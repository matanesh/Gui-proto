import type { Run, RunEvent, RunEventType, Severity, SseConnectionState } from "@/models";
import { isTerminalStatus } from "@/models";
import { IS_REAL } from "@/config/api";
import { getRun, updateRun } from "./mockData";
import { connectRealRunEventStream } from "./real/realEventStream";

/**
 * Mock SSE client — an EventSource-like abstraction over a simulated stream.
 *
 * Mapping to the real thing (docs/API_CONTRACT.md, docs/EVENT_SCHEMA.md):
 * - `connectRunEventStream(runId, …)` ↔ `new EventSource("/api/events/stream?runId=…")`.
 * - `onEvent` ↔ EventSource `message`/named-event listeners (one JSON RunEvent per message).
 * - Each RunEvent's `eventId` ↔ the SSE `id:` field. On reconnect the browser
 *   sends `Last-Event-ID`; the BFF replays events after it. We simulate that
 *   replay window by re-delivering the last couple of events after a simulated
 *   reconnect — which is why consumers MUST deduplicate by eventId/sequence.
 * - `close()` ↔ `EventSource.close()` — always call it on component unmount.
 *
 * The mock also *drives* the run lifecycle (a real client never would): it
 * advances the in-memory run store so REST snapshots stay consistent with the
 * stream, exactly as Core-emitted events would keep the real system coherent.
 */

export interface RunEventStreamHandlers {
  onEvent: (event: RunEvent) => void;
  onStateChange: (state: SseConnectionState) => void;
}

export interface RunEventStreamHandle {
  close: () => void;
  /** Manual reconnect affordance for the disconnected state. */
  reconnect: () => void;
}

const HEARTBEAT_INTERVAL_MS = 10_000;

/** Per-run sequence counters survive reconnects within a session. */
const sequenceCounters = new Map<string, number>();

function nextSequence(runId: string): number {
  const next = (sequenceCounters.get(runId) ?? 0) + 1;
  sequenceCounters.set(runId, next);
  return next;
}

let eventCounter = 0;
function makeEvent(
  runId: string,
  type: RunEventType,
  severity: Severity,
  message: string,
  payload: Record<string, unknown>,
  source = "core",
): RunEvent {
  eventCounter += 1;
  const isHeartbeat = type === "heartbeat";
  return {
    eventId: isHeartbeat ? `evt-hb-${String(eventCounter).padStart(6, "0")}` : `evt-${String(eventCounter).padStart(6, "0")}`,
    runId,
    sequence: isHeartbeat ? -1 : nextSequence(runId),
    timestamp: new Date().toISOString(),
    type,
    severity,
    source,
    message,
    payload,
  };
}

const PHASE_SEQUENCE = ["initializing", "validating", "processing", "finalizing"] as const;

function phaseForProgress(progress: number): string {
  if (progress < 10) return PHASE_SEQUENCE[0];
  if (progress < 25) return PHASE_SEQUENCE[1];
  if (progress < 85) return PHASE_SEQUENCE[2];
  return PHASE_SEQUENCE[3];
}

const LOG_LINES = [
  "Validating configuration parameters…",
  "Acquiring execution slot from worker pool…",
  "Loading task manifest…",
  "Processing batch {n}/{total}…",
  "Checkpoint written successfully.",
  "Verifying integrity constraints…",
  "Intermediate results persisted.",
  "Releasing transient resources…",
];

function randomLogLine(step: number): string {
  const template = LOG_LINES[step % LOG_LINES.length]!;
  return template.replace("{n}", String((step % 8) + 1)).replace("{total}", "8");
}

/**
 * Connect to the (mock) event stream for a run.
 * Returns a handle whose `close()` must be called on unmount.
 */
