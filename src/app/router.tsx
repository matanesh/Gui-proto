import { lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";

// Route-level code splitting: each screen is its own chunk, so the initial
// bundle stays small and screens load on demand.
const DashboardPage = lazy(() =>
  import("@/features/dashboard/DashboardPage").then((m) => ({ default: m.DashboardPage })),
);
const CommandLauncherPage = lazy(() =>
  import("@/features/commands/CommandLauncherPage").then((m) => ({ default: m.CommandLauncherPage })),
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
      { path: "/commands", element: <CommandLauncherPage /> },
      { path: "/runs", element: <RunsHistoryPage /> },
      { path: "/runs/:runId", element: <RunDetailsPage /> },
      { path: "/health", element: <SystemHealthPage /> },
      { path: "/config", element: <ConfigurationPage /> },
      { path: "*", element: <NotFoundPage /> },
    ],
  },
]);
