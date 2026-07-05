"""In-memory run store, idempotency ledger, per-run event log, and health.

Stands in for BFF-side persistence (the Core owns business truth). Thread-safety
is not needed: the app is single-process async and all access is on the event loop.
"""
from __future__ import annotations

import random
from datetime import datetime, timedelta, timezone
from typing import Optional

from .catalog import COMMAND_DEFINITIONS
from .models import (
    HealthComponent,
    HealthMetrics,
    HealthSnapshot,
    Run,
    RunEvent,
    RunStatus,
)

_runs: dict[str, Run] = {}
_idempotency: dict[str, str] = {}
_payloads: dict[str, dict] = {}
_event_log: dict[str, list[RunEvent]] = {}

OPERATORS = ["operator-01", "operator-02", "operator-03", "operator-04", "operator-05"]


def now_iso() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def _seed() -> None:
    rng = random.Random(20260703)
    statuses: list[RunStatus] = (
        ["succeeded"] * 6 + ["failed", "failed", "cancelled", "timeout", "running", "running", "queued"]
    )
    base = datetime.now(timezone.utc)
    for _ in range(28):
        cmd = rng.choice(COMMAND_DEFINITIONS)
        status = rng.choice(statuses)
        created = base - timedelta(seconds=rng.random() * 14 * 24 * 3600)
        started = created + timedelta(seconds=3 + rng.random() * 15) if status not in ("queued", "accepted") else None
        terminal = status in ("succeeded", "failed", "cancelled", "timeout")
        duration = int(cmd.estimated_duration_sec * (0.6 + rng.random() * 0.9)) if terminal else None
        completed = (started + timedelta(seconds=duration)) if (terminal and started and duration) else None
        progress = 100 if status == "succeeded" else (rng.randint(10, 90) if status == "running" else (rng.randint(20, 90) if terminal else 0))
        run_id = f"run-{created.strftime('%Y%m%d')}-{rng.randint(100000, 999999)}"
        _runs[run_id] = Run(
            run_id=run_id, command_id=cmd.id, command_name=cmd.name, status=status, progress=progress,
            created_at=_fmt(created), started_at=_fmt(started), completed_at=_fmt(completed),
            duration_sec=duration, requested_by=rng.choice(OPERATORS),
            summary=(f"{cmd.name} completed." if status == "succeeded" else None),
            current_phase="completed" if status == "succeeded" else status,
            target_pc_id=None, target_device_id=None, target_label=None,
        )
    # A few access-point-targeted runs so the Fleet Map shows history.
    for pc in ["ap-002", "ap-005", "ap-007", "ap-011"]:
        cmd = rng.choice(COMMAND_DEFINITIONS)
        created = base - timedelta(seconds=rng.random() * 6 * 24 * 3600)
        run_id = f"run-{created.strftime('%Y%m%d')}-{rng.randint(100000, 999999)}"
        _runs[run_id] = Run(
            run_id=run_id, command_id=cmd.id, command_name=cmd.name, status="succeeded", progress=100,
            created_at=_fmt(created), started_at=_fmt(created), completed_at=_fmt(created),
            duration_sec=cmd.estimated_duration_sec, requested_by=rng.choice(OPERATORS),
            summary=f"{cmd.name} applied to {pc}.", current_phase="completed",
            target_pc_id=pc, target_device_id=None, target_label=pc,
        )


