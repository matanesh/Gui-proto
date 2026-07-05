# Overnight handoff — real backend (Phase 3)

**What happened:** the overnight autonomous session (via `run_loop.sh`, non-interactive)
could only **write files** — `git` and `python` were permission-blocked, so nothing
was committed, pushed, or verified. All new work is on disk, uncommitted.

**Last committed/pushed state:** `44eb01e` (the Phase 3 plan). Everything below is
**new, uncommitted** work sitting in the working tree.

## What was built (backend only — the frontend was deliberately NOT touched)

A working FastAPI BFF implementing the HLD, in `backend/`:

- `app/` — FastAPI app (`main.py`), env config, pydantic models (camelCase JSON),
  sanitized command catalog, in-memory store (runs/idempotency/event-log/health),
  async event **bus**, no-broker **simulator**, RabbitMQ **broker** integration,
  and REST + SSE routers (`app/api/`).
- `core/worker.py` — sanitized Python Core worker (consumes commands, emits events).
- `Dockerfile`, root `docker-compose.yml` (rabbitmq + bff + core), `.env.example`.
- Docs: `backend/README.md`, root README "Real backend" section.

Two modes: **no-broker** (internal simulator, no RabbitMQ needed) and **broker**
(`BFF_BROKER_ENABLED=true`, uses RabbitMQ + the Core worker).

## Morning steps (run in an INTERACTIVE session)

### 1. Verify the backend compiles + boots (no broker)
```bash
cd backend
python3 -m compileall app core          # syntax check
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --port 8000        # then, in another shell:
curl http://localhost:8000/api/health
curl http://localhost:8000/api/commands
# submit + stream:
RID=$(curl -s -XPOST http://localhost:8000/api/commands/cmd-health-scan/runs \
  -H 'content-type: application/json' \
  -d '{"parameters":{},"requestedBy":"operator-01","clientRequestId":"test-1"}' | python3 -c 'import sys,json;print(json.load(sys.stdin)["runId"])')
curl -N "http://localhost:8000/api/events/stream?runId=$RID"   # should stream events + heartbeats
```
Fix any import/typo issues (this code was written but never executed).

### 2. (Optional) Full stack round-trip
```bash
docker compose up --build      # needs Docker; not available in the dev WSL
# BFF http://localhost:8000/docs, RabbitMQ http://localhost:15672 (guest/guest)
```

### 3. Commit + push the backend
```bash
cd /mnt/c/Users/matan/project/my_apps/GUI
git add -A
git commit -m "feat(backend): FastAPI BFF + RabbitMQ + Python Core + SSE (HLD Phase 3)"
git push origin main
```

### 4. B9 — wire the frontend to the real BFF (still TODO)
Add `VITE_API_MODE=mock|real` + `VITE_API_BASE_URL`. Behind that flag, swap the
mock services for `fetch` (REST) and native `EventSource` (SSE) — the models,
hooks, and components are unchanged because the BFF already returns the exact
camelCase shapes. Keep **mock the default** so the app stays green. After wiring,
run `npm run build` to verify, then commit. (Left undone tonight specifically to
avoid breaking the known-good, pushed frontend without a tsc check.)

## Sanitization
All backend code is generic/sanitized: placeholder creds (`guest/guest`), generic
command names, no real endpoints or business logic. Review before any real use.
