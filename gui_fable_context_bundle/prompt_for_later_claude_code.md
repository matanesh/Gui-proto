You are a senior Frontend Architect, Solution Architect, and React/TypeScript engineer.

Your task is to build a polished frontend-only prototype for an internal enterprise Operational Command Center GUI.

Before writing code, read all attached files, especially:

* HLD_CONTEXT_BUNDLE.md
* User_Action_Execution_Command_Flow.jpeg
* Enterprise_Operational_Orchestration_Architecture.jpeg
* Async_System_Sequence_Architecture_Diagram.jpeg
* Operational_Command_Center_Blueprint_compressed.pdf
* Mission_Control_Architecture_compressed.pdf

First, derive a concise internal `/goal` from this prompt and the attached context.

The `/goal` should clarify:

* what needs to be built
* what should not be built
* the architecture assumptions
* the documentation deliverables
* the frontend prototype deliverables
* the execution order

Then execute the work in two phases:

1. Phase 1 — create the architecture/documentation blueprint.
2. Phase 2 — build the frontend UI prototype based on that blueprint.

====================================================
IMPORTANT PROJECT CONTEXT
=========================

We are designing a GUI for an existing internal Python Core system.

This is an internal system running in a closed/sensitive environment, so everything must remain sanitized.

Do not use:

* real system names
* real endpoints
* real network details
* real credentials
* real usernames
* real classified terminology
* real security details
* real business logic

Use generic enterprise terminology only.

Target architecture:

* Frontend: React + TypeScript + Vite
* Styling/UI: Tailwind CSS + shadcn/ui
* Routing: React Router
* Server state: TanStack Query
* Client/UI state: Zustand
* Future BFF: FastAPI
* Future messaging backbone: RabbitMQ
* Future Core system: existing Python Core
* Commands: REST from UI to FastAPI BFF
* Runtime updates/events: SSE from FastAPI BFF to UI
* WebSocket: future option only, not part of v1

Core architecture principles:

1. Frontend is UI only.
2. Business logic stays in the Python Core.
3. FastAPI BFF is a thin translation/orchestration/facade layer.
4. RabbitMQ is the integration backbone.
5. REST is used for discrete command submission and query APIs.
6. SSE is used for one-way runtime updates such as status, progress, logs, warnings, errors, completion, and health.
7. WebSocket is deferred unless future requirements need true bidirectional realtime communication.
8. Prefer simplicity, maintainability, and fast delivery over over-engineering.
9. The prototype should demonstrate architectural intent, not simulate a real operational system.
10. The goal is to impress stakeholders while keeping the technical foundation clean, replaceable, and future-ready.

====================================================
OVERALL GOAL
============

Create a demo-ready frontend prototype called:

Ops Command Center

The prototype should look like a serious internal enterprise command-center application:

* modern
* polished
* technical
* dark enterprise mission-control style
* clean and not childish
* suitable for engineering managers, architects, and technical leadership
* command/run lifecycle oriented
* event-driven
* built with clean frontend architecture
* easy to later connect to a real FastAPI BFF and real SSE stream

This is NOT a real production system.
This is NOT a full backend implementation.
This is NOT a real RabbitMQ implementation.
This is NOT a real authentication implementation.
This is NOT a real operational tool.

This is a frontend-only prototype with mock REST APIs and mock SSE/event stream.

====================================================
PHASE 1 — PROJECT BLUEPRINT / DOCUMENTATION
===========================================

Before implementing the UI, create a `/docs` directory and generate these sanitized architecture documents:

1. HLD.md
2. ADR.md
3. API_CONTRACT.md
4. EVENT_SCHEMA.md
5. GUI_SPEC.md
6. FAILURE_MODES.md
7. CODE_REVIEW_CHECKLIST.md

These documents are part of the deliverable.
They are not temporary notes.

They should be professional, concise, and useful for architects, managers, and future developers.

Use sanitized/generic terminology only.

