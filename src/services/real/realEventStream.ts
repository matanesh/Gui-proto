import type { RunEvent, RunEventType } from "@/models";
import { API_BASE_URL } from "@/config/api";
import type {
  RunEventStreamHandle,
  RunEventStreamHandlers,
} from "../eventStreamClient";

// The BFF sends each event with an `event: <type>` line, so the browser
// dispatches them as named events (not the default "message"). We listen to
// every type. Native EventSource handles Last-Event-ID reconnect automatically.
const EVENT_TYPES: RunEventType[] = [
  "run.accepted",
  "run.queued",
  "run.started",
  "run.progress",
  "run.log",
  "run.warning",
  "run.error",
  "run.completed",
  "run.failed",
  "run.cancelled",
  "heartbeat",
];

/** Real SSE connection to GET /api/events/stream?runId=… via native EventSource. */
export function connectRealRunEventStream(
  runId: string,
  handlers: RunEventStreamHandlers,
): RunEventStreamHandle {
  let source: EventSource | null = null;
  let closed = false;

  const open = () => {
    if (closed) return;
    handlers.onStateChange("connecting");
    const es = new EventSource(
      `${API_BASE_URL}/events/stream?runId=${encodeURIComponent(runId)}`,
    );
    source = es;

    es.onopen = () => !closed && handlers.onStateChange("open");
    es.onerror = () => {
      // EventSource auto-reconnects while readyState !== CLOSED.
      if (closed) return;
      handlers.onStateChange(es.readyState === EventSource.CLOSED ? "disconnected" : "reconnecting");
    };

    const handle = (e: MessageEvent) => {
      try {
        handlers.onEvent(JSON.parse(e.data) as RunEvent);
      } catch {
        /* ignore malformed frames */
      }
    };
    for (const type of EVENT_TYPES) es.addEventListener(type, handle as EventListener);
  };

  open();

  return {
    close: () => {
      closed = true;
      source?.close();
      source = null;
    },
    reconnect: () => {
      source?.close();
      open();
    },
  };
}
