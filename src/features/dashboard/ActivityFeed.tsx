import { useEffect, useState } from "react";
import { Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatTime } from "@/lib/utils";
import type { Run } from "@/models";

interface ActivityItem {
  id: number;
  at: string;
  runId: string;
  text: string;
  tone: "info" | "success" | "warning";
}

const FEED_TEMPLATES: Array<{ text: (run: Run) => string; tone: ActivityItem["tone"] }> = [
  { text: (r) => `run.progress on ${r.runId} — ${Math.min(99, r.progress + Math.floor(Math.random() * 10))}%`, tone: "info" },
  { text: (r) => `run.log emitted by ${r.commandName}`, tone: "info" },
  { text: (r) => `heartbeat acknowledged for ${r.runId}`, tone: "info" },
  { text: (r) => `${r.commandName} checkpoint persisted`, tone: "success" },
  { text: () => `queue depth updated — broker nominal`, tone: "info" },
  { text: (r) => `run.warning on ${r.runId} — transient retry`, tone: "warning" },
];

/**
 * Mock live activity feed: synthesizes event-shaped lines from recent runs on
 * an interval. With the real backend this becomes a multiplexed SSE consumer.
 */
export function ActivityFeed({ runs }: { runs: Run[] }) {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    if (runs.length === 0) return;
    let counter = 0;
    const tick = () => {
      const run = runs[Math.floor(Math.random() * Math.min(runs.length, 10))]!;
      const template = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)]!;
      counter += 1;
      setItems((prev) =>
        [
          {
            id: counter,
            at: new Date().toISOString(),
            runId: run.runId,
            text: template.text(run),
            tone: template.tone,
          },
          ...prev,
        ].slice(0, 12),
      );
    };
    tick();
    const interval = setInterval(tick, 3500);
    return () => clearInterval(interval);
  }, [runs]);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">Live Activity</CardTitle>
        <Badge variant="success" className="gap-1">
          <Activity className="h-3 w-3" />
          streaming
        </Badge>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto">
        <ul className="space-y-2.5">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 font-mono text-muted-foreground">{formatTime(item.at)}</span>
              <span
                className={
                  item.tone === "success"
                    ? "text-status-success"
                    : item.tone === "warning"
                      ? "text-status-warning"
                      : "text-foreground/80"
                }
              >
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
