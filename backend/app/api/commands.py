"""Command catalog + submission (docs/API_CONTRACT.md)."""
from __future__ import annotations

import asyncio

from fastapi import APIRouter, HTTPException

from .. import simulator, store
from ..catalog import COMMAND_DEFINITIONS, COMMANDS_BY_ID
from ..config import settings
from ..models import CommandAck, CommandRequestBody, Run

router = APIRouter(tags=["commands"])


@router.get("/commands")
async def list_commands() -> dict:
    return {"items": COMMAND_DEFINITIONS}


@router.post("/commands/{command_id}/runs", status_code=202, response_model=CommandAck)
async def submit_command(command_id: str, body: CommandRequestBody) -> CommandAck:
    # Idempotency: same clientRequestId returns the original acknowledgment.
    existing_run_id = store.lookup_request(body.client_request_id)
    if existing_run_id and (existing := store.get_run(existing_run_id)):
        return CommandAck(run_id=existing.run_id, accepted=True, status=existing.status,
                          message="Duplicate submission; returning original acknowledgment.",
                          accepted_at=existing.created_at)

    command = COMMANDS_BY_ID.get(command_id)
    if command is None:
        raise HTTPException(status_code=404, detail=f"Unknown command '{command_id}'.")
    if not command.enabled:
        raise HTTPException(status_code=422, detail=f"Command '{command.name}' is disabled.")

    created = store.now_iso()
    run_id = f"run-{created[:10].replace('-', '')}-{_rand_suffix()}"
    run = Run(
        run_id=run_id, command_id=command.id, command_name=command.name, status="accepted",
        progress=0, created_at=created, requested_by=body.requested_by,
        current_phase="pending-dispatch", target_pc_id=body.target_pc_id,
        target_device_id=body.target_device_id, target_label=body.target_label,
    )
    store.put_run(run)
    store.remember_request(body.client_request_id, run_id, body.model_dump(by_alias=True))

    # Dispatch: publish to the broker for the Core, or drive locally (no-broker).
    if settings.broker_enabled:
        from ..broker import publish_command  # local import: broker optional
        await publish_command(run_id, command.id, body)
    else:
        asyncio.create_task(simulator.drive_run(run_id))

    return CommandAck(run_id=run_id, accepted=True, status="accepted",
                      message="Command accepted and queued for execution.", accepted_at=created)


def _rand_suffix() -> str:
    import random
    return str(random.randint(100000, 999999))
