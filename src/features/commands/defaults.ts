import type { CommandDefinition, CommandParameters } from "@/models";

/** Build a parameter set from a command's field defaults (for quick-send flows). */
export function buildDefaultParameters(command: CommandDefinition): CommandParameters {
  const params: CommandParameters = {};
  for (const field of command.configurableFields) {
    if (field.defaultValue !== null) {
      params[field.key] = field.type === "number" ? Number(field.defaultValue) : field.defaultValue;
    } else if (field.type === "boolean") {
      params[field.key] = false;
    } else if (field.type === "select" && field.options?.length) {
      params[field.key] = field.options[0]!;
    } else {
      params[field.key] = "";
    }
  }
  return params;
}
