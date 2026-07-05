"""System health snapshot (docs/API_CONTRACT.md)."""
from __future__ import annotations

from fastapi import APIRouter

from .. import store
from ..config import settings
from ..models import HealthSnapshot

router = APIRouter(tags=["health"])


@router.get("/health", response_model=HealthSnapshot)
async def get_health() -> HealthSnapshot:
    return store.health_snapshot(broker_enabled=settings.broker_enabled)
