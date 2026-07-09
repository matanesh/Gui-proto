import { Clock, Layers } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScenarioStatusBadge } from "@/components/shared/ScenarioStatusBadge";
import { cn } from "@/lib/utils";
import { useDemoStore } from "@/store/demoStore";
import type { Scenario } from "@/models";

export function ScenarioCard({
  scenario,
  selected,
  onSelect,
}: {
  scenario: Scenario;
  selected: boolean;
  onSelect: () => void;
}) {
  const activeScenarioId = useDemoStore((s) => s.activeScenarioId);
  const status = useDemoStore((s) => s.status);
  const isActive = activeScenarioId === scenario.id;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => e.key === "Enter" && onSelect()}
      className={cn(
        "cursor-pointer p-4 transition-colors hover:border-primary/40",
        selected && "border-primary/60 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="font-medium leading-snug">{scenario.title}</p>
        {isActive && <ScenarioStatusBadge status={status} />}
      </div>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{scenario.description}</p>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {scenario.durationSec}s
        </span>
        <span className="flex items-center gap-1">
          <Layers className="h-3.5 w-3.5" /> {scenario.components.length} components
        </span>
        <Badge variant={scenario.outcome === "success" ? "success" : "warning"} className="ml-auto">
          {scenario.outcome === "success" ? "Succeeds" : "Fails / partial"}
        </Badge>
      </div>
    </Card>
  );
}
