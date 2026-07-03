import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/models";

const RISK_VARIANT: Record<RiskLevel, "success" | "warning" | "error"> = {
  low: "success",
  medium: "warning",
  high: "error",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={RISK_VARIANT[level]}>Risk: {level}</Badge>;
}
