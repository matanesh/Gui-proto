import type { Scenario } from "@/models";

/**
 * Sanitized, self-contained scenario library for the Scenario Runner and
 * Timeline/Replay view. Every step is a scripted, timed beat: the simulation
 * engine (see demo/simulation-engine/scenarioEngine.ts) fires each step at
 * `atMs` (scaled by the presenter's speed setting), appending an EventMessage
 * to the Live Event Stream and applying any mapEffects to the Fleet Map
 * overlay. Nothing here models a real system — component names, event
 * types, and payload previews are all generic placeholders.
 */
export const SCENARIOS: Scenario[] = [
  {
    id: "happy-path",
    title: "Happy Path Operation",
    description:
      "A single command runs end to end without incident: submitted, accepted, executed, and completed cleanly.",
    durationSec: 8,
    components: ["ui", "bff", "broker", "core", "map"],
    mapEffectsSummary: "Primary asset pulses running, then turns completed; region stays healthy throughout.",
    expectedOutcome: "Run reaches task.completed with no warnings or retries.",
    outcome: "success",
    talkingPoints: [
      "REST is used only for the discrete submit — everything after is one-way updates.",
      "The BFF returns 202 Accepted immediately; the Core does the actual work asynchronously.",
      "Notice the map reacts the instant an event lands — no polling.",
    ],
    steps: [
      { id: "hp-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted for execution.", payloadPreview: "{ command: \"data-sync\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "normal" }] },
      { id: "hp-2", atMs: 600, component: "bff", type: "command.accepted", severity: "info", message: "BFF validated the request and returned 202 Accepted.", payloadPreview: "{ runId: \"…\", status: \"accepted\" }" },
      { id: "hp-3", atMs: 1400, component: "broker", type: "task.started", severity: "info", message: "Command published to the internal queue.", payloadPreview: "{ queue: \"tasks.default\" }" },
      { id: "hp-4", atMs: 2200, component: "core", type: "task.started", severity: "info", message: "Core Service picked up the task.", payloadPreview: "{ phase: \"initializing\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "hp-5", atMs: 3400, component: "core", type: "task.progress", severity: "info", message: "Task progress 35%.", payloadPreview: "{ progress: 35 }" },
      { id: "hp-6", atMs: 4800, component: "core", type: "task.progress", severity: "info", message: "Task progress 72%.", payloadPreview: "{ progress: 72 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 60, status: "normal" }] },
      { id: "hp-7", atMs: 6200, component: "core", type: "task.log", severity: "debug", message: "Finalizing output artifacts.", payloadPreview: "{ step: \"finalize\" }" },
      { id: "hp-8", atMs: 7400, component: "bff", type: "task.completed", severity: "info", message: "Run completed successfully.", payloadPreview: "{ status: \"succeeded\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }, { kind: "route.completed", role: "route-a", progress: 100, status: "completed" }] },
    ],
  },
  {
    id: "long-running",
    title: "Long Running Operation",
    description:
      "A multi-phase task that takes noticeably longer, exercising sustained progress reporting and connection stability over time.",
    durationSec: 14,
    components: ["ui", "bff", "core", "map"],
    mapEffectsSummary: "Primary asset stays in a running state across several progress beats before completing.",
    expectedOutcome: "Run completes after multiple progress phases; SSE connection stays open throughout.",
    outcome: "success",
    talkingPoints: [
      "Long-running work is exactly why REST alone isn't enough — the client needs a stream, not a poll loop.",
      "Heartbeats (not shown as events) keep the SSE connection alive between progress beats.",
      "The UI never blocks waiting for completion; it stays responsive the whole time.",
    ],
    steps: [
      { id: "lr-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Long-running command submitted.", payloadPreview: "{ command: \"batch-validation\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "lr-2", atMs: 900, component: "core", type: "task.started", severity: "info", message: "Core Service began multi-phase processing.", payloadPreview: "{ phases: 5 }" },
      { id: "lr-3", atMs: 2600, component: "core", type: "task.progress", severity: "info", message: "Phase 1/5 complete — 18%.", payloadPreview: "{ progress: 18 }" },
      { id: "lr-4", atMs: 4800, component: "core", type: "task.progress", severity: "info", message: "Phase 2/5 complete — 36%.", payloadPreview: "{ progress: 36 }" },
      { id: "lr-5", atMs: 7200, component: "core", type: "task.progress", severity: "info", message: "Phase 3/5 complete — 55%.", payloadPreview: "{ progress: 55 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 40, status: "normal" }] },
      { id: "lr-6", atMs: 9600, component: "core", type: "task.progress", severity: "info", message: "Phase 4/5 complete — 78%.", payloadPreview: "{ progress: 78 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 75, status: "normal" }] },
      { id: "lr-7", atMs: 12200, component: "core", type: "task.progress", severity: "info", message: "Phase 5/5 complete — 96%.", payloadPreview: "{ progress: 96 }" },
      { id: "lr-8", atMs: 13400, component: "bff", type: "task.completed", severity: "info", message: "Long-running run completed successfully.", payloadPreview: "{ status: \"succeeded\", durationSec: 13 }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }, { kind: "route.completed", role: "route-a", progress: 100, status: "completed" }] },
    ],
  },
  {
    id: "progress-updates",
    title: "Progress Updates",
    description:
      "Focused walkthrough of granular progress reporting — the UI's progress bar and map should track every beat precisely.",
    durationSec: 9,
    components: ["ui", "core", "map"],
    mapEffectsSummary: "Route between primary and secondary assets fills in step with reported progress.",
    expectedOutcome: "Progress advances monotonically from 0 to 100 with no gaps.",
    outcome: "success",
    talkingPoints: [
      "Each task.progress event is idempotent to render — the UI just reflects the latest value.",
      "This is the clearest illustration of SSE as one-way status/progress updates.",
    ],
    steps: [
      { id: "pu-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted.", payloadPreview: "{ command: \"report-generation\" }" },
      { id: "pu-2", atMs: 700, component: "core", type: "task.started", severity: "info", message: "Core Service started the task.", payloadPreview: "{}", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "pu-3", atMs: 1800, component: "core", type: "task.progress", severity: "info", message: "Progress 12%.", payloadPreview: "{ progress: 12 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 12, status: "normal" }] },
      { id: "pu-4", atMs: 3000, component: "core", type: "task.progress", severity: "info", message: "Progress 31%.", payloadPreview: "{ progress: 31 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 31, status: "normal" }] },
      { id: "pu-5", atMs: 4200, component: "core", type: "task.progress", severity: "info", message: "Progress 54%.", payloadPreview: "{ progress: 54 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 54, status: "normal" }] },
      { id: "pu-6", atMs: 5400, component: "core", type: "task.progress", severity: "info", message: "Progress 78%.", payloadPreview: "{ progress: 78 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 78, status: "normal" }] },
      { id: "pu-7", atMs: 6600, component: "core", type: "task.progress", severity: "info", message: "Progress 93%.", payloadPreview: "{ progress: 93 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 93, status: "normal" }] },
      { id: "pu-8", atMs: 7800, component: "bff", type: "task.completed", severity: "info", message: "Run completed successfully.", payloadPreview: "{ status: \"succeeded\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }, { kind: "route.completed", role: "route-a", progress: 100, status: "completed" }] },
    ],
  },
  {
    id: "timeout-retry",
    title: "Timeout and Retry",
    description:
      "A task stalls past its expected window, the Core schedules a retry, and the retry succeeds.",
    durationSec: 11,
    components: ["ui", "bff", "core", "map"],
    mapEffectsSummary: "Primary asset flips to degraded during the stall, back to warning on retry, then completed.",
    expectedOutcome: "Run recovers via one retry and completes; the stall is visible but not fatal.",
    outcome: "success",
    talkingPoints: [
      "Timeouts are detected by the Core, not the UI — the UI only reflects what it's told.",
      "task.retry_scheduled is a first-class event so the timeline can show retries explicitly, not hide them.",
      "This is the difference between 'stuck' and 'recovering' — the UI must make that distinction obvious.",
    ],
    steps: [
      { id: "tr-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted.", payloadPreview: "{ command: \"health-scan\" }" },
      { id: "tr-2", atMs: 700, component: "core", type: "task.started", severity: "info", message: "Core Service started the task.", payloadPreview: "{}", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "tr-3", atMs: 2200, component: "core", type: "task.progress", severity: "info", message: "Progress 22%.", payloadPreview: "{ progress: 22 }" },
      { id: "tr-4", atMs: 4600, component: "core", type: "task.warning", severity: "warning", message: "No progress reported for 4.4s — exceeding expected window.", payloadPreview: "{ stalledForSec: 4.4 }", mapEffects: [{ kind: "asset.status", role: "primary", status: "degraded" }] },
      { id: "tr-5", atMs: 5800, component: "core", type: "task.retry_scheduled", severity: "warning", message: "Scheduling retry 1/3 after timeout.", payloadPreview: "{ attempt: 1, maxAttempts: 3 }" },
      { id: "tr-6", atMs: 7200, component: "core", type: "task.started", severity: "info", message: "Retry attempt started.", payloadPreview: "{ attempt: 1 }", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "tr-7", atMs: 8800, component: "core", type: "task.progress", severity: "info", message: "Progress 64% (retry attempt).", payloadPreview: "{ progress: 64 }" },
      { id: "tr-8", atMs: 10200, component: "bff", type: "task.completed", severity: "info", message: "Run completed successfully after one retry.", payloadPreview: "{ status: \"succeeded\", retries: 1 }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }] },
    ],
  },
  {
    id: "partial-failure",
    title: "Partial Failure",
    description:
      "A multi-target task partially succeeds — one asset completes, another fails — resulting in a mixed final status.",
    durationSec: 10,
    components: ["ui", "bff", "core", "map"],
    mapEffectsSummary: "Primary asset completes; secondary asset fails; region health drops to warning.",
    expectedOutcome: "Run ends with a partial-success summary, not a false 'succeeded' or blanket 'failed'.",
    outcome: "failure",
    talkingPoints: [
      "The UI must never collapse a mixed outcome into a misleading single status.",
      "Partial success is a distinct, first-class terminal state — not an error message bolted onto 'succeeded'.",
      "This is exactly the kind of nuance that gets lost without an event-sourced run history.",
    ],
    steps: [
      { id: "pf-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted for two targets.", payloadPreview: "{ targets: 2 }" },
      { id: "pf-2", atMs: 900, component: "core", type: "task.started", severity: "info", message: "Core Service started processing both targets.", payloadPreview: "{}", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }, { kind: "asset.status", role: "secondary", status: "warning" }] },
      { id: "pf-3", atMs: 2600, component: "core", type: "task.progress", severity: "info", message: "Target 1 progress 60%.", payloadPreview: "{ target: 1, progress: 60 }" },
      { id: "pf-4", atMs: 4200, component: "core", type: "task.completed", severity: "info", message: "Target 1 completed successfully.", payloadPreview: "{ target: 1, status: \"succeeded\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }] },
      { id: "pf-5", atMs: 5400, component: "core", type: "task.warning", severity: "warning", message: "Target 2 reported a recoverable error.", payloadPreview: "{ target: 2, code: \"E_TARGET_UNREACHABLE\" }", mapEffects: [{ kind: "asset.status", role: "secondary", status: "degraded" }, { kind: "region.health", role: "region-a", status: "warning" }] },
      { id: "pf-6", atMs: 7000, component: "core", type: "task.failed", severity: "error", message: "Target 2 failed after exhausting retries.", payloadPreview: "{ target: 2, status: \"failed\" }", mapEffects: [{ kind: "asset.status", role: "secondary", status: "failed" }] },
      { id: "pf-7", atMs: 8600, component: "bff", type: "task.completed", severity: "warning", message: "Run ended in partial success (1/2 targets succeeded).", payloadPreview: "{ status: \"partial_success\", succeeded: 1, failed: 1 }" },
    ],
  },
  {
    id: "core-unavailable",
    title: "Core Service Unavailable",
    description:
      "The command is accepted by the BFF, but the Core Service cannot be reached, leaving the run stuck in an accepted state.",
    durationSec: 9,
    components: ["ui", "bff", "broker", "core"],
    mapEffectsSummary: "Primary asset never leaves warning; region health drops to degraded.",
    expectedOutcome: "Run stays visibly 'accepted, not yet started' with a clear unavailability warning — never a silent hang.",
    outcome: "failure",
    talkingPoints: [
      "The BFF can accept a command without the Core being reachable — that's the whole point of the queue decoupling them.",
      "The UI's job is to surface 'we don't know yet' honestly instead of guessing a status.",
      "This is why health checks and queue-depth visibility matter for operators.",
    ],
    steps: [
      { id: "cu-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted.", payloadPreview: "{ command: \"configuration-check\" }" },
      { id: "cu-2", atMs: 700, component: "bff", type: "command.accepted", severity: "info", message: "BFF accepted the request (202).", payloadPreview: "{ status: \"accepted\" }" },
      { id: "cu-3", atMs: 1600, component: "broker", type: "task.started", severity: "info", message: "Command published to the internal queue.", payloadPreview: "{ queue: \"tasks.default\" }" },
      { id: "cu-4", atMs: 3400, component: "core", type: "task.warning", severity: "warning", message: "No Core Service consumer has acknowledged the task.", payloadPreview: "{ waitingSec: 3.4 }", mapEffects: [{ kind: "region.health", role: "region-a", status: "warning" }] },
      { id: "cu-5", atMs: 5600, component: "core", type: "task.warning", severity: "critical", message: "Core Service health check failing — service appears unreachable.", payloadPreview: "{ component: \"core\", status: \"unreachable\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "degraded" }, { kind: "region.health", role: "region-a", status: "degraded" }] },
      { id: "cu-6", atMs: 7600, component: "bff", type: "task.failed", severity: "error", message: "Run marked as stalled — Core Service unavailable, queue depth growing.", payloadPreview: "{ status: \"stalled\", queueDepth: 14 }" },
    ],
  },
  {
    id: "stream-disconnect-recovery",
    title: "Event Stream Disconnect and Recovery",
    description:
      "The SSE connection drops mid-run; the UI shows a reconnecting state, then recovers and catches up.",
    durationSec: 10,
    components: ["ui", "bff", "core"],
    mapEffectsSummary: "No status change during the drop — the map correctly freezes rather than guessing.",
    expectedOutcome: "Stream reconnects automatically and the run resumes reflecting live state with no duplicated or lost progress.",
    outcome: "success",
    talkingPoints: [
      "SSE reconnect uses Last-Event-ID so the client resumes exactly where it left off.",
      "While disconnected, the UI must freeze rather than fabricate progress — 'last known' beats 'guessed'.",
      "A snapshot fetch on reconnect reconciles any events missed during the gap.",
    ],
    steps: [
      { id: "sd-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted.", payloadPreview: "{ command: \"simulation-run\" }" },
      { id: "sd-2", atMs: 800, component: "core", type: "task.started", severity: "info", message: "Core Service started the task.", payloadPreview: "{}", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "sd-3", atMs: 2000, component: "core", type: "task.progress", severity: "info", message: "Progress 30%.", payloadPreview: "{ progress: 30 }" },
      { id: "sd-4", atMs: 3400, component: "bff", type: "stream.disconnected", severity: "warning", message: "SSE connection dropped — attempting to reconnect.", payloadPreview: "{ reason: \"network_blip\" }" },
      { id: "sd-5", atMs: 6200, component: "bff", type: "stream.reconnected", severity: "info", message: "SSE connection restored; replayed 2 missed events from Last-Event-ID.", payloadPreview: "{ replayed: 2 }" },
      { id: "sd-6", atMs: 7400, component: "core", type: "task.progress", severity: "info", message: "Progress 82% (caught up after reconnect).", payloadPreview: "{ progress: 82 }" },
      { id: "sd-7", atMs: 8800, component: "bff", type: "task.completed", severity: "info", message: "Run completed successfully.", payloadPreview: "{ status: \"succeeded\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }] },
    ],
  },
  {
    id: "duplicate-event",
    title: "Duplicate Event Handling",
    description:
      "A network retry causes the same progress event to be delivered twice; the UI de-duplicates using eventId.",
    durationSec: 8,
    components: ["ui", "bff", "core"],
    mapEffectsSummary: "No visible flicker on the map — the duplicate is suppressed before it reaches render state.",
    expectedOutcome: "The duplicate is visible in the raw stream but rendered once in derived UI state.",
    outcome: "success",
    talkingPoints: [
      "At-least-once delivery is normal for message brokers — the client must be idempotent, not the broker.",
      "Deduplication keys off eventId, not arrival order.",
      "The Live Event Stream intentionally shows both deliveries so presenters can point at the mechanism.",
    ],
    steps: [
      { id: "de-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted.", payloadPreview: "{ command: \"data-sync\" }" },
      { id: "de-2", atMs: 800, component: "core", type: "task.started", severity: "info", message: "Core Service started the task.", payloadPreview: "{}", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "de-3", atMs: 2400, component: "core", type: "task.progress", severity: "info", message: "Progress 45%.", payloadPreview: "{ progress: 45, eventId: \"evt-045\" }" },
      { id: "de-4", atMs: 3000, component: "broker", type: "task.progress", severity: "debug", message: "Duplicate delivery of the same progress event (eventId evt-045) — redelivered after an ack timeout.", payloadPreview: "{ progress: 45, eventId: \"evt-045\", duplicate: true }" },
      { id: "de-5", atMs: 4600, component: "core", type: "task.progress", severity: "info", message: "Progress 81%.", payloadPreview: "{ progress: 81 }" },
      { id: "de-6", atMs: 6400, component: "bff", type: "task.completed", severity: "info", message: "Run completed successfully — duplicate had no effect on final state.", payloadPreview: "{ status: \"succeeded\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }] },
    ],
  },
  {
    id: "out-of-order-event",
    title: "Out-of-order Event Handling",
    description:
      "A later-sequence event arrives before an earlier one due to network jitter; the UI reorders using the sequence number.",
    durationSec: 8,
    components: ["ui", "bff", "core"],
    mapEffectsSummary: "Route progress only ever moves forward on the map, even though the wire order was jumbled.",
    expectedOutcome: "Final rendered state reflects strictly increasing sequence, regardless of arrival order.",
    outcome: "success",
    talkingPoints: [
      "Sequence numbers, not arrival time, define truth for ordering.",
      "This is why every event carries a monotonic sequence — timestamps alone aren't reliable under jitter.",
      "A gap or inversion in sequence is a cheap, deterministic signal the client can act on.",
    ],
    steps: [
      { id: "oo-1", atMs: 0, component: "ui", type: "command.accepted", severity: "info", message: "Command submitted.", payloadPreview: "{ command: \"batch-validation\" }" },
      { id: "oo-2", atMs: 800, component: "core", type: "task.started", severity: "info", message: "Core Service started the task.", payloadPreview: "{}", mapEffects: [{ kind: "asset.status", role: "primary", status: "warning" }] },
      { id: "oo-3", atMs: 2200, component: "core", type: "task.progress", severity: "info", message: "Progress 70% (sequence 5) — arrived before sequence 4.", payloadPreview: "{ progress: 70, sequence: 5 }" },
      { id: "oo-4", atMs: 3000, component: "broker", type: "task.progress", severity: "debug", message: "Sequence 4 arrived after sequence 5 — reordered before rendering.", payloadPreview: "{ progress: 55, sequence: 4 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 55, status: "normal" }] },
      { id: "oo-5", atMs: 4600, component: "core", type: "task.progress", severity: "info", message: "Progress 88% (sequence 6).", payloadPreview: "{ progress: 88, sequence: 6 }", mapEffects: [{ kind: "route.progress", role: "route-a", progress: 88, status: "normal" }] },
      { id: "oo-6", atMs: 6400, component: "bff", type: "task.completed", severity: "info", message: "Run completed successfully in correct sequence order.", payloadPreview: "{ status: \"succeeded\" }", mapEffects: [{ kind: "asset.status", role: "primary", status: "completed" }, { kind: "route.completed", role: "route-a", progress: 100, status: "completed" }] },
    ],
  },
];

export function getScenario(id: string): Scenario | undefined {
  return SCENARIOS.find((s) => s.id === id);
}
