"""Run history, snapshot, and cancellation (docs/API_CONTRACT.md)."""
from __future__ import annotations

from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from .. import store
from ..models import Run, RunsPage, RunStatus

router = APIRouter(tags=["runs"])


@router.get("/runs", response_model=RunsPage)
async def list_runs(
    status: Optional[list[RunStatus]] = Query(default=None),
    command_type: Optional[str] = Query(default=None, alias="commandType"),
    from_date: Optional[str] = Query(default=None, alias="fromDate"),
    to_date: Optional[str] = Query(default=None, alias="toDate"),
    search: Optional[str] = Query(default=None),
    target_pc_id: Optional[str] = Query(default=None, alias="targetPcId"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100, alias="pageSize"),
    sort: str = Query(default="createdAt:desc"),
) -> RunsPage:
    items, page, total, total_pages = store.filter_runs(
        status=status, command_type=command_type, from_date=from_date, to_date=to_date,
        search=search, target_pc_id=target_pc_id, sort=sort, page=page, page_size=page_size,
    )
    return RunsPage(items=items, page=page, page_size=page_size, total_items=total, total_pages=total_pages)


@router.get("/runs/{run_id}", response_model=Run)
async def get_run(run_id: str) -> Run:
    run = store.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' was not found.")
    return run


@router.post("/runs/{run_id}/cancel", status_code=202)
async def cancel_run(run_id: str) -> dict:
    run = store.get_run(run_id)
    if run is None:
        raise HTTPException(status_code=404, detail=f"Run '{run_id}' was not found.")
    if run.status in ("succeeded", "failed", "cancelled", "timeout"):
        raise HTTPException(status_code=409, detail=f"Run is already {run.status}.")
    # Cooperative cancellation: the simulator/Core observes this phase.
    store.update_run(run_id, current_phase="cancelling")
    return {"runId": run_id, "cancellationRequested": True,
            "message": "Cancellation requested. Awaiting confirmation from the core system."}
