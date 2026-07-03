import type {
  CommandDefinition,
  HealthCheckEntry,
  HealthSnapshot,
  Run,
  RunStatus,
} from "@/models";

/**
 * Sanitized mock fixtures + in-memory run store.
 * ONLY service modules may import this file — pages/components never do.
 * Seeded PRNG keeps demo data stable across reloads within a session shape.
 */

// ---------------------------------------------------------------------------
// Command catalog (generic enterprise commands only)
// ---------------------------------------------------------------------------

export const COMMAND_DEFINITIONS: CommandDefinition[] = [
  {
    id: "cmd-data-sync",
    name: "Data Sync",
    description:
      "Synchronize datasets between configured stores with verification and rollback safety.",
    category: "Data Operations",
    riskLevel: "medium",
    estimatedDurationSec: 120,
    enabled: true,
    configurableFields: [
      {
        key: "targetEnvironment",
        label: "Target Environment",
        type: "select",
        required: true,
        defaultValue: "staging",
        options: ["staging", "integration", "sandbox"],
        description: "Environment the sync runs against.",
      },
      {
        key: "batchSize",
        label: "Batch Size",
        type: "number",
        required: true,
        defaultValue: 500,
        description: "Records per batch (100–5000).",
      },
      {
        key: "dryRun",
        label: "Dry Run",
        type: "boolean",
        required: false,
        defaultValue: true,
        description: "Validate without applying changes.",
      },
    ],
  },
  {
    id: "cmd-health-scan",
    name: "Health Scan",
    description: "Run a full diagnostic sweep across registered subsystems.",
    category: "Diagnostics",
    riskLevel: "low",
    estimatedDurationSec: 45,
    enabled: true,
    configurableFields: [
      {
        key: "scope",
        label: "Scan Scope",
        type: "select",
        required: true,
        defaultValue: "standard",
        options: ["quick", "standard", "deep"],
        description: "Depth of the diagnostic sweep.",
      },
      {
        key: "includeMetrics",
        label: "Collect Metrics",
        type: "boolean",
        required: false,
        defaultValue: true,
        description: "Attach performance metrics to the report.",
      },
    ],
  },
  {
    id: "cmd-report-generation",
    name: "Report Generation",
    description: "Generate an operational summary report for a selected period.",
    category: "Reporting",
    riskLevel: "low",
    estimatedDurationSec: 90,
    enabled: true,
    configurableFields: [
      {
        key: "period",
        label: "Reporting Period",
        type: "select",
        required: true,
        defaultValue: "last-7-days",
        options: ["last-24-hours", "last-7-days", "last-30-days"],
        description: "Time window covered by the report.",
      },
      {
        key: "format",
        label: "Output Format",
        type: "select",
        required: true,
        defaultValue: "pdf",
        options: ["pdf", "html", "csv"],
        description: "Rendered output format.",
      },
      {
        key: "notifyOnComplete",
        label: "Notify on Completion",
        type: "boolean",
        required: false,
        defaultValue: false,
        description: "Send a notification when the report is ready.",
      },
    ],
  },
  {
    id: "cmd-batch-validation",
    name: "Batch Validation",
    description: "Validate queued batches against schema and integrity rules.",
    category: "Data Operations",
    riskLevel: "medium",
    estimatedDurationSec: 180,
    enabled: true,
    configurableFields: [
      {
        key: "validationLevel",
        label: "Validation Level",
        type: "select",
        required: true,
        defaultValue: "strict",
        options: ["lenient", "standard", "strict"],
        description: "Rule set applied to each batch.",
      },
      {
        key: "maxBatches",
        label: "Max Batches",
        type: "number",
        required: true,
        defaultValue: 10,
        description: "Upper limit of batches to validate in this run.",
      },
    ],
  },
  {
    id: "cmd-configuration-check",
    name: "Configuration Check",
    description: "Compare active configuration against the approved baseline.",
    category: "Diagnostics",
    riskLevel: "low",
    estimatedDurationSec: 30,
    enabled: true,
    configurableFields: [
      {
        key: "baseline",
        label: "Baseline Version",
        type: "text",
        required: true,
        defaultValue: "baseline-current",
        description: "Identifier of the baseline to compare against.",
      },
    ],
  },
  {
    id: "cmd-simulation-run",
    name: "Simulation Run",
    description:
      "Execute a controlled simulation scenario in an isolated sandbox environment.",
    category: "Simulation",
    riskLevel: "high",
    estimatedDurationSec: 300,
    enabled: true,
    configurableFields: [
      {
        key: "scenario",
        label: "Scenario",
        type: "select",
        required: true,
        defaultValue: "load-profile-a",
        options: ["load-profile-a", "load-profile-b", "failover-drill"],
        description: "Predefined sanitized scenario to execute.",
      },
      {
        key: "iterations",
        label: "Iterations",
        type: "number",
        required: true,
        defaultValue: 3,
        description: "Number of simulation iterations (1–10).",
      },
      {
        key: "captureTrace",
        label: "Capture Trace",
        type: "boolean",
        required: false,
        defaultValue: true,
        description: "Record a detailed execution trace.",
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Seeded PRNG (mulberry32) for stable demo history
// ---------------------------------------------------------------------------

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OPERATORS = ["operator-01", "operator-02", "operator-03", "operator-04", "operator-05"];

const PHASES_BY_STATUS: Record<RunStatus, string | null> = {
  queued: "waiting",
  accepted: "pending-dispatch",
  running: "processing",
  succeeded: "completed",
  failed: "aborted",
  cancelled: "cancelled",
  timeout: "timed-out",
};

function pick<T>(rand: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rand() * arr.length)]!;
}

function seededHistory(): Run[] {
  const rand = mulberry32(20260703);
  const statuses: RunStatus[] = [
    "succeeded", "succeeded", "succeeded", "succeeded", "succeeded", "succeeded",
    "failed", "failed",
    "cancelled",
    "timeout",
    "running", "running",
    "queued",
  ];
  const runs: Run[] = [];
  const now = Date.now();

  for (let i = 0; i < 42; i++) {
    const command = pick(rand, COMMAND_DEFINITIONS);
    const status = pick(rand, statuses);
    const ageMs = rand() * 14 * 24 * 3600 * 1000; // within last 14 days
    const createdAt = new Date(now - ageMs);
    const isStarted = status !== "queued" && status !== "accepted";
    const startedAt = isStarted ? new Date(createdAt.getTime() + 3000 + rand() * 15000) : null;
    const isTerminal = ["succeeded", "failed", "cancelled", "timeout"].includes(status);
    const durationSec = isTerminal
      ? Math.round(command.estimatedDurationSec * (0.6 + rand() * 0.9))
      : null;
    const completedAt =
      isTerminal && startedAt ? new Date(startedAt.getTime() + (durationSec ?? 0) * 1000) : null;

    const progress =
      status === "succeeded" ? 100
      : status === "running" ? Math.round(10 + rand() * 80)
      : status === "failed" || status === "timeout" ? Math.round(20 + rand() * 70)
      : status === "cancelled" ? Math.round(rand() * 60)
      : 0;

    const summaryByStatus: Record<RunStatus, string | null> = {
      succeeded: `${command.name} completed. ${Math.round(rand() * 9000 + 500)} records processed.`,
      failed: "Terminated: validation rule violation in processing stage.",
      cancelled: "Cancelled by operator request.",
      timeout: "Exceeded maximum allowed duration.",
      running: null,
      queued: null,
      accepted: null,
    };

    runs.push({
      runId: `run-${createdAt.toISOString().slice(0, 10).replace(/-/g, "")}-${String(100000 + Math.floor(rand() * 899999))}`,
      commandId: command.id,
      commandName: command.name,
      status,
      progress,
      createdAt: createdAt.toISOString(),
      startedAt: startedAt ? startedAt.toISOString() : null,
      completedAt: completedAt ? completedAt.toISOString() : null,
      durationSec,
      requestedBy: pick(rand, OPERATORS),
      summary: summaryByStatus[status],
      currentPhase: PHASES_BY_STATUS[status],
    });
  }

  runs.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return runs;
}

// ---------------------------------------------------------------------------
// In-memory run store (module singleton)
// ---------------------------------------------------------------------------

const runStore = new Map<string, Run>();
for (const run of seededHistory()) {
  runStore.set(run.runId, run);
}

/** Idempotency ledger: clientRequestId -> runId (see docs/API_CONTRACT.md). */
const idempotencyLedger = new Map<string, string>();

export function getAllRuns(): Run[] {
  return [...runStore.values()].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getRun(runId: string): Run | undefined {
  return runStore.get(runId);
}

export function putRun(run: Run): void {
  runStore.set(run.runId, run);
}

/** Patch a run in place; used by runsApi and the mock event stream. */
export function updateRun(runId: string, patch: Partial<Run>): Run | undefined {
  const current = runStore.get(runId);
  if (!current) return undefined;
  const next = { ...current, ...patch };
  runStore.set(runId, next);
  return next;
}

export function rememberClientRequest(clientRequestId: string, runId: string): void {
  idempotencyLedger.set(clientRequestId, runId);
}

export function lookupClientRequest(clientRequestId: string): string | undefined {
  return idempotencyLedger.get(clientRequestId);
}

// ---------------------------------------------------------------------------
// Health fixtures
// ---------------------------------------------------------------------------

export function buildHealthSnapshot(): HealthSnapshot {
  const now = new Date().toISOString();
  const jitter = (base: number, spread: number) =>
    Math.round(base + (Math.random() - 0.5) * spread);
  // Broker occasionally shows degraded to exercise the degraded UI state.
  const brokerDegraded = Math.random() < 0.3;

  return {
    checkedAt: now,
    components: [
      {
        component: "frontend",
        status: "operational",
        latencyMs: jitter(2, 2),
        lastCheckedAt: now,
        details: "Static assets served; bundle healthy.",
      },
      {
        component: "bff",
        status: "operational",
        latencyMs: jitter(14, 8),
        lastCheckedAt: now,
        details: "All REST endpoints responsive.",
      },
      {
        component: "messageBroker",
        status: brokerDegraded ? "degraded" : "operational",
        latencyMs: jitter(brokerDegraded ? 90 : 28, 20),
        lastCheckedAt: now,
        details: brokerDegraded
          ? "Queue depth above warning threshold."
          : "Queues nominal; consumers keeping up.",
      },
      {
        component: "pythonCore",
        status: "operational",
        latencyMs: jitter(31, 12),
        lastCheckedAt: now,
        details: "Workers healthy; executor pool nominal.",
      },
      {
        component: "sseStream",
        status: "operational",
        latencyMs: jitter(8, 6),
        lastCheckedAt: now,
        details: "Event stream fan-out nominal.",
      },
    ],
    metrics: {
      queueDepth: jitter(brokerDegraded ? 120 : 30, 25),
      eventThroughputPerSec: jitter(110, 60),
      failedMessages: brokerDegraded ? jitter(6, 4) : jitter(1, 2),
      dlqCount: brokerDegraded ? 2 : jitter(0, 1),
      eventBacklog: brokerDegraded ? jitter(40, 20) : jitter(8, 8),
    },
  };
}

export function buildHealthTimeline(): HealthCheckEntry[] {
  const entries: HealthCheckEntry[] = [];
  const now = Date.now();
  const rand = mulberry32(777);
  const components = ["frontend", "bff", "messageBroker", "pythonCore", "sseStream"] as const;

  for (let i = 0; i < 24; i++) {
    const at = new Date(now - i * 10 * 60 * 1000).toISOString(); // every 10 min
    const component = pick(rand, components);
    const roll = rand();
    const status = roll < 0.82 ? "operational" : roll < 0.95 ? "degraded" : "unavailable";
    entries.push({
      checkedAt: at,
      component,
      status,
      note:
        status === "operational"
          ? "Check passed."
          : status === "degraded"
            ? "Elevated latency observed."
            : "Health probe failed; retrying.",
    });
  }
  return entries;
}
