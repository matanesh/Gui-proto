"""RabbitMQ integration (broker mode).

Command path: BFF publishes a command message to the commands exchange; the
Python Core worker consumes it. Event path: the Core publishes RunEvents to the
events exchange; this consumer applies them to the BFF snapshot and fans them out
over SSE via the bus.

Only imported when BFF_BROKER_ENABLED=true, so aio-pika is an optional dependency
at runtime.
"""
from __future__ import annotations

import json
from typing import Optional

import aio_pika

from . import store
from .bus import bus
from .config import settings
from .models import CommandRequestBody, RunEvent

_connection: Optional[aio_pika.abc.AbstractRobustConnection] = None
_channel: Optional[aio_pika.abc.AbstractChannel] = None
_commands_exchange: Optional[aio_pika.abc.AbstractExchange] = None


async def _ensure_publisher() -> aio_pika.abc.AbstractExchange:
    global _connection, _channel, _commands_exchange
    if _commands_exchange is None or _channel is None or _channel.is_closed:
        _connection = await aio_pika.connect_robust(settings.rabbitmq_url)
        _channel = await _connection.channel()
        _commands_exchange = await _channel.declare_exchange(
            settings.commands_exchange, aio_pika.ExchangeType.TOPIC, durable=True
        )
    return _commands_exchange


async def publish_command(run_id: str, command_id: str, body: CommandRequestBody) -> None:
    exchange = await _ensure_publisher()
    message = {
        "runId": run_id,
        "commandId": command_id,
        "parameters": body.parameters,
        "requestedBy": body.requested_by,
        "clientRequestId": body.client_request_id,
        "targetPcId": body.target_pc_id,
        "targetDeviceId": body.target_device_id,
        "targetLabel": body.target_label,
    }
    await exchange.publish(
        aio_pika.Message(body=json.dumps(message).encode(), content_type="application/json"),
        routing_key=f"command.{command_id}",
    )


def _apply_event(event: RunEvent) -> None:
    """Update the BFF run snapshot from a Core-emitted event (Core is authoritative)."""
    p = event.payload or {}
    if event.type == "run.queued":
        store.update_run(event.run_id, status="queued", current_phase="waiting")
    elif event.type == "run.started":
        store.update_run(event.run_id, status="running", started_at=event.timestamp,
                         current_phase=p.get("phase", "initializing"))
    elif event.type == "run.progress":
        store.update_run(event.run_id, progress=int(p.get("progress", 0)),
                         current_phase=p.get("phase", "processing"))
    elif event.type == "run.completed":
        store.update_run(event.run_id, status="succeeded", progress=100, completed_at=event.timestamp,
                         duration_sec=p.get("durationSec"), current_phase="completed", summary=p.get("summary"))
    elif event.type == "run.failed":
        store.update_run(event.run_id, status="failed", completed_at=event.timestamp,
                         current_phase="aborted", summary=p.get("reason"))
    elif event.type == "run.cancelled":
        store.update_run(event.run_id, status="cancelled", completed_at=event.timestamp, current_phase="cancelled")


class EventConsumer:
    def __init__(self, connection: aio_pika.abc.AbstractRobustConnection) -> None:
        self._connection = connection

    async def stop(self) -> None:
        await self._connection.close()


async def start_event_consumer() -> EventConsumer:
    connection = await aio_pika.connect_robust(settings.rabbitmq_url)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=50)
    exchange = await channel.declare_exchange(settings.events_exchange, aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue(settings.events_queue, durable=True)
    await queue.bind(exchange, routing_key="event.#")

    async def on_message(message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            event = RunEvent.model_validate_json(message.body)
            _apply_event(event)
            await bus.publish(event)

    await queue.consume(on_message)
    return EventConsumer(connection)
