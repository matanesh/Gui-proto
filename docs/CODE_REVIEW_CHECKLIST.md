# Code Review Checklist — Ops Command Center

> Apply to every PR touching this prototype. Items phrased as assertions — a reviewer should be able to check each one.

## Architecture boundaries

- [ ] No business logic in the frontend — the UI renders state and submits commands; it never decides outcomes.
- [ ] Page/feature components do **not** import `mockData.ts` (or any mock fixtures) directly — all data flows through the service layer + query hooks.
- [ ] Service layer is clean: one module per API area (`commandsApi`, `runsApi`, `healthApi`, `eventStreamClient`), all returning typed models.
- [ ] Replacing mocks with real FastAPI endpoints requires changes **only** inside `src/services/` (and config), not in components or hooks.
- [ ] REST (commands/queries) and SSE (telemetry) responsibilities are not mixed in the same module.

## TypeScript

- [ ] `strict` mode passes; no new `any` (justify any exception in the PR description).
- [ ] Shared models live in `src/models/` and are reused — no ad-hoc redeclared shapes in components.
- [ ] Unions (`RunStatus`, `RunEventType`, `Severity`, `SseConnectionState`) are exhaustively handled (`switch` with `never` check or lookup maps).
- [ ] Public functions/hooks have explicit return types.

## State management

- [ ] Server-state data (commands, runs, health) is fetched via TanStack Query hooks — never stored in Zustand.
- [ ] Zustand holds UI/client state only (sidebar, filters, tabs, preferences).
- [ ] No duplicated runtime truth: SSE-derived view state lives in hook/component scope and reconciles against snapshot queries.
- [ ] Query keys are consistent and invalidation is intentional (e.g. submit → invalidate runs list).

## UI/UX

- [ ] Every data surface has loading (skeleton), empty, and error (with retry) states.
- [ ] Status is conveyed with text + color, never color alone.
- [ ] Layout is responsive per GUI_SPEC (sidebar collapse, grid reflow, table scroll).
- [ ] Interactive elements are keyboard-accessible with visible focus; forms have labels and error text.
- [ ] Timestamps, runIds, sequences, and payloads render in monospace; formatting helpers are shared, not duplicated.

## SSE / events

- [ ] Connection status (`connecting/open/reconnecting/disconnected`) is exposed to the user wherever a stream is consumed.
- [ ] Heartbeat handling exists and stalls are detected (no heartbeat ⇒ reconnect path).
- [ ] Reconnect uses backoff and is visible in the UI.
- [ ] Events are deduplicated by `eventId`/`sequence`; ordering uses `sequence`; terminal states are sticky.
- [ ] Stream subscriptions are cleaned up on unmount (no leaked timers/intervals/listeners).
- [ ] Comments map the mock behavior to real `EventSource` + `Last-Event-ID` where relevant.

## Security / sanitization

- [ ] No secrets, tokens, or credentials anywhere in the repo.
- [ ] No real endpoints, hostnames, IPs, or network details — placeholders only.
- [ ] No real system names, usernames, or classified/domain-specific terminology — generic enterprise vocabulary only.
- [ ] Mock data follows the sanitization rules in GUI_SPEC §9.

## Maintainability

- [ ] Components are reasonably small and single-purpose; shared pieces extracted to `components/shared` or `components/ui`.
- [ ] Folder structure matches the documented layout (`features/`, `services/`, `models/`, `store/`, `hooks/`).
- [ ] Names are readable and domain-consistent (run, command, event — matching the models).
- [ ] No over-engineering: no speculative abstractions, no unused generics, no premature optimization.
- [ ] `npm run build` and type checks pass; no new lint warnings.
