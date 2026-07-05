# Quickstart — run after cloning

Prerequisites: **Node.js 20+**, and (for the backend) **Python 3.11+**.

```bash
git clone git@github.com:matanesh/Gui-proto.git
cd Gui-proto
```

## 1. Frontend only (mock data — no backend needed)

```bash
npm install
npm run dev            # open http://localhost:5173
```

That's the whole app, running on in-browser mocks. Done — nothing else required.

## 2. Add the real backend (FastAPI BFF)

In a **second terminal**:

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate    # or use: pip install --user
pip install -r requirements.txt
python3 -m uvicorn app.main:app --port 8000           # BFF at http://localhost:8000
```

Check the BFF: open **http://localhost:8000/docs** (interactive API).

Point the frontend at it — create a file named **`.env`** in the project root:

```
VITE_API_MODE=real
VITE_API_BASE_URL=http://localhost:8000/api
```

Then restart `npm run dev`. The app now uses the real BFF (REST + SSE).
Delete `.env` (or set `VITE_API_MODE=mock`) to go back to mocks.

## 3. Full stack with RabbitMQ (needs Docker) — not yet verified

```bash
docker compose up --build      # RabbitMQ + BFF + Python Core worker
# BFF: http://localhost:8000/docs   RabbitMQ UI: http://localhost:15672 (guest/guest)
```

## Handy

```bash
npm run build      # type-check + production build
npm run lint       # ESLint
npm run dev:host   # expose the dev server on your LAN/IP
```

More detail: `README.md` (frontend), `backend/README.md` (backend),
`CONTINUE_HERE.md` (project state), `docs/` (HLD, API contract, event schema).