export function connectRunEventStream(
  runId: string,
  handlers: RunEventStreamHandlers,
): RunEventStreamHandle {
  // Real mode: delegate to a native EventSource against the BFF's SSE endpoint.
  if (IS_REAL) return connectRealRunEventStream(runId, handlers);

  let closed = false;
  let state: SseConnectionState = "connecting";
  const timers = new Set<ReturnType<typeof setTimeout>>();
  /** Recently delivered events — simulated Last-Event-ID replay buffer. */
  const recentlyDelivered: RunEvent[] = [];
  let reconnectSimulated = false;

  const setState = (next: SseConnectionState) => {
    if (closed) return;
    state = next;
    handlers.onStateChange(next);
  };

  const schedule = (fn: () => void, ms: number) => {
    if (closed) return;
    const t = setTimeout(() => {
      timers.delete(t);
      if (!closed) fn();
    }, ms);
    timers.add(t);
  };

  const deliver = (event: RunEvent) => {
    if (closed || state !== "open") return;
    recentlyDelivered.push(event);
    if (recentlyDelivered.length > 5) recentlyDelivered.shift();
    handlers.onEvent(event);
  };

  // ---- heartbeats -------------------------------------------------------
  const heartbeatLoop = () => {
    schedule(() => {
      if (state === "open") {
        deliver(makeEvent(runId, "heartbeat", "debug", "heartbeat", {}, "bff"));
      }
      heartbeatLoop();
    }, HEARTBEAT_INTERVAL_MS);
  };

  // ---- lifecycle driver (active runs only) ------------------------------
  let tick = 0;

  const finishRun = (
    type: RunEventType,
    status: Run["status"],
    severity: Severity,
    message: string,
    payload: Record<string, unknown>,
  ) => {
    const run = getRun(runId);
    const startedAt = run?.startedAt ? new Date(run.startedAt).getTime() : Date.now();
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    updateRun(runId, {
      status,
      completedAt: new Date().toISOString(),
      durationSec,
      currentPhase: status === "succeeded" ? "completed" : status,
      summary: typeof payload["summary"] === "string" ? (payload["summary"] as string) : message,
      ...(status === "succeeded" ? { progress: 100 } : {}),
    });
    deliver(makeEvent(runId, type, severity, message, { ...payload, durationSec }));
  };

  const driveActiveRun = () => {
    schedule(() => {
      const run = getRun(runId);
      if (!run || isTerminalStatus(run.status)) return;

      // Cooperative cancellation: runsApi.cancelRun set this phase.
      if (run.currentPhase === "cancelling") {
        finishRun("run.cancelled", "cancelled", "warning", "Run cancelled by operator request.", {
          requestedBy: run.requestedBy,
        });
        return;
      }

      tick += 1;

      if (run.status === "accepted" && tick >= 1) {
        updateRun(runId, { status: "queued", currentPhase: "waiting" });
        deliver(makeEvent(runId, "run.queued", "info", "Queued awaiting core capacity.", { queuePosition: 1 }, "bff"));
      } else if (run.status === "queued" && tick >= 2) {
        updateRun(runId, {
          status: "running",
          startedAt: new Date().toISOString(),
          currentPhase: "initializing",
          progress: 2,
        });
        deliver(makeEvent(runId, "run.started", "info", "Execution started.", { phase: "initializing" }));
      } else if (run.status === "running") {
        const failThisRun = runId.endsWith("7") && run.progress > 55; // deterministic-ish failure path for demo variety
        if (failThisRun && Math.random() < 0.25) {
          deliver(makeEvent(runId, "run.error", "error", "Unrecoverable error in processing stage.", { code: "E-PROC-011" }));
          finishRun("run.failed", "failed", "critical", "Run failed: processing stage aborted.", {
            reason: "Processing stage aborted after unrecoverable error.",
          });
          return;
        }

        // Logs flow every tick; progress advances every other tick.
        deliver(makeEvent(runId, "run.log", tick % 7 === 0 ? "debug" : "info", randomLogLine(tick), { logger: "core.executor" }));

        if (tick % 2 === 0) {
          const progress = Math.min(100, run.progress + 4 + Math.floor(Math.random() * 6));
          const phase = phaseForProgress(progress);
          updateRun(runId, { progress, currentPhase: phase });
          deliver(makeEvent(runId, "run.progress", "info", `Progress ${progress}% — ${phase}.`, { progress, phase }));

          if (progress >= 35 && progress <= 45 && Math.random() < 0.35) {
            deliver(makeEvent(runId, "run.warning", "warning", "Retrying transient step (attempt 2/3).", { code: "W-RETRY" }));
          }

          if (progress >= 100) {
            finishRun("run.completed", "succeeded", "info", "Run completed successfully.", {
              summary: `${run.commandName} completed. ${(1200 + Math.floor(Math.random() * 8000)).toLocaleString()} records processed.`,
            });
            return;
          }
        }
      }

      // One simulated mid-run reconnect to demonstrate the reconnect UX.
      if (!reconnectSimulated && tick === 9 && getRun(runId) && !isTerminalStatus(getRun(runId)!.status)) {
        reconnectSimulated = true;
        simulateReconnect(() => driveActiveRun());
        return;
      }

      driveActiveRun();
    }, 900 + Math.random() * 600);
  };

  const simulateReconnect = (resume: () => void) => {
    setState("reconnecting");
    schedule(() => {
      setState("open");
      // Replay: re-deliver the last events, as a real BFF would after
      // receiving Last-Event-ID. Consumers dedup these by eventId/sequence.
      for (const past of recentlyDelivered.slice(-2)) {
        handlers.onEvent(past);
      }
      resume();
    }, 1800 + Math.random() * 1200);
  };

  // ---- replay for terminal runs -----------------------------------------
  const replayTerminalRun = (run: Run) => {
    const condensed: Array<[RunEventType, Severity, string]> = [
      ["run.accepted", "info", "Command accepted."],
      ["run.started", "info", "Execution started."],
      ["run.progress", "info", "Progress 50% — processing."],
      run.status === "succeeded"
        ? ["run.completed", "info", "Run completed successfully."]
        : run.status === "failed"
          ? ["run.failed", "critical", run.summary ?? "Run failed."]
          : run.status === "cancelled"
            ? ["run.cancelled", "warning", "Run cancelled by operator request."]
            : ["run.failed", "error", "Run timed out."],
    ];
    condensed.forEach(([type, severity, message], i) => {
      schedule(() => {
        deliver(makeEvent(runId, type, severity, message, type === "run.progress" ? { progress: 50, phase: "processing" } : {}));
      }, 150 * (i + 1));
    });
  };

  // ---- connection bootstrap ---------------------------------------------
  const open = () => {
    setState("connecting");
    schedule(() => {
      setState("open");
      deliver(makeEvent(runId, "run.accepted", "info", "Command accepted.", {}, "bff"));
      heartbeatLoop();

      const run = getRun(runId);
      if (run && isTerminalStatus(run.status)) {
        replayTerminalRun(run);
      } else {
        driveActiveRun();
      }
    }, 300 + Math.random() * 500);
  };

  open();

  return {
    close: () => {
      closed = true;
      for (const t of timers) clearTimeout(t);
      timers.clear();
    },
    reconnect: () => {
      if (closed) return;
      // Manual reconnect from the disconnected state — like recreating an EventSource.
      simulateReconnect(() => {
        const run = getRun(runId);
        if (run && !isTerminalStatus(run.status)) driveActiveRun();
      });
    },
  };
}
