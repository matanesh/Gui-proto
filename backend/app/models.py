"""Pydantic models mirroring docs/API_CONTRACT.md and docs/EVENT_SCHEMA.md.

Python attributes are snake_case; JSON is camelCase via the alias generator, so
the wire format matches the frontend TypeScript models exactly.
"""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel

RunStatus = Literal["queued", "accepted", "running", "succeeded", "failed", "cancelled", "timeout"]
RiskLevel = Literal["low", "medium", "high"]
CommandFieldType = Literal["text", "number", "select", "boolean"]
Severity = Literal["debug", "info", "warning", "error", "critical"]
RunEventType = Literal[
    "run.accepted", "run.queued", "run.started", "run.progress", "run.log",
    "run.warning", "run.error", "run.completed", "run.failed", "run.cancelled", "heartbeat",
]
ComponentStatus = Literal["operational", "degraded", "unavailable", "unknown"]

TERMINAL_STATUSES: set[str] = {"succeeded", "failed", "cancelled", "timeout"}


class CamelModel(BaseModel):
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class CommandField(CamelModel):
    key: str
    label: str
    type: CommandFieldType
    required: bool
    default_value: Any = None
    options: Optional[list[str]] = None
    description: Optional[str] = None


class CommandDefinition(CamelModel):
    id: str
    name: str
    description: str
    category: str
    configurable_fields: list[CommandField]
    risk_level: RiskLevel
    estimated_duration_sec: int
    enabled: bool


class CommandRequestBody(CamelModel):
    parameters: dict[str, Any] = {}
    requested_by: str
    client_request_id: str
    target_pc_id: Optional[str] = None
    target_device_id: Optional[str] = None
    target_label: Optional[str] = None


class CommandAck(CamelModel):
    run_id: str
    accepted: bool
    status: RunStatus
    message: str
    accepted_at: str


class Run(CamelModel):
    run_id: str
    command_id: str
    command_name: str
    status: RunStatus
    progress: int
    created_at: str
    started_at: Optional[str] = None
    completed_at: Optional[str] = None
    duration_sec: Optional[int] = None
    requested_by: str
    summary: Optional[str] = None
    current_phase: Optional[str] = None
    target_pc_id: Optional[str] = None
    target_device_id: Optional[str] = None
    target_label: Optional[str] = None


class RunsPage(CamelModel):
    items: list[Run]
    page: int
    page_size: int
    total_items: int
    total_pages: int


class RunEvent(CamelModel):
    event_id: str
    run_id: str
    sequence: int
    timestamp: str
    type: RunEventType
    severity: Severity
    source: str
    message: str
    payload: dict[str, Any] = {}


class HealthComponent(CamelModel):
    component: str
    status: ComponentStatus
    latency_ms: Optional[int] = None
    last_checked_at: str
    details: str


class HealthMetrics(CamelModel):
    queue_depth: int
    event_throughput_per_sec: int
    failed_messages: int
    dlq_count: int
    event_backlog: int


class HealthSnapshot(CamelModel):
    checked_at: str
    components: list[HealthComponent]
    metrics: HealthMetrics
