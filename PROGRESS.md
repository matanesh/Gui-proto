# PROGRESS — Ops Command Center

**NEXT STEP: B11 verify + commit the backend (see HANDOFF_NIGHT.md), then B9 frontend real-mode wiring — do these in an INTERACTIVE session (python/git/tsc were blocked overnight).**

> Phases 1 & 2 (docs + mock frontend) are COMPLETE (see checklist below).
> **Phase 3 (bottom of file)** aligns the code with the HLD: a real FastAPI BFF
> that talks to RabbitMQ and a Python Core, with SSE. The mock frontend keeps
> working; the real path is behind an env flag. Work Phase 3 top-to-bottom.

Rules: after each completed step, mark it `[x]`, add a note (what was done, files changed), update NEXT STEP above, and `git commit` + `git push`. Never redo completed steps. When Phase 3 passes, write `DONE` on the first line of this file.

## Checklist

### Step 0 — Bootstrap
- [x] 0. git init, .gitignore, GOAL.md, PROGRESS.md, fix CLAUDE.md reference, initial commit
  - Note: repo initialized on branch `main`; CLAUDE.md now points to the real handoff files.

### Phase 1 — Documentation
- [x] 1. docs/HLD.md — full HLD with Mermaid diagrams (architecture, command flow, event flow, run lifecycle)
- [x] 2. docs/ADR.md — ADR-001…ADR-010, full Context/Decision/Alternatives/Rationale/Tradeoffs/Consequences/Revisit structure
- [x] 3. docs/API_CONTRACT.md — all 7 endpoints, examples, error/pagination/idempotency models, status code guidance
- [x] 4. docs/EVENT_SCHEMA.md — RunEvent envelope, 11 types, 5 severities, ordering/dedup/replay/reconnect/gap/flood handling, JSON examples
- [x] 5. docs/GUI_SPEC.md — UX principles, IA, 6 screens, component inventory, states, responsive/a11y, mock data rules
- [x] 6. docs/FAILURE_MODES.md — all 12 failure scenarios with UI behavior
- [x] 7. docs/CODE_REVIEW_CHECKLIST.md — 7 review sections as checkable assertions

