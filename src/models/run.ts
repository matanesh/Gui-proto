/** Run lifecycle status. Terminal: succeeded | failed | cancelled | timeout. */
export type RunStatus =
  | "queued"
  | "accepted"
  | "running"
  | "succeeded"
  | "failed"
  | "cancelled"
  | "timeout";

export const TERMINAL_RUN_STATUSES: readonly RunStatus[] = [
  "succeeded",
  "failed",
  "cancelled",
  "timeout",
];

export function isTerminalStatus(status: RunStatus): boolean {
  return TERMINAL_RUN_STATUSES.includes(status);
}

export interface Run {
  runId: string;
  commandId: string;
  commandName: string;
  status: RunStatus;
  /** 0–100; may be absent while queued/accepted. */
  progress: number;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  durationSec: number | null;
  requestedBy: string;
  summary: string | null;
  currentPhase: string | null;
  /** Servicing access point this run targeted (Fleet Map), if any. */
  targetPcId: string | null;
  /** Specific connected device targeted (phone/laptop under an AP), if any. */
  targetDeviceId: string | null;
  /** Human label for the target, e.g. "Phone-7 (10.10.2.31)". */
  targetLabel: string | null;
}

export interface RunsPage {
  items: Run[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export interface RunsFilter {
  status?: RunStatus[];
  commandType?: string;
  fromDate?: string;
  toDate?: string;
  search?: string;
  /** Filter to runs launched against a specific access point. */
  targetPcId?: string;
  page?: number;
  pageSize?: number;
  sort?: string;
}
