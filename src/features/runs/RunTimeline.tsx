import {
  AlertTriangle,
  CheckCircle2,
  CircleDot,
  Clock,
  Play,
  XCircle,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn, formatTime } from "@/lib/utils";
import { EmptyState } from "@/components/shared/EmptyState";
import type { RunEvent } from "@/models";

const TYPE_ICON: Partial<Record<RunEvent["type"], LucideIcon>> = {
  "run.accepted": CircleDot,
  "run.queued": Clock,
  "run.started": Play,
  "run.progress": CircleDot,
  "run.warning": AlertTriangle,
  "run.error": XCircle,
  "run.completed": CheckCircle2,
  "run.failed": XCircle,
  "run.cancelled": XCircle,
};

function toneFor(event: RunEvent): string {
  switch (event.type) {
    case "run.completed":
      return "text-status-success border-status-success/40";
    case "run.failed":
    case "run.error":
      return "text-status-error border-status-error/40";
    case "run.warning":
    case "run.cancelled":
      return "text-status-warning border-status-warning/40";
    case "run.started":
    case "run.progress":
      return "text-status-running border-status-running/40";
    default:
      return "text-muted-foreground border-border";
  }
}

/** Vertical lifecycle timeline built from non-log events, ordered by sequence. */
export function RunTimeline({ events }: { events: RunEvent[] }) {
  if (events.length === 0) {
    return (
      <EmptyState
        title="No lifecycle events yet"
        description="Events will appear here as the run progresses."
      />
    );
  }

  return (
    <ol className="relative ml-3 space-y-4 border-l pl-6">
      {events.map((event) => {
        const Icon = TYPE_ICON[event.type] ?? CircleDot;
        return (
          <li key={event.eventId} className="relative">
            <span
              className={cn(
                "absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full border bg-background",
                toneFor(event),
              )}
            >
              <Icon className="h-3 w-3" />
            </span>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <span className="font-mono text-xs text-muted-foreground">
                {formatTime(event.timestamp)}
              </span>
              <span className="font-mono text-xs text-muted-foreground/70">
                seq {event.sequence}
              </span>
              <span className="text-sm font-medium">{event.type}</span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">{event.message}</p>
          </li>
        );
      })}
    </ol>
  );
}
