import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { PIPELINE_STAGES } from "./pipelineStages";
import type { ScenarioStatus } from "@/models";

/** The canonical async flow, with the currently active stage highlighted live. */
export function PipelineStepper({
  currentIndex,
  status,
}: {
  currentIndex: number;
  status: ScenarioStatus;
}) {
  const failed = status === "failed";

  return (
    <ol className="flex flex-wrap gap-x-1 gap-y-4 sm:flex-nowrap sm:overflow-x-auto">
      {PIPELINE_STAGES.map((stage, idx) => {
        const done = idx < currentIndex || (idx === currentIndex && status === "completed");
        const isCurrent = idx === currentIndex && status !== "completed";
        const isFailedHere = isCurrent && failed;

        return (
          <li key={stage.id} className="flex min-w-[6.5rem] flex-1 items-center gap-1">
            <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  done && "border-status-success/50 bg-status-success/15 text-status-success",
                  isCurrent && !isFailedHere && "border-status-running bg-status-running/15 text-status-running animate-pulse",
                  isFailedHere && "border-status-error bg-status-error/15 text-status-error animate-pulse",
                  !done && !isCurrent && "border-border text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : idx + 1}
              </span>
              <span
                className={cn(
                  "text-[11px] leading-tight text-muted-foreground",
                  (isCurrent || done) && "text-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
            {idx < PIPELINE_STAGES.length - 1 && (
              <div className={cn("hidden h-px flex-1 bg-border sm:block", idx < currentIndex && "bg-status-success/50")} />
            )}
          </li>
        );
      })}
    </ol>
  );
}
