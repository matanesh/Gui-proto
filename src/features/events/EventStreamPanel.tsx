import { useMemo, useState } from "react";
import { Pause, Play, Radio, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { EmptyState } from "@/components/shared/EmptyState";
import { ComponentBadge } from "@/components/shared/ComponentBadge";
import { SeverityBadge, SEVERITY_VARIANT } from "@/components/shared/SeverityBadge";
import { cn, formatTime } from "@/lib/utils";
import { COMPONENT_LABEL } from "@/models";
import type { ComponentName, EventMessage, EventSeverity } from "@/models";
import { useDemoStore } from "@/store/demoStore";

const SEVERITIES: EventSeverity[] = ["debug", "info", "warning", "error", "critical"];
const COMPONENTS: ComponentName[] = ["ui", "bff", "broker", "core", "worker", "map"];

/**
 * Global Live Event Stream — reusable as a full page or a dashboard widget.
 * Fed entirely by demoStore.events (see store/demoStore.ts); events animate
 * in via the `event-row-enter` CSS class (see index.css), which only plays
 * on truly new DOM nodes because the list is keyed by stable event ids.
 */
export function EventStreamPanel({
  maxHeightClassName = "max-h-[32rem]",
  limit = 200,
  title = "Live Event Stream",
}: {
  maxHeightClassName?: string;
  limit?: number;
  title?: string;
}) {
  const events = useDemoStore((s) => s.events);
  const paused = useDemoStore((s) => s.eventStreamPaused);
  const pendingCount = useDemoStore((s) => s.pendingCount);
  const toggleEventStream = useDemoStore((s) => s.toggleEventStream);

  const [severityFilter, setSeverityFilter] = useState<Set<EventSeverity>>(new Set());
  const [componentFilter, setComponentFilter] = useState<ComponentName | "all">("all");
  const [correlationFilter, setCorrelationFilter] = useState<string | null>(null);
  const [selected, setSelected] = useState<EventMessage | null>(null);

  const filtered = useMemo(() => {
    return events
      .filter((e) => {
        if (severityFilter.size > 0 && !severityFilter.has(e.severity)) return false;
        if (componentFilter !== "all" && e.component !== componentFilter) return false;
        if (correlationFilter && e.correlationId !== correlationFilter) return false;
        return true;
      })
      .slice(0, limit);
  }, [events, severityFilter, componentFilter, correlationFilter, limit]);

  function toggleSeverity(s: EventSeverity) {
    setSeverityFilter((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Radio className={cn("h-4 w-4", paused ? "text-muted-foreground" : "text-status-running")} />
          {title}
          {paused && (
            <Badge variant="warning">
              Paused{pendingCount > 0 ? ` · ${pendingCount} buffered` : ""}
            </Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={toggleEventStream}>
          {paused ? (
            <>
              <Play className="h-3.5 w-3.5" /> Resume
            </>
          ) : (
            <>
              <Pause className="h-3.5 w-3.5" /> Pause
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {SEVERITIES.map((s) => {
            const active = severityFilter.size === 0 || severityFilter.has(s);
            return (
              <button key={s} type="button" onClick={() => toggleSeverity(s)}>
                <Badge
                  variant={active ? SEVERITY_VARIANT[s] : "neutral"}
                  className={cn("cursor-pointer select-none uppercase", !active && "opacity-40")}
                >
                  {s}
                </Badge>
              </button>
            );
          })}
          <span className="mx-1 h-4 w-px bg-border" />
          <Select value={componentFilter} onValueChange={(v) => setComponentFilter(v as ComponentName | "all")}>
            <SelectTrigger className="h-7 w-40 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All components</SelectItem>
              {COMPONENTS.map((c) => (
                <SelectItem key={c} value={c}>
                  {COMPONENT_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {correlationFilter && (
            <button type="button" onClick={() => setCorrelationFilter(null)}>
              <Badge variant="accepted" className="flex cursor-pointer items-center gap-1">
                correlation {correlationFilter.slice(0, 8)}
                <X className="h-3 w-3" />
              </Badge>
            </button>
          )}
          <span className="ml-auto text-xs text-muted-foreground">{filtered.length} shown</span>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            title="No events yet"
            description="Run a scenario from the Scenario Runner to see live events appear here."
          />
        ) : (
          <ul className={cn("space-y-1.5 overflow-y-auto pr-1", maxHeightClassName)}>
            {filtered.map((e) => (
              <li key={e.id} className="event-row-enter">
                <button
                  type="button"
                  onClick={() => setSelected(e)}
                  className={cn(
                    "w-full rounded-md border px-3 py-2 text-left text-sm transition-colors hover:border-primary/40",
                    correlationFilter === e.correlationId && "border-status-accepted/50 bg-status-accepted/5",
                  )}
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground">{formatTime(e.timestamp)}</span>
                    <SeverityBadge severity={e.severity} />
                    <ComponentBadge component={e.component} />
                    <span className="font-mono text-xs">{e.type}</span>
                  </div>
                  <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{e.payloadPreview}</p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent>
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="font-mono text-base">{selected.type}</DialogTitle>
                <DialogDescription>
                  {formatTime(selected.timestamp)} · {COMPONENT_LABEL[selected.component]}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3 text-sm">
                <SeverityBadge severity={selected.severity} />
                <div>
                  <p className="text-xs text-muted-foreground">Payload preview (sanitized)</p>
                  <p className="mt-0.5 break-all rounded-md border bg-muted/30 p-2 font-mono text-xs">
                    {selected.payloadPreview}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Correlation id</p>
                  <p className="mt-0.5 break-all font-mono text-xs">{selected.correlationId}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setCorrelationFilter(selected.correlationId);
                    setSelected(null);
                  }}
                >
                  Show related events
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
