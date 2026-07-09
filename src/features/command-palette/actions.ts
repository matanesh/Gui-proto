import type { NavigateFunction } from "react-router-dom";
import {
  Activity,
  AlertTriangle,
  GitBranch,
  LayoutDashboard,
  ListChecks,
  Map,
  Network,
  Pause,
  Play,
  PlayCircle,
  Radio,
  Repeat,
  RotateCcw,
  Rocket,
  Settings,
  ShieldAlert,
  TerminalSquare,
} from "lucide-react";
import type { useDemoStore } from "@/store/demoStore";
import type { useUiStore } from "@/store/uiStore";

type DemoStore = ReturnType<typeof useDemoStore.getState>;
type UiStore = ReturnType<typeof useUiStore.getState>;

export interface PaletteAction {
  id: string;
  label: string;
  group: "Navigate" | "Scenario" | "Event Stream" | "Demo";
  icon: typeof LayoutDashboard;
  keywords?: string;
  run: (ctx: { navigate: NavigateFunction; demo: DemoStore; ui: UiStore }) => void;
}

export const PALETTE_ACTIONS: PaletteAction[] = [
  { id: "nav-dashboard", label: "Open dashboard", group: "Navigate", icon: LayoutDashboard, run: ({ navigate }) => navigate("/") },
  { id: "nav-commands", label: "Open command console", group: "Navigate", icon: TerminalSquare, run: ({ navigate }) => navigate("/commands") },
  { id: "nav-runs", label: "Open runs history", group: "Navigate", icon: ListChecks, run: ({ navigate }) => navigate("/runs") },
  { id: "nav-map", label: "Open map", group: "Navigate", icon: Map, run: ({ navigate }) => navigate("/map") },
  { id: "nav-scenarios", label: "Open scenario runner", group: "Navigate", icon: PlayCircle, run: ({ navigate }) => navigate("/scenarios") },
  { id: "nav-events", label: "Open event stream", group: "Navigate", icon: Radio, run: ({ navigate }) => navigate("/events") },
  { id: "nav-timeline", label: "Open timeline", group: "Navigate", icon: GitBranch, run: ({ navigate }) => navigate("/timeline") },
  { id: "nav-architecture", label: "Open architecture view", group: "Navigate", icon: Network, run: ({ navigate }) => navigate("/architecture") },
  { id: "nav-failure-modes", label: "Open failure modes", group: "Navigate", icon: ShieldAlert, run: ({ navigate }) => navigate("/failure-modes") },
  { id: "nav-health", label: "Open system health", group: "Navigate", icon: Activity, run: ({ navigate }) => navigate("/health") },
  { id: "nav-config", label: "Open configuration", group: "Navigate", icon: Settings, run: ({ navigate }) => navigate("/config") },
  {
    id: "toggle-explain-mode",
    label: "Toggle explain mode",
    group: "Navigate",
    icon: Network,
    keywords: "architecture explain",
    run: ({ navigate }) => navigate(window.location.pathname === "/architecture" ? "/" : "/architecture"),
  },

  {
    id: "run-selected-scenario",
    label: "Run selected scenario",
    group: "Scenario",
    icon: Play,
    run: ({ navigate, demo }) => {
      const id = demo.activeScenarioId ?? demo.scenarios[0]?.id;
      if (id) demo.runScenario(id);
      navigate("/scenarios");
    },
  },
  {
    id: "inject-failure",
    label: "Inject failure",
    group: "Scenario",
    icon: AlertTriangle,
    run: ({ demo }) => demo.injectFailure(),
  },
  {
    id: "reset-demo",
    label: "Reset demo",
    group: "Demo",
    icon: RotateCcw,
    run: ({ demo }) => demo.resetDemo(),
  },
  {
    id: "replay-intro",
    label: "Replay intro",
    group: "Demo",
    icon: Rocket,
    run: ({ ui }) => ui.replayIntro(),
  },

  {
    id: "pause-event-stream",
    label: "Pause event stream",
    group: "Event Stream",
    icon: Pause,
    run: ({ demo }) => {
      if (!demo.eventStreamPaused) demo.toggleEventStream();
    },
  },
  {
    id: "resume-event-stream",
    label: "Resume event stream",
    group: "Event Stream",
    icon: Repeat,
    run: ({ demo }) => {
      if (demo.eventStreamPaused) demo.toggleEventStream();
    },
  },
];
