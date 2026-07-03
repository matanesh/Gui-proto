import { Badge } from "@/components/ui/badge";
import type { RunStatus } from "@/models";

const STATUS_VARIANT: Record<RunStatus, "success" | "running" | "warning" | "error" | "neutral" | "accepted"> = {
  succeeded: "success",
  running: "running",
  queued: "warning",
  accepted: "accepted",
  failed: "error",
  timeout: "error",
  cancelled: "neutral",
};

const STATUS_LABEL: Record<RunStatus, string> = {
  succeeded: "Succeeded",
  running: "Running",
  queued: "Queued",
  accepted: "Accepted",
  failed: "Failed",
  timeout: "Timeout",
  cancelled: "Cancelled",
};

export function StatusBadge({ status }: { status: RunStatus }) {
  return <Badge variant={STATUS_VARIANT[status]}>{STATUS_LABEL[status]}</Badge>;
}
