# GUI Specification — Ops Command Center

> Frontend specification for the prototype. Style target: dark enterprise mission-control — technical, premium, not flashy.

## 1. UX Principles

1. **Honest state** — the UI never invents backend state. Loading, partial, stale, and disconnected states are shown explicitly.
2. **Command vs. telemetry separation** — actions (REST) and live updates (SSE) are visually and architecturally distinct.
3. **Lifecycle-first** — everything orbits the run lifecycle: submit → accepted → running → terminal.
4. **Progressive disclosure** — dashboards summarize; details live one click deeper (Run Details tabs).
5. **Operator efficiency** — dense but scannable; strong hierarchy, status colors, keyboard-friendly forms.
6. **Sanitized always** — generic commands, generic operators, placeholder endpoints.

## 2. Information Architecture & Navigation

Persistent left **sidebar** (collapsible) + top **header**.

```
Ops Command Center
├── Dashboard        /
├── Commands         /commands
├── Runs             /runs
│   └── Run Details  /runs/:runId
├── System Health    /health
└── Configuration    /config
```

Header: app name/logo area, global run-activity hint, SSE/system status pill, placeholder user chip ("operator-01").
Sidebar: nav items with icons + active state; collapse toggle (state in Zustand).

## 3. Screens

### 3.1 Dashboard — `/`
Purpose: high-level operational overview; the "wall screen".
Contents: hero/status strip (system state summary + CTA "Launch Command"); metric cards — active runs, completed (24h), failed (24h), average duration, queue depth (mock), event throughput (mock); system status cards for Frontend / FastAPI BFF / Message Broker / Python Core; recent runs table (last ~8, row → Run Details); live activity feed (recent events across runs, mock stream).

### 3.2 Command Launcher — `/commands`
Purpose: select a generic command, configure, launch.
Layout: catalog list/grid grouped by category (left) + selected-command details panel (right).
Details panel: description, category, **risk level badge** (low/medium/high), estimated duration, dynamically rendered configuration form from `configurableFields` (text/number/select/boolean), inline validation, Launch button.
Submit flow: validate → `POST` mock submit → show **202 accepted** state with runId → navigate to Run Details. Submission errors keep form state and show a retry-able error.

### 3.3 Run Details — `/runs/:runId` (flagship)
Purpose: full lifecycle view of one run; the demo centerpiece.
Header: command name, runId (copyable), status badge, progress bar, current phase, **SSE connection pill** (connecting / open / reconnecting / disconnected), timestamps (createdAt/startedAt/completedAt), duration, requestedBy.
Actions: Cancel (only while active), Retry (only when terminal), Export Logs — mock behaviors.
Tabs:
- **Overview** — summary, key fields, progress, latest events digest.
- **Timeline** — lifecycle events as a vertical timeline (accepted → queued → started → progress milestones → terminal).
- **Logs** — virtualized log viewer (`run.log`), severity filter, auto-follow toggle, export.
- **Events** — raw event feed with type/severity/sequence, dedup/order guaranteed.
- **Request Payload** — the submitted parameters + clientRequestId, pretty JSON.
- **Diagnostics** — connection stats (events received, duplicates dropped, last sequence, heartbeat age), gap/reconnect notices.
Live behavior: events stream in via mock SSE; progress and status update in real time; simulated reconnect visibly flips the connection pill; terminal event closes the stream and finalizes the header.

### 3.4 Runs History — `/runs`
Purpose: list/inspect historical runs.
Contents: filter bar (status multi-select, command type, date range, search by runId), sortable columns (createdAt, duration, status), client-side pagination, row click → Run Details. Full loading (skeleton rows), empty ("No runs match your filters"), and error (retry) states.

### 3.5 Configuration — `/config`
Purpose: generic frontend configuration (mock).
Contents: mock API base URL + mock SSE endpoint path (display/edit, clearly marked *"production values are injected by deployment/runtime configuration — never hardcoded"*); feature flags (e.g. auto-follow logs, activity feed on dashboard); UI preferences (density, timestamp format); refresh interval; event display preferences (max rendered events, severity floor). No secrets, no real network details.

