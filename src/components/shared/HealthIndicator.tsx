import { cn } from "@/lib/utils";
import type { ComponentStatus } from "@/models";

const STATUS_DOT: Record<ComponentStatus, string> = {
  operational: "bg-status-success",
  degraded: "bg-status-warning",
  unavailable: "bg-status-error",
  unknown: "bg-status-neutral",
};

const STATUS_LABEL: Record<ComponentStatus, string> = {
  operational: "Operational",
  degraded: "Degraded",
  unavailable: "Unavailable",
  unknown: "Unknown",
};

export function HealthIndicator({ status, className }: { status: ComponentStatus; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-sm", className)}>
      <span className={cn("h-2 w-2 rounded-full", STATUS_DOT[status])} aria-hidden />
      {STATUS_LABEL[status]}
    </span>
  );
}

export const COMPONENT_LABELS: Record<string, string> = {
  frontend: "Frontend",
  bff: "FastAPI BFF",
  messageBroker: "Message Broker",
  pythonCore: "Python Core",
  sseStream: "SSE Stream",
};
