/** Connection state of the (mock) SSE stream, mirrored in the UI. */
export type SseConnectionState =
  | "connecting"
  | "open"
  | "reconnecting"
  | "disconnected";

/** Client-side stream diagnostics surfaced in the Run Details Diagnostics tab. */
export interface StreamDiagnostics {
  eventsReceived: number;
  duplicatesDropped: number;
  gapsDetected: number;
  reconnects: number;
  lastSequence: number;
  lastHeartbeatAt: string | null;
}
