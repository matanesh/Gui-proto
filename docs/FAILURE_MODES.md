# Failure Modes — Ops Command Center

> How the system (and specifically the frontend) behaves when things go wrong. Guiding rule: **the UI never invents state** — it shows what it knows, marks what it doesn't, and recovers via the snapshot API.

## Command submission failures

REST `POST /api/commands/{id}/runs` fails (network error, 4xx/5xx):

- The form keeps its state; nothing is cleared.
- A clear error is shown (validation details per field for 400; "broker unavailable, safe to retry" for 503).
- Retry re-sends with the **same `clientRequestId`** — idempotency guarantees no duplicate run.
- No run entry, no navigation, no phantom "pending" row is created for a failed submit.

## Command accepted but no events

202 received (runId exists) but no SSE events arrive within an expected window (~10–15s):

- UI shows the run in `accepted` state — honest, not "running".
- A **delayed-telemetry warning** appears: "Run accepted; no telemetry received yet."
- The UI polls the snapshot (`GET /api/runs/{runId}`) at a modest interval as a fallback.
- Once events arrive, the warning clears and live updates take over.

## SSE disconnect

- Connection pill flips to `reconnecting`; last-known data stays visible, marked possibly stale.
- Retries use exponential backoff with jitter (1s → 2s → 4s → … cap ~30s).
- Heartbeats define liveness: no heartbeat for > ~2.5 intervals ⇒ treat the stream as dead even if the socket looks open.
- After repeated failures: state `disconnected`, manual "Reconnect" affordance, snapshot polling as fallback.
- On successful reconnect: resume via `Last-Event-ID` replay, or snapshot-recover if the replay window was exceeded.

## Duplicate events

At-least-once delivery makes duplicates normal (especially after reconnect/replay):

- Deduplicate by `eventId` / `(runId, sequence)`.
- Duplicates are dropped silently; the Diagnostics tab counts them.
- Rendering is idempotent — applying the same event twice must not corrupt progress/status.

## Out-of-order events

- `sequence` is the ordering authority; the timeline/log views render in sequence order.
- Slightly early events are buffered briefly (~1–2s) to allow reordering.
- Status regressions are refused: a `running` event arriving after `run.completed` is discarded (terminal states are sticky).

## Event gap

Detected when an event's `sequence` jumps more than +1 past the last contiguous one:

- Short buffer wait; if the gap persists → **snapshot recovery** via `GET /api/runs/{runId}`.
- After recovery, live events with `sequence` ≤ snapshot's applied sequence are dropped.
- The timeline shows a gap marker; missing events are never fabricated.

## Event flood

- `run.progress` coalesced to a few renders/sec; `run.log` batched per animation frame.
- Log and event lists are virtualized — DOM stays bounded regardless of volume.
- Severity filters cut visible noise; counters remain accurate.
- If coalescing hides intermediate values, the UI notes "N events coalesced".

## RabbitMQ unavailable

Production design decision for the BFF: **fail fast** (503 on submit, `BROKER_UNAVAILABLE`) or **degrade** (accept + buffer, only if explicitly designed with ownership of that buffer).
Frontend behavior either way:

- Submit errors clearly state the dependency failure and that retry is safe (idempotent).
- System Health shows the broker as `unavailable`/`degraded`; Dashboard status cards reflect it.

## Core unavailable

- New runs stay `queued` (visible as such, with queue position if known) or fail fast with a clear terminal status — per production policy.
- The UI shows honest `queued` state and elapsed wait; no fake progress.
- System Health marks the Python Core `unavailable`; runs affected show their last authoritative state.

## BFF restart

- All SSE connections drop → standard reconnect path (backoff + `Last-Event-ID`).
- In-flight REST requests fail → standard error surfaces with retry.
- After reconnect, snapshots are refetched (TanStack Query refetch-on-reconnect) so views resync to authoritative state.
- If the BFF lost its replay window on restart, clients snapshot-recover — by design, no data is invented.

## Browser refresh

- The URL carries the context (`/runs/:runId`); on load the UI fetches the snapshot first, then subscribes to live events.
- Events at or below the snapshot's sequence are dropped as already-applied.
- UI preferences (sidebar, filters) survive via Zustand persistence where configured; no server truth is persisted client-side.

## Partial telemetry

Some fields may be missing (e.g. no `startedAt` yet, unknown duration, no progress for a phase):

- Missing values render as explicit placeholders ("—", "not reported"), never as fabricated defaults.
- Progress without a terminal event does not imply success; status comes only from status-bearing events/snapshots.
- The Diagnostics tab exposes what the client actually knows: last sequence, heartbeat age, duplicates dropped, gaps detected.
