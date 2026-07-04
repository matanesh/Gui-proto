import { useNavigate } from "react-router-dom";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./StatusBadge";
import { formatDuration, relativeTime } from "@/lib/utils";
import type { Run } from "@/models";

export type RunsSortKey = "createdAt" | "durationSec" | "status";
export type SortDirection = "asc" | "desc";

interface RunsTableProps {
  runs: Run[];
  compact?: boolean;
  sortKey?: RunsSortKey;
  sortDir?: SortDirection;
  onSortChange?: (key: RunsSortKey) => void;
}

function SortableHead({
  label,
  columnKey,
  sortKey,
  sortDir,
  onSortChange,
}: {
  label: string;
  columnKey: RunsSortKey;
  sortKey?: RunsSortKey;
  sortDir?: SortDirection;
  onSortChange?: (key: RunsSortKey) => void;
}) {
  if (!onSortChange) return <TableHead>{label}</TableHead>;
  const active = sortKey === columnKey;
  const Icon = !active ? ArrowUpDown : sortDir === "asc" ? ArrowUp : ArrowDown;
  return (
    <TableHead>
      <button
        type="button"
        className="inline-flex items-center gap-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        onClick={() => onSortChange(columnKey)}
      >
        {label}
        <Icon className="h-3 w-3" />
      </button>
    </TableHead>
  );
}

export function RunsTable({ runs, compact = false, sortKey, sortDir, onSortChange }: RunsTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Run ID</TableHead>
          <TableHead>Command</TableHead>
          <SortableHead
            label="Status"
            columnKey="status"
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={onSortChange}
          />
          {!compact && <TableHead className="w-32">Progress</TableHead>}
          <SortableHead
            label="Created"
            columnKey="createdAt"
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={onSortChange}
          />
          <SortableHead
            label="Duration"
            columnKey="durationSec"
            sortKey={sortKey}
            sortDir={sortDir}
            onSortChange={onSortChange}
          />
          {!compact && <TableHead>Requested by</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {runs.map((run) => (
          <TableRow
            key={run.runId}
            className="cursor-pointer"
            tabIndex={0}
            onClick={() => navigate(`/runs/${run.runId}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter") navigate(`/runs/${run.runId}`);
            }}
          >
            <TableCell className="font-mono text-xs">{run.runId}</TableCell>
            <TableCell className="whitespace-nowrap">{run.commandName}</TableCell>
            <TableCell>
              <StatusBadge status={run.status} />
            </TableCell>
            {!compact && (
              <TableCell>
                <div className="flex items-center gap-2">
                  <Progress value={run.progress} className="h-1.5 w-20" />
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {run.progress}%
                  </span>
                </div>
              </TableCell>
            )}
            <TableCell className="whitespace-nowrap text-muted-foreground">
              {relativeTime(run.createdAt)}
            </TableCell>
            <TableCell className="tabular-nums text-muted-foreground">
              {formatDuration(run.durationSec)}
            </TableCell>
            {!compact && (
              <TableCell className="font-mono text-xs text-muted-foreground">
                {run.requestedBy}
              </TableCell>
            )}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
