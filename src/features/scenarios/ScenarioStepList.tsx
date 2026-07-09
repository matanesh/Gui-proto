import { CheckCircle2, CircleDot, Circle } from "lucide-react";
import { ComponentBadge } from "@/components/shared/ComponentBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { cn } from "@/lib/utils";
import type { Scenario } from "@/models";

/** Read-only step-by-step preview of a scenario's scripted event sequence. */
export function ScenarioStepList({
  scenario,
  currentStepIndex,
}: {
  scenario: Scenario;
  currentStepIndex: number;
}) {
  return (
    <ol className="space-y-2">
      {scenario.steps.map((step, idx) => {
        const fired = idx < currentStepIndex;
        const isCurrent = idx === currentStepIndex;
        return (
          <li
            key={step.id}
            className={cn(
              "flex items-start gap-2 rounded-md border px-3 py-2 text-sm",
              isCurrent && "border-primary/50 bg-primary/5",
              fired && !isCurrent && "opacity-60",
            )}
          >
            {fired ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-status-success" />
            ) : isCurrent ? (
              <CircleDot className="mt-0.5 h-4 w-4 shrink-0 animate-pulse text-status-running" />
            ) : (
              <Circle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/40" />
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <ComponentBadge component={step.component} />
                <SeverityBadge severity={step.severity} />
                <span className="font-mono text-xs text-muted-foreground">{step.type}</span>
              </div>
              <p className="mt-1 text-muted-foreground">{step.message}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
