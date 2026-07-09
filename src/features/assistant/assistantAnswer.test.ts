import { getAssistantAnswer, QUICK_QUESTIONS } from "./assistantAnswer";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertMatch(actual: string, pattern: RegExp, message: string) {
  if (!pattern.test(actual)) {
    throw new Error(`${message}: ${actual}`);
  }
}

assert(QUICK_QUESTIONS.length >= 6, "assistant exposes useful quick-start prompts");

const runAnswer = getAssistantAnswer("How do I run the system?");
assertEqual(runAnswer.category, "Runbook", "run question category");
assertMatch(runAnswer.answer, /npm install/i, "run answer includes install command");
assertMatch(runAnswer.answer, /npm run dev/i, "run answer includes dev command");
assert(runAnswer.sources.some((source) => source.includes("README")), "run answer cites README");

const backendAnswer = getAssistantAnswer("How do I connect the real backend and SSE?");
assertEqual(backendAnswer.category, "Backend integration", "backend question category");
assertMatch(backendAnswer.answer, /VITE_API_MODE=real/i, "backend answer includes real mode flag");
assertMatch(backendAnswer.answer, /FastAPI/i, "backend answer includes FastAPI");
assertMatch(backendAnswer.answer, /SSE/i, "backend answer includes SSE");

const unknownAnswer = getAssistantAnswer("Can it make coffee for the operator?");
assertEqual(unknownAnswer.category, "Fallback", "unknown question uses fallback");
assertMatch(unknownAnswer.answer, /I can help with/i, "fallback explains scope");
assert(unknownAnswer.suggestedQuestions.length > 0, "fallback suggests next questions");

console.log("assistantAnswer tests passed");
