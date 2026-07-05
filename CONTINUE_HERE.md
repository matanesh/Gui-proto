# Continue here — Ops Command Center

**Resume point (last pushed commit): see `git log -1`. Repo: `matanesh/Gui-proto` (main).**
Read `PROGRESS.md` (checklist + Phase 3) and `HANDOFF_NIGHT.md` first. `CLAUDE.md` has the working rules.

## Where we stopped

### DONE & verified
- **Frontend** (React+TS+Vite, mock mode): full app — Dashboard, Command Console (`/commands`),
  Run Details, Runs History, Fleet Map (Leaflet, offline-capable), System Health, Configuration,
  boot animation, editable system name. `npm run build` + `npm run lint` clean.
- **Real backend** (`backend/`, FastAPI BFF): real REST + SSE, verified live in **no-broker mode**
  (internal simulator drives runs). Submit→202+runId, SSE stream, snapshot, idempotency, CORS all OK.
- **Frontend ↔ real BFF switch**: `VITE_API_MODE=real` + `VITE_API_BASE_URL` — real REST via fetch,
  real SSE via EventSource. Default is `mock` so the app stays green. Verified (tsc+lint+build, CORS, 202).

### WRITTEN but NOT verified
- **RabbitMQ broker path + Python Core worker + `docker-compose.yml`** — code exists, never run
  (no Docker/RabbitMQ on the dev WSL). Needs `docker compose up --build` in a Docker environment.

### Not built (by design)
- Real business logic — the "Core" is a sanitized simulator that mimics the run lifecycle.

## How to run

```bash
# Frontend (mock, default)
npm install && npm run dev                      # http://localhost:5173

# Real BFF (no broker) — separate shell
cd backend && pip install -r requirements.txt   # (python3-venv missing on dev box; --user works)
python3 -m uvicorn app.main:app --port 8000     # http://localhost:8000/docs

# Point the UI at the real BFF: create .env with
#   VITE_API_MODE=real
#   VITE_API_BASE_URL=http://localhost:8000/api
# then: npm run dev

# Full stack with the real broker (NEEDS DOCKER — this is the unverified path)
docker compose up --build                       # BFF :8000, RabbitMQ UI :15672 (guest/guest)
```

## Suggested next steps
1. **Verify the broker path**: `docker compose up --build`, set `BFF_BROKER_ENABLED=true`, confirm a
   real submit → RabbitMQ → Core worker → RabbitMQ → SSE round-trip. Fix any wiring in
   `backend/app/broker.py` + `backend/core/worker.py` (written but unrun).
   (Or ask an agent to add a lightweight in-process broker stub to test without Docker.)
2. Real-browser smoke test of `VITE_API_MODE=real` against the running BFF.
3. Optional: auth placeholder at the BFF, run-history persistence, device pins on the big map.

## Notes
- Everything is sanitized (no real names/endpoints/secrets; `guest/guest` placeholder only).
- SSH to GitHub works as `matanesh`; `gh` CLI is NOT installed.
- Commit + push after each step (see CLAUDE.md).
