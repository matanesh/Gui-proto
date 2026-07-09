import type { ComponentName } from "./scenario";

export type ArchitectureView = "runtime" | "deployment" | "failure";

export interface ArchitectureNode {
  id: string;
  label: string;
  kind: ComponentName | "external";
  description: string;
  /** Position on a 0–100 canvas grid. */
  x: number;
  y: number;
}

export type ArchitectureEdgeKind = "rest" | "sse" | "queue" | "internal";

export interface ArchitectureEdge {
  id: string;
  from: string;
  to: string;
  label: string;
  kind: ArchitectureEdgeKind;
  /** Only drawn in the failure view — marks an edge that can break. */
  failureLabel?: string;
}
