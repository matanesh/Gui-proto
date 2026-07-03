import type { CommandDefinition } from "@/models";
import { simulateRequest } from "./apiClient";
import { COMMAND_DEFINITIONS } from "./mockData";

/** Mirrors GET /api/commands (docs/API_CONTRACT.md). */
export async function fetchCommands(): Promise<CommandDefinition[]> {
  return simulateRequest(() => COMMAND_DEFINITIONS, { failRate: 0.03 });
}
