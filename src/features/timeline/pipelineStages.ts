import type { Scenario, ScenarioStep } from "@/models";

/**
 * The canonical async command/event flow, independent of any one scenario.
 * Used to explain REST-for-commands / SSE-for-updates during a presentation
 * (see docs/HLD.md command & event flow diagrams) while the concrete steps
 * below tick through it live.
 */
export const PIPELINE_STAGES = [
  { id: "user-action", label: "User action" },
  { id: "rest-submit", label: "REST command submitted" },
  { id: "bff-accept", label: "BFF accepts (202)" },
  { id: "queue-publish", label: "Published to Event Broker" },
  { id: "core-processing", label: "Core Service processing" },
  { id: "progress-emit", label: "Progress event emitted" },
  { id: "sse-stream", label: "BFF streams SSE event" },
  { id: "ui-update", label: "UI updates state" },
  { id: "map-update", label: "Map updates" },
  { id: "completion", label: "Completion / failure" },
] as const;

export type PipelineStageId = (typeof PIPELINE_STAGES)[number]["id"];

/** Maps one scripted scenario step to the pipeline stage it best represents. */
export function stageIndexForStep(step: ScenarioStep, isLastStep: boolean): number {
  if (isLastStep) return PIPELINE_STAGES.length - 1;
  if (step.component === "ui") return step.type === "command.accepted" ? 0 : 7;
  if (step.component === "broker") return 3;
  if (step.component === "core") return step.type === "task.progress" ? 5 : 4;
  if (step.component === "map") return 8;
  if (step.component === "bff") return step.type === "command.accepted" ? 2 : 6;
  return 7;
}

export function currentStageIndex(scenario: Scenario, currentStepIndex: number): number {
  if (currentStepIndex <= 0) return -1;
  const idx = Math.min(currentStepIndex, scenario.steps.length) - 1;
  return stageIndexForStep(scenario.steps[idx], idx === scenario.steps.length - 1);
}
