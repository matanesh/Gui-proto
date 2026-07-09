import { Link } from "react-router-dom";
import {
  Clock,
  Gauge,
  ListChecks,
  Play,
  Rocket,
  XCircle,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MetricCard } from "@/components/shared/MetricCard";
import { RunsTable } from "@/components/shared/RunsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { HealthIndicator, COMPONENT_LABELS } from "@/components/shared/HealthIndicator";
import { ActivityFeed } from "./ActivityFeed";
import { EventStreamPanel } from "@/features/events/EventStreamPanel";
import { useRunsList } from "@/hooks/useRuns";
import { useHealth } from "@/hooks/useHealth";
import { useUiStore } from "@/store/uiStore";
import { formatDuration } from "@/lib/utils";

export function DashboardPage() {
  const runsQuery = useRunsList({ page: 1, pageSize: 50 });
  const healthQuery = useHealth();
  const activityFeedEnabled = useUiStore((s) => s.dashboardActivityFeedEnabled);

  const runs = runsQuery.data?.items ?? [];
  const dayAgo = Date.now() - 24 * 3600 * 1000;
  const activeCount = runs.filter((r) => ["running", "queued", "accepted"].includes(r.status)).length;
  const completed24h = runs.filter(
    (r) => r.status === "succeeded" && r.completedAt && new Date(r.completedAt).getTime() > dayAgo,
  ).length;
  const failed24h = runs.filter(
    (r) => ["failed", "timeout"].includes(r.status) && r.completedAt && new Date(r.completedAt).getTime() > dayAgo,
  ).length;
  const durations = runs.map((r) => r.durationSec).filter((d): d is number => d !== null);
  const avgDuration = durations.length
    ? durations.reduce((a, b) => a + b, 0) / durations.length
    : null;

  const metrics = healthQuery.data?.metrics;
  const healthComponents =
    healthQuery.data?.components.filter((c) => c.component !== "sseStream") ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="High-level operational overview across commands, runs, and system components."
        actions={
          <Button asChild>
            <Link to="/commands">
              <Rocket />
              Launch Command
            </Link>
          </Button>
        }
      />

      {/* Hero strip */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/10 via-card to-card">
        <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-sm text-muted-foreground">Operational status</p>
            <p className="mt-1 text-lg font-semibold">
              {activeCount > 0
                ? `${activeCount} run${activeCount === 1 ? "" : "s"} in flight — telemetry streaming`
                : "All quiet — no active runs"}
            </p>
          </div>
          <div className="flex items-center gap-6">
            {healthQuery.isLoading ? (
              <Skeleton className="h-5 w-48" />
            ) : (
              healthComponents.map((c) => (
                <div key={c.component} className="text-center">
                  <p className="text-xs text-muted-foreground">{COMPONENT_LABELS[c.component]}</p>
                  <HealthIndicator status={c.status} className="mt-0.5" />
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Metric cards */}
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Active Runs" value={activeCount} icon={Play} loading={runsQuery.isLoading} />
        <MetricCard label="Completed (24h)" value={completed24h} icon={ListChecks} loading={runsQuery.isLoading} />
        <MetricCard label="Failed (24h)" value={failed24h} icon={XCircle} loading={runsQuery.isLoading} />
        <MetricCard
          label="Avg Duration"
          value={avgDuration !== null ? formatDuration(avgDuration) : "—"}
          icon={Clock}
          loading={runsQuery.isLoading}
        />
        <MetricCard
          label="Queue Depth"
          value={metrics?.queueDepth ?? "—"}
          icon={Gauge}
          hint="mock broker metric"
          loading={healthQuery.isLoading}
        />
        <MetricCard
          label="Events / sec"
          value={metrics?.eventThroughputPerSec ?? "—"}
          icon={Zap}
          hint="mock stream metric"
          loading={healthQuery.isLoading}
        />
      </div>

      {/* Recent runs + activity feed */}
      <div className={`grid gap-6 ${activityFeedEnabled ? "lg:grid-cols-3" : ""}`}>
        <Card className={activityFeedEnabled ? "lg:col-span-2" : ""}>
          <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-base">Recent Runs</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link to="/runs">View all</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {runsQuery.isLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : runsQuery.isError ? (
              <ErrorState onRetry={() => void runsQuery.refetch()} />
            ) : runs.length === 0 ? (
              <EmptyState
                title="No runs yet"
                description="Launch your first command to see it here."
                action={
                  <Button asChild size="sm">
                    <Link to="/commands">Launch Command</Link>
                  </Button>
                }
              />
            ) : (
              <RunsTable runs={runs.slice(0, 8)} compact />
            )}
          </CardContent>
        </Card>

        {activityFeedEnabled && <ActivityFeed runs={runs} />}
      </div>

      {/* Scenario-driven live event stream (see Scenario Runner / demoStore) */}
      <div className="mt-6">
        <EventStreamPanel maxHeightClassName="max-h-72" limit={40} />
      </div>
    </div>
  );
}
