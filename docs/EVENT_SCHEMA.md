# Event Schema — Ops Command Center

> Schema for run events streamed from the future FastAPI BFF over SSE. The prototype's mock event stream emits exactly these shapes. Sanitized; no real payloads.

## RunEvent envelope

Every event on the stream is a `RunEvent`:

| Field | Type | Notes |
|---|---|---|
| `eventId` | string | globally unique (e.g. `evt-000042`); SSE `id:` field; dedup key |
| `runId` | string | the run this event belongs to |
| `sequence` | number | strictly increasing **per run**, no reuse; ordering + gap detection |
| `timestamp` | ISO-8601 string | producer clock (Core), informational — ordering uses `sequence` |
| `type` | RunEventType | see below |
| `severity` | Severity | see below |
| `source` | string | logical producer: `core`, `bff`, `broker` |
| `message` | string | human-readable, sanitized |
| `payload` | object | type-specific data (progress %, phase, log line metadata) |

## Event types

| Type | Meaning | Typical payload |
|---|---|---|
| `run.accepted` | BFF accepted the command | `{ "clientRequestId": "…" }` |
| `run.queued` | queued awaiting Core capacity | `{ "queuePosition": 3 }` |
| `run.started` | Core began execution | `{ "phase": "initializing" }` |
| `run.progress` | progress update | `{ "progress": 37, "phase": "processing" }` |
| `run.log` | log line | `{ "line": "…", "logger": "…" }` |
| `run.warning` | non-fatal issue | `{ "code": "W-…" }` |
| `run.error` | error occurred (may or may not be terminal) | `{ "code": "E-…" }` |
| `run.completed` | terminal: succeeded | `{ "summary": "…", "durationSec": 125 }` |
| `run.failed` | terminal: failed | `{ "reason": "…" }` |
| `run.cancelled` | terminal: cancelled | `{ "requestedBy": "…" }` |
| `heartbeat` | liveness signal, **no run semantics** | `{}` |

Terminal events (`run.completed`, `run.failed`, `run.cancelled`) end the logical stream for a run; the server may close the connection after sending one.

## Severity

`debug` · `info` · `warning` · `error` · `critical`

Severity is orthogonal to type: a `run.log` can be `debug` or `error`; `run.warning` is at least `warning`. The UI filters the log/event views by severity.

## Ordering

- `sequence` is the only ordering authority; wall-clock `timestamp` is informational.
- The client renders events sorted by `sequence` and treats a lower-than-last `sequence` as a duplicate or stale delivery.
- `heartbeat` events do **not** consume run sequence numbers.

## Deduplication

- Delivery is assumed **at-least-once**; duplicates are normal after reconnects/replays.
- Dedup key: `eventId` (primary) and `(runId, sequence)` (equivalent check).
- The client keeps the set of seen sequences per run (or simply the max contiguous sequence) and drops duplicates silently.

## Last-Event-ID and replay window

- Each SSE message carries `id: <eventId>`; the browser's `EventSource` automatically sends `Last-Event-ID` on reconnect.
- The BFF keeps a bounded **replay window** per run (size/retention is a deployment decision, e.g. last N events or last M minutes).
- If `Last-Event-ID` falls inside the window → the BFF replays everything after it, then resumes live.
- If it falls **outside** the window → the BFF signals a full resync is needed (fresh stream from current state); the client must snapshot-recover first.

## Heartbeat

- Emitted every ~10 seconds when no run events flow.
- Purposes: keep proxies/LBs from idling out the connection; let the client detect a stalled stream (no heartbeat for > ~2.5 intervals ⇒ treat as disconnected and reconnect).
- Never rendered in the event timeline; only feeds the connection-state indicator.

## Reconnect behavior

1. Connection drops → client state `reconnecting`; UI shows it honestly.
2. Retry with exponential backoff + jitter (e.g. 1s → 2s → 4s → … capped ~30s).
3. On reopen, resume via `Last-Event-ID` (replay) — or snapshot-recover if the window was missed.
4. After repeated failures, state `disconnected` with a manual retry affordance; keep last-known data visible, clearly marked as possibly stale.

## Snapshot recovery — GET /api/runs/{runId}

The run snapshot endpoint is the client's recovery source of truth. Use it:

- after reconnect when the replay window was exceeded,
- when a **sequence gap** is detected (see below),
- on page load/refresh before subscribing to live events.

Pattern: fetch snapshot → render authoritative status/progress → subscribe to SSE → drop events with `sequence` ≤ snapshot's last-applied sequence.

## Event gap handling

If an incoming event's `sequence` is more than +1 above the last contiguous sequence:

1. Buffer briefly (out-of-order tolerance, ~1–2s).
2. If the gap persists → snapshot-recover, then resume applying live events above the snapshot sequence.
3. Never fabricate the missing events; the timeline shows a gap marker if events were lost.

## Event flood handling

- Coalesce high-frequency `run.progress` updates (render at most a few per second).
- Batch `run.log` appends per animation frame; render log/event lists with virtualization.
- Severity filters reduce the visible set; raw counts stay accurate.
- Backpressure honesty: if the client drops rendering detail, show a "N events coalesced" note rather than silently losing information.

## Logs vs. events

`run.log` lines are high-volume operational output rendered in the **Logs** view (virtualized, filterable, exportable). Lifecycle events (`run.started`, `run.progress`, terminal events, warnings/errors) drive the **Timeline** and status header. Both arrive on the same stream, but the UI separates them so lifecycle signal is never buried in log noise.

## Example events

```json
{ "eventId": "evt-000001", "runId": "run-20260703-000123", "sequence": 1, "timestamp": "2026-07-03T12:00:00Z", "type": "run.accepted", "severity": "info", "source": "bff", "message": "Command accepted.", "payload": { "clientRequestId": "b4f7c2a0-0000-4000-8000-000000000001" } }
```

```json
{ "eventId": "evt-000004", "runId": "run-20260703-000123", "sequence": 4, "timestamp": "2026-07-03T12:00:06Z", "type": "run.started", "severity": "info", "source": "core", "message": "Execution started.", "payload": { "phase": "initializing" } }
```

```json
{ "eventId": "evt-000042", "runId": "run-20260703-000123", "sequence": 42, "timestamp": "2026-07-03T12:01:00Z", "type": "run.progress", "severity": "info", "source": "core", "message": "Processing batch 3/8", "payload": { "progress": 37, "phase": "processing" } }
```

```json
{ "eventId": "evt-000057", "runId": "run-20260703-000123", "sequence": 57, "timestamp": "2026-07-03T12:01:31Z", "type": "run.warning", "severity": "warning", "source": "core", "message": "Retrying transient step (attempt 2/3).", "payload": { "code": "W-RETRY" } }
```

```json
{ "eventId": "evt-000090", "runId": "run-20260703-000123", "sequence": 90, "timestamp": "2026-07-03T12:02:10Z", "type": "run.completed", "severity": "info", "source": "core", "message": "Run completed successfully.", "payload": { "summary": "4,210 records processed.", "durationSec": 125 } }
```

```json
{ "eventId": "evt-hb-000013", "runId": "run-20260703-000123", "sequence": -1, "timestamp": "2026-07-03T12:01:40Z", "type": "heartbeat", "severity": "debug", "source": "bff", "message": "heartbeat", "payload": {} }
```

*(Heartbeats carry `sequence: -1` by convention — they are excluded from run ordering.)*
