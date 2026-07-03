import { createBrowserRouter } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { DashboardPage } from "@/features/dashboard/DashboardPage";
import { CommandLauncherPage } from "@/features/commands/CommandLauncherPage";
import { RunsHistoryPage } from "@/features/runs/RunsHistoryPage";
import { RunDetailsPage } from "@/features/runs/RunDetailsPage";
import { SystemHealthPage } from "@/features/health/SystemHealthPage";
import { ConfigurationPage } from "@/features/configuration/ConfigurationPage";

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
    ],
  },
]);