def _fmt(dt: Optional[datetime]) -> Optional[str]:
    if dt is None:
        return None
    return dt.astimezone(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


# --- runs ------------------------------------------------------------------

def all_runs() -> list[Run]:
    return sorted(_runs.values(), key=lambda r: r.created_at, reverse=True)


def get_run(run_id: str) -> Optional[Run]:
    return _runs.get(run_id)


def put_run(run: Run) -> None:
    _runs[run.run_id] = run


def update_run(run_id: str, **patch) -> Optional[Run]:
    run = _runs.get(run_id)
    if run is None:
        return None
    updated = run.model_copy(update=patch)
    _runs[run_id] = updated
    return updated


def filter_runs(*, status=None, command_type=None, from_date=None, to_date=None,
                search=None, target_pc_id=None, sort="createdAt:desc",
                page=1, page_size=20):
    items = all_runs()
    if status:
        items = [r for r in items if r.status in status]
    if command_type:
        items = [r for r in items if r.command_id == command_type]
    if target_pc_id:
        items = [r for r in items if r.target_pc_id == target_pc_id]
    if from_date:
        items = [r for r in items if r.created_at >= from_date]
    if to_date:
        items = [r for r in items if r.created_at <= to_date + "T23:59:59Z"]
    if search:
        q = search.lower()
        items = [r for r in items if q in r.run_id.lower()]

    key, _, direction = sort.partition(":")
    reverse = direction != "asc"
    if key == "durationSec":
        items.sort(key=lambda r: r.duration_sec or -1, reverse=reverse)
    elif key == "status":
        items.sort(key=lambda r: r.status, reverse=reverse)
    else:
        items.sort(key=lambda r: r.created_at, reverse=reverse)

    total = len(items)
    total_pages = max(1, (total + page_size - 1) // page_size)
    page = min(max(1, page), total_pages)
    start = (page - 1) * page_size
    return items[start:start + page_size], page, total, total_pages


# --- idempotency + payloads ------------------------------------------------

def remember_request(client_request_id: str, run_id: str, payload: dict) -> None:
    _idempotency[client_request_id] = run_id
    _payloads[run_id] = payload


def lookup_request(client_request_id: str) -> Optional[str]:
    return _idempotency.get(client_request_id)


def get_payload(run_id: str) -> Optional[dict]:
    return _payloads.get(run_id)


# --- event log (for SSE replay + snapshot) ---------------------------------

def append_event(event: RunEvent) -> None:
    if event.type == "heartbeat":
        return
    log = _event_log.setdefault(event.run_id, [])
    log.append(event)
    if len(log) > 500:
        del log[: len(log) - 500]


def events_after(run_id: str, last_event_id: Optional[str]) -> list[RunEvent]:
    log = _event_log.get(run_id, [])
    if not last_event_id:
        return list(log)
    for i, ev in enumerate(log):
        if ev.event_id == last_event_id:
            return log[i + 1:]
    return list(log)  # unknown id -> replay all we have


# --- health ----------------------------------------------------------------

def health_snapshot(broker_enabled: bool) -> HealthSnapshot:
    now = now_iso()
    degraded = random.random() < 0.25
    broker_status = "operational" if broker_enabled else "unavailable"
    core_status = "operational" if broker_enabled else "degraded"
    return HealthSnapshot(
        checked_at=now,
        components=[
            HealthComponent(component="frontend", status="operational", latency_ms=2, last_checked_at=now, details="Static assets served."),
            HealthComponent(component="bff", status="operational", latency_ms=random.randint(8, 22), last_checked_at=now, details="All REST endpoints responsive."),
            HealthComponent(component="messageBroker", status=("degraded" if (broker_enabled and degraded) else broker_status), latency_ms=random.randint(20, 90), last_checked_at=now, details=("Broker connected." if broker_enabled else "Broker disabled (internal simulator active).")),
            HealthComponent(component="pythonCore", status=core_status, latency_ms=random.randint(20, 50), last_checked_at=now, details=("Workers healthy." if broker_enabled else "No Core worker (simulator drives runs).")),
            HealthComponent(component="sseStream", status="operational", latency_ms=random.randint(4, 14), last_checked_at=now, details="Event stream fan-out nominal."),
        ],
        metrics=HealthMetrics(
            queue_depth=random.randint(0, 60), event_throughput_per_sec=random.randint(50, 160),
            failed_messages=random.randint(0, 3), dlq_count=random.randint(0, 1), event_backlog=random.randint(0, 20),
        ),
    )


_seed()
