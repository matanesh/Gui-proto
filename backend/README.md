# Ops Command Center — FastAPI BFF

Thin Backend-For-Frontend that implements [`docs/API_CONTRACT.md`](../docs/API_CONTRACT.md)
and [`docs/EVENT_SCHEMA.md`](../docs/EVENT_SCHEMA.md): REST for commands/queries,
SSE for runtime events. Sanitized — no real names, endpoints, or secrets.

Two run modes:

- **No-broker (default)** — an internal simulator drives run lifecycles, so the
  BFF is fully demoable **without RabbitMQ**.
- **Broker** — commands are published to RabbitMQ for the Python Core worker,
  whose events are consumed and fanned out over SSE (`BFF_BROKER_ENABLED=true`).

## Run (no broker)

```bash
cd backend
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

- OpenAPI docs: http://localhost:8000/docs
- Health: `curl http://localhost:8000/api/health`
- Commands: `curl http://localhost:8000/api/commands`
- Submit: `curl -XPOST http://localhost:8000/api/commands/cmd-health-scan/runs -H 'content-type: application/json' -d '{"parameters":{},"requestedBy":"operator-01","clientRequestId":"<uuid>"}'`
- Stream: `curl -N 'http://localhost:8000/api/events/stream?runId=<runId>'`

## Run with RabbitMQ + Core (real path)

See [`../docker-compose.yml`](../docker-compose.yml) once B8 lands, or run a local
RabbitMQ and start both processes:

```bash
BFF_BROKER_ENABLED=true uvicorn app.main:app --port 8000   # terminal 1
python -m core.worker                                       # terminal 2 (Core)
```

## Layout

```
app/
  main.py       FastAPI app, CORS, routers, lifespan
  config.py     env-based settings (BFF_* vars)
  models.py     pydantic models (camelCase JSON, matches the frontend)
  catalog.py    sanitized command catalog
  store.py      in-memory runs, idempotency, event log, health
  bus.py        in-process async pub/sub for SSE fan-out
  simulator.py  no-broker run lifecycle driver
  broker.py     RabbitMQ publisher/consumer (broker mode)     [B6]
  api/          commands, runs, health, events (SSE)
core/
  worker.py     Python Core: consumes commands, emits events   [B7]
```
