import { Info, Rocket } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUiStore } from "@/store/uiStore";
import type { Severity } from "@/models";

// Display-only placeholders. Production values are injected by deployment/runtime
// configuration — never hardcoded and never containing real endpoints/secrets.
const MOCK_API_BASE_URL = "/api";
const MOCK_SSE_PATH = "/api/events/stream";

const SEVERITIES: Severity[] = ["debug", "info", "warning", "error", "critical"];

export function ConfigurationPage() {
  const {
    logAutoFollow,
    setLogAutoFollow,
    logSeverityFloor,
    setLogSeverityFloor,
    dashboardActivityFeedEnabled,
    setDashboardActivityFeedEnabled,
    refreshIntervalSec,
    setRefreshIntervalSec,
    maxRenderedEvents,
    setMaxRenderedEvents,
    replayIntro,
  } = useUiStore();

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Configuration"
        description="Frontend configuration and display preferences for this prototype."
      />

      <div className="mb-6 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p className="text-muted-foreground">
          This is a frontend-only prototype. The endpoint values below are placeholders shown for
          reference — in production they are injected by deployment/runtime configuration and must
          never be hardcoded, contain real network details, or include secrets.
        </p>
      </div>

      <div className="space-y-6">
        {/* Connectivity (read-only placeholders) */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connectivity</CardTitle>
            <CardDescription>Placeholder endpoints for the future FastAPI BFF.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="api-base">API Base URL</Label>
              <Input id="api-base" value={MOCK_API_BASE_URL} readOnly className="font-mono" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sse-path">SSE Endpoint Path</Label>
              <Input id="sse-path" value={MOCK_SSE_PATH} readOnly className="font-mono" />
            </div>
          </CardContent>
        </Card>

        {/* Presentation */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Presentation</CardTitle>
            <CardDescription>Demo-facing controls for presenters.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between py-2">
              <div>
                <Label>Cinematic intro</Label>
                <p className="text-xs text-muted-foreground">
                  Replay the entry sequence shown once per browser session.
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={replayIntro}>
                <Rocket /> Replay intro
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Feature flags */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Feature Flags</CardTitle>
            <CardDescription>Toggle optional UI behaviors.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1">
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="ff-activity">Dashboard activity feed</Label>
                <p className="text-xs text-muted-foreground">
                  Show the live activity stream on the dashboard.
                </p>
              </div>
              <Switch
                id="ff-activity"
                checked={dashboardActivityFeedEnabled}
                onCheckedChange={setDashboardActivityFeedEnabled}
              />
            </div>
            <Separator />
            <div className="flex items-center justify-between py-2">
              <div>
                <Label htmlFor="ff-autofollow">Log auto-follow by default</Label>
                <p className="text-xs text-muted-foreground">
                  Automatically scroll to the newest log line in Run Details.
                </p>
              </div>
              <Switch id="ff-autofollow" checked={logAutoFollow} onCheckedChange={setLogAutoFollow} />
            </div>
          </CardContent>
        </Card>

        {/* Display preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Display & Event Preferences</CardTitle>
            <CardDescription>Control refresh cadence and event rendering.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="refresh-interval">Health refresh interval</Label>
                <p className="text-xs text-muted-foreground">
                  How often the System Health snapshot refetches.
                </p>
              </div>
              <Select
                value={String(refreshIntervalSec)}
                onValueChange={(v) => setRefreshIntervalSec(Number(v))}
              >
                <SelectTrigger id="refresh-interval" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Off</SelectItem>
                  <SelectItem value="10">Every 10s</SelectItem>
                  <SelectItem value="30">Every 30s</SelectItem>
                  <SelectItem value="60">Every 60s</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="min-severity">Default log severity floor</Label>
                <p className="text-xs text-muted-foreground">
                  Minimum severity shown in the Logs view.
                </p>
              </div>
              <Select
                value={logSeverityFloor}
                onValueChange={(v) => setLogSeverityFloor(v as Severity)}
              >
                <SelectTrigger id="min-severity" className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITIES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Separator />
            <div className="flex items-center justify-between gap-4">
              <div>
                <Label htmlFor="max-events">Max rendered events</Label>
                <p className="text-xs text-muted-foreground">
                  Upper bound on events kept in memory per run (flood protection).
                </p>
              </div>
              <Input
                id="max-events"
                type="number"
                min={50}
                max={5000}
                step={50}
                value={maxRenderedEvents}
                onChange={(e) => setMaxRenderedEvents(Number(e.target.value) || 50)}
                className="w-40"
              />
            </div>
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          Preferences are stored locally in your browser (no server, no secrets). Clearing site data
          resets them to defaults.
        </p>
      </div>
    </div>
  );
}
