import {
  Activity,
  AlertTriangle,
  Boxes,
  Cpu,
  Gauge,
  Inbox,
  Radio,
  RefreshCw,
  Server,
  Zap,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/shared/MetricCard";
import { HealthIndicator, COMPONENT_LABELS } from "@/components/shared/HealthIndicator";
import { ErrorState } from "@/components/shared/ErrorState";
import { useHealth, useHealthTimeline } from "@/hooks/useHealth";
import { cn, formatTime, relativeTime } from "@/lib/utils";
import type { ComponentStatus, HealthComponentId } from "@/models";

const COMPONENT_ICON: Record<HealthComponentId, LucideIcon> = {
  frontend: Boxes,
  bff: Server,
  messageBroker: Inbox,
  pythonCore: Cpu,
  sseStream: Radio,
};

const STATUS_ACCENT: Record<ComponentStatus, string> = {
  operational: "border-status-success/30",
  degraded: "border-status-warning/40",
  unavailable: "border-status-error/40",
  unknown: "border-border",
};

export function SystemHealthPage() {
  const healthQuery = useHealth();
  const timelineQuery = useHealthTimeline();

  const snapshot = healthQuery.data;
  const metrics = snapshot?.metrics;
  const anyDegraded = snapshot?.components.some((c) => c.status !== "operational");

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Health of the architecture components and integration backbone."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => void healthQuery.refetch()}
            disabled={healthQuery.isFetching}
          >
            <RefreshCw className={cn(healthQuery.isFetching && "animate-spin")} />
            Refresh
          </Button>
        }
      />

      {healthQuery.isError ? (
        <ErrorState onRetry={() => void healthQuery.refetch()} />
      ) : (
        <>
          {snapshot && anyDegraded && (
            <div className="mb-6 flex items-center gap-2 rounded-lg border border-status-warning/40 bg-status-warning/10 p-3 text-sm text-status-warning">
              <AlertTriangle className="h-4 w-4" />
              One or more components are not fully operational. Runs may queue or degrade.
            </div>
          )}

          {/* Component cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {healthQuery.isLoading || !snapshot
              ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-36 w-full" />)
              : snapshot.components.map((component) => {
                  const Icon = COMPONENT_ICON[component.component];
                  return (
                    <Card key={component.component} className={cn(STATUS_ACCENT[component.status])}>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="rounded-md bg-muted p-2">
                              <Icon className="h-4 w-4" />
                            </div>
                            <CardTitle className="text-base">
                              {COMPONENT_LABELS[component.component]}
                            </CardTitle>
                          </div>
                          <HealthIndicator status={component.status} />
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground">{component.details}</p>
                        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            Latency:{" "}
                            <span className="font-mono text-foreground">
                              {component.latencyMs !== null ? `${component.latencyMs}ms` : "—"}
                            </span>
                          </span>
                          <span>checked {relativeTime(component.lastCheckedAt)}</span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
          </div>

          {/* Broker / stream metrics */}
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Broker & Stream Metrics
          </h2>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
            <MetricCard label="Queue Depth" value={metrics?.queueDepth ?? "—"} icon={Gauge} loading={healthQuery.isLoading} />
            <MetricCard label="Events / sec" value={metrics?.eventThroughputPerSec ?? "—"} icon={Zap} loading={healthQuery.isLoading} />
            <MetricCard label="Failed Messages" value={metrics?.failedMessages ?? "—"} icon={AlertTriangle} loading={healthQuery.isLoading} />
            <MetricCard label="DLQ Count" value={metrics?.dlqCount ?? "—"} icon={Inbox} loading={healthQuery.isLoading} />
            <MetricCard label="Event Backlog" value={metrics?.eventBacklog ?? "—"} icon={Activity} loading={healthQuery.isLoading} />
          </div>

          {/* Health check timeline */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Health Check Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              {timelineQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <Skeleton key={i} className="h-8 w-full" />
                  ))}
                </div>
              ) : timelineQuery.isError ? (
                <ErrorState onRetry={() => void timelineQuery.refetch()} />
              ) : (
                <ul className="divide-y">
                  {(timelineQuery.data ?? []).map((entry, i) => (
                    <li key={i} className="flex items-center gap-3 py-2 text-sm">
                      <span className="w-20 shrink-0 font-mono text-xs text-muted-foreground">
                        {formatTime(entry.checkedAt)}
                      </span>
                      <span className="w-32 shrink-0">{COMPONENT_LABELS[entry.component]}</span>
                      <HealthIndicator status={entry.status} className="w-32 shrink-0" />
                      <span className="truncate text-muted-foreground">{entry.note}</span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
