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

The system name shown in the **boot animation**, the sidebar, and the browser
tab is a single editable value. Set it without touching code by creating a
`.env` (copy from [`.env.example`](.env.example)):

```bash
VITE_SYSTEM_NAME="Mission Control"
```

It falls back to `Ops Command Center` if unset. A short intro animation plays on
entry (CSS-only, GPU-friendly, respects `prefers-reduced-motion`, and is
skippable with any key/click).

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
- `connected-devices.csv` (children) — columns: `id, parentId, name, ip, type`
  (+ extras). `parentId` links a device to an access point `id`.

Edit those files (or use the in-app **Upload CSV** button to swap datasets for
the session — parsed in your browser, nothing is uploaded).

**Coverage sectors.** If an access point has `heading` (deg from north), `fov`
(deg), and `range` (m), the map draws a translucent coverage wedge — handy for
routers/antennas. Leave them blank for a plain marker.

**Command history per PC.** Sending a command from a PC's panel creates a run in
the same in-memory store as the Runs screen, tagged with the PC id. The panel
shows the latest command status and full history, each linking to Run Details.
Marker color reflects the latest command outcome (or device status if none yet).

## Folder structure

```
docs/                        Architecture & design documentation (see below)
src/
  app/                       Router + providers (TanStack Query, tooltips, toaster)
  components/
    layout/                  AppShell, Sidebar, TopHeader, PageHeader
    ui/                      shadcn/ui-style primitives (button, card, tabs, …)
    shared/                  Domain components (StatusBadge, RunsTable, MetricCard, …)
  features/
    dashboard/               Dashboard screen + live activity feed
    commands/                Command Launcher + dynamic command form
    runs/                    Runs History + flagship Run Details (tabs, timeline, logs)
    health/                  System Health screen
    configuration/           Configuration screen
  services/                  Mock REST + SSE layer (the future FastAPI seam)
  hooks/                     TanStack Query hooks + SSE consumption hooks
  models/                    Strict shared TypeScript models
  store/                     Zustand UI store (preferences, filters, sidebar)
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
