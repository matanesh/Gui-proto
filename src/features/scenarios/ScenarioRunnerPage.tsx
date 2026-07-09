import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ListTree } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ComponentBadge } from "@/components/shared/ComponentBadge";
import { useDemoStore } from "@/store/demoStore";
import { ScenarioCard } from "./ScenarioCard";
import { ScenarioControls } from "./ScenarioControls";
import { ScenarioStepList } from "./ScenarioStepList";

export function ScenarioRunnerPage() {
  const scenarios = useDemoStore((s) => s.scenarios);
  const activeScenarioId = useDemoStore((s) => s.activeScenarioId);
  const stepIndex = useDemoStore((s) => s.stepIndex);
  const status = useDemoStore((s) => s.status);

  const [selectedId, setSelectedId] = useState(scenarios[0]?.id ?? "");
  const selected = useMemo(
    () => scenarios.find((s) => s.id === selectedId) ?? scenarios[0],
    [scenarios, selectedId],
  );

  if (!selected) return null;

  const isActive = activeScenarioId === selected.id;
  const currentStepIndex = isActive ? stepIndex : 0;
  const progressPct = Math.round((currentStepIndex / selected.steps.length) * 100);

  return (
    <div>
      <PageHeader
        title="Scenario Runner"
        description="Scripted, sanitized demo storytelling — run a scenario end to end and watch the event stream, timeline, and map react live."
        actions={
          <Button variant="outline" asChild>
            <Link to="/timeline">
              <ListTree /> Open Timeline
            </Link>
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {scenarios.map((scenario) => (
            <ScenarioCard
              key={scenario.id}
              scenario={scenario}
              selected={scenario.id === selected.id}
              onSelect={() => setSelectedId(scenario.id)}
            />
          ))}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>{selected.title}</CardTitle>
                  <p className="mt-1 text-sm text-muted-foreground">{selected.description}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <ScenarioControls scenario={selected} />

              {isActive && status !== "idle" && (
                <div>
                  <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                    <span>
                      Step {Math.min(currentStepIndex, selected.steps.length)} / {selected.steps.length}
                    </span>
                    <span>{progressPct}%</span>
                  </div>
                  <Progress value={progressPct} />
                </div>
              )}

              <dl className="grid grid-cols-2 gap-4 rounded-md border bg-muted/30 p-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Duration</dt>
                  <dd className="font-medium">{selected.durationSec}s (at 1x)</dd>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <dt className="text-xs text-muted-foreground">Components</dt>
                  <dd className="mt-1 flex flex-wrap gap-1">
                    {selected.components.map((c) => (
                      <ComponentBadge key={c} component={c} />
                    ))}
                  </dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-xs text-muted-foreground">Expected outcome</dt>
                  <dd className="font-medium">{selected.expectedOutcome}</dd>
                </div>
              </dl>

              <div>
                <p className="mb-1 text-xs font-medium text-muted-foreground">Map effects</p>
                <p className="text-sm text-muted-foreground">{selected.mapEffectsSummary}</p>
              </div>

              <div>
                <p className="mb-1.5 text-xs font-medium text-muted-foreground">Presenter talking points</p>
                <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
                  {selected.talkingPoints.map((tp) => (
                    <li key={tp}>{tp}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Event sequence</CardTitle>
            </CardHeader>
            <CardContent>
              <ScenarioStepList scenario={selected} currentStepIndex={currentStepIndex} />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
