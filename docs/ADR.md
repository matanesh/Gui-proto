# Architecture Decision Records — Ops Command Center

> Status: Accepted for v1 unless noted. Sanitized: no real system names, endpoints, or business specifics.

---

## ADR-001: React + TypeScript + Vite for the Frontend

### Context
We need a modern SPA for an internal operational GUI. There is no SEO requirement and no server-side rendering requirement. The team values fast iteration and a clear separation from backend concerns.

### Decision
Use **React + TypeScript + Vite** for the frontend.

### Alternatives Considered
- Angular — batteries-included but heavier ceremony for an internal SPA of this size.
- Vue — viable; React chosen for ecosystem breadth and team familiarity.
- Next.js — see ADR-002.

### Rationale
- Excellent fit for an internal SPA; fast dev server and build via Vite.
- Strong ecosystem (Router, TanStack Query, shadcn/ui).
- TypeScript gives strict contracts shared across services/hooks/screens.
- No SSR/SEO requirements; a static bundle is the simplest deployable artifact.

### Tradeoffs
- More assembly required than a full framework (routing, state, structure are choices we own).

### Consequences
- Clean UI-only frontend; backend boundary stays at the BFF contract.
- Build output is static assets, deployable behind any internal web server.

### When to Revisit
If SSR, SEO, or server components ever become requirements (unlikely for an internal console).

---

## ADR-002: Avoid Next.js in v1

### Context
Next.js bundles SSR, routing, and a Node.js server runtime. Our system is an internal SPA with a planned FastAPI BFF.

### Decision
Do **not** use Next.js in v1.

### Alternatives Considered
- Next.js in SPA-only mode — still drags a Node server runtime and framework conventions we don't need.

### Rationale
- No SEO requirement; no SSR requirement.
- No need for a Node.js backend layer — the BFF is FastAPI (Python), aligned with the Core team's ecosystem.
- Avoid blurring the boundary between UI and BFF: with Next.js it is tempting to put API logic in the frontend repo.

### Tradeoffs
- Forgo Next.js niceties (file-based routing, image optimization) that matter little for an internal console.

### Consequences
- One backend technology (Python) across BFF and Core; simpler operations.

### When to Revisit
If public-facing pages with SEO/SSR needs are ever added.

---

## ADR-003: FastAPI as the BFF

### Context
The browser cannot and should not speak AMQP to RabbitMQ. A translation layer is needed between HTTP (REST/SSE) and the messaging backbone.

### Decision
Use **FastAPI** as a thin Backend-For-Frontend (future phase; mocked in this prototype).

### Alternatives Considered
- Node/Express BFF — introduces a second backend runtime.
- Direct exposure of Core via HTTP — requires invasive Core changes, violates "keep backend unchanged".

### Rationale
- Python ecosystem alignment with the existing Core team.
- Excellent for thin APIs: async, typed, first-class OpenAPI.
- Good fit for both REST and SSE (`StreamingResponse`).
- Direct RabbitMQ integration via mature Python clients.

### Tradeoffs
- One more deployable service to operate (unavoidable given the browser/AMQP gap).

### Consequences
- The BFF is a facade: validation, translation, streaming. Business logic stays in the Core.
- The frontend service layer in this prototype mirrors the future FastAPI contract 1:1.

### When to Revisit
If the BFF starts accumulating business rules — that is a design violation, not a reason to grow it.

---

## ADR-004: RabbitMQ as the Integration Backbone

### Context
Command execution is asynchronous and long-running. The Core already lives in a messaging-friendly environment; components may be deployed across network zones.

### Decision
Use **RabbitMQ** between the BFF and the Python Core (future phase).

### Alternatives Considered
- Direct HTTP calls BFF → Core — synchronous coupling, poor fit for long-running work, invasive to the Core.
- Kafka — stronger for event streaming at scale, heavier to operate; RabbitMQ's queue semantics fit command dispatch better here.

### Rationale
- Asynchronous execution with acknowledgment semantics.
- Decoupling: BFF and Core can be deployed, scaled, and restarted independently.
- Routing keys enable future microservice expansion.
- Retries, dead-letter queues, and backpressure are built in.
- Network flexibility: components can communicate across zones through the broker.

### Tradeoffs
- Broker becomes critical infrastructure; needs monitoring (queue depth, DLQ) — surfaced in the System Health screen.

### Consequences
- All command and event traffic between BFF and Core rides the broker.
- The UI treats broker health as a first-class health component.

### When to Revisit
If event volume/retention needs outgrow queue semantics (then evaluate a log-based broker for the event path).

---

## ADR-005: REST for Commands

### Context
Users submit discrete commands (run X with parameters Y) and query data (history, snapshots, health).

### Decision
Use **REST** for command submission and query APIs.

### Alternatives Considered
- WebSocket command channel — bidirectional complexity for what is a request/ack interaction.
- GraphQL — unnecessary flexibility for a small, well-known API surface.

### Rationale
- Commands are discrete request/acknowledge interactions — the natural REST shape.
- Maps cleanly to OpenAPI; simple to test, document, and mock.
- Enables the **202 Accepted + runId** pattern: submission is acknowledged immediately, execution is followed asynchronously.
- Idempotency via `clientRequestId` is straightforward.

