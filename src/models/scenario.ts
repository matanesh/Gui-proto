import type { Severity } from "./event";

/** Generic architecture components a scenario step can attribute an event to. */
export type ComponentName = "ui" | "bff" | "broker" | "core" | "worker" | "map";

export const COMPONENT_LABEL: Record<ComponentName, string> = {
  ui: "Operations UI",
  bff: "BFF",
  broker: "Event Broker",
  core: "Core Service",
  worker: "Internal Worker",
  map: "Map",
};

export type ScenarioStatus = "idle" | "running" | "paused" | "completed" | "failed";

export type ScenarioSpeed = 1 | 2 | 4;

/** Event types shown on the Live Event Stream panel. See docs/EVENT_SCHEMA.md. */
export type EventMessageType =
  | "command.accepted"
  | "command.rejected"
  | "task.started"
  | "task.progress"
  | "task.log"
  | "task.warning"
  | "task.retry_scheduled"
  | "task.failed"
  | "task.completed"
  | "stream.disconnected"
  | "stream.reconnected"
  | "map.asset.updated"
  | "map.region.degraded"
  | "map.route.completed";

export type EventSeverity = Severity;

/** A single entry rendered in the Live Event Stream panel. */
export interface EventMessage {
  id: string;
  timestamp: string;
  severity: EventSeverity;
  component: ComponentName;
  type: EventMessageType;
  correlationId: string;
  /** Short sanitized payload preview — never real business data. */
  payloadPreview: string;
  scenarioId?: string;
}

export type AssetStatus = "normal" | "warning" | "degraded" | "failed" | "completed";
export type RegionHealth = "normal" | "warning" | "degraded" | "failed";

export type MapEffectKind =
  | "asset.status"
  | "region.health"
  | "route.progress"
  | "route.completed"
  | "alert.pulse";

/**
 * Map effects reference logical roles ("primary", "secondary", "region-a"...)
 * rather than concrete access-point ids, so any scenario can drive any
 * Fleet Map dataset — the map resolves roles to real markers at runtime.
 */
export interface MapEffect {
  kind: MapEffectKind;
  role: string;
  status?: AssetStatus | RegionHealth;
  progress?: number;
}

export interface ScenarioStep {
  id: string;
  /** Offset from scenario start, in ms, at 1x speed. */
  atMs: number;
  component: ComponentName;
  type: EventMessageType;
  severity: EventSeverity;
  message: string;
  payloadPreview: string;
  mapEffects?: MapEffect[];
  /** Presenter can inject a failure once playback reaches this step. */
  failureInjectable?: boolean;
}

export interface Scenario {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  components: ComponentName[];
  mapEffectsSummary: string;
  expectedOutcome: string;
  outcome: "success" | "failure";
  talkingPoints: string[];
  steps: ScenarioStep[];
}
