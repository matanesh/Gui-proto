import { useEffect, useRef } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn, formatTime } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";
import type { RunEvent, Severity } from "@/models";

const SEVERITY_RANK: Record<Severity, number> = {
  debug: 0,
  info: 1,
  warning: 2,
  error: 3,
  critical: 4,
};

const SEVERITY_TONE: Record<Severity, string> = {
  debug: "text-muted-foreground/70",
  info: "text-foreground/85",
  warning: "text-status-warning",
  error: "text-status-error",
  critical: "text-status-error font-semibold",
};

interface LogViewerProps {
  logs: RunEvent[];
  runId: string;
}

/**
 * Bounded log viewer. Rendering is already capped upstream (maxRenderedEvents,
 * see useRunEvents); for production-scale floods swap the scroll body for a
 * virtualized list per docs/FAILURE_MODES.md "Event flood".
 */
export function LogViewer({ logs, runId }: LogViewerProps) {
  const autoFollow = useUiStore((s) => s.logAutoFollow);
  const setAutoFollow = useUiStore((s) => s.setLogAutoFollow);
  const severityFloor = useUiStore((s) => s.logSeverityFloor);
  const setSeverityFloor = useUiStore((s) => s.setLogSeverityFloor);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const visible = logs.filter(
    (log) => SEVERITY_RANK[log.severity] >= SEVERITY_RANK[severityFloor],
  );

  useEffect(() => {
    if (autoFollow && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [visible.length, autoFollow]);

  const exportLogs = () => {
    const text = visible
      .map((l) => `${l.timestamp} [${l.severity.toUpperCase()}] seq=${l.sequence} ${l.message}`)
      .join("\n");
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${runId}-logs.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch id="auto-follow" checked={autoFollow} onCheckedChange={setAutoFollow} />
            <Label htmlFor="auto-follow" className="text-xs">
              Auto-follow
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="severity-floor" className="text-xs text-muted-foreground">
              Min severity
            </Label>
            <Select value={severityFloor} onValueChange={(v) => setSeverityFloor(v as Severity)}>
              <SelectTrigger id="severity-floor" className="h-7 w-28 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(SEVERITY_RANK) as Severity[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={exportLogs} disabled={visible.length === 0}>
          <Download />
          Export logs
        </Button>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title="No log lines"
          description={
            logs.length > 0
              ? "All lines are below the current severity floor."
              : "Log output will stream here while the run executes."
          }
        />
      ) : (
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto rounded-md border bg-background/60 p-3 font-mono text-xs leading-relaxed"
          role="log"
          aria-live="off"
        >
          {visible.map((log) => (
            <div key={log.eventId} className="flex gap-3">
              <span className="shrink-0 text-muted-foreground/60">{formatTime(log.timestamp)}</span>
              <span className={cn("shrink-0 w-14 uppercase", SEVERITY_TONE[log.severity])}>
                {log.severity}
              </span>
              <span className={SEVERITY_TONE[log.severity]}>{log.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
