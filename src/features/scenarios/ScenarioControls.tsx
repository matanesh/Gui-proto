import { AlertTriangle, Pause, Play, Repeat, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDemoStore } from "@/store/demoStore";
import type { Scenario, ScenarioSpeed } from "@/models";

const SPEED_LABEL: Record<ScenarioSpeed, string> = { 1: "1x", 2: "2x", 4: "Instant" };
const SPEEDS: ScenarioSpeed[] = [1, 2, 4];

/** Play/pause/reset/replay/speed/inject-failure controls for one scenario. */
export function ScenarioControls({ scenario }: { scenario: Scenario }) {
  const status = useDemoStore((s) => s.status);
  const activeScenarioId = useDemoStore((s) => s.activeScenarioId);
  const speed = useDemoStore((s) => s.speed);
  const runScenario = useDemoStore((s) => s.runScenario);
  const pause = useDemoStore((s) => s.pause);
  const resume = useDemoStore((s) => s.resume);
  const reset = useDemoStore((s) => s.reset);
  const replay = useDemoStore((s) => s.replay);
  const setSpeed = useDemoStore((s) => s.setSpeed);
  const injectFailure = useDemoStore((s) => s.injectFailure);

  const isActive = activeScenarioId === scenario.id;
  const effectiveStatus = isActive ? status : "idle";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {effectiveStatus === "running" ? (
        <Button size="sm" variant="secondary" onClick={pause}>
          <Pause /> Pause
        </Button>
      ) : effectiveStatus === "paused" ? (
        <Button size="sm" onClick={resume}>
          <Play /> Resume
        </Button>
      ) : (
        <Button size="sm" onClick={() => runScenario(scenario.id)}>
          <Play /> {effectiveStatus === "idle" ? "Start" : "Run again"}
        </Button>
      )}
      <Button size="sm" variant="outline" disabled={!isActive} onClick={reset}>
        <RotateCcw /> Reset
      </Button>
      <Button size="sm" variant="outline" disabled={!isActive} onClick={replay}>
        <Repeat /> Replay
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-status-error hover:text-status-error"
        disabled={effectiveStatus !== "running"}
        onClick={injectFailure}
      >
        <AlertTriangle /> Inject Failure
      </Button>
      <Select value={String(speed)} onValueChange={(v) => setSpeed(Number(v) as ScenarioSpeed)}>
        <SelectTrigger className="w-28">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {SPEEDS.map((s) => (
            <SelectItem key={s} value={String(s)}>
              {SPEED_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
