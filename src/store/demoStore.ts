import { create } from "zustand";
import type {
  AssetStatus,
  EventMessage,
  RegionHealth,
  Scenario,
  ScenarioSpeed,
  ScenarioStatus,
} from "@/models";
import { SCENARIOS, getScenario } from "@/demo/scenarios";

/**
 * Demo/simulation engine store — see docs at the top of demo/scenarios.
 *
 * This is the one piece of "runtime" the frontend owns: a scripted timeline
 * player that fans scenario steps out to (a) the Live Event Stream log and
 * (b) a role-keyed map overlay that the Fleet Map resolves to real markers.
 * It stands in for what a real EventStreamClient (SSE) would deliver — see
 * CommandClient/EventStreamClient interfaces in services/ for the
 * production-shaped abstraction this is replacing for demo purposes.
 */

const MAX_EVENTS = 400;

export interface MapOverlayState {
  assets: Record<string, AssetStatus>;
  regions: Record<string, RegionHealth>;
  routes: Record<string, { progress: number; status: AssetStatus }>;
}

const EMPTY_OVERLAY: MapOverlayState = { assets: {}, regions: {}, routes: {} };

interface DemoState {
  scenarios: Scenario[];
  activeScenarioId: string | null;
  status: ScenarioStatus;
  speed: ScenarioSpeed;
  stepIndex: number;
  runCorrelationId: string | null;
  mapOverlay: MapOverlayState;
  events: EventMessage[];
  eventStreamPaused: boolean;
  pendingCount: number;

  runScenario: (id: string) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  replay: () => void;
  setSpeed: (speed: ScenarioSpeed) => void;
  injectFailure: () => void;
  toggleEventStream: () => void;
  resetDemo: () => void;
}

let timers: number[] = [];
let segmentStartPerf = 0;
let segmentBaseElapsedMs = 0;
let pendingBuffer: EventMessage[] = [];

function clearTimers() {
  timers.forEach((t) => window.clearTimeout(t));
  timers = [];
}

