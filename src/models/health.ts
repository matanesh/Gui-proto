export type ComponentStatus =
  | "operational"
  | "degraded"
  | "unavailable"
  | "unknown";

export type HealthComponentId =
  | "frontend"
  | "bff"
  | "messageBroker"
  | "pythonCore"
  | "sseStream";

export interface SystemHealth {
  component: HealthComponentId;
  status: ComponentStatus;
  latencyMs: number | null;
  lastCheckedAt: string;
  details: string;
}

export interface HealthMetrics {
  queueDepth: number;
  eventThroughputPerSec: number;
  failedMessages: number;
  dlqCount: number;
  eventBacklog: number;
}

export interface HealthSnapshot {
  checkedAt: string;
  components: SystemHealth[];
  metrics: HealthMetrics;
}

export interface HealthCheckEntry {
  checkedAt: string;
  component: HealthComponentId;
  status: ComponentStatus;
  note: string;
}
