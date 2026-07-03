import { useNavigate } from "react-router-dom";
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

interface RunsTableProps {
  runs: Run[];
  compact?: boolean;
}

export function RunsTable({ runs, compact = false }: RunsTableProps) {
  const navigate = useNavigate();

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Run ID</TableHead>
          <TableHead>Command</TableHead>
          <TableHead>Status</TableHead>
          {!compact && <TableHead className="w-32">Progress</TableHead>}
          <TableHead>Created</TableHead>
          <TableHead>Duration</TableHead>
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
