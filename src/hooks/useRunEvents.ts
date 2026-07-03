import { useCallback, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { RunEvent, StreamDiagnostics } from "@/models";
import { isTerminalEvent } from "@/models";
import { useUiStore } from "@/store/uiStore";
import { useSseConnection } from "./useSseConnection";

interface RunEventsState {
  events: RunEvent[];
  diagnostics: StreamDiagnostics;
}

const INITIAL_DIAGNOSTICS: StreamDiagnostics = {
  eventsReceived: 0,
  duplicatesDropped: 0,
  gapsDetected: 0,
  reconnects: 0,
  lastSequence: 0,
  lastHeartbeatAt: null,
};

/**
 * Consumes the run event stream with the client-side guarantees from
 * docs/EVENT_SCHEMA.md: dedup by eventId/sequence, ordering by sequence,
 * gap detection, heartbeat tracking, and bounded rendering.
 */
export function useRunEvents(runId: string | undefined) {
  const queryClient = useQueryClient();
  const maxRenderedEvents = useUiStore((s) => s.maxRenderedEvents);
  const [state, setState] = useState<RunEventsState>({
    events: [],
    diagnostics: INITIAL_DIAGNOSTICS,
  });
  const seenSequences = useRef(new Set<number>());

  const handleEvent = useCallback(
    (event: RunEvent) => {
      if (event.type === "heartbeat") {
        setState((prev) => ({
          ...prev,
          diagnostics: { ...prev.diagnostics, lastHeartbeatAt: event.timestamp },
        }));
        return;
      }

      // Dedup: replays after (simulated) reconnect re-deliver recent events.
      if (seenSequences.current.has(event.sequence)) {
        setState((prev) => ({
          ...prev,
          diagnostics: {
            ...prev.diagnostics,
            duplicatesDropped: prev.diagnostics.duplicatesDropped + 1,
          },
        }));
        return;
      }
      seenSequences.current.add(event.sequence);

      // Terminal events settle the run — refresh the snapshot (source of truth).
      if (isTerminalEvent(event)) {
        void queryClient.invalidateQueries({ queryKey: ["run", event.runId] });
        void queryClient.invalidateQueries({ queryKey: ["runs"] });
      }

      setState((prev) => {
        const gap =
          prev.diagnostics.lastSequence > 0 &&
          event.sequence > prev.diagnostics.lastSequence + 1;

        const events = [...prev.events, event].sort((a, b) => a.sequence - b.sequence);
        // Bounded rendering (event flood handling): keep the newest N.
        const bounded = events.length > maxRenderedEvents ? events.slice(-maxRenderedEvents) : events;

        return {
          events: bounded,
          diagnostics: {
            ...prev.diagnostics,
            eventsReceived: prev.diagnostics.eventsReceived + 1,
            gapsDetected: prev.diagnostics.gapsDetected + (gap ? 1 : 0),
            lastSequence: Math.max(prev.diagnostics.lastSequence, event.sequence),
          },
        };
      });
    },
    [queryClient, maxRenderedEvents],
  );

  const { connectionState, reconnect } = useSseConnection(runId, handleEvent);

  const trackedReconnect = useCallback(() => {
    setState((prev) => ({
      ...prev,
      diagnostics: { ...prev.diagnostics, reconnects: prev.diagnostics.reconnects + 1 },
    }));
    reconnect();
  }, [reconnect]);

  const logs = useMemo(
    () => state.events.filter((e) => e.type === "run.log"),
    [state.events],
  );

  const lifecycleEvents = useMemo(
    () => state.events.filter((e) => e.type !== "run.log"),
    [state.events],
  );

  return {
    events: state.events,
    logs,
    lifecycleEvents,
    diagnostics: state.diagnostics,
    connectionState,
    reconnect: trackedReconnect,
  };
}
