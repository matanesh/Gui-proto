# Ops Command Center — Prototype

A demo-ready, **frontend-only** prototype of an internal enterprise *Operational Command Center*: a dark, mission-control-style console for launching operational commands and following their runs in real time.

> **Sanitized prototype.** No real system names, endpoints, credentials, or business logic appear anywhere in this repository. All data is mocked in the browser.

---

## What this prototype is

- A polished React + TypeScript SPA demonstrating the **architectural intent** of a GUI for an existing Python Core system.
- A working demonstration of the **command lifecycle** (submit → accepted → running → terminal) driven by a **mock REST layer** and a **mock SSE event stream**.
- A clean, strongly-typed foundation whose service layer can be swapped for a real FastAPI BFF with **no changes to components**.

## What this prototype is **not**

- Not a real backend, FastAPI BFF, or RabbitMQ implementation.
- Not a real SSE server — the event stream is simulated in-browser.
- Not real authentication/authorization (a placeholder operator identity is shown).
- No WebSocket (deferred to a future phase — see [`docs/ADR.md`](docs/ADR.md)).
- No business logic in the frontend, and no real operational tool behind it.

---

## Tech stack

| Concern | Choice |
|---|---|
| Framework | React 19 + TypeScript (strict) |
| Build tool | Vite |
| Styling | Tailwind CSS v4 + shadcn/ui-style components |
| Routing | React Router |
| Server state | TanStack Query |
| UI/client state | Zustand |
| Icons / toasts | lucide-react / sonner |

Rationale for each decision is recorded in [`docs/ADR.md`](docs/ADR.md).

---

## Running the app

Requires Node.js 20+.

```bash
npm install
npm run dev      # localhost only  → http://localhost:5173
npm run build    # type-check (tsc -b) + production build to dist/
npm run preview  # preview the production build (localhost)
npm run lint     # ESLint (see "Linting" below)
```

### Localhost vs. network / IP

By default the dev server binds to **localhost** (only reachable from this
machine). To reach it from another device on your network — a phone, a VM, a
colleague's laptop — bind to all interfaces:

```bash
npm run dev:host          # binds 0.0.0.0; Vite prints the Network URL, e.g. http://192.168.1.42:5173
npm run preview:host      # same, for the production build
```

You can also set host/port explicitly via environment variables (honored by
`vite.config.ts`):

```bash
HOST=0.0.0.0 PORT=8080 npm run dev        # bind all interfaces on port 8080
PORT=3000 npm run dev                     # localhost:3000
npm run dev -- --host --port 8080         # equivalent one-off flags
```

To serve the built assets from any static host: `npm run build`, then serve the
`dist/` folder (e.g. `npm run preview:host`, or any static file server / nginx).

> Note: this is a frontend-only prototype with no backend — binding to the
> network only exposes the static UI and its in-browser mocks, no real data.

### System name (editable)

The system name shown in the **cinematic intro**, the sidebar, and the browser
tab is a single editable value. Set it without touching code by creating a
`.env` (copy from [`.env.example`](.env.example)):

```bash
VITE_SYSTEM_NAME="Mission Control"
```

It falls back to `Ops Command Center` if unset.

### Cinematic intro

A short mission-control entry sequence plays once per browser session — a
CSS/SVG starfield, a perspective grid, a command-vehicle silhouette with
engine glow, a radar sweep, and staggered HUD lines ("Establishing secure
demo session" → "All systems nominal") — before zooming/fading into the
dashboard. It's:

- **Skippable** — a visible "Skip intro" button, or <kbd>Esc</kbd>.
- **Session-remembered** — won't replay on refresh; presenters can force it
  again from **Configuration → Presentation → Replay intro** (also in the
  command palette).
- **Reduced-motion aware** — falls back to a near-instant static reveal.
- **Non-blocking** — wrapped in an error boundary; a rendering failure never
  prevents the dashboard underneath (already mounted) from showing.

See `src/components/intro/`.

### Linting

An MVP ESLint flat config ([`eslint.config.js`](eslint.config.js)) covers
JS/TypeScript recommended rules, React hooks correctness, and the Vite
fast-refresh guard. Run `npm run lint`; it currently reports **zero problems**.

---

## Fleet Map

The **Fleet Map** screen (`/map`) plots access points (PCs) on a Leaflet map,
with click-to-inspect details, connected devices, coverage sectors, and
command history.

**Offline / air-gapped tiles.** The engine is Leaflet (MIT, no API key). The
tile *source* is a config value so the same code works online and on an isolated
network:

```bash
# .env
VITE_MAP_TILE_SOURCE="google"     # default demo (also: "osm")
# For the isolated system, point at your internal tile server or bundled tiles:
VITE_MAP_TILE_SOURCE="offline"
VITE_MAP_TILE_URL="http://tiles.internal/{z}/{x}/{y}.png"
```

**Editable data (two CSVs).** The fleet loads from `public/data/`:

- `access-points.csv` (parents) — columns: `id, name, ip, lat, lng, group,
  deviceStatus, heading, fov, range` **+ any extra columns you add** (preserved
  and shown in the details panel).
- `connected-devices.csv` (children) — columns: `id, parentId, name, ip, type,
  lat, lng` (+ extras). `parentId` links a device to its **servicing** access
  point `id`. `lat`/`lng` are optional: fill them for a device whose exact
  position is known, leave blank for a device located only approximately (via
  its servicing AP).

Edit those files (or use the in-app **Upload CSV** button to swap datasets for
the session — parsed in your browser, nothing is uploaded).

**Coverage sectors.** If an access point has `heading` (deg from north), `fov`
(deg), and `range` (m), **double-click its marker** to reveal a translucent
coverage wedge — handy for routers/antennas. Double-click again to hide it.

**Command Console & mobile targeting.** The main **Dashboard** (and the Fleet
Map) has a Command Console: type an **IP** (an access point, *or* a connected
device such as a phone/laptop) — or a name/id — pick a command from the
dropdown, and **Send**. Targeting a device resolves to its servicing access
point; if the device reported an **exact** location it's shown precisely (with a
link line to its AP), otherwise an **approximate area** is drawn around the
servicing AP. Sending opens a **draggable, resizable floating window** with a
mini map of the target and the live command result (status/progress), plus a
link to the full Run Details.

