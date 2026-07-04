import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { RunsFilterBar } from "./RunsFilterBar";
import { RunsTable, type RunsSortKey, type SortDirection } from "@/components/shared/RunsTable";
import { EmptyState } from "@/components/shared/EmptyState";
import { ErrorState } from "@/components/shared/ErrorState";
import { useRunsList } from "@/hooks/useRuns";
import { useCommands } from "@/hooks/useCommands";
import { useUiStore } from "@/store/uiStore";
import type { RunsFilter } from "@/models";

const PAGE_SIZE = 10;

export function RunsHistoryPage() {
  const filters = useUiStore((s) => s.runsFilters);
  const setRunsFilters = useUiStore((s) => s.setRunsFilters);
  const resetRunsFilters = useUiStore((s) => s.resetRunsFilters);

  const [page, setPage] = useState(1);
  const [sortKey, setSortKey] = useState<RunsSortKey>("createdAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const commandsQuery = useCommands();

  const apiFilter: RunsFilter = useMemo(
    () => ({
      status: filters.status.length ? filters.status : undefined,
      commandType: filters.commandType || undefined,
      fromDate: filters.fromDate || undefined,
      toDate: filters.toDate || undefined,
      search: filters.search || undefined,
      page,
      pageSize: PAGE_SIZE,
      sort: `${sortKey}:${sortDir}`,
    }),
    [filters, page, sortKey, sortDir],
  );

  const runsQuery = useRunsList(apiFilter);
  const data = runsQuery.data;

  const handleFilterChange = (patch: Parameters<typeof setRunsFilters>[0]) => {
    setRunsFilters(patch);
    setPage(1);
  };

  const handleSortChange = (key: RunsSortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
    setPage(1);
  };

  return (
    <div>
      <PageHeader
        title="Runs"
        description="Search, filter, and inspect historical runs across all commands."
      />

      <RunsFilterBar
        filters={filters}
        commands={commandsQuery.data ?? []}
        onChange={handleFilterChange}
        onReset={() => {
          resetRunsFilters();
          setPage(1);
        }}
      />

      <Card>
        <CardContent className="p-0">
          {runsQuery.isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: PAGE_SIZE }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          ) : runsQuery.isError ? (
            <div className="p-4">
              <ErrorState onRetry={() => void runsQuery.refetch()} />
            </div>
          ) : !data || data.items.length === 0 ? (
            <div className="p-4">
              <EmptyState
                title="No runs match your filters"
                description="Try clearing filters or widening the date range."
              />
            </div>
          ) : (
            <RunsTable
              runs={data.items}
              sortKey={sortKey}
              sortDir={sortDir}
              onSortChange={handleSortChange}
            />
          )}
        </CardContent>
      </Card>

      {data && data.totalItems > 0 && (
        <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {(data.page - 1) * data.pageSize + 1}–
            {Math.min(data.page * data.pageSize, data.totalItems)} of {data.totalItems} runs
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={data.page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft />
              Previous
            </Button>
            <span className="tabular-nums">
              Page {data.page} / {data.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={data.page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
              <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