Do not invent real business requirements.
Do not invent classified concepts.
Do not include real endpoints or secrets.

---

1. HLD.md

---

Create a High Level Design document.

Suggested structure:

# High Level Design - Ops Command Center

## 1. Executive Summary

Explain that the project introduces a modern frontend GUI for an existing Python Core system, using a thin FastAPI BFF, RabbitMQ integration backbone, REST commands, and SSE runtime updates.

## 2. Goals

Include:

* provide modern operational GUI
* keep frontend as UI only
* preserve Python Core as business logic owner
* use BFF as translation/orchestration layer
* support async command execution
* provide run visibility, progress, logs, and system health
* enable fast MVP delivery

## 3. Non-Goals

Include:

* no business logic in frontend
* no real backend in prototype
* no real RabbitMQ implementation in prototype
* no real authentication in prototype
* no WebSocket in v1
* no classified/system-specific details

## 4. Architecture Overview

Describe:

* React frontend
* FastAPI BFF
* RabbitMQ
* Python Core
* REST command flow
* SSE event flow

Add Mermaid high-level architecture diagram.

## 5. Component Responsibilities

Explain responsibilities of:

* Frontend
* FastAPI BFF
* RabbitMQ
* Python Core

## 6. Command Flow

Describe:
User action -> REST command submit -> BFF validation/translation -> RabbitMQ command message -> Core execution -> runId returned/available -> UI follows run.

Add Mermaid sequence diagram.

## 7. Event Flow

Describe:
Core emits events -> RabbitMQ/event pipeline -> BFF exposes SSE -> UI consumes status/progress/logs/completion.

Add Mermaid diagram.

## 8. Run Lifecycle

Define statuses:

* queued
* accepted
* running
* succeeded
* failed
* cancelled
* timeout

Explain transitions.

## 9. State Ownership

Clarify:

* Frontend owns UI state only.
* TanStack Query manages server-state-like data.
* Zustand manages local UI state only.
* BFF should not own business logic.
* Core owns business truth.
* BFF may own persistence only if explicitly required for audit, replay, run history, or user preferences.

## 10. Failure Handling Summary

Summarize:

* command submission failure
* SSE disconnect
* duplicate events
* out-of-order events
* event flood
* Core unavailable
* RabbitMQ unavailable
* BFF restart

## 11. MVP Scope

Define what v1 should include.

## 12. Future Extensions

Include:

* real FastAPI integration
* real RabbitMQ integration
* auth/authorization
* audit trail
* replay buffer
* Redis/cache if needed
* WebSocket if bidirectional realtime becomes necessary

## 13. Open Questions

List technical questions that must be closed before production development.

---

2. ADR.md

---

Create Architecture Decision Records.

Use this structure for each ADR:

## Context

## Decision

## Alternatives Considered

## Rationale

## Tradeoffs

## Consequences

## When to Revisit

Include these ADRs:

### ADR-001: React + TypeScript + Vite

Decision:
Use React + TypeScript + Vite for the frontend.

Rationale:

* good fit for internal SPA
* fast developer experience
* strong ecosystem
* no SSR/SEO requirement
* clear separation from backend

### ADR-002: Avoid Next.js in v1

Decision:
Do not use Next.js in v1.

Rationale:

* no SEO requirement
* no SSR requirement
* no need for Node.js backend layer
* avoid blurring boundary between UI and FastAPI BFF

### ADR-003: FastAPI as BFF

Decision:
Use FastAPI as a future BFF.

Rationale:

* Python ecosystem alignment
* good for thin APIs
* good OpenAPI support
* good fit for REST + SSE
* avoids introducing Node.js backend runtime

### ADR-004: RabbitMQ as Integration Backbone

Decision:
Use RabbitMQ between BFF and Core.

Rationale:

* async execution
* decoupling
* routing
* retries
* queues
* operational resilience

### ADR-005: REST for Commands

Decision:
Use REST for command submission and query APIs.

Rationale:

