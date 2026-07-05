"""Python Core worker (broker mode).

Consumes command messages from RabbitMQ, executes a simulated run lifecycle, and
publishes sequenced RunEvents back to the events exchange. This is a sanitized
placeholder for the real Core — the business logic lives in the real system.

Run:  python -m core.worker      (from the backend/ directory)
Env:  BFF_RABBITMQ_URL, BFF_COMMANDS_EXCHANGE, BFF_EVENTS_EXCHANGE
"""
from __future__ import annotations

import asyncio
import json
import os
import random
from datetime import datetime, timezone
from itertools import count

import aio_pika

RABBITMQ_URL = os.environ.get("BFF_RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
COMMANDS_EXCHANGE = os.environ.get("BFF_COMMANDS_EXCHANGE", "occ.commands")
EVENTS_EXCHANGE = os.environ.get("BFF_EVENTS_EXCHANGE", "occ.events")
COMMANDS_QUEUE = os.environ.get("CORE_COMMANDS_QUEUE", "occ.core.commands")

LOG_LINES = [
    "Validating configuration parameters…",
    "Acquiring execution slot from worker pool…",
    "Loading task manifest…",
    "Processing batch {n}/8…",
    "Checkpoint written successfully.",
    "Verifying integrity constraints…",
    "Intermediate results persisted.",
    "Releasing transient resources…",
]

_event_ids = count(1)


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _event(run_id: str, seq: int, type_: str, severity: str, message: str, payload: dict | None = None) -> dict:
    return {
        "eventId": f"evt-{next(_event_ids):06d}",
        "runId": run_id,
        "sequence": seq,
        "timestamp": _now(),
        "type": type_,
        "severity": severity,
        "source": "core",
        "message": message,
        "payload": payload or {},
    }


def _phase(progress: int) -> str:
    if progress < 10:
        return "initializing"
    if progress < 25:
        return "validating"
    if progress < 85:
        return "processing"
    return "finalizing"


async def _execute(run_id: str, command_id: str, exchange: aio_pika.abc.AbstractExchange) -> None:
    seq = count(1)

    async def emit(type_: str, severity: str, message: str, payload: dict | None = None) -> None:
        body = _event(run_id, next(seq), type_, severity, message, payload)
        await exchange.publish(
            aio_pika.Message(body=json.dumps(body).encode(), content_type="application/json"),
            routing_key=f"event.{type_}",
        )

    await emit("run.queued", "info", "Queued awaiting core capacity.", {"queuePosition": 1})
    await asyncio.sleep(0.6)
    await emit("run.started", "info", "Execution started.", {"phase": "initializing"})

    progress = 2
    tick = 0
    while progress < 100:
        tick += 1
        await asyncio.sleep(0.9 + random.random() * 0.6)
        await emit("run.log", "debug" if tick % 7 == 0 else "info",
                   LOG_LINES[tick % len(LOG_LINES)].replace("{n}", str((tick % 8) + 1)),
                   {"logger": "core.executor"})
        if tick % 2 == 0:
            progress = min(100, progress + 4 + random.randint(0, 6))
            await emit("run.progress", "info", f"Progress {progress}% — {_phase(progress)}.",
                       {"progress": progress, "phase": _phase(progress)})

    await emit("run.completed", "info", "Run completed successfully.",
               {"summary": f"{command_id} completed. {random.randint(1200, 9000):,} records processed.",
                "durationSec": tick})


async def main() -> None:
    connection = await aio_pika.connect_robust(RABBITMQ_URL)
    channel = await connection.channel()
    await channel.set_qos(prefetch_count=10)

    commands_exchange = await channel.declare_exchange(COMMANDS_EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
    events_exchange = await channel.declare_exchange(EVENTS_EXCHANGE, aio_pika.ExchangeType.TOPIC, durable=True)
    queue = await channel.declare_queue(COMMANDS_QUEUE, durable=True)
    await queue.bind(commands_exchange, routing_key="command.#")

    print(f"[core] connected to {RABBITMQ_URL}; waiting for commands…", flush=True)

    async def on_command(message: aio_pika.abc.AbstractIncomingMessage) -> None:
        async with message.process():
            data = json.loads(message.body)
            run_id, command_id = data.get("runId"), data.get("commandId")
            print(f"[core] executing {command_id} for {run_id}", flush=True)
            await _execute(run_id, command_id, events_exchange)

    await queue.consume(on_command)
    await asyncio.Future()  # run forever


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("[core] stopped", flush=True)
