import { useMemo } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Ban, Copy, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ConnectionPill } from "@/components/shared/ConnectionPill";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { RunTimeline } from "./RunTimeline";
import { LogViewer } from "./LogViewer";
import { EventFeed } from "./EventFeed";
import { useCancelRun, useRun } from "@/hooks/useRuns";
import { useRunEvents } from "@/hooks/useRunEvents";
import { fetchRunRequestPayload } from "@/services/runsApi";
import { isTerminalStatus } from "@/models";
import { formatDuration, formatTimestamp, relativeTime } from "@/lib/utils";

export function RunDetailsPage() {
  const { runId } = useParams<{ runId: string }>();
  const runQuery = useRun(runId, { refetchIntervalMs: 4000 });
  const run = runQuery.data;
  const isTerminal = run ? isTerminalStatus(run.status) : false;

  const { logs, lifecycleEvents, diagnostics, connectionState, reconnect } = useRunEvents(runId);
  const cancelMutation = useCancelRun();

  const payloadQuery = useQuery({
    queryKey: ["run-payload", runId],
    queryFn: () => fetchRunRequestPayload(runId!),
    enabled: Boolean(runId),
  });

  // Live progress: prefer the newest progress event over the (polled) snapshot.
  const liveProgress = useMemo(() => {
    for (let i = lifecycleEvents.length - 1; i >= 0; i--) {
      const p = lifecycleEvents[i]!.payload["progress"];
      if (typeof p === "number") return p;
    }
    return run?.progress ?? 0;
  }, [lifecycleEvents, run?.progress]);

  const copyRunId = () => {
    if (!runId) return;
    void navigator.clipboard.writeText(runId);
    toast.success("Run ID copied to clipboard");
  };

  const handleCancel = () => {
    if (!runId) return;
    cancelMutation.mutate(runId, {
      onSuccess: (ack) => toast.success("Cancellation requested", { description: ack.message }),
      onError: (error) =>
        toast.error("Cancel failed", {
          description: error instanceof Error ? error.message : "Unexpected error.",
        }),
    });
  };

  const handleRetry = () => {
    toast.info("Retry submitted (mock)", {
      description: "In production this would resubmit the command with a new clientRequestId.",
    });
  };

  if (runQuery.isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (runQuery.isError || !run) {
    return (
      <div>
        <PageHeader title="Run Details" />
        <ErrorState
          title="Run not found"
          message={`No run with id '${runId ?? ""}' exists in the mock store.`}
          onRetry={() => void runQuery.refetch()}
        />
      </div>
    );
  }

  const heartbeatAge = diagnostics.lastHeartbeatAt
    ? relativeTime(diagnostics.lastHeartbeatAt)
    : "none yet";

  return (
    <div>
      <PageHeader
        title={run.commandName}
        description="Live lifecycle view of a single run — commands via REST, telemetry via SSE."
        actions={
          <>
            <ConnectionPill state={connectionState} />
            {!isTerminal ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleCancel}
                disabled={cancelMutation.isPending}
              >
                <Ban />
                Cancel
              </Button>
            ) : (
              <Button variant="outline" size="sm" onClick={handleRetry}>
                <RotateCcw />
                Retry
              </Button>
            )}
          </>
        }
      />

      {/* Status header */}
      <Card className="mb-6">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-center gap-3">
            <StatusBadge status={run.status} />
            <button
              type="button"
              onClick={copyRunId}
              className="inline-flex items-center gap-1.5 rounded font-mono text-sm text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              title="Copy run ID"
            >
              {run.runId}
              <Copy className="h-3.5 w-3.5" />
            </button>
            {run.currentPhase && (
              <span className="text-sm text-muted-foreground">
                phase: <span className="font-mono">{run.currentPhase}</span>
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center gap-3">
            <Progress
              value={liveProgress}
              className="h-2 flex-1"
              indicatorClassName={
                run.status === "failed" || run.status === "timeout"
                  ? "bg-status-error"
                  : run.status === "succeeded"
                    ? "bg-status-success"
                    : undefined
              }
            />
            <span className="w-12 text-right font-mono text-sm tabular-nums">
              {Math.round(liveProgress)}%
            </span>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 text-sm sm:grid-cols-3 lg:grid-cols-6">
            <div>
              <dt className="text-xs text-muted-foreground">Created</dt>
              <dd className="font-mono text-xs">{formatTimestamp(run.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Started</dt>
              <dd className="font-mono text-xs">{formatTimestamp(run.startedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Completed</dt>
              <dd className="font-mono text-xs">{formatTimestamp(run.completedAt)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Duration</dt>
              <dd className="font-mono text-xs">{formatDuration(run.durationSec)}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Requested by</dt>
              <dd className="font-mono text-xs">{run.requestedBy}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Command</dt>
              <dd className="font-mono text-xs">{run.commandId}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="logs">Logs</TabsTrigger>
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="payload">Request Payload</TabsTrigger>
          <TabsTrigger value="diagnostics">Diagnostics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {run.summary ??
                  (isTerminal
                    ? "No summary was reported for this run."
                    : "Run in progress — summary will be available on completion.")}
              </p>
              <div>
                <h4 className="mb-2 text-sm font-medium">Latest events</h4>
                {lifecycleEvents.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No events received yet.</p>
                ) : (
                  <ul className="space-y-1">
                    {lifecycleEvents.slice(-5).map((e) => (
                      <li key={e.eventId} className="flex gap-3 text-sm">
                        <span className="font-mono text-xs text-muted-foreground">
                          seq {e.sequence}
                        </span>
                        <span className="font-mono text-xs">{e.type}</span>
                        <span className="truncate text-muted-foreground">{e.message}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="p-5">
              <RunTimeline events={lifecycleEvents} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-5">
              <LogViewer logs={logs} runId={run.runId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="events">
          <EventFeed events={lifecycleEvents} />
        </TabsContent>

        <TabsContent value="payload">
          <Card>
            <CardContent className="p-5">
              {payloadQuery.data ? (
                <pre className="overflow-x-auto rounded-md border bg-background/60 p-4 font-mono text-xs leading-relaxed">
                  {JSON.stringify(payloadQuery.data, null, 2)}
                </pre>
              ) : (
                <EmptyState
                  title="Payload not available"
                  description="The mock store retains request payloads only for runs launched in this session. Historical seeded runs have no stored payload."
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="diagnostics">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Stream Diagnostics</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={reconnect}
                disabled={connectionState === "open" || connectionState === "connecting"}
              >
                Reconnect
              </Button>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {[
                  ["Events received", diagnostics.eventsReceived],
                  ["Duplicates dropped", diagnostics.duplicatesDropped],
                  ["Gaps detected", diagnostics.gapsDetected],
                  ["Reconnects", diagnostics.reconnects],
                  ["Last sequence", diagnostics.lastSequence],
                  ["Last heartbeat", heartbeatAge],
                ].map(([label, value]) => (
                  <div key={String(label)} className="rounded-md border p-3">
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-1 font-mono text-lg tabular-nums">{value}</dd>
                  </div>
                ))}
              </dl>
              <p className="mt-4 text-xs text-muted-foreground">
                Duplicates are re-delivered events after (simulated) reconnects — deduplicated by
                eventId/sequence exactly as a real client would after sending Last-Event-ID. On
                gaps the client falls back to the run snapshot API as the source of truth.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