* commands are discrete request/ack interactions
* simple to test
* simple to document
* maps well to OpenAPI
* allows 202 Accepted + runId pattern

### ADR-006: SSE for Runtime Updates

Decision:
Use SSE for one-way runtime updates.

Rationale:

* status/progress/logs are server-to-client
* simpler than WebSocket
* HTTP-friendly
* browser support
* reconnect model

### ADR-007: WebSocket Deferred

Decision:
Do not implement WebSocket in v1.

Rationale:

* no bidirectional realtime requirement yet
* would add unnecessary operational complexity
* can be revisited if collaboration, streaming commands, or low-latency bidirectional flows become required

### ADR-008: BFF Persistence Strategy

Decision:
Do not add a BFF database by default.

Rationale:

* BFF should remain thin
* persistence should exist only with clear ownership
* add DB only for audit, replay, run history, user preferences, authorization mapping, or event buffer

### ADR-009: Redis/Cache Strategy

Decision:
Do not add Redis/cache by default in MVP.

Rationale:

* TanStack Query handles frontend cache
* Redis is useful only if there is a backend need:
  shared cache, SSE fan-out, replay buffer, rate limiting, locks, or throttling

### ADR-010: Frontend State Management

Decision:
Use TanStack Query for server state and Zustand for UI/client state.

Rationale:

* avoid mixing backend state with local UI state
* clear mental model
* maintainable frontend architecture

---

3. API_CONTRACT.md

---

Create an API contract document for the future FastAPI BFF.

This prototype will not implement the real backend, but the mock services should align with this contract.

Include endpoints:

### GET /api/commands

Returns command catalog.

### POST /api/commands/{commandId}/runs

Submits a command.
Returns quickly with:

* accepted
* runId
* status
* acceptedAt
* message

Prefer:
HTTP 202 Accepted

### GET /api/runs

Returns paginated/filterable run history.

Support conceptual filters:

* status
* commandType
* fromDate
* toDate
* search

### GET /api/runs/{runId}

Returns current run snapshot.

### POST /api/runs/{runId}/cancel

Requests cancellation.

### GET /api/health

Returns system health snapshot.

### GET /api/events/stream?runId={runId}

Future SSE stream endpoint.

Include:

* request examples
* response examples
* error model
* pagination model
* idempotency using clientRequestId
* status code guidance
* security placeholder
* no real endpoint values

---

4. EVENT_SCHEMA.md

---

Create a future event schema document.

Define an event envelope:

RunEvent:

* eventId
* runId
* sequence
* timestamp
* type
* severity
* source
* message
* payload

Event types:

* run.accepted
* run.queued
* run.started
* run.progress
* run.log
* run.warning
* run.error
* run.completed
* run.failed
* run.cancelled
* heartbeat

Severity:

* debug
* info
* warning
* error
* critical

Explain:

* ordering
* deduplication
* Last-Event-ID
* replay window
* heartbeat
* reconnect behavior
* snapshot recovery using GET /api/runs/{runId}
* event flood handling
* logs vs events separation

Add example JSON events.

---

5. GUI_SPEC.md

---

Create a GUI specification document.

Include:

* UX principles
* information architecture
* navigation
* screen list
* component list
* loading/empty/error states
* responsive behavior
* accessibility basics
* mock data guidelines

Required screens:

* Dashboard
* Command Launcher
* Run Details
* Runs History
* Configuration
* System Health

Clarify that UI must demonstrate:

* REST command submission
* async run lifecycle
* SSE runtime updates
* separation between commands and telemetry
* frontend as UI only
* no real business logic in frontend

---

6. FAILURE_MODES.md

---

Create a failure modes document.

Include:

## Command submission failures

What happens if REST submit fails.

## Command accepted but no events

UI should show accepted state, then delayed telemetry warning.

## SSE disconnect

UI shows reconnecting/disconnected state, retries with backoff, uses heartbeat.

## Duplicate events

Use eventId/sequence to deduplicate.

## Out-of-order events

