import { Badge } from "@/components/ui/badge";
import type { EventSeverity } from "@/models";

const VARIANT: Record<EventSeverity, "neutral" | "running" | "warning" | "error"> = {
  debug: "neutral",
  info: "running",
  warning: "warning",
  error: "error",
  critical: "error",
};

export function SeverityBadge({ severity }: { severity: EventSeverity }) {
  return (
    <Badge variant={VARIANT[severity]} className="uppercase">
      {severity}
    </Badge>
  );
}
