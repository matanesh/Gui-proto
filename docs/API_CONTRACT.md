# API Contract — Ops Command Center BFF

> Contract for the **future FastAPI BFF**. The prototype's mock services implement these exact shapes so real endpoints can be swapped in without UI changes. All values below are placeholders — no real endpoints, hosts, or credentials.

Base path: `/api` (relative; the deployed base URL comes from runtime configuration, never hardcoded).

Conventions:

- JSON request/response bodies, UTF-8, `camelCase` fields.
- Timestamps are ISO-8601 UTC strings (e.g. `2026-07-03T12:00:00Z`).
- All list endpoints are paginated (see [Pagination model](#pagination-model)).
- All errors use the common [Error model](#error-model).

---

## GET /api/commands

Returns the command catalog available to the current user.

**Response 200**

```json
{
  "items": [
    {
      "id": "cmd-data-sync",
      "name": "Data Sync",
      "description": "Synchronize datasets between configured stores.",
      "category": "Data Operations",
      "riskLevel": "medium",
      "estimatedDurationSec": 120,
      "enabled": true,
      "configurableFields": [
        {
          "key": "targetEnvironment",
          "label": "Target Environment",
          "type": "select",
          "required": true,
          "defaultValue": "staging",
          "options": ["staging", "integration", "sandbox"],
          "description": "Environment the sync runs against."
        },
        {
          "key": "dryRun",
          "label": "Dry Run",
          "type": "boolean",
          "required": false,
          "defaultValue": true,
          "description": "Validate without applying changes."
        }
      ]
    }
  ]
}
```

---

## POST /api/commands/{commandId}/runs

Submits a command for asynchronous execution. Returns **quickly** — execution is followed via SSE and the run snapshot endpoint.

**Request**

```json
{
  "parameters": { "targetEnvironment": "staging", "dryRun": true },
  "requestedBy": "operator-01",
  "clientRequestId": "b4f7c2a0-0000-4000-8000-000000000001"
}
```

**Response 202 Accepted** (preferred status; the run is not done, it is accepted)

```json
{
  "accepted": true,
  "runId": "run-20260703-000123",
  "status": "accepted",
  "acceptedAt": "2026-07-03T12:00:00Z",
  "message": "Command accepted and queued for execution."
}
```

**Errors**

- `400` — validation failure (missing/invalid parameters). `error.details` lists per-field issues.
- `404` — unknown `commandId`.
- `409` — duplicate `clientRequestId` with different payload (see [Idempotency](#idempotency)).
- `422` — command disabled.
- `503` — broker unavailable; the command was **not** enqueued.

---

## GET /api/runs

Returns paginated, filterable run history.

**Query parameters (all optional)**

| Param | Type | Meaning |
|---|---|---|
| `status` | RunStatus | filter by status (repeatable) |
| `commandType` | string | filter by command id |
| `fromDate` | ISO-8601 | createdAt lower bound |
| `toDate` | ISO-8601 | createdAt upper bound |
| `search` | string | match against runId |
| `page` | int ≥ 1 | page number (default 1) |
| `pageSize` | int 1–100 | page size (default 20) |
| `sort` | string | e.g. `createdAt:desc` (default) |

**Response 200**

```json
{
  "items": [
    {
      "runId": "run-20260703-000123",
      "commandId": "cmd-data-sync",
      "commandName": "Data Sync",
      "status": "succeeded",
      "progress": 100,
      "createdAt": "2026-07-03T12:00:00Z",
      "startedAt": "2026-07-03T12:00:05Z",
      "completedAt": "2026-07-03T12:02:10Z",
      "durationSec": 125,
      "requestedBy": "operator-01",
      "summary": "Sync completed. 4,210 records processed.",
      "currentPhase": "completed"
    }
  ],
  "page": 1,
  "pageSize": 20,
  "totalItems": 137,
  "totalPages": 7
}
```

---

## GET /api/runs/{runId}

Returns the current snapshot of a single run. This endpoint is the **recovery source of truth** after SSE reconnects or detected event gaps.

**Response 200** — a single `Run` object (same shape as items above).

**Errors** — `404` unknown runId.

---

## POST /api/runs/{runId}/cancel

Requests cancellation. Cancellation is **cooperative**: the response acknowledges the request; the outcome arrives as a `run.cancelled` (or terminal) event and in the snapshot.

**Request** — empty body or `{ "reason": "operator abort" }`.

**Response 202**

```json
{ "runId": "run-20260703-000123", "cancellationRequested": true, "message": "Cancellation requested." }
```

**Errors** — `404` unknown runId; `409` run already terminal.

---

## GET /api/health

Returns a health snapshot of the architecture components.

**Response 200**

```json
{
  "checkedAt": "2026-07-03T12:00:00Z",
  "components": [
    { "component": "frontend", "status": "operational", "latencyMs": 2, "lastCheckedAt": "2026-07-03T12:00:00Z", "details": "static assets served" },
    { "component": "bff", "status": "operational", "latencyMs": 14, "lastCheckedAt": "2026-07-03T12:00:00Z", "details": "all endpoints responsive" },
    { "component": "messageBroker", "status": "degraded", "latencyMs": 87, "lastCheckedAt": "2026-07-03T12:00:00Z", "details": "queue depth above threshold" },
    { "component": "pythonCore", "status": "operational", "latencyMs": 31, "lastCheckedAt": "2026-07-03T12:00:00Z", "details": "workers healthy" }
  ],
  "metrics": {
    "queueDepth": 42,
    "eventThroughputPerSec": 118,
    "failedMessages": 3,
    "dlqCount": 1,
    "eventBacklog": 12
  }
}
```

Component `status` values: `operational` | `degraded` | `unavailable` | `unknown`.

---

## GET /api/events/stream?runId={runId}

**Future SSE endpoint.** One-way stream of `RunEvent` objects for a run (see [EVENT_SCHEMA.md](./EVENT_SCHEMA.md)).

- `Content-Type: text/event-stream`
- Each SSE message: `id:` = eventId, `event:` = event type, `data:` = JSON `RunEvent`.
- Heartbeats every ~10s keep intermediaries from timing out and let the client detect stalls.
- Reconnect resume via the standard `Last-Event-ID` request header; the BFF replays events after that id from its replay window, else the client must snapshot-recover via `GET /api/runs/{runId}`.

```
id: evt-000042
event: run.progress
data: {"eventId":"evt-000042","runId":"run-20260703-000123","sequence":42,"timestamp":"2026-07-03T12:01:00Z","type":"run.progress","severity":"info","source":"core","message":"Processing batch 3/8","payload":{"progress":37}}
```

---

## Error model

All non-2xx responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Parameter 'targetEnvironment' is required.",
    "details": [{ "field": "targetEnvironment", "issue": "required" }],
    "requestId": "req-000000",
    "timestamp": "2026-07-03T12:00:00Z"
  }
}
```

Codes: `VALIDATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `COMMAND_DISABLED`, `BROKER_UNAVAILABLE`, `CORE_UNAVAILABLE`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## Pagination model

Requests: `page` (1-based), `pageSize`. Responses: `items`, `page`, `pageSize`, `totalItems`, `totalPages`. Clients must treat `totalItems` as approximate under concurrent writes.

## Idempotency

`clientRequestId` (client-generated UUID) makes command submission idempotent:

- Same `clientRequestId` + same payload → the BFF returns the **original** 202 response (same `runId`); no duplicate run.
- Same `clientRequestId` + different payload → `409 CONFLICT`.
- Retention window for idempotency keys is a BFF deployment concern (suggested ≥ 24h).

## Status code guidance

| Code | Use |
|---|---|
| 200 | successful query |
| 202 | command/cancel accepted for async processing |
| 400 | malformed/invalid request |
| 404 | unknown resource |
| 409 | idempotency conflict / already terminal |
| 422 | valid shape, not executable (disabled command) |
| 429 | rate limited |
| 503 | dependency unavailable (broker/core) — safe to retry with backoff |

## Security placeholder

Production deployments front all endpoints with the organization's standard authentication/authorization (e.g. SSO at the gateway, role→command authorization in the BFF). **No authentication is implemented in the prototype**, and no security scheme details are specified here. No credentials, tokens, or real hostnames may appear in this repository.