**Command history per PC.** Sending a command from a PC's panel creates a run in
the same in-memory store as the Runs screen, tagged with the PC id. The panel
shows the latest command status and full history, each linking to Run Details.
Marker color reflects the latest command outcome (or device status if none yet).

## Demo storytelling layer (Scenario Runner, Live Event Stream, Timeline, Architecture, Failure Modes)

Everything under **Scenarios**, **Event Stream**, **Timeline**, **Architecture**,
and **Failure Modes** in the sidebar is a second, independent simulation layer —
deliberately separate from the Command Console / Runs / Dashboard mock REST+SSE
layer described above. That first layer models *one command → one run*; this
layer models *a whole scripted incident*, driving the event stream, the map,
and a presentation-oriented timeline together so it reads as a real demo
narrative rather than a single API call. Both are frontend-only simulations;
neither talks to `backend/`.

- **`src/store/demoStore.ts`** — a small Zustand-based scenario player
  (play/pause/reset/replay/speed 1x-2x-Instant/inject-failure/pause-stream)
  that fires each scenario's scripted steps on a timer, appending to a capped
  global event log and updating a role-keyed map overlay.
- **`src/demo/scenarios/scenarios.ts`** — 9 sanitized scenarios (Happy Path,
  Long Running, Progress Updates, Timeout + Retry, Partial Failure, Core
  Service Unavailable, Event Stream Disconnect + Recovery, Duplicate Event,
  Out-of-order Event), each with a title, description, duration, involved
  components, map effects, full event sequence, expected outcome, and
  presenter talking points.
- **Scenario Runner** (`/scenarios`) — browse, start/pause/reset/replay,
  change speed, or inject a failure mid-run.
- **Live Event Stream** (`/events` + a Dashboard widget) — every event
  emitted by the running scenario, filterable by severity/component, with a
  details dialog and correlation-id "show related events" linking. New rows
  animate in via a CSS keyframe (no JS animation loop).
- **Timeline / Replay** (`/timeline`) — the canonical async flow (user action
  → REST → BFF accept → broker publish → Core processing → progress event →
  SSE stream → UI update → map update → completion/failure) with the current
  stage driven live by whichever scenario step just fired; a clickable,
  scenario-scoped step list sits below with the same playback controls.
- **Fleet Map reactivity** — scenario map effects reference logical roles
  (`primary`/`secondary`/`region-a`/`route-a`), resolved at runtime to real
  markers from whatever CSV is loaded (`src/features/fleet/mapBindings.ts`),
  so any scenario lights up any dataset: overlay color + pulse per asset
  status, an animated route line, and a live scenario banner on the map.
- **Explain Architecture** (`/architecture`) — Runtime Flow / Deployment View
  / Failure View tabs sharing one linear node+edge diagram component (no
  external graph library), explaining REST-for-commands, SSE-for-updates,
  the BFF as a thin facade, RabbitMQ as the integration backbone, and where
  each failure mode actually lives in the topology.
- **Failure Modes** (`/failure-modes`) — 9 cards (SSE disconnected, command
  timeout, duplicate event, out-of-order event, BFF unavailable, Core
  processing failure, stale status, retry exhausted, partial success), each
  with what happens / user-visible behavior / recovery strategy /
  architectural implication, deep-linking into the matching scenario.
