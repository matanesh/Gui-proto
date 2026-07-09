import { Link } from "react-router-dom";
import { AlertOctagon } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ArchitectureFlowDiagram } from "./ArchitectureFlowDiagram";
import {
  DEPLOYMENT_UNITS,
  FAILURE_EDGES,
  RUNTIME_EDGES,
  RUNTIME_NODES,
} from "@/demo/architecture/architectureData";

const RUNTIME_FORWARD = RUNTIME_EDGES.filter((e) => e.kind === "rest" || e.id.endsWith("-cmd"));
const RUNTIME_BACKWARD = RUNTIME_EDGES.filter((e) => e.id.endsWith("-evt") || e.kind === "sse");
const FAILURE_FORWARD = FAILURE_EDGES.filter((e) => e.from !== "bff" || e.to !== "ui");
const FAILURE_BACKWARD = FAILURE_EDGES.filter((e) => e.from === "bff" && e.to === "ui");

export function ArchitecturePage() {
  return (
    <div>
      <PageHeader
        title="Explain Architecture"
        description="The generic architecture behind this demo, in three views — no document needed."
      />

      <Tabs defaultValue="runtime">
        <TabsList>
          <TabsTrigger value="runtime">Runtime Flow</TabsTrigger>
          <TabsTrigger value="deployment">Deployment View</TabsTrigger>
          <TabsTrigger value="failure">Failure View</TabsTrigger>
        </TabsList>

        <TabsContent value="runtime">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Command + event flow</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <ArchitectureFlowDiagram
                nodes={RUNTIME_NODES}
                forwardEdges={RUNTIME_FORWARD}
                backwardEdges={RUNTIME_BACKWARD}
              />
              <p className="text-xs text-muted-foreground">
                ↔ WebSocket remains a future option only — not implemented in v1, no bidirectional
                requirement yet.
              </p>
              <div className="grid gap-3 border-t pt-4 text-sm sm:grid-cols-2">
                <p><strong>REST</strong> carries discrete user commands — one request, one 202 Accepted response.</p>
                <p><strong>SSE</strong> is one-way: status, progress, log, and completion updates stream to the UI.</p>
                <p><strong>BFF</strong> is a thin adapter/facade — it validates and translates, it doesn't own business logic.</p>
                <p><strong>Core</strong> owns business truth — it decides what actually happens.</p>
                <p className="sm:col-span-2"><strong>Event Broker (RabbitMQ)</strong> is the integration backbone — it decouples the BFF from the Core so either can be slow, restart, or scale independently.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deployment">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Deployment units</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {DEPLOYMENT_UNITS.map((unit) => (
                  <div key={unit.id} className="rounded-lg border p-4">
                    <p className="font-medium">{unit.title}</p>
                    <Badge variant="outline" className="mt-1.5">{unit.runtime}</Badge>
                    <p className="mt-2 text-sm text-muted-foreground">{unit.description}</p>
                    <p className="mt-2 text-xs text-muted-foreground/80">{unit.scaling}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failure">
          <Card>
            <CardHeader className="flex-row items-center justify-between space-y-0">
              <CardTitle className="text-base">Where this can break</CardTitle>
              <Button variant="outline" size="sm" asChild>
                <Link to="/failure-modes">
                  <AlertOctagon /> Full Failure Modes view
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <ArchitectureFlowDiagram
                nodes={RUNTIME_NODES}
                forwardEdges={FAILURE_FORWARD}
                backwardEdges={FAILURE_BACKWARD}
                showFailureLabels
              />
              <p className="text-xs text-muted-foreground">
                Each red annotation is a scripted scenario in the Scenario Runner — run it to see the
                exact recovery behavior, not just the label.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
