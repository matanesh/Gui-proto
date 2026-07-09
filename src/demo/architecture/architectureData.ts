import type { ArchitectureEdge, ArchitectureNode } from "@/models";

/**
 * Static, sanitized architecture reference for the Explain Architecture
 * screen — mirrors docs/HLD.md without requiring a presenter to open a
 * document. Nothing here is derived at runtime; it's presentation content.
 */
export const RUNTIME_NODES: ArchitectureNode[] = [
  { id: "ui", label: "Operations UI", kind: "ui", description: "React SPA. UI only — no business logic.", x: 5, y: 50 },
  { id: "bff", label: "BFF", kind: "bff", description: "FastAPI. Thin translation/orchestration facade.", x: 35, y: 50 },
  { id: "broker", label: "Event Broker", kind: "broker", description: "RabbitMQ. Integration backbone between BFF and Core.", x: 65, y: 50 },
  { id: "core", label: "Core Service", kind: "core", description: "Existing Python Core. Owns business truth.", x: 95, y: 50 },
];

export const RUNTIME_EDGES: ArchitectureEdge[] = [
  { id: "ui-bff-rest", from: "ui", to: "bff", label: "REST: submit command", kind: "rest" },
  { id: "bff-broker-cmd", from: "bff", to: "broker", label: "publish command", kind: "queue" },
  { id: "broker-core-cmd", from: "broker", to: "core", label: "deliver command", kind: "queue" },
  { id: "core-broker-evt", from: "core", to: "broker", label: "publish event", kind: "queue" },
  { id: "broker-bff-evt", from: "broker", to: "bff", label: "deliver event", kind: "queue" },
  { id: "bff-ui-sse", from: "bff", to: "ui", label: "SSE: status/progress/completion", kind: "sse" },
  { id: "ui-bff-ws", from: "ui", to: "bff", label: "WebSocket (future, optional)", kind: "internal", failureLabel: "Not implemented in v1 — no bidirectional need yet" },
];

export interface DeploymentUnit {
  id: string;
  title: string;
  runtime: string;
  description: string;
  scaling: string;
}

export const DEPLOYMENT_UNITS: DeploymentUnit[] = [
  {
    id: "client",
    title: "Browser (client-side)",
    runtime: "Static React SPA bundle",
    description: "Served as static assets. Holds no business state — everything is re-derived from REST snapshots and SSE events.",
    scaling: "Scales via CDN/static hosting — effectively unlimited.",
  },
  {
    id: "bff-tier",
    title: "Application tier",
    runtime: "FastAPI process (BFF)",
    description: "Thin, stateless-by-default HTTP + SSE facade. Validates and translates REST calls into broker messages.",
    scaling: "Horizontally scalable behind a load balancer; no shared in-memory state assumed.",
  },
  {
    id: "broker-tier",
    title: "Messaging tier",
    runtime: "RabbitMQ (or equivalent event broker)",
    description: "Durable queues decouple the BFF from the Core. Handles routing, retries, and backpressure.",
    scaling: "Clustered/mirrored queues for availability; scales independently of the app tier.",
  },
  {
    id: "core-tier",
    title: "Core tier",
    runtime: "Python Core Service + Internal Worker(s)",
    description: "Owns business logic and truth. Consumes commands, executes work, emits lifecycle events.",
    scaling: "Scales by adding worker consumers; owns its own operational concerns (retries, timeouts).",
  },
];

export const FAILURE_EDGES: ArchitectureEdge[] = [
  { id: "f-rest", from: "ui", to: "bff", label: "REST: submit command", kind: "rest", failureLabel: "Command timeout / rejected — see Failure Modes" },
  { id: "f-queue-cmd", from: "bff", to: "broker", label: "publish command", kind: "queue", failureLabel: "Broker unavailable — BFF fails fast or degrades" },
  { id: "f-core", from: "broker", to: "core", label: "deliver command", kind: "queue", failureLabel: "Core unavailable — run stalls in accepted state" },
  { id: "f-sse", from: "bff", to: "ui", label: "SSE: status/progress/completion", kind: "sse", failureLabel: "Stream disconnect — UI shows reconnecting, replays via Last-Event-ID" },
];
