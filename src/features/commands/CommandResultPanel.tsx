import { useMemo } from "react";
import { Terminal } from "lucide-react";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { EmptyState } from "@/components/shared/EmptyState";
import { Progress } from "@/components/ui/progress";
import { LogViewer } from "@/features/runs/LogViewer";
import { useRun } from "@/hooks/useRuns";
import { useRunEvents } from "@/hooks/useRunEvents";

/**
 * Live result of a command: status, progress bar, and the parsed log stream.
 * Drives the run lifecycle via useRunEvents (same engine as Run Details).
 */
export function CommandResultPanel({ runId }: { runId: string | null }) {
  const runQuery = useRun(runId ?? undefined, { refetchIntervalMs: 1500 });
  const { logs, lifecycleEvents, connectionState } = useRunEvents(runId ?? undefined);
  const run = runQuery.data;

  const liveProgress = useMemo(() => {
    for (let i = lifecycleEvents.length - 1; i >= 0; i--) {
      const p = lifecycleEvents[i]!.payload["progress"];
      if (typeof p === "number") return p;
    }
    return run?.progress ?? 0;
  }, [lifecycleEvents, run?.progress]);

  if (!runId) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState
          title="No command sent yet"
          description="Resolve a target and send a command to see live progress and parsed logs here."
          icon={Terminal}
        />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          {run && <StatusBadge status={run.status} />}
          <span className="truncate text-sm text-muted-foreground">{run?.commandName ?? "…"}</span>
        </div>
        <ConnectionPill state={connectionState} />
      </div>

      <div className="flex items-center gap-2">
        <Progress value={liveProgress} className="h-2 flex-1" />
        <span className="w-10 text-right font-mono text-sm tabular-nums">
          {Math.round(liveProgress)}%
        </span>
      </div>

      <div className="min-h-0 flex-1">
        <LogViewer logs={logs} runId={run?.runId ?? runId} />
      </div>
    </div>
  );
}
