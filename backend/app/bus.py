"""In-process async pub/sub event bus for SSE fan-out.

The BFF is single-process here; publish() appends to the store event log (for
Last-Event-ID replay) and fans out to every subscriber queue for the run. With
a multi-instance BFF this is where a shared broker/Redis fan-out would slot in.
"""
from __future__ import annotations

import asyncio

from . import store
from .models import RunEvent


class EventBus:
    def __init__(self) -> None:
        self._subscribers: dict[str, set[asyncio.Queue[RunEvent]]] = {}

    def subscribe(self, run_id: str) -> asyncio.Queue[RunEvent]:
        queue: asyncio.Queue[RunEvent] = asyncio.Queue(maxsize=1000)
        self._subscribers.setdefault(run_id, set()).add(queue)
        return queue

    def unsubscribe(self, run_id: str, queue: asyncio.Queue[RunEvent]) -> None:
        subs = self._subscribers.get(run_id)
        if subs is not None:
            subs.discard(queue)
            if not subs:
                self._subscribers.pop(run_id, None)

    async def publish(self, event: RunEvent) -> None:
        store.append_event(event)
        for queue in list(self._subscribers.get(event.run_id, ())):
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                # Slow consumer: drop rather than block the producer. The client
                # recovers via the snapshot API on the resulting sequence gap.
                pass


bus = EventBus()
