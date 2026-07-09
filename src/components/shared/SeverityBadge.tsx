import { Badge } from "@/components/ui/badge";
import type { EventSeverity } from "@/models";

// eslint-disable-next-line react-refresh/only-export-components -- shared component + its variant map, same pattern as ui/badge.tsx
export const SEVERITY_VARIANT: Record<EventSeverity, "neutral" | "running" | "warning" | "error"> = {
  debug: "neutral",
  info: "running",
  warning: "warning",
  error: "error",
  critical: "error",
};

export function SeverityBadge({ severity }: { severity: EventSeverity }) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity]} className="uppercase">
      {severity}
    </Badge>
  );
}