function newEventId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `evt-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export const useDemoStore = create<DemoState>()((set, get) => {
  function appendEvent(event: EventMessage) {
    if (get().eventStreamPaused) {
      pendingBuffer.push(event);
      set({ pendingCount: pendingBuffer.length });
      return;
    }
    set((s) => ({ events: [event, ...s.events].slice(0, MAX_EVENTS) }));
  }

  function applyMapEffects(step: Scenario["steps"][number]) {
    if (!step.mapEffects?.length) return;
    set((s) => {
      const overlay: MapOverlayState = {
        assets: { ...s.mapOverlay.assets },
        regions: { ...s.mapOverlay.regions },
        routes: { ...s.mapOverlay.routes },
      };
      for (const effect of step.mapEffects ?? []) {
        if (effect.kind === "asset.status" && effect.status) {
          overlay.assets[effect.role] = effect.status as AssetStatus;
        } else if (effect.kind === "region.health" && effect.status) {
          overlay.regions[effect.role] = effect.status as RegionHealth;
        } else if (effect.kind === "route.progress" || effect.kind === "route.completed") {
          overlay.routes[effect.role] = {
            progress: effect.progress ?? 0,
            status: (effect.status as AssetStatus) ?? "normal",
          };
        }
      }
      return { mapOverlay: overlay };
    });
  }

  function fireStep(scenario: Scenario, idx: number) {
    const step = scenario.steps[idx];
    const correlationId = get().runCorrelationId ?? scenario.id;
    appendEvent({
      id: newEventId(),
      timestamp: new Date().toISOString(),
      severity: step.severity,
      component: step.component,
      type: step.type,
      correlationId,
      payloadPreview: step.payloadPreview,
      scenarioId: scenario.id,
    });
    applyMapEffects(step);
    const isLast = idx === scenario.steps.length - 1;
    set({ stepIndex: idx + 1 });
    if (isLast) {
      set({ status: scenario.outcome === "success" ? "completed" : "failed" });
    }
  }

  function scheduleFrom(scenario: Scenario, fromStepIndex: number, baseElapsedMs: number, speed: ScenarioSpeed) {
    clearTimers();
    segmentStartPerf = performance.now();
    segmentBaseElapsedMs = baseElapsedMs;
    for (let idx = fromStepIndex; idx < scenario.steps.length; idx++) {
      const step = scenario.steps[idx];
      const delay = Math.max(0, (step.atMs - baseElapsedMs) / speed);
      const t = window.setTimeout(() => fireStep(scenario, idx), delay);
      timers.push(t);
    }
  }

  return {
    scenarios: SCENARIOS,
    activeScenarioId: null,
    status: "idle",
    speed: 1,
    stepIndex: 0,
    runCorrelationId: null,
    mapOverlay: EMPTY_OVERLAY,
    events: [],
    eventStreamPaused: false,
    pendingCount: 0,

    runScenario: (id) => {
      const scenario = getScenario(id);
      if (!scenario) return;
      clearTimers();
      set({
        activeScenarioId: id,
        status: "running",
        stepIndex: 0,
        runCorrelationId: newEventId(),
        mapOverlay: EMPTY_OVERLAY,
      });
      scheduleFrom(scenario, 0, 0, get().speed);
    },

    pause: () => {
      if (get().status !== "running") return;
      const elapsed = segmentBaseElapsedMs + (performance.now() - segmentStartPerf) * get().speed;
      clearTimers();
      segmentBaseElapsedMs = elapsed;
      set({ status: "paused" });
    },

    resume: () => {
      const { status, activeScenarioId, stepIndex } = get();
      if (status !== "paused" || !activeScenarioId) return;
      const scenario = getScenario(activeScenarioId);
      if (!scenario) return;
      set({ status: "running" });
      scheduleFrom(scenario, stepIndex, segmentBaseElapsedMs, get().speed);
    },

    reset: () => {
      clearTimers();
      segmentBaseElapsedMs = 0;
      set({ status: "idle", stepIndex: 0, mapOverlay: EMPTY_OVERLAY });
    },

    replay: () => {
      const { activeScenarioId } = get();
      if (!activeScenarioId) return;
      get().reset();
      get().runScenario(activeScenarioId);
    },

    setSpeed: (speed) => {
      const { status, activeScenarioId, stepIndex } = get();
      if (status === "running" && activeScenarioId) {
        const elapsed = segmentBaseElapsedMs + (performance.now() - segmentStartPerf) * get().speed;
        set({ speed });
        const scenario = getScenario(activeScenarioId);
        if (scenario) scheduleFrom(scenario, stepIndex, elapsed, speed);
      } else {
        set({ speed });
      }
    },

    injectFailure: () => {
      const { status, activeScenarioId } = get();
      if (status !== "running" || !activeScenarioId) return;
      const scenario = getScenario(activeScenarioId);
      if (!scenario) return;
      clearTimers();
      const correlationId = get().runCorrelationId ?? scenario.id;
      appendEvent({
        id: newEventId(),
        timestamp: new Date().toISOString(),
        severity: "critical",
        component: "core",
        type: "task.failed",
        correlationId,
        payloadPreview: "{ injected: true, code: \"E_PRESENTER_INJECTED\" }",
        scenarioId: scenario.id,
      });
      set((s) => {
        const overlay: MapOverlayState = {
          assets: { ...s.mapOverlay.assets },
          regions: { ...s.mapOverlay.regions },
          routes: { ...s.mapOverlay.routes },
        };
        for (const role of Object.keys(overlay.assets)) overlay.assets[role] = "failed";
        for (const role of Object.keys(overlay.regions)) overlay.regions[role] = "failed";
        return { mapOverlay: overlay, status: "failed", stepIndex: scenario.steps.length };
      });
    },

    toggleEventStream: () => {
      const paused = get().eventStreamPaused;
      if (!paused) {
        appendEvent({
          id: newEventId(),
          timestamp: new Date().toISOString(),
          severity: "warning",
          component: "bff",
          type: "stream.disconnected",
          correlationId: get().runCorrelationId ?? "stream",
          payloadPreview: "{ reason: \"presenter_paused\" }",
        });
        set({ eventStreamPaused: true });
      } else {
        set({ eventStreamPaused: false });
        const flushed = pendingBuffer;
        pendingBuffer = [];
        set((s) => ({
          events: [
            {
              id: newEventId(),
              timestamp: new Date().toISOString(),
              severity: "info" as const,
              component: "bff" as const,
              type: "stream.reconnected" as const,
              correlationId: get().runCorrelationId ?? "stream",
              payloadPreview: `{ replayed: ${flushed.length} }`,
            },
            ...flushed,
            ...s.events,
          ].slice(0, MAX_EVENTS),
          pendingCount: 0,
        }));
      }
    },

    resetDemo: () => {
      clearTimers();
      pendingBuffer = [];
      segmentBaseElapsedMs = 0;
      set({
        activeScenarioId: null,
        status: "idle",
        stepIndex: 0,
        runCorrelationId: null,
        mapOverlay: EMPTY_OVERLAY,
        events: [],
        eventStreamPaused: false,
        pendingCount: 0,
      });
    },
  };
});
