import { useMemo } from "react";
import { Rnd } from "react-rnd";
import { Link } from "react-router-dom";
import { ExternalLink, GripHorizontal, X } from "lucide-react";
import { TargetMap } from "./TargetMap";
import type { ResolvedTarget } from "./targets";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { Progress } from "@/components/ui/progress";
import { useRun } from "@/hooks/useRuns";
import { useRunEvents } from "@/hooks/useRunEvents";

interface CommandResultWindowProps {
  runId: string;
  target: ResolvedTarget;
  onClose: () => void;
}

/**
 * Floating, draggable, resizable window showing the live result of a command
 * plus a mini map of where the target is. useRunEvents drives the mock run
 * lifecycle (same as Run Details), so progress advances while this is open.
 */
export function CommandResultWindow({ runId, target, onClose }: CommandResultWindowProps) {
  const runQuery = useRun(runId, { refetchIntervalMs: 1500 });
  const { lifecycleEvents, connectionState } = useRunEvents(runId);
  const run = runQuery.data;

  const liveProgress = useMemo(() => {
    for (let i = lifecycleEvents.length - 1; i >= 0; i--) {
      const p = lifecycleEvents[i]!.payload["progress"];
      if (typeof p === "number") return p;
    }
    return run?.progress ?? 0;
  }, [lifecycleEvents, run?.progress]);

  return (
    <div className="pointer-events-none fixed inset-0 z-[80]">
      <Rnd
        default={{ x: Math.max(16, window.innerWidth - 460), y: 110, width: 420, height: 380 }}
        minWidth={300}
        minHeight={280}
        bounds="parent"
        dragHandleClassName="cmd-window-drag"
        className="pointer-events-auto"
      >
        <div className="flex h-full flex-col overflow-hidden rounded-lg border bg-card shadow-2xl">
          <div className="cmd-window-drag flex cursor-move items-center justify-between gap-2 border-b bg-muted/40 px-3 py-2">
            <div className="flex min-w-0 items-center gap-2">
              <GripHorizontal className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="truncate text-sm font-medium">{target.name}</span>
              <span className="truncate font-mono text-xs text-muted-foreground">{target.ip}</span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Link to={`/runs/${runId}`} className="rounded p-1 hover:bg-accent" title="Open full Run Details">
                <ExternalLink className="h-4 w-4" />
              </Link>
              <button onClick={onClose} className="rounded p-1 hover:bg-accent" title="Close">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="min-h-0 flex-1">
            <TargetMap target={target} />
          </div>

          <div className="space-y-1.5 border-t p-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                {run && <StatusBadge status={run.status} />}
                <span className="truncate text-xs text-muted-foreground">{run?.commandName ?? "…"}</span>
              </div>
              <ConnectionPill state={connectionState} />
            </div>
            <div className="flex items-center gap-2">
              <Progress value={liveProgress} className="h-1.5 flex-1" />
              <span className="w-9 text-right font-mono text-xs">{Math.round(liveProgress)}%</span>
            </div>
            {target.kind === "device" && (
              <p className="text-[11px] text-muted-foreground">
                {target.exactLocation
                  ? "Exact location reported by the command."
                  : `Approximate area around ${target.servingAp.name}.`}
              </p>
            )}
          </div>
        </div>
      </Rnd>
    </div>
  );
}
