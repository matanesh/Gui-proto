export type RunEventType =
  | "run.accepted"
  | "run.queued"
  | "run.started"
  | "run.progress"
  | "run.log"
  | "run.warning"
  | "run.error"
  | "run.completed"
  | "run.failed"
  | "run.cancelled"
  | "heartbeat";

export type Severity = "debug" | "info" | "warning" | "error" | "critical";

/** Event envelope streamed over (mock) SSE. See docs/EVENT_SCHEMA.md. */
export interface RunEvent {
  eventId: string;
  runId: string;
  /** Strictly increasing per run; heartbeats use -1 and are excluded from ordering. */
  sequence: number;
  timestamp: string;
  type: RunEventType;
  severity: Severity;
  source: string;
  message: string;
  payload: Record<string, unknown>;
}

export const TERMINAL_EVENT_TYPES: readonly RunEventType[] = [
  "run.completed",
  "run.failed",
  "run.cancelled",
];

export function isTerminalEvent(event: RunEvent): boolean {
  return TERMINAL_EVENT_TYPES.includes(event.type);
}
