export interface AssistantAnswer {
  category: string;
  answer: string;
  sources: string[];
  suggestedQuestions: string[];
}

interface KnowledgeEntry {
  id: string;
  category: string;
  keywords: string[];
  question: string;
  answer: string;
  sources: string[];
}

export const QUICK_QUESTIONS = [
  "How do I run the system?",
  "How do I run the production build?",
  "How do I use the demo scenarios?",
  "What are REST and SSE used for?",
  "How do I connect the real backend?",
  "Where do logs and live events appear?",
  "What does the Fleet Map show?",
  "How do I explain failure modes?",
] as const;

const KNOWLEDGE_BASE: KnowledgeEntry[] = [
  {
    id: "run-local",
    category: "Runbook",
    question: QUICK_QUESTIONS[0],
    keywords: ["run", "start", "local", "dev", "system", "install", "operate", "open"],
    sources: ["README.md", "package.json", "GOAL.md"],
    answer:
      "To run the prototype locally: 1) npm install, 2) npm run dev for localhost, or npm run dev:host when you need LAN/tunnel access, 3) open the Vite URL in the browser. The app runs in mock mode by default, so no backend, RabbitMQ, credentials, or real endpoints are required for the demo.",
  },
  {
    id: "run-build",
    category: "Runbook",
    question: QUICK_QUESTIONS[1],
    keywords: ["build", "production", "preview", "dist", "static", "serve"],
    sources: ["package.json", "README.md"],
    answer:
      "For a production-like preview: run npm run build, then serve the dist/ folder. For temporary external demos, serving dist/ statically is safer than tunneling the Vite dev server because Vite may reject unknown tunnel hostnames.",
  },
  {
    id: "scenarios",
    category: "Demo storytelling",
    question: QUICK_QUESTIONS[2],
    keywords: ["scenario", "scenarios", "story", "demo", "happy", "failure", "runner", "replay"],
    sources: ["src/demo/scenarios/scenarios.ts", "src/features/scenarios/ScenarioRunnerPage.tsx"],
    answer:
      "Open Scenarios from the sidebar, choose a scenario, then press Start. The scenario emits scripted events into the Live Event Stream, advances the Timeline, and can drive Fleet Map overlays. Use Pause, Replay, speed selection, or Inject Failure while presenting.",
  },
  {
    id: "rest-sse",
    category: "Architecture",
    question: QUICK_QUESTIONS[3],
    keywords: ["rest", "sse", "websocket", "event", "command", "architecture", "flow"],
    sources: ["docs/HLD.md", "docs/API_CONTRACT.md", "docs/EVENT_SCHEMA.md", "src/features/architecture/ArchitecturePage.tsx"],
    answer:
      "REST is used for discrete command submission and query APIs: the UI sends a command and receives a fast 202 Accepted with a runId. SSE is used for one-way runtime updates: status, progress, logs, warnings, errors, and completion events stream back to the browser. WebSocket is intentionally deferred until true bidirectional realtime is required.",
  },
  {
    id: "backend",
    category: "Backend integration",
    question: QUICK_QUESTIONS[4],
    keywords: ["backend", "real", "fastapi", "rabbitmq", "core", "connect", "api", "sse", "vite_api_mode"],
    sources: ["backend/README.md", "src/config/api.ts", "src/services/realApiClient.ts", "README.md"],
    answer:
      "The frontend stays mock by default. To connect the real FastAPI BFF path, run the backend stack, then set VITE_API_MODE=real and VITE_API_BASE_URL to the BFF base URL before starting/building the frontend. In real mode, REST calls go to FastAPI and runtime updates use the real SSE endpoint, while the same UI components continue to render commands, runs, health, logs, and events.",
  },
  {
    id: "logs-events",
    category: "Observability",
    question: QUICK_QUESTIONS[5],
    keywords: ["logs", "events", "event stream", "live", "diagnostics", "run details", "ask logs"],
    sources: ["src/features/events/EventStreamPanel.tsx", "src/features/runs/RunDetailsPage.tsx", "docs/EVENT_SCHEMA.md"],
    answer:
      "Live demo events appear in the Event Stream panel and Dashboard widget. Per-run lifecycle, logs, payload, and diagnostics are in Run Details. A future AI backend can use these same sources as context so operators can ask questions like 'why did this run fail?' or 'summarize the last warnings'.",
  },
  {
    id: "fleet-map",
    category: "Fleet Map",
    question: QUICK_QUESTIONS[6],
    keywords: ["map", "fleet", "marker", "device", "target", "csv", "location"],
    sources: ["src/features/fleet/FleetMapPage.tsx", "public/data/access-points.csv", "public/data/connected-devices.csv"],
    answer:
      "The Fleet Map renders sanitized access points and connected devices from CSV data. Operators can search by IP/name/id, click markers for details/history, upload CSV overrides, and send commands to an access point or device. Scenario playback can add marker status overlays and animated routes for presentation storytelling.",
  },
  {
    id: "failure-modes",
    category: "Failure modes",
    question: QUICK_QUESTIONS[7],
    keywords: ["failure", "timeout", "retry", "duplicate", "out-of-order", "disconnect", "unavailable", "partial"],
    sources: ["src/features/failure-modes/FailureModesPage.tsx", "docs/FAILURE_MODES.md", "src/demo/failure-modes/failureModes.ts"],
    answer:
      "Use Failure Modes to explain operational maturity beyond the happy path. Each card describes what breaks, what the user sees, how recovery works, and the architectural implication. Several cards link directly into a matching Scenario Runner playback so the failure can be demonstrated live.",
  },
];

function scoreEntry(entry: KnowledgeEntry, normalizedQuestion: string): number {
  const tokens = normalizedQuestion.split(/[^a-z0-9]+/).filter((token) => token.length > 2);
  let score = 0;
  for (const keyword of entry.keywords) {
    const normalizedKeyword = keyword.toLowerCase();
    if (normalizedQuestion.includes(normalizedKeyword)) score += normalizedKeyword.length > 4 ? 4 : 2;
  }
  for (const token of tokens) {
    if (entry.question.toLowerCase().includes(token)) score += 1;
    if (entry.category.toLowerCase().includes(token)) score += 1;
  }
  return score;
}

export function getAssistantAnswer(question: string): AssistantAnswer {
  const normalizedQuestion = question.trim().toLowerCase();
  if (!normalizedQuestion) {
    return {
      category: "Guide",
      answer: "Ask me how to run the prototype, explain the architecture, use scenarios, inspect logs/events, or connect the real FastAPI/SSE backend.",
      sources: ["README.md", "docs/HLD.md"],
      suggestedQuestions: [...QUICK_QUESTIONS.slice(0, 4)],
    };
  }

  const ranked = KNOWLEDGE_BASE
    .map((entry) => ({ entry, score: scoreEntry(entry, normalizedQuestion) }))
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score < 2) {
    return {
      category: "Fallback",
      answer:
        "I can help with this prototype's runbook, architecture, scenarios, event stream, Fleet Map, failure modes, and real backend integration. I do not have a live LLM or log-ingestion backend yet, so I am answering from the built-in sanitized project guide.",
      sources: ["README.md", "docs/HLD.md", "docs/GUI_SPEC.md"],
      suggestedQuestions: [...QUICK_QUESTIONS.slice(0, 5)],
    };
  }

  return {
    category: best.entry.category,
    answer: best.entry.answer,
    sources: best.entry.sources,
    suggestedQuestions: KNOWLEDGE_BASE.filter((entry) => entry.id !== best.entry.id)
      .slice(0, 3)
      .map((entry) => entry.question),
  };
}
