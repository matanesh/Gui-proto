"""SSE event stream (docs/API_CONTRACT.md, docs/EVENT_SCHEMA.md).

GET /api/events/stream?runId=...  →  text/event-stream of RunEvents.
Supports Last-Event-ID reconnect (replay from the store event log) and periodic
heartbeats so clients can detect a stalled stream.
"""
from __future__ import annotations

import asyncio
from typing import AsyncGenerator, Optional

from fastapi import APIRouter, Header, Query, Request
from fastapi.responses import StreamingResponse

from .. import store
from ..bus import bus
from ..config import settings
from ..models import RunEvent
from ..simulator import make_event

router = APIRouter(tags=["events"])


def _format(event: RunEvent) -> str:
    data = event.model_dump_json(by_alias=True)
    return f"id: {event.event_id}\nevent: {event.type}\ndata: {data}\n\n"


async def _stream(run_id: str, last_event_id: Optional[str], request: Request) -> AsyncGenerator[str, None]:
    queue = bus.subscribe(run_id)
    try:
        # Replay anything after the client's last seen event id.
        for past in store.events_after(run_id, last_event_id):
            yield _format(past)

        while True:
            if await request.is_disconnected():
                break
            try:
                event = await asyncio.wait_for(queue.get(), timeout=settings.heartbeat_interval_sec)
                yield _format(event)
            except asyncio.TimeoutError:
                # No run events within the window → heartbeat (liveness).
                yield _format(make_event(run_id, "heartbeat", "debug", "heartbeat", source="bff"))
    finally:
        bus.unsubscribe(run_id, queue)


@router.get("/events/stream")
async def event_stream(
    request: Request,
    run_id: str = Query(alias="runId"),
    last_event_id: Optional[str] = Header(default=None, alias="Last-Event-ID"),
) -> StreamingResponse:
    return StreamingResponse(
        _stream(run_id, last_event_id, request),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive", "X-Accel-Buffering": "no"},
    )
