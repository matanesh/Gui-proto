import { useState } from "react";
import { CheckCircle2, CircleDot, Circle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ComponentBadge } from "@/components/shared/ComponentBadge";
import { SeverityBadge } from "@/components/shared/SeverityBadge";
import { cn } from "@/lib/utils";
import { COMPONENT_LABEL } from "@/models";
import { PIPELINE_STAGES, stageIndexForStep } from "./pipelineStages";
import type { Scenario, ScenarioStep } from "@/models";

/** Clickable scenario step list — click a row to open its details drawer. */
export function TimelineStepList({
  scenario,
  currentStepIndex,
  correlationId,
}: {
  scenario: Scenario;
  currentStepIndex: number;
  correlationId: string | null;
}) {
  const [selected, setSelected] = useState<ScenarioStep | null>(null);

  return (
    <>
      <ol className="space-y-2">
        {scenario.steps.map((step, idx) => {
          const fired = idx < currentStepIndex;
          const isCurrent = idx === currentStepIndex;
          const stage = PIPELINE_STAGES[stageIndexForStep(step, idx === scenario.steps.length - 1)];
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => setSelected(step)}
                className={cn(
                  "flex w-full items-start gap-2 rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40",
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
                    <span className="font-mono text-xs text-muted-foreground">{stage.label}</span>
                  </div>
                  <p className="mt-1 text-muted-foreground">{step.message}</p>
                </div>
              </button>
            </li>
          );
        })}
      </ol>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base">{selected.type}</DialogTitle>
                <DialogDescription>{COMPONENT_LABEL[selected.component]}</DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <SeverityBadge severity={selected.severity} />
                <p className="text-muted-foreground">{selected.message}</p>
                <div>
                  <p className="text-xs text-muted-foreground">Payload preview (sanitized)</p>
                  <p className="mt-0.5 break-all rounded-md border bg-muted/30 p-2 font-mono text-xs">
                    {selected.payloadPreview}
                  </p>
                </div>
                {correlationId && (
                  <div>
                    <p className="text-xs text-muted-foreground">Correlation id (shared across this run)</p>
                    <p className="mt-0.5 break-all font-mono text-xs">{correlationId}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