- **Command Palette** (<kbd>Ctrl/Cmd+K</kbd>, or the "Search commands" button
  in the header) — navigate anywhere, run the selected scenario, inject a
  failure, pause/resume the event stream, reset the demo, replay the intro,
  or toggle explain mode. See `src/features/command-palette/`.

## Recommended demo flow

1. Start with the cinematic intro (or replay it from Configuration / the palette).
2. Land on the Dashboard, then open the Fleet Map.
3. Open **Scenario Runner** and run **Happy Path Operation**.
4. Watch **Live Event Stream** fill in and the Fleet Map react live.
5. Open **Timeline / Replay** to explain the async REST/SSE flow step by step.
6. Open **Explain Architecture** and walk Runtime Flow → Deployment View → Failure View.
7. Run a scenario again and click **Inject Failure** mid-run.
8. Point out the recovery behavior in the event stream and on the map.
9. Open **Failure Modes** for the full engineering-maturity picture.
10. Close on "future integration path": swap `VITE_API_MODE=real` and point at `backend/` — see below.

## Folder structure

```
docs/                        Architecture & design documentation (see below)
src/
  app/                       Router + providers (TanStack Query, tooltips, toaster)
  components/
    intro/                   Cinematic intro (starfield, error boundary)
    layout/                  AppShell, Sidebar, TopHeader, PageHeader
    ui/                      shadcn/ui-style primitives (button, card, tabs, …)
    shared/                  Domain components (StatusBadge, RunsTable, MetricCard, SeverityBadge, …)
  features/
    dashboard/               Dashboard screen + live activity feed
    commands/                Command Console + dynamic command form
    runs/                    Runs History + flagship Run Details (tabs, timeline, logs)
    fleet/                   Fleet Map (Leaflet), CSV data, scenario map bindings
    health/                  System Health screen
    configuration/           Configuration screen
    scenarios/               Scenario Runner (catalog, details, controls, step list)
    events/                  Live Event Stream panel + page
    timeline/                Timeline/Replay (pipeline stepper + step list)
    architecture/            Explain Architecture (runtime/deployment/failure diagrams)
    failure-modes/           Failure Modes cards
    command-palette/         Ctrl/Cmd+K palette + action registry
  demo/                      Scenario data, architecture data, failure-mode data
    scenarios/               The 9 sanitized scenario definitions
    architecture/            Static architecture node/edge + deployment-unit data
    failure-modes/           Static failure-mode reference data
  services/                  Mock REST + SSE layer (the future FastAPI seam)
  hooks/                     TanStack Query hooks + SSE consumption hooks
  models/                    Strict shared TypeScript models (incl. Scenario, EventMessage, ArchitectureNode/Edge, FailureMode)
  store/                     Zustand stores — uiStore (preferences/filters) + demoStore (scenario player)
  lib/                       Utilities (cn, formatting, id generation)
```

## Documentation

The `docs/` directory is a first-class deliverable, not scratch notes:

| Document | Contents |
|---|---|
| [`HLD.md`](docs/HLD.md) | High-level design, component responsibilities, command/event flows, run lifecycle (with Mermaid diagrams) |
| [`ADR.md`](docs/ADR.md) | Ten architecture decision records (React+Vite, FastAPI BFF, RabbitMQ, REST/SSE, WebSocket deferred, state management, …) |
| [`API_CONTRACT.md`](docs/API_CONTRACT.md) | REST + SSE contract for the future BFF (202 Accepted pattern, filters, error/idempotency models) |
| [`EVENT_SCHEMA.md`](docs/EVENT_SCHEMA.md) | RunEvent envelope, event types, ordering/dedup/replay/reconnect semantics |
| [`GUI_SPEC.md`](docs/GUI_SPEC.md) | UX principles, screens, component inventory, states, responsive/accessibility |
| [`FAILURE_MODES.md`](docs/FAILURE_MODES.md) | How the UI behaves under submission failures, SSE disconnects, gaps, floods, outages |
| [`CODE_REVIEW_CHECKLIST.md`](docs/CODE_REVIEW_CHECKLIST.md) | Reviewer checklist enforcing the architecture boundaries |

---

## Architecture assumptions

The target production topology (mocked here) is:

```
Command flow:  Browser → REST → FastAPI BFF → RabbitMQ → Python Core
Event flow:    Python Core → RabbitMQ → FastAPI BFF → SSE → Browser
```

- **Frontend is UI only.** Business logic stays in the Python Core.
- **FastAPI BFF is a thin translation/facade layer** (REST + SSE ↔ RabbitMQ). It owns no business rules.
- **RabbitMQ is the integration backbone** — async execution, decoupling, routing, retries.
- **REST for commands** (discrete request/ack, the 202 Accepted + `runId` pattern); **SSE for runtime updates** (one-way status/progress/logs/completion).

---

## Mock REST layer

