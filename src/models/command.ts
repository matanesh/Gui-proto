import type { RunStatus } from "./run";

export type RiskLevel = "low" | "medium" | "high";

export type CommandFieldType = "text" | "number" | "select" | "boolean";

export interface CommandField {
  key: string;
  label: string;
  type: CommandFieldType;
  required: boolean;
  defaultValue: string | number | boolean | null;
  options?: string[];
  description?: string;
}

export interface CommandDefinition {
  id: string;
  name: string;
  description: string;
  category: string;
  configurableFields: CommandField[];
  riskLevel: RiskLevel;
  estimatedDurationSec: number;
  enabled: boolean;
}

export type CommandParameters = Record<string, string | number | boolean>;

export interface CommandRequest {
  commandId: string;
  parameters: CommandParameters;
  requestedBy: string;
  /** Client-generated UUID; makes submission idempotent (see docs/API_CONTRACT.md). */
  clientRequestId: string;
  /** Optional servicing access point this command targets (Fleet Map). */
  targetPcId?: string;
  /** Optional specific connected device targeted (phone/laptop under an AP). */
  targetDeviceId?: string;
  /** Optional human label for the target. */
  targetLabel?: string;
}

export interface CommandAck {
  runId: string;
  accepted: boolean;
  status: RunStatus;
  message: string;
  acceptedAt: string;
}