Use sequence and snapshot recovery.

## Event gap

Detect missing sequence and fallback to GET /api/runs/{runId}.

## Event flood

Use filtering, batching/coalescing, virtualized lists for heavy logs.

## RabbitMQ unavailable

BFF should fail fast or degrade depending on production design.

## Core unavailable

Runs may stay queued or fail with clear status.

## BFF restart

UI should reconnect and fetch current snapshot.

## Browser refresh

UI reloads current run from snapshot API.

## Partial telemetry

UI must not invent state. It should show partial data clearly.

---

7. CODE_REVIEW_CHECKLIST.md

---

Create a code review checklist.

Include sections:

## Architecture boundaries

* no business logic in frontend
* components do not call mock data directly
* service layer is clean
* future FastAPI replacement is straightforward

## TypeScript

* strict types
* avoid any
* shared models

## State management

* TanStack Query for server state
* Zustand for local UI state only
* no duplicated runtime truth in Zustand

## UI/UX

* loading states
* empty states
* error states
* responsive layout
* accessible components

## SSE/events

* connection status
* heartbeat
* reconnect UI
* sequence/eventId handling
* cleanup on unmount

## Security/sanitization

* no secrets
* no real endpoints
* no classified terminology
* no credentials in repo

## Maintainability

* reusable components
* clean folder structure
* readable names
* no over-engineering

====================================================
PHASE 2 — FRONTEND PROTOTYPE
============================

After creating the documentation, build the frontend prototype.

The implementation must align with the documents.

Use:

* React
* TypeScript
* Vite
* Tailwind CSS
* shadcn/ui
* React Router
* TanStack Query
* Zustand

Do not use:

* Next.js
* real backend
* real RabbitMQ
* real auth
* real endpoints
* real business logic
* classified terminology

====================================================
APP NAME AND STYLE
==================

Application name:
Ops Command Center

Visual style:
Dark enterprise mission-control.

The UI should feel like:

* internal engineering operations console
* command center
* execution monitoring system
* clean enterprise dashboard
* technical and premium
* not childish
* not overly flashy

Use:

* dark background
* neutral/slate surfaces
* blue/cyan accents
* clear status colors
* professional cards/tables/tabs
* strong information hierarchy

====================================================
REQUIRED ROUTES AND SCREENS
===========================

Create these routes:

1. Dashboard
   Route: /

Purpose:
High-level operational overview.

Include:

* active runs count
* completed runs count
* failed runs count
* average duration
* mock queue depth
* mock event throughput
* recent runs table
* live event/activity feed
* system status cards:

  * Frontend
  * FastAPI BFF
  * Message Broker
  * Python Core
* clear CTA to launch a command
* attractive hero/status section

2. Command Launcher
   Route: /commands

Purpose:
User selects a generic command and launches a run.

Include:

* command catalog
* command categories
* selected command details panel
* sanitized configuration form
* validation UX
* risk level indicator
* estimated duration
* launch button
* on submit: call mock REST service
* create or return a new runId
* show accepted response
* navigate to Run Details after launch

Use only generic commands, for example:

* Data Sync
* Health Scan
* Report Generation
* Batch Validation
* Configuration Check
* Simulation Run

Do not invent real domain-specific business logic.

3. Run Details
   Route: /runs/:runId

Purpose:
Detailed lifecycle view of one run.

Include:

* run status header
* status badge
* progress indicator
* command name
* runId
* createdAt
* startedAt
* completedAt
* duration
* requestedBy
* current phase
* SSE connection state:

  * connecting
  * open
  * reconnecting
  * disconnected
* tabs:

  * Overview
  * Timeline
  * Logs
  * Events
  * Request Payload
  * Diagnostics

Run Details should be the most impressive screen.

It should demonstrate:

* async lifecycle
* live event updates
* progress changes
* logs
* warnings/errors
* heartbeat
* reconnecting state
* completion/failure states

Add mock actions:

* cancel
* retry
* export logs

