import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { PlayCircle } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScenarioControls } from "@/features/scenarios/ScenarioControls";
import { useDemoStore } from "@/store/demoStore";
import { PipelineStepper } from "./PipelineStepper";
import { TimelineStepList } from "./TimelineStepList";
import { currentStageIndex } from "./pipelineStages";

export function TimelinePage() {
  const scenarios = useDemoStore((s) => s.scenarios);
  const activeScenarioId = useDemoStore((s) => s.activeScenarioId);
  const stepIndex = useDemoStore((s) => s.stepIndex);
  const status = useDemoStore((s) => s.status);
  const runCorrelationId = useDemoStore((s) => s.runCorrelationId);

  const [selectedId, setSelectedId] = useState(scenarios[0]?.id ?? "");
  const scenario = useMemo(
    () => scenarios.find((s) => s.id === selectedId) ?? scenarios[0],
    [scenarios, selectedId],
  );

  if (!scenario) return null;

  const isActive = activeScenarioId === scenario.id;
  const currentStepIdx = isActive ? stepIndex : 0;
  const effectiveStatus = isActive ? status : "idle";
  const stageIdx = isActive ? currentStageIndex(scenario, stepIndex) : -1;

  return (
    <div>
      <PageHeader
        title="Timeline / Replay"
        description="The full async command/event flow, explained — REST submit, BFF accept, broker publish, Core processing, SSE updates, and map/UI reconciliation, all in one place."
        actions={
          <Button variant="outline" asChild>
            <Link to="/scenarios">
              <PlayCircle /> Scenario Runner
            </Link>
          </Button>
        }
      />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Async flow reference</CardTitle>
        </CardHeader>
        <CardContent>
          <PipelineStepper currentIndex={stageIdx} status={effectiveStatus} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Scenario</CardTitle>
            <Select value={scenario.id} onValueChange={setSelectedId}>
              <SelectTrigger className="h-8 w-64 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {scenarios.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <ScenarioControls scenario={scenario} />
        </CardHeader>
        <CardContent>
          <TimelineStepList
            scenario={scenario}
            currentStepIndex={currentStepIdx}
            correlationId={isActive ? runCorrelationId : null}
          />
        </CardContent>
      </Card>
    </div>
  );
}
