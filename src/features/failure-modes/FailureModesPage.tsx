import { Link } from "react-router-dom";
import { ArrowRight, Eye, Radio, RotateCw, ShieldAlert } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FAILURE_MODES } from "@/demo/failure-modes/failureModes";

/** Optional link into a Scenario Runner scenario that demonstrates this failure mode live. */
const RELATED_SCENARIO: Partial<Record<string, string>> = {
  "sse-disconnected": "stream-disconnect-recovery",
  "command-timeout": "timeout-retry",
  "duplicate-event": "duplicate-event",
  "out-of-order-event": "out-of-order-event",
  "bff-unavailable": "core-unavailable",
  "core-processing-failure": "core-unavailable",
  "partial-success": "partial-failure",
};

export function FailureModesPage() {
  return (
    <div>
      <PageHeader
        title="Failure Modes"
        description="Engineering maturity beyond the happy path — what breaks, what the user sees, and how it recovers."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {FAILURE_MODES.map((mode) => {
          const scenarioId = RELATED_SCENARIO[mode.id];
          return (
            <Card key={mode.id}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <ShieldAlert className="h-4 w-4 text-status-warning" />
                  {mode.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <p className="text-muted-foreground">{mode.whatHappens}</p>
                <div className="flex gap-2">
                  <Eye className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p><span className="font-medium">User sees: </span>{mode.userVisibleBehavior}</p>
                </div>
                <div className="flex gap-2">
                  <RotateCw className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p><span className="font-medium">Recovery: </span>{mode.recoveryStrategy}</p>
                </div>
                <div className="flex gap-2">
                  <Radio className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <p><span className="font-medium">Implies: </span>{mode.architecturalImplication}</p>
                </div>
                {scenarioId && (
                  <Button variant="outline" size="sm" className="mt-1" asChild>
                    <Link to={`/scenarios?scenario=${scenarioId}`}>
                      See it run <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
