import type {
  CommandAck,
  CommandRequest,
  Run,
  RunsFilter,
  RunsPage,
} from "@/models";
import { isTerminalStatus } from "@/models";
import { ApiError, simulateRequest } from "./apiClient";
import {
  COMMAND_DEFINITIONS,
  getAllRuns,
  getRun,
  getRequestPayload,
  lookupClientRequest,
  putRun,
  rememberClientRequest,
  rememberRequestPayload,
  updateRun,
} from "./mockData";

/** Returns the original submission payload for session-launched runs (mock-only helper). */
export async function fetchRunRequestPayload(runId: string): Promise<unknown> {
  return simulateRequest(() => getRequestPayload(runId) ?? null, { failRate: 0 });
}

/**
 * Mirrors POST /api/commands/{commandId}/runs — the 202 Accepted pattern.
 * Returns quickly with a runId; execution is followed via the (mock) SSE
 * stream and snapshot queries, exactly as the real BFF would behave.
 */
export async function submitCommand(request: CommandRequest): Promise<CommandAck> {
  return simulateRequest(
    () => {
      // Idempotency: same clientRequestId returns the original ack.
      const existingRunId = lookupClientRequest(request.clientRequestId);
      if (existingRunId) {
        const existing = getRun(existingRunId);
        if (existing) {
          return {
            runId: existing.runId,
            accepted: true,
            status: existing.status,
            message: "Duplicate submission; returning original acknowledgment.",
            acceptedAt: existing.createdAt,
          };
        }
      }

      const command = COMMAND_DEFINITIONS.find((c) => c.id === request.commandId);
      if (!command) {
        throw new ApiError("NOT_FOUND", 404, `Unknown command '${request.commandId}'.`);
      }
      if (!command.enabled) {
        throw new ApiError("COMMAND_DISABLED", 422, `Command '${command.name}' is disabled.`);
      }

      const now = new Date();
      const runId = `run-${now.toISOString().slice(0, 10).replace(/-/g, "")}-${String(
        100000 + Math.floor(Math.random() * 899999),
      )}`;

      const run: Run = {
        runId,
        commandId: command.id,
        commandName: command.name,
        status: "accepted",
        progress: 0,
        createdAt: now.toISOString(),
        startedAt: null,
        completedAt: null,
        durationSec: null,
        requestedBy: request.requestedBy,
        summary: null,
        currentPhase: "pending-dispatch",
      };
      putRun(run);
      rememberClientRequest(request.clientRequestId, runId);
      rememberRequestPayload(runId, {
        commandId: request.commandId,
        parameters: request.parameters,
        requestedBy: request.requestedBy,
        clientRequestId: request.clientRequestId,
      });

      return {
        runId,
        accepted: true,
        status: "accepted",
        message: "Command accepted and queued for execution.",
        acceptedAt: run.createdAt,
      };
    },
    { failRate: 0.04, minDelayMs: 200, maxDelayMs: 500 },
  );
}

/** Mirrors GET /api/runs with filters + client-side pagination. */
export async function fetchRuns(filter: RunsFilter = {}): Promise<RunsPage> {
  return simulateRequest(() => {
    let items = getAllRuns();

    if (filter.status && filter.status.length > 0) {
      items = items.filter((r) => filter.status!.includes(r.status));
    }
    if (filter.commandType) {
      items = items.filter((r) => r.commandId === filter.commandType);
    }
    if (filter.fromDate) {
      items = items.filter((r) => r.createdAt >= new Date(filter.fromDate!).toISOString());
    }
    if (filter.toDate) {
      const to = new Date(filter.toDate);
      to.setHours(23, 59, 59, 999);
      items = items.filter((r) => r.createdAt <= to.toISOString());
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      items = items.filter((r) => r.runId.toLowerCase().includes(q));
    }

    const [sortKey = "createdAt", sortDir = "desc"] = (filter.sort ?? "createdAt:desc").split(":");
    items = [...items].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "durationSec") {
        cmp = (a.durationSec ?? -1) - (b.durationSec ?? -1);
      } else if (sortKey === "status") {
        cmp = a.status.localeCompare(b.status);
      } else {
        cmp = a.createdAt.localeCompare(b.createdAt);
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    const pageSize = filter.pageSize ?? 10;
    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const page = Math.min(filter.page ?? 1, totalPages);

    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      page,
      pageSize,
      totalItems,
      totalPages,
    };
  });
}

/**
 * Mirrors GET /api/runs/{runId} — the snapshot recovery source of truth.
 * failRate 0: this path must stay reliable for the demo-critical screen.
 */
export async function fetchRun(runId: string): Promise<Run> {
  return simulateRequest(
    () => {
      const run = getRun(runId);
      if (!run) {
        throw new ApiError("NOT_FOUND", 404, `Run '${runId}' was not found.`);
      }
      return run;
    },
    { failRate: 0 },
  );
}

/** Mirrors POST /api/runs/{runId}/cancel — cooperative cancellation request. */
export async function cancelRun(runId: string): Promise<{ runId: string; cancellationRequested: boolean; message: string }> {
  return simulateRequest(
    () => {
      const run = getRun(runId);
      if (!run) {
        throw new ApiError("NOT_FOUND", 404, `Run '${runId}' was not found.`);
      }
      if (isTerminalStatus(run.status)) {
        throw new ApiError("CONFLICT", 409, `Run is already ${run.status}.`);
      }
      // The mock event stream observes this phase and emits run.cancelled.
      updateRun(runId, { currentPhase: "cancelling" });
      return {
        runId,
        cancellationRequested: true,
        message: "Cancellation requested. Awaiting confirmation from the core system.",
      };
    },
    { failRate: 0.03, minDelayMs: 150, maxDelayMs: 400 },
  );
}