### Phase 2 — Frontend prototype
- [x] 8. Scaffold Vite + React + TS at root — manual scaffold (package.json, vite.config.ts, tsconfigs, index.html, src/main.tsx), npm install OK, build OK. Note: themed index.css landed here too.
- [x] 9. Tailwind v4 via @tailwindcss/vite + dark mission-control theme tokens; hand-written shadcn-style primitives in src/components/ui (button, card, badge, tabs, table, input, select, switch, label, progress, skeleton, separator, tooltip, dialog, sonner); cn + format utils in src/lib/utils.ts
- [x] 10. Router + app shell — createBrowserRouter with 6 routes, AppShell/Sidebar/TopHeader/PageHeader, page stubs per feature. Note: Zustand uiStore.ts created here (sidebar state needed it) — step 13 covers Query wiring only.
- [x] 11. Typed models — src/models/{run,command,event,health,sse,index}.ts, strict unions + envelopes per docs
- [x] 12. Mock service layer — apiClient (latency+failure sim, ApiError), mockData (6 commands, seeded 42-run history, in-memory run store, idempotency ledger, health fixtures), commandsApi, runsApi (202+runId, filters, snapshot, cancel), healthApi
- [x] 13. TanStack Query hooks — useCommands, useRunsList/useRun/useSubmitCommand/useCancelRun (with invalidation), useHealth (+timeline, refresh interval from uiStore). Provider landed in step 10; uiStore in step 10.
- [x] 14. Mock SSE — eventStreamClient (EventSource-like handle, heartbeats, sequenced lifecycle driver, cooperative cancel, simulated reconnect + Last-Event-ID-style replay, terminal-run condensed replay), useSseConnection (lifecycle/cleanup), useRunEvents (dedup, ordering, gap detection, bounded rendering, diagnostics)
- [x] 15a. Dashboard — hero status strip, 6 metric cards, system status (4 components), recent runs table, live activity feed, CTA; shared components created (StatusBadge, RiskBadge, ConnectionPill, MetricCard, HealthIndicator, Empty/ErrorState, RunsTable)
- [x] 15b. Command Launcher — catalog grouped by category, selectable cards, details panel (risk, est. duration), DynamicCommandForm (text/number/select/boolean, validation, a11y), 202 submit → toast → navigate to Run Details
- [x] 15c. Run Details (flagship) — status header (badge, copyable runId, live progress, phases, timestamps), ConnectionPill, cancel/retry/export actions, 6 tabs (Overview/Timeline/Logs/Events/Payload/Diagnostics), RunTimeline + LogViewer (severity floor, auto-follow, export) + EventFeed; snapshot polling + payload store added to runsApi/mockData
- [x] 15d. Runs History — RunsFilterBar (status toggles, command, date range, runId search), sortable columns (created/duration/status), server-driven pagination, loading/empty/error states; filters persisted in uiStore
- [x] 15e. Configuration — placeholder API base URL + SSE path (read-only, sanitization note), feature flags (activity feed, log auto-follow), display prefs (health refresh interval, severity floor, max rendered events); all wired to persisted uiStore
- [x] 15f. System Health — 5 component cards (status accent, latency, last-checked) with degraded banner, broker/stream metric cards, health-check timeline; auto-refresh via uiStore interval
- [x] 16. README.md at root — what it is/isnt, stack, run instructions, folder structure, docs index, architecture assumptions, mock REST/SSE explanation, how to connect real FastAPI/SSE, design rationale, sanitization notes
- [x] 17. Verify — npm run build (tsc -b + vite build) passes clean; dev server boots and serves HTTP 200 with correct title. Chunk-size note is an advisory warning only. DONE written to top of PROGRESS.md.

## Post-completion polish (after DONE)
- Route-level code splitting: pages lazy-loaded in src/app/router.tsx with a Suspense fallback in AppShell. Main chunk 558 kB → 393 kB; per-screen chunks load on demand; chunk-size build warning resolved.
- Added catch-all 404 route (src/features/misc/NotFoundPage.tsx) for unknown URLs.

## Feature: Fleet Map (added after DONE)
- New /map screen (Leaflet + react-leaflet, MIT). Tile source configurable
  (google default / osm / offline internal URL via VITE_MAP_TILE_*).
- Two editable CSVs in public/data (access-points + connected-devices),
  parser preserves unknown columns; in-app Upload CSV override.
- Markers colored by latest command outcome / device status; optional coverage
  sector wedges (heading/fov/range); click -> details panel (fields, extras,
  connected devices, last status, history).
- Command send from a PC creates a run tagged with targetPcId (extended Run,
  CommandRequest, RunsFilter, mock store + seeded PC-targeted history);
  history links to Run Details.
