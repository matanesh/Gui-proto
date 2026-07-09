import { Badge } from "@/components/ui/badge";
import type { ScenarioStatus } from "@/models";

const VARIANT: Record<ScenarioStatus, "neutral" | "running" | "warning" | "success" | "error"> = {
  idle: "neutral",
  running: "running",
  paused: "warning",
  completed: "success",
  failed: "error",
};

const LABEL: Record<ScenarioStatus, string> = {
  idle: "Idle",
  running: "Running",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
};

export function ScenarioStatusBadge({ status }: { status: ScenarioStatus }) {
  return <Badge variant={VARIANT[status]}>{LABEL[status]}</Badge>;
}
