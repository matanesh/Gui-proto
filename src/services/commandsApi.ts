import type { CommandDefinition } from "@/models";
import { IS_REAL } from "@/config/api";
import { simulateRequest } from "./apiClient";
import { COMMAND_DEFINITIONS } from "./mockData";
import { realFetchCommands } from "./real/realApi";

/** Mirrors GET /api/commands (docs/API_CONTRACT.md). */
export async function fetchCommands(): Promise<CommandDefinition[]> {
  if (IS_REAL) return realFetchCommands();
  return simulateRequest(() => COMMAND_DEFINITIONS, { failRate: 0.03 });
}