### 3.6 System Health — `/health`
Purpose: architecture component health.
Contents: component cards (Frontend, FastAPI BFF, Message Broker, Python Core, SSE Stream) with status (operational/degraded/unavailable/unknown), mock latency, lastCheckedAt, details line; metrics strip (queue depth, failed messages, DLQ count, event backlog); health-check timeline (recent checks with statuses); degraded/unavailable visual treatments.

## 4. Component Inventory

Layout: `AppShell`, `Sidebar`, `TopHeader`, `PageHeader`.
Primitives (shadcn/ui-style): Button, Card, Badge, Tabs, Table, Input, Select, Switch, Label, Progress, Skeleton, Dialog, Tooltip, Toast (sonner), Separator.
Shared/domain: `StatusBadge` (run status → color), `RiskBadge`, `ConnectionPill` (SSE state), `MetricCard`, `SystemStatusCard`, `RunsTable`, `EventFeed`, `LogViewer` (virtualized), `Timeline`, `CommandCard`, `DynamicCommandForm`, `EmptyState`, `ErrorState`, `HealthIndicator`.

## 5. Loading / Empty / Error States

Every data surface implements all three:
- **Loading** — skeletons matching final layout (cards, table rows); never spinners-only for large areas.
- **Empty** — explanatory copy + primary action where sensible (e.g. "No runs yet — launch your first command").
- **Error** — concise message + Retry button; errors from the mock layer are surfaced, not swallowed.
SSE additionally exposes `connecting/open/reconnecting/disconnected` in the ConnectionPill and Diagnostics tab.

## 6. Responsive Behavior

- Desktop-first (operator consoles), functional down to tablet width.
- Sidebar collapses to icons below ~1024px; auto-collapsed by default below ~768px.
- Card grids reflow 4 → 2 → 1 columns; tables allow horizontal scroll on narrow screens.
- Run Details tabs remain usable at narrow widths (scrollable tab list).

## 7. Accessibility Basics

- Semantic landmarks (nav/main/header); one h1 per screen.
- All interactive elements keyboard reachable; visible focus rings.
- Status never conveyed by color alone — badges carry text labels.
- Form fields have associated labels and error text (`aria-invalid`, described-by).
- Live regions: toast announcements; log auto-follow does not trap focus.
- Contrast: dark theme tuned for WCAG AA on text and status colors.

## 8. Visual Language

- Background: near-black slate; surfaces: elevated slate cards with subtle borders.
- Accents: blue/cyan for primary actions and links.
- Status colors: emerald = succeeded/operational, blue = running/info, amber = queued/warning/degraded, red = failed/error/unavailable, slate = cancelled/unknown, violet = accepted.
- Typography: clean sans for UI, monospace for runIds, sequences, logs, payloads.
- Density: compact tables, generous page-level spacing; no decorative noise.

## 9. Mock Data Guidelines

- Commands: only the six generic ones (Data Sync, Health Scan, Report Generation, Batch Validation, Configuration Check, Simulation Run).
- Operators: `operator-01…operator-05`. RunIds: `run-YYYYMMDD-NNNNNN`. Events: `evt-NNNNNN`.
- History: a few dozen runs across all statuses and the last ~14 days, deterministic enough for stable demos.
- Log lines: plausible but generic ("Validating configuration…", "Processing batch 3/8") — no real system vocabulary.
- Mock latency 150–600ms; occasional (~5%) simulated errors on queries, lower on submit; never on the demo-critical happy path in Run Details.
- All mock data lives behind the service layer (`services/mockData.ts`); **pages never import it directly**.

## 10. Architectural Demonstrations (what a reviewer must be able to see)

1. REST command submission with 202 + runId acknowledgment.
2. Async run lifecycle from accepted to terminal, visualized live.
3. SSE runtime updates: ordered events, heartbeat, reconnect simulation, connection states.
4. Separation of commands (REST) and telemetry (SSE) in both UI and code.
5. Frontend as UI only — no business logic; service layer swappable for real FastAPI.