Lives in `src/services/`. Every call goes through `simulateRequest()` in
[`apiClient.ts`](src/services/apiClient.ts), which adds realistic latency and an
occasional simulated failure so the UI's loading/error paths are genuinely
exercised. An in-memory run store ([`mockData.ts`](src/services/mockData.ts))
holds a seeded history plus any runs launched this session, and enforces
idempotency via `clientRequestId`.

Page components **never** import mock data directly — they consume TanStack
Query hooks (`src/hooks/`) which call the service modules. This is the seam that
makes the backend swap trivial.

## Mock SSE layer

[`eventStreamClient.ts`](src/services/eventStreamClient.ts) is an
`EventSource`-like abstraction that, for a given `runId`, emits:

- an ordered, **sequenced** lifecycle (`run.accepted → queued → started → progress/log/warning → terminal`),
- periodic **heartbeats**,
- a **simulated mid-run reconnect** (which re-delivers recent events, exactly as a real server would replay after `Last-Event-ID`),
- **cooperative cancellation** (a cancel request produces a `run.cancelled` event).

The consuming hooks (`useSseConnection`, `useRunEvents`) apply the client-side
guarantees from [`EVENT_SCHEMA.md`](docs/EVENT_SCHEMA.md): **dedup** by
`eventId`/`sequence`, **ordering** by sequence, **gap detection**, bounded
rendering (flood protection), and heartbeat tracking. The **Run Details** screen
is where all of this is on display.

---

## Connecting a real backend later

**Real FastAPI REST** — replace the bodies of `commandsApi.ts`, `runsApi.ts`,
and `healthApi.ts` with `fetch` calls against the endpoints in
[`API_CONTRACT.md`](docs/API_CONTRACT.md). The models, hooks, and components stay
as-is because they already speak the contract's shapes.

**Real SSE** — replace `connectRunEventStream()` with:

```ts
const source = new EventSource(`${apiBaseUrl}/api/events/stream?runId=${runId}`);
source.onmessage = (e) => onEvent(JSON.parse(e.data) as RunEvent);
// The browser sends Last-Event-ID automatically on reconnect; the BFF replays
// from its window. Keep the dedup/ordering logic in useRunEvents unchanged.
```

`useSseConnection` already owns connect/cleanup, so only the client construction changes.

## Real backend (FastAPI BFF + RabbitMQ + Core)

The [`backend/`](backend/) directory contains a working implementation of the HLD:
a **FastAPI BFF** that serves the REST contract and an SSE stream, a **RabbitMQ**
integration, and a sanitized **Python Core** worker. It runs two ways:

- **No broker (default)** — an internal simulator drives run lifecycles, so the
  BFF is fully usable without RabbitMQ:
  ```bash
  cd backend && python3 -m venv .venv && source .venv/bin/activate
  pip install -r requirements.txt
  uvicorn app.main:app --reload --port 8000    # docs at http://localhost:8000/docs
  ```
- **Full stack** — RabbitMQ + BFF + Core via Docker:
  ```bash
  docker compose up --build                    # from the repo root
  ```

Point the frontend at it (default stays mock, so this is opt-in):

```bash
VITE_API_MODE=real VITE_API_BASE_URL=http://localhost:8000/api npm run dev
```

> The frontend real-mode adapter (swapping the mock services for `fetch` +
> `EventSource` behind `VITE_API_MODE`) is the remaining wiring step — see
> `backend/README.md` and PROGRESS.md (Phase 3, step B9).

See [`backend/README.md`](backend/README.md) for endpoints, layout, and the
broker vs. no-broker details.

---

## Design decisions in brief

- **Why REST for commands?** Commands are discrete request/acknowledge interactions; REST maps cleanly to OpenAPI and enables the 202 Accepted + `runId` async pattern.
- **Why SSE for updates?** Status/progress/logs are one-way server→client streams; SSE is plain HTTP, proxy-friendly, and has native browser reconnect with `Last-Event-ID`.
- **Why no WebSocket in v1?** There is no bidirectional realtime requirement; REST + SSE cover the full interaction model without the added operational complexity. It remains a documented upgrade path.
- **Why no real backend here?** The goal is to demonstrate architectural intent and a clean, replaceable frontend foundation — not to ship a production system.

Full reasoning: [`docs/ADR.md`](docs/ADR.md).

---

## Security & sanitization

- No secrets, tokens, or credentials anywhere in the repository.
- No real endpoints, hostnames, IPs, or network details — placeholders only (e.g. `/api`).
- No real system names, usernames, or classified/domain-specific terminology — generic enterprise vocabulary and generic commands only (Data Sync, Health Scan, Report Generation, Batch Validation, Configuration Check, Simulation Run).
- The Configuration screen's endpoint fields are read-only placeholders; production values are injected by deployment/runtime configuration.
