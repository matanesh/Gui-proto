import { Fragment } from "react";
import { ArrowLeft, ArrowRight, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ArchitectureEdge, ArchitectureNode } from "@/models";

const KIND_COLOR: Record<ArchitectureEdge["kind"], string> = {
  rest: "text-status-running",
  sse: "text-status-success",
  queue: "text-status-warning",
  internal: "text-muted-foreground",
};

function edgeBetween(fromId: string, toId: string, edges: ArchitectureEdge[]): ArchitectureEdge | undefined {
  return edges.find((e) => e.from === fromId && e.to === toId);
}

function NodeCard({ node }: { node: ArchitectureNode }) {
  return (
    <div className="flex w-44 shrink-0 flex-col items-center gap-1 self-center rounded-lg border bg-card px-3 py-4 text-center">
      <p className="text-sm font-semibold">{node.label}</p>
      <p className="text-xs text-muted-foreground">{node.description}</p>
    </div>
  );
}

function EdgeLine({ edge, direction, showFailure }: { edge?: ArchitectureEdge; direction: "forward" | "backward"; showFailure: boolean }) {
  if (!edge) return <div className="min-h-[2.5rem] flex-1" />;
  const Icon = direction === "forward" ? ArrowRight : ArrowLeft;
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className={cn("flex items-center gap-1 text-xs", KIND_COLOR[edge.kind])}>
        {direction === "backward" && <Icon className="h-3.5 w-3.5 shrink-0" />}
        <span>{edge.label}</span>
        {direction === "forward" && <Icon className="h-3.5 w-3.5 shrink-0" />}
      </div>
      {showFailure && edge.failureLabel && (
        <div className="flex items-start gap-1 text-[11px] leading-snug text-status-error">
          <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" /> <span>{edge.failureLabel}</span>
        </div>
      )}
    </div>
  );
}

/**
 * Linear command/event pipeline diagram: node boxes with a forward
 * (command, top) and backward (event, bottom) edge stacked between each
 * pair. Shared by the Runtime Flow and Failure views (different edge sets).
 */
export function ArchitectureFlowDiagram({
  nodes,
  forwardEdges,
  backwardEdges,
  showFailureLabels = false,
}: {
  nodes: ArchitectureNode[];
  forwardEdges: ArchitectureEdge[];
  backwardEdges: ArchitectureEdge[];
  showFailureLabels?: boolean;
}) {
  return (
    <div className="overflow-x-auto">
      <div className="flex min-w-max items-start gap-2 py-2">
        {nodes.map((node, idx) => (
          <Fragment key={node.id}>
            <NodeCard node={node} />
            {idx < nodes.length - 1 && (
              <div className="flex w-52 shrink-0 flex-col items-center gap-1.5 pt-6">
                <EdgeLine
                  edge={edgeBetween(node.id, nodes[idx + 1].id, forwardEdges)}
                  direction="forward"
                  showFailure={showFailureLabels}
                />
                <div className="h-px w-full bg-border" />
                <EdgeLine
                  edge={edgeBetween(nodes[idx + 1].id, node.id, backwardEdges)}
                  direction="backward"
                  showFailure={showFailureLabels}
                />
              </div>
            )}
          </Fragment>
        ))}
      </div>
    </div>
  );
}
