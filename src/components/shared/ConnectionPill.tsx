import { Loader2, Radio, RefreshCw, WifiOff } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { SseConnectionState } from "@/models";

const STATE_CONFIG: Record<
  SseConnectionState,
  { variant: "success" | "warning" | "error" | "neutral"; label: string }
> = {
  connecting: { variant: "neutral", label: "Connecting" },
  open: { variant: "success", label: "Live" },
  reconnecting: { variant: "warning", label: "Reconnecting" },
  disconnected: { variant: "error", label: "Disconnected" },
};

export function ConnectionPill({ state }: { state: SseConnectionState }) {
  const { variant, label } = STATE_CONFIG[state];
  const Icon =
    state === "open" ? Radio
    : state === "connecting" ? Loader2
    : state === "reconnecting" ? RefreshCw
    : WifiOff;

  return (
    <Badge variant={variant} className="gap-1.5" aria-live="polite">
      <Icon
        className={
          state === "connecting" || state === "reconnecting"
            ? "h-3 w-3 animate-spin"
            : "h-3 w-3"
        }
      />
      SSE: {label}
    </Badge>
  );
}