These actions may be mock UI behavior only.
Do not implement real backend logic.

4. Runs History
   Route: /runs

Purpose:
List and inspect historical runs.

Include:

* runs table
* filters:

  * status
  * command type
  * date range
  * search by runId
* sorting
* simple pagination/client-side paging
* row click navigates to Run Details
* loading state
* empty state
* error state

5. Configuration
   Route: /config

Purpose:
Generic frontend configuration screen.

Include:

* mock API base URL
* mock SSE endpoint path
* feature flags
* UI preferences
* refresh interval
* event display preferences
* clear note that production values should come from deployment/runtime configuration

Do not include secrets.
Do not include real network details.

6. System Health
   Route: /health

Purpose:
Show health of architecture components.

Include:

* Frontend status
* FastAPI BFF status
* RabbitMQ/message broker status
* Python Core status
* SSE stream status
* mock latency
* mock queue depth
* mock failed messages
* mock DLQ count
* event backlog indicator
* health check timeline
* degraded/unavailable states

====================================================
DATA MODELS
===========

Create strict TypeScript models.

At minimum:

RunStatus:

* queued
* accepted
* running
* succeeded
* failed
* cancelled
* timeout

CommandDefinition:

* id
* name
* description
* category
* configurableFields
* riskLevel: low / medium / high
* estimatedDurationSec
* enabled

CommandField:

* key
* label
* type
* required
* defaultValue
* options
* description

CommandRequest:

* commandId
* parameters
* requestedBy
* clientRequestId

CommandAck:

* runId
* accepted
* status
* message
* acceptedAt

Run:

* runId
* commandId
* commandName
* status
* progress
* createdAt
* startedAt
* completedAt
* durationSec
* requestedBy
* summary
* currentPhase

RunEvent:

* eventId
* runId
* sequence
* timestamp
* type
* severity
* message
* payload

SystemHealth:

* component
* status
* latencyMs
* lastCheckedAt
* details

SseConnectionState:

* connecting
* open
* reconnecting
* disconnected

====================================================
MOCK REST API
=============

Create a clean service layer.

The UI must not import mock data directly from page components.

Create mock services such as:

* services/apiClient.ts
* services/commandsApi.ts
* services/runsApi.ts
* services/healthApi.ts
* services/eventStreamClient.ts
* services/mockData.ts

Mock REST behavior:

* fetch command definitions
* submit command
* fetch run by id
* fetch runs history
* cancel run mock
* fetch system health

Simulate:

* loading delay
* occasional errors
* successful command submission
* 202 Accepted pattern
* runId generation
* run snapshot updates

Use TanStack Query hooks around these services.

====================================================
MOCK SSE / EVENT STREAM
=======================

Implement a mock EventSource-like abstraction.

It should simulate a future SSE connection without requiring a real backend.

Requirements:

* connect to a selected runId
* emit heartbeat events
* emit ordered run events with sequence numbers
* emit progress updates
* emit log events
* emit warning events
* optionally emit error/failure events
* emit completed event
* simulate connection states:

  * connecting
  * open
  * reconnecting
  * disconnected
* simulate occasional reconnect
* show reconnect state in UI
* cleanup connection on component unmount
* include comments explaining how this would later map to real EventSource and Last-Event-ID

Do not create a real server.

The mock SSE should be impressive enough for a demo, especially in Run Details.

====================================================
STATE MANAGEMENT RULES
======================

Use TanStack Query for server-state-like data:

* command definitions
* run history
* run details
* health data

Use Zustand only for UI/client state:

* sidebar collapsed
* selected theme/layout preference
* filters
* selected tabs
* local UI preferences
* possibly local event display settings

Do not store backend runtime truth arbitrarily in Zustand.
Do not duplicate server state in Zustand.
Do not put business logic in Zustand.

====================================================
FRONTEND STRUCTURE
==================

Use a clean folder structure similar to:

