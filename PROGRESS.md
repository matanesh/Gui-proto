DONE

# PROGRESS — Ops Command Center

**NEXT STEP: none — all steps complete.**

Rules: after each completed step, mark it `[x]`, add a note (what was done, files changed), update NEXT STEP above, and `git commit`. Never redo completed steps. When step 17 passes, write `DONE` on the first line of this file.

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
