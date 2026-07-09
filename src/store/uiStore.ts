import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { RunStatus, Severity } from "@/models";

/**
 * UI/client state ONLY (see ADR-010). Server-state (commands, runs, health)
 * lives in TanStack Query — never here.
 */

export interface RunsHistoryFilters {
  status: RunStatus[];
  commandType: string;
  fromDate: string;
  toDate: string;
  search: string;
}

export const EMPTY_RUNS_FILTERS: RunsHistoryFilters = {
  status: [],
  commandType: "",
  fromDate: "",
  toDate: "",
  search: "",
};

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  runsFilters: RunsHistoryFilters;
  setRunsFilters: (filters: Partial<RunsHistoryFilters>) => void;
  resetRunsFilters: () => void;

  logAutoFollow: boolean;
  setLogAutoFollow: (value: boolean) => void;

  logSeverityFloor: Severity;
  setLogSeverityFloor: (value: Severity) => void;

  dashboardActivityFeedEnabled: boolean;
  setDashboardActivityFeedEnabled: (value: boolean) => void;

  refreshIntervalSec: number;
  setRefreshIntervalSec: (value: number) => void;

  maxRenderedEvents: number;
  setMaxRenderedEvents: (value: number) => void;

  /** Bumped by "Replay intro" to force-remount the cinematic intro, bypassing the session-seen gate. */
  introReplayToken: number;
  replayIntro: () => void;

  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      runsFilters: EMPTY_RUNS_FILTERS,
      setRunsFilters: (filters) =>
        set((s) => ({ runsFilters: { ...s.runsFilters, ...filters } })),
      resetRunsFilters: () => set({ runsFilters: EMPTY_RUNS_FILTERS }),

      logAutoFollow: true,
      setLogAutoFollow: (value) => set({ logAutoFollow: value }),

      logSeverityFloor: "debug",
      setLogSeverityFloor: (value) => set({ logSeverityFloor: value }),

      dashboardActivityFeedEnabled: true,
      setDashboardActivityFeedEnabled: (value) =>
        set({ dashboardActivityFeedEnabled: value }),

      refreshIntervalSec: 30,
      setRefreshIntervalSec: (value) => set({ refreshIntervalSec: value }),

      maxRenderedEvents: 500,
      setMaxRenderedEvents: (value) => set({ maxRenderedEvents: value }),

      introReplayToken: 0,
      replayIntro: () => set((s) => ({ introReplayToken: s.introReplayToken + 1 })),

      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: "occ-ui-preferences",
      // Filters are session-scoped by intent; persist only durable preferences.
      partialize: (s) => ({
        sidebarCollapsed: s.sidebarCollapsed,
        logAutoFollow: s.logAutoFollow,
        logSeverityFloor: s.logSeverityFloor,
        dashboardActivityFeedEnabled: s.dashboardActivityFeedEnabled,
        refreshIntervalSec: s.refreshIntervalSec,
        maxRenderedEvents: s.maxRenderedEvents,
      }),
    },
  ),
);
