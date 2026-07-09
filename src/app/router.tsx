/* eslint-disable react-refresh/only-export-components -- route module: mixes lazy route components with the router export by design */
import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

// Route-level code splitting: each screen is its own chunk, so the initial
// bundle stays small and screens load on demand.
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const CommandConsolePage = lazy(() =>
  import("@/features/commands/CommandConsolePage").then((m) => ({ default: m.CommandConsolePage })),
);
const RunsHistoryPage = lazy(() =>
  import("@/features/runs/RunsHistoryPage").then((m) => ({ default: m.RunsHistoryPage })),
);
const RunDetailsPage = lazy(() =>
  import("@/features/runs/RunDetailsPage").then((m) => ({ default: m.RunDetailsPage })),
);
const SystemHealthPage = lazy(() =>
  import("@/features/health/SystemHealthPage").then((m) => ({ default: m.SystemHealthPage })),
);
const FleetMapPage = lazy(() =>
  import("@/features/fleet/FleetMapPage").then((m) => ({ default: m.FleetMapPage })),
);
const ScenarioRunnerPage = lazy(() =>
  import("@/features/scenarios/ScenarioRunnerPage").then((m) => ({ default: m.ScenarioRunnerPage })),
);
const EventStreamPage = lazy(() =>
  import("@/features/events/EventStreamPage").then((m) => ({ default: m.EventStreamPage })),
);
const TimelinePage = lazy(() =>
  import("@/features/timeline/TimelinePage").then((m) => ({ default: m.TimelinePage })),
);
const ArchitecturePage = lazy(() =>
  import("@/features/architecture/ArchitecturePage").then((m) => ({ default: m.ArchitecturePage })),
);
const FailureModesPage = lazy(() =>
  import("@/features/failure-modes/FailureModesPage").then((m) => ({ default: m.FailureModesPage })),
);
const ConfigurationPage = lazy(() =>
  import("@/features/configuration/ConfigurationPage").then((m) => ({ default: m.ConfigurationPage })),
);
const NotFoundPage = lazy(() =>
  import("@/features/misc/NotFoundPage").then((m) => ({ default: m.NotFoundPage })),
);

export const router = createBrowserRouter([
  {
    element: <AppShell />,
    children: [
      { path: "/", element: <DashboardPage /> },
      { path: "/commands", element: <CommandConsolePage /> },
      { path: "/runs", element: <RunsHistoryPage /> },
      { path: "/runs/:runId", element: <RunDetailsPage /> },
      { path: "/map", element: <FleetMapPage /> },
      { path: "/scenarios", element: <ScenarioRunnerPage /> },
      { path: "/events", element: <EventStreamPage /> },
      { path: "/timeline", element: <TimelinePage /> },
      { path: "/architecture", element: <ArchitecturePage /> },
      { path: "/failure-modes", element: <FailureModesPage /> },
      { path: "/health", element: <SystemHealthPage /> },
      { path: "/config", element: <ConfigurationPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