src/
app/
router.tsx
providers.tsx
components/
layout/
ui/
shared/
features/
dashboard/
commands/
runs/
health/
configuration/
services/
apiClient.ts
commandsApi.ts
runsApi.ts
healthApi.ts
eventStreamClient.ts
mockData.ts
models/
command.ts
run.ts
event.ts
health.ts
store/
uiStore.ts
hooks/
useRunEvents.ts
useSseConnection.ts
lib/
utils.ts

Keep:

* page components separate from reusable UI components
* mock services separate from UI
* models reusable and typed
* components reasonably small

====================================================
REQUIRED UI COMPONENTS
======================

Use shadcn/ui and Tailwind to create:

* App shell
* Sidebar navigation
* Top header
* Status cards
* Metric cards
* Data tables
* Badges
* Tabs
* Progress bars
* Timeline component
* Log viewer
* Event feed
* Health indicators
* Command cards
* Forms
* Toasts/notifications
* Skeleton loading states
* Empty states
* Error states

The app should feel demo-ready.

====================================================
README.md REQUIREMENTS
======================

Create a root README.md.

It should explain:

# Ops Command Center Prototype

Include:

* what this prototype is
* what this prototype is not
* tech stack
* how to run locally
* folder structure
* documentation structure
* architecture assumptions
* mock REST layer
* mock SSE layer
* how to later connect real FastAPI endpoints
* how to later connect real SSE
* why REST is used for commands
* why SSE is used for updates
* why WebSocket is not implemented in v1
* why there is no real backend
* security/sanitization notes
* no secrets/no classified data warning

Local run instructions should include:

* npm install
* npm run dev
* npm run build

====================================================
QUALITY BAR
===========

The final result must be:

* demo-ready
* visually impressive
* technically clean
* strongly typed
* maintainable
* easy to understand
* easy to later connect to real FastAPI/SSE
* sanitized
* not over-engineered

Requirements:

* TypeScript strict types
* avoid any unless strongly justified
* reusable components
* clean service layer
* clean models
* no direct mock data imports in page components
* no real secrets
* no real endpoints
* no classified terms
* no business logic in frontend
* loading/empty/error states
* responsive layout
* npm install and npm run dev should work

====================================================
EXECUTION ORDER
===============

Work in this order:

1. Read attached files.
2. Derive and write a concise `/goal`.
3. Create `/docs`.
4. Generate all architecture documents.
5. Create the Vite React TypeScript project structure.
6. Add Tailwind CSS and shadcn/ui.
7. Implement routing and app shell.
8. Implement typed models.
9. Implement mock service layer.
10. Implement TanStack Query provider and hooks.
11. Implement Zustand UI store.
12. Implement mock SSE/event stream.
13. Implement screens:

    * Dashboard
    * Command Launcher
    * Run Details
    * Runs History
    * Configuration
    * System Health
14. Implement polished enterprise UI.
15. Add README.md.
16. Run build/lint/type checks if available.
17. Fix issues.
18. Summarize what was created and how to run it.

====================================================
FINAL DELIVERABLE
=================

Produce a complete frontend prototype project.

The project must include:

* /docs/HLD.md
* /docs/ADR.md
* /docs/API_CONTRACT.md
* /docs/EVENT_SCHEMA.md
* /docs/GUI_SPEC.md
* /docs/FAILURE_MODES.md
* /docs/CODE_REVIEW_CHECKLIST.md
* root README.md
* React + TypeScript + Vite app
* Tailwind CSS + shadcn/ui styling
* React Router routes
* TanStack Query setup
* Zustand setup
* typed models
* mock REST services
* mock SSE/event stream
* enterprise command-center UI
* all required screens
* sanitized demo data only

Do not build a real backend.
Do not implement real RabbitMQ.
Do not implement real authentication.
Do not invent real business logic.
Do not include secrets or classified details.

Prioritize:

1. impressive stakeholder demo
2. clean frontend architecture
3. clear future integration path
4. maintainability
5. simplicity over over-engineering
