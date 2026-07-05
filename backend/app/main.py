"""FastAPI BFF entrypoint.

Run (no broker, internal simulator drives runs):
    uvicorn app.main:app --reload --port 8000
Enable the real broker path (needs RabbitMQ + the Core worker):
    BFF_BROKER_ENABLED=true uvicorn app.main:app --port 8000
"""
from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import __version__
from .api import commands, events, health, runs
from .config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    consumer = None
    if settings.broker_enabled:
        # Optional import: broker deps only needed when enabled.
        from .broker import start_event_consumer
        consumer = await start_event_consumer()
    yield
    if consumer is not None:
        await consumer.stop()


app = FastAPI(title="Ops Command Center BFF", version=__version__, lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for router in (commands.router, runs.router, health.router, events.router):
    app.include_router(router, prefix=settings.api_prefix)


@app.get("/")
async def root() -> dict:
    return {"service": "ops-command-center-bff", "version": __version__,
            "brokerEnabled": settings.broker_enabled, "docs": "/docs"}
