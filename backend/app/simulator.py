"""Internal run-lifecycle simulator (no-broker mode).

Drives a run from accepted → running → terminal, emitting sequenced RunEvents
onto the bus and updating the store — the server-side equivalent of the frontend
mock event stream. When the broker is enabled, the Python Core worker plays this
role instead (see backend/core/worker.py) and this module is not used.
"""
from __future__ import annotations

import asyncio
import random
from datetime import datetime, timezone
from itertools import count

from . import store
from .bus import bus
from .models import RunEvent, Severity

_seq: dict[str, count] = {}
_event_ids = count(1)

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


def _now() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _seq_for(run_id: str) -> int:
    return next(_seq.setdefault(run_id, count(1)))


def make_event(run_id: str, type_: str, severity: Severity, message: str,
               payload: dict | None = None, source: str = "core") -> RunEvent:
    is_hb = type_ == "heartbeat"
    return RunEvent(
        event_id=f"evt-{next(_event_ids):06d}",
        run_id=run_id,
        sequence=-1 if is_hb else _seq_for(run_id),
        timestamp=_now(),
        type=type_,  # type: ignore[arg-type]
        severity=severity,
        source=source,
        message=message,
        payload=payload or {},
    )


def _phase(progress: int) -> str:
    if progress < 10:
        return "initializing"
    if progress < 25:
        return "validating"
    if progress < 85:
        return "processing"
    return "finalizing"


async def drive_run(run_id: str) -> None:
    """Advance a run to completion, publishing events as it goes."""
    await asyncio.sleep(0.3)
    await bus.publish(make_event(run_id, "run.accepted", "info", "Command accepted.", source="bff"))

    await asyncio.sleep(0.8)
    store.update_run(run_id, status="queued", current_phase="waiting")
    await bus.publish(make_event(run_id, "run.queued", "info", "Queued awaiting core capacity.", {"queuePosition": 1}, "bff"))

    await asyncio.sleep(0.8)
    store.update_run(run_id, status="running", started_at=_now(), current_phase="initializing", progress=2)
    await bus.publish(make_event(run_id, "run.started", "info", "Execution started.", {"phase": "initializing"}))

    progress = 2
    tick = 0
    while progress < 100:
        run = store.get_run(run_id)
        if run is None or run.status in ("cancelled", "failed", "timeout"):
            return
        if run.current_phase == "cancelling":
            _finish(run_id, "run.cancelled", "cancelled", "warning", "Run cancelled by operator request.", {})
            await bus.publish(make_event(run_id, "run.cancelled", "warning", "Run cancelled by operator request.", {}))
            return

        tick += 1
        await asyncio.sleep(0.9 + random.random() * 0.6)
        await bus.publish(make_event(run_id, "run.log", "debug" if tick % 7 == 0 else "info",
                                     LOG_LINES[tick % len(LOG_LINES)].replace("{n}", str((tick % 8) + 1)),
                                     {"logger": "core.executor"}))
        if tick % 2 == 0:
            progress = min(100, progress + 4 + random.randint(0, 6))
            phase = _phase(progress)
            store.update_run(run_id, progress=progress, current_phase=phase)
            await bus.publish(make_event(run_id, "run.progress", "info", f"Progress {progress}% — {phase}.",
                                         {"progress": progress, "phase": phase}))
            if 35 <= progress <= 45 and random.random() < 0.35:
                await bus.publish(make_event(run_id, "run.warning", "warning", "Retrying transient step (attempt 2/3).", {"code": "W-RETRY"}))

    summary = f"{store.get_run(run_id).command_name} completed. {random.randint(1200, 9000):,} records processed."
    _finish(run_id, "run.completed", "succeeded", "info", "Run completed successfully.", {"summary": summary})
    await bus.publish(make_event(run_id, "run.completed", "info", "Run completed successfully.", {"summary": summary}))


def _finish(run_id: str, _type: str, status: str, _sev: Severity, _msg: str, _payload: dict) -> None:
    run = store.get_run(run_id)
    started = run.started_at if run else None
    duration = None
    if started:
        t0 = datetime.fromisoformat(started.replace("Z", "+00:00"))
        duration = int((datetime.now(timezone.utc) - t0).total_seconds())
    patch = dict(status=status, completed_at=_now(), duration_sec=duration,
                 current_phase="completed" if status == "succeeded" else status)
    if status == "succeeded":
        patch["progress"] = 100
        patch["summary"] = _payload.get("summary")
    store.update_run(run_id, **patch)
