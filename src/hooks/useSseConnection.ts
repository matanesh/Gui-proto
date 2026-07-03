import { useCallback, useEffect, useRef, useState } from "react";
import type { RunEvent, SseConnectionState } from "@/models";
import {
  connectRunEventStream,
  type RunEventStreamHandle,
} from "@/services/eventStreamClient";

/**
 * Owns the lifecycle of one (mock) SSE connection: connect on mount,
 * close on unmount/runId change, expose connection state + manual reconnect.
 * With a real backend this hook would own the EventSource instance instead.
 */
export function useSseConnection(
  runId: string | undefined,
  onEvent: (event: RunEvent) => void,
) {
  const [connectionState, setConnectionState] = useState<SseConnectionState>("connecting");
  const handleRef = useRef<RunEventStreamHandle | null>(null);
  const onEventRef = useRef(onEvent);
  onEventRef.current = onEvent;

  useEffect(() => {
    if (!runId) return;
    setConnectionState("connecting");
    const handle = connectRunEventStream(runId, {
      onEvent: (event) => onEventRef.current(event),
      onStateChange: setConnectionState,
    });
    handleRef.current = handle;

    return () => {
      // Cleanup on unmount — the EventSource.close() equivalent.
      handle.close();
      handleRef.current = null;
    };
  }, [runId]);

  const reconnect = useCallback(() => {
    handleRef.current?.reconnect();
  }, []);

  return { connectionState, reconnect };
}