- Files: src/features/fleet/*, src/services/fleetApi.ts, src/hooks/useFleet.ts,
  src/config/map.ts, src/models/fleet.ts, src/lib/csv.ts.

## Feature: Command Console + mobile targeting + floating result window (added after DONE)
- Command Console on Dashboard + Fleet Map: search target by IP/name/id (access
  point OR connected device), pick command from dropdown, Send.
- Mobile device targeting: device resolves to servicing AP; exact location shown
  if reported (marker + link line), else approximate area (circle) around the AP.
  connected-devices.csv gained optional lat/lng; some phones/laptops added.
- Draggable/resizable floating result window (react-rnd) with mini map (TargetMap)
  + live run status/progress; drives run lifecycle via useRunEvents.
- Coverage pizza now shown on double-click of a marker (was global toggle).
- Runs extended with targetDeviceId + targetLabel; submit + seed updated.
- Files: src/features/fleet/{CommandConsole,CommandResultWindow,TargetMap,targets}.tsx,
  src/features/commands/defaults.ts; edits to MapView, FleetMapPage, PcDetailsPanel,
  SendCommandDialog, DashboardPage, models, fleetApi, mockData, runsApi.

## Rework: dedicated Command Console screen + dockable map (added after DONE)
- Removed the command console from the main Dashboard (Dashboard = generic data only).
- /commands is now the Command Console: target field (IP/name/id) + command dropdown
  + full parameter form (DynamicCommandForm, submitLabel="Send command"); below it a
  result panel (status + progress bar + parsed logs via LogViewer) on the left and a
  map on the right.
- DockableMap: docked to the right by default (resizable via left-edge drag), with a
  Float button -> movable react-rnd window, and Dock button back.
- Reused useRun + useRunEvents to drive live result; TargetMap for the location.
- Removed old CommandLauncherPage (catalog browse); DynamicCommandForm gained submitLabel.
- Files: src/features/commands/{CommandConsolePage,CommandResultPanel}.tsx,
  src/features/fleet/DockableMap.tsx; edits to router, DynamicCommandForm, DashboardPage.

## Phase 3 — Real backend, HLD alignment (in progress)

Goal: React → REST → FastAPI BFF → RabbitMQ → Python Core; Core → RabbitMQ → BFF → SSE → React.
The BFF must also run standalone (no broker) via an internal simulator, so it's demoable without RabbitMQ.
Everything sanitized. Frontend stays mock by default; real mode via env flag. Commit + push after each step.

> NIGHT NOTE (autonomous resume): the non-interactive session could run file
> writes only — `git` and `python` were permission-blocked, so B1–B8 & B10 are
> WRITTEN TO DISK but NOT yet committed/pushed and NOT yet verified. See
> HANDOFF_NIGHT.md for the exact morning verify + commit steps. Do B9 + B11 in an
> interactive session where tsc/npm/git run, then commit everything.

- [x] B1. Backend scaffold — backend/{requirements.txt,.env.example,.gitignore,README.md,Dockerfile}, app package + core package. (written; unverified)
- [x] B2. Pydantic models — backend/app/models.py (CamelModel + to_camel alias → camelCase JSON matching the frontend). (written; unverified)
- [x] B3. Store + catalog — backend/app/store.py (in-memory runs, idempotency, event log, health, seeded history incl. ap-targeted) + catalog.py (6 sanitized commands). (written; unverified)
- [x] B4. REST endpoints — backend/app/api/{commands,runs,health}.py: GET /commands, POST /commands/{id}/runs (202+runId+idempotency), GET /runs (filters+paginate), GET /runs/{id}, POST /runs/{id}/cancel, GET /health. (written; unverified)
- [x] B5. SSE — backend/app/bus.py (async pub/sub) + simulator.py (no-broker lifecycle driver) + api/events.py (text/event-stream, heartbeats, Last-Event-ID replay). (written; unverified)
- [x] B6. RabbitMQ — backend/app/broker.py (aio-pika command publisher + event consumer, applies events to snapshot + fans to bus); enabled via BFF_BROKER_ENABLED. (written; unverified)
- [x] B7. Python Core worker — backend/core/worker.py (consumes commands, drives lifecycle, publishes RunEvents). (written; unverified)
- [x] B8. docker-compose.yml (rabbitmq + bff + core) + backend/Dockerfile. (written; unverified)
- [ ] B9. Frontend real adapters behind the service interface: realApiClient + real EventSource stream; env VITE_API_MODE=mock|real, VITE_API_BASE_URL. Default mock (app unchanged). **NOT STARTED — needs an interactive session (tsc) to avoid breaking the working frontend build.**
- [x] B10. Docs — backend/README.md + root README "Real backend" section. (docs/HLD.md "running the real stack" still TODO)
- [ ] B11. Verify: venv pip install; python -m compileall backend; boot BFF no-broker; curl REST + SSE; docker compose up round-trip; npm run build after B9. **NOT DONE — python/git blocked in the autonomous session.**
