import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatTime } from "@/lib/utils";
import type { RunEvent, Severity } from "@/models";

const SEVERITY_VARIANT: Record<Severity, "neutral" | "running" | "warning" | "error"> = {
  debug: "neutral",
  info: "running",
  warning: "warning",
  error: "error",
  critical: "error",
};

/** Raw event feed: everything except heartbeats, ordered by sequence. */
export function EventFeed({ events }: { events: RunEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No events received yet"
        description="Run events will appear here as they arrive on the stream."
      />
    );
  }

  return (
    <div className="max-h-96 overflow-y-auto rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Seq</TableHead>
            <TableHead className="w-24">Time</TableHead>
            <TableHead className="w-36">Type</TableHead>
            <TableHead className="w-24">Severity</TableHead>
            <TableHead>Message</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.eventId}>
              <TableCell className="font-mono text-xs">{event.sequence}</TableCell>
              <TableCell className="font-mono text-xs text-muted-foreground">
                {formatTime(event.timestamp)}
              </TableCell>
              <TableCell className="font-mono text-xs">{event.type}</TableCell>
              <TableCell>
                <Badge variant={SEVERITY_VARIANT[event.severity]}>{event.severity}</Badge>
              </TableCell>
              <TableCell className="text-sm text-muted-foreground">{event.message}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