### Tradeoffs
- Not suitable for pushing updates — which is exactly why SSE exists alongside it (ADR-006).

### Consequences
- Clear split: REST = client-initiated, SSE = server-initiated.

### When to Revisit
Not expected; the split is architectural, not incidental.

---

## ADR-006: SSE for Runtime Updates

### Context
Status, progress, logs, warnings, and completion are server-to-client, one-way, continuous updates.

### Decision
Use **Server-Sent Events** for runtime updates.

### Alternatives Considered
- Polling — simple but laggy and wasteful for log/progress streams.
- WebSocket — bidirectional; more operational complexity (see ADR-007).

### Rationale
- The data flow is strictly one-way (server → client); SSE matches exactly.
- Plain HTTP: friendly to proxies, load balancers, and existing infra.
- Native browser `EventSource` with automatic reconnect and `Last-Event-ID` resume.
- Simpler failure model than WebSocket.

### Tradeoffs
- One-way only (fine — commands go over REST).
- Connection-per-stream limits on HTTP/1.1 (mitigated by HTTP/2 or a multiplexed stream).

### Consequences
- Event schema needs `eventId`/`sequence` for dedup/ordering and heartbeats for liveness ([EVENT_SCHEMA.md](./EVENT_SCHEMA.md)).
- The prototype ships a mock EventSource-like client with the same surface.

### When to Revisit
Together with ADR-007 if bidirectional realtime becomes required.

---

## ADR-007: WebSocket Deferred

### Context
WebSocket offers bidirectional realtime but demands more from infrastructure (upgrade handling, LB affinity, custom heartbeat/reconnect protocol).

### Decision
Do **not** implement WebSocket in v1.

### Alternatives Considered
- WebSocket for everything — one channel, but reinvents request/response over it and complicates ops.

### Rationale
- No bidirectional realtime requirement exists: commands are REST, updates are SSE.
- Avoid unnecessary operational complexity in v1.
- REST + SSE covers the full v1 interaction model.

### Tradeoffs
- If a bidirectional need appears later, a second transport must be introduced — acceptable, and the service-layer abstraction keeps the blast radius small.

### Consequences
- Documented upgrade path only; no code in v1.

### When to Revisit
If collaboration features, streaming command input, or low-latency bidirectional flows become requirements.

---

## ADR-008: BFF Persistence Strategy — No Database by Default

### Context
A BFF with a database drifts toward owning state and, eventually, business logic.

### Decision
Do **not** add a BFF database by default.

### Alternatives Considered
- BFF-owned relational DB for run history — creates a second source of truth next to the Core.

### Rationale
- The BFF should remain thin; the Core owns business truth.
- Persistence must have an explicit owner and purpose before it exists.

### Tradeoffs
- Run history and replay depend on Core/broker capabilities until a need is proven.

### Consequences
Add BFF persistence **only** for explicitly scoped needs: audit trail, event replay buffer, run history offload, user preferences, or authorization mapping — each via its own ADR.

### When to Revisit
When one of the above needs is confirmed for production.

---

## ADR-009: Redis/Cache Strategy — Not in MVP

### Context
Caching layers are often added preemptively "for scale".

### Decision
Do **not** add Redis or any server-side cache in the MVP.

### Alternatives Considered
- Redis from day one — cost without a proven consumer.

### Rationale
- TanStack Query already provides client-side caching, deduplication, and refetching.
- Server-side cache is justified only by a concrete backend need: shared cache across BFF instances, SSE fan-out/pub-sub, replay buffer, rate limiting, distributed locks, or throttling.

### Tradeoffs
- If multi-instance SSE fan-out arrives, Redis pub/sub (or broker-native fan-out) becomes relevant — added then, not now.

### Consequences
- Simpler MVP topology; fewer moving parts in System Health.

### When to Revisit
When the BFF scales beyond one instance or replay/rate-limiting requirements land.

---

## ADR-010: Frontend State Management — TanStack Query + Zustand

### Context
Mixing server data and UI state in one store breeds stale copies of backend truth and hidden business logic.

### Decision
Use **TanStack Query for server state** and **Zustand for UI/client state only**.

### Alternatives Considered
- Redux (+ RTK Query) — heavier ceremony; RTK Query overlaps TanStack Query.
- Zustand for everything — hand-rolled caching/refetching; duplicated runtime truth.
- React context only — re-render and composition pain at this scale.

### Rationale
- Clear mental model: *if the backend owns it, TanStack Query manages it; if only the UI cares, Zustand holds it.*
- TanStack Query provides caching, retries, invalidation, and loading/error states for free.
- Zustand is minimal for sidebar/tabs/filters/preferences.

### Tradeoffs
- Two libraries — each small and single-purpose; the boundary is the point.

### Consequences
- No backend runtime truth is duplicated into Zustand (enforced in [CODE_REVIEW_CHECKLIST.md](./CODE_REVIEW_CHECKLIST.md)).
- SSE-driven view state lives in component/hook scope, reconciled against snapshot queries.

### When to Revisit
Not expected for v1 scope.
