# /goal — Ops Command Center (frontend-only prototype)

## What to build
A demo-ready, frontend-only prototype of an internal enterprise **Ops Command Center** GUI:

- **Stack:** React + TypeScript + Vite, Tailwind CSS + shadcn/ui, React Router, TanStack Query (server state), Zustand (UI state only).
- **Mock REST layer:** command catalog, submit command (202 Accepted + runId), run snapshot, runs history, cancel, health — with simulated latency and occasional errors. Pages never import mock data directly; everything goes through a service layer.
- **Mock SSE layer:** EventSource-like abstraction emitting heartbeats and ordered, sequenced run events (progress, logs, warnings, errors, completion) with connection states (connecting/open/reconnecting/disconnected) and simulated reconnects.
- **Screens:** Dashboard `/`, Command Launcher `/commands`, Run Details `/runs/:runId` (flagship), Runs History `/runs`, Configuration `/config`, System Health `/health`.
- **Style:** dark enterprise mission-control — slate surfaces, blue/cyan accents, clear status colors, professional information hierarchy.

## What NOT to build
No real backend, no real FastAPI, no real RabbitMQ, no real SSE server, no real auth, no WebSocket (v1), no business logic in the frontend, no real names/endpoints/secrets/classified terms. Generic commands only (Data Sync, Health Scan, Report Generation, Batch Validation, Configuration Check, Simulation Run).

## Architecture assumptions
Future production: Browser → REST → FastAPI BFF → RabbitMQ → Python Core (commands); Python Core → RabbitMQ → FastAPI → SSE → Browser (events). Frontend is UI only; Core owns business truth; BFF is a thin translation layer. The prototype's service layer must be trivially replaceable with real FastAPI endpoints and a real EventSource.

## Deliverables
1. **Docs** in `/docs`: HLD.md, ADR.md (ADR-001…010), API_CONTRACT.md, EVENT_SCHEMA.md, GUI_SPEC.md, FAILURE_MODES.md, CODE_REVIEW_CHECKLIST.md.
2. **App**: full Vite React TS project at repo root with the six screens, typed models, mock services, mock SSE, TanStack Query + Zustand wiring.
3. **README.md** at root (what it is/isn't, how to run, how to connect real FastAPI/SSE later, sanitization notes).

## Execution order
Phase 1 (docs 1–7) → Phase 2 (scaffold → Tailwind/shadcn → shell/routing → models → mock services → Query/Zustand → mock SSE → six screens → README → build/typecheck/fix → DONE). Tracked step-by-step in PROGRESS.md; git commit after every completed step.
