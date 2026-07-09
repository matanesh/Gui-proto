import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";
import { Starfield } from "./Starfield";
import { IntroErrorBoundary } from "./IntroErrorBoundary";

const SESSION_KEY = "occ-intro-seen";

type Phase = "visible" | "leaving" | "done";

const HUD_LINES = [
  "Establishing secure demo session",
  "Loading operational map",
  "Synchronizing simulated event stream",
  "All systems nominal",
];

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function ShipIcon() {
  return (
    <svg width="34" height="34" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2 L18 16 L12 13 L6 16 Z"
        fill="url(#occ-ship-grad)"
        stroke="oklch(0.85 0.05 240)"
        strokeWidth="0.75"
        strokeLinejoin="round"
      />
      <defs>
        <linearGradient id="occ-ship-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="oklch(0.85 0.05 240)" />
          <stop offset="100%" stopColor="oklch(0.6 0.16 240)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/**
 * One-shot cinematic entry sequence: starfield + perspective grid + a
 * command-vehicle silhouette with engine glow, a radar sweep, and staggered
 * HUD telemetry lines, zoom/fading into the dashboard underneath (which is
 * already mounted — see App.tsx). Session-remembered via sessionStorage
 * unless explicitly replayed. Fully skippable and reduced-motion aware.
 */
export function CinematicIntro({ forceShow = false }: { forceShow?: boolean }) {
  const reduced = useRef(prefersReducedMotion());
  const alreadySeen = useRef(
    typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1",
  );
  const [phase, setPhase] = useState<Phase>(
    !forceShow && alreadySeen.current ? "done" : "visible",
  );

  const holdMs = reduced.current ? 300 : 4200;
  const leaveMs = reduced.current ? 100 : 550;

  useEffect(() => {
    if (phase !== "visible") return;
    try {
      sessionStorage.setItem(SESSION_KEY, "1");
    } catch {
      // sessionStorage unavailable (privacy mode etc.) — not fatal, just replays every time.
    }
    const timer = setTimeout(() => setPhase("leaving"), holdMs);
    return () => clearTimeout(timer);
  }, [phase, holdMs]);

  useEffect(() => {
    if (phase !== "leaving") return;
    const timer = setTimeout(() => setPhase("done"), leaveMs);
    return () => clearTimeout(timer);
  }, [phase, leaveMs]);

  const skip = () => setPhase((p) => (p === "visible" ? "leaving" : p));

  useEffect(() => {
    if (phase === "done") return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") skip();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={cn(
        "intro-splash",
        phase === "leaving" && "intro-splash--leaving",
        reduced.current && "intro-splash--reduced",
      )}
      role="status"
      aria-label={`${APP_NAME} — initializing`}
    >
      <IntroErrorBoundary>
        {!reduced.current && <Starfield />}
        {!reduced.current && <div className="intro-grid" />}
        {!reduced.current && (
          <div className="intro-radar absolute right-8 top-8 hidden sm:block">
            <div className="intro-radar-sweep" />
          </div>
        )}
      </IntroErrorBoundary>

      <div className="relative flex flex-col items-center gap-5 px-4">
        <div className="intro-ship-wrap">
          <ShipIcon />
          {!reduced.current && <div className="intro-ship-glow" />}
        </div>

        <h1 className="intro-title text-center">{APP_NAME}</h1>

        <div className="w-full max-w-xs space-y-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
          {HUD_LINES.map((line, i) => (
            <p
              key={line}
              className="intro-hud-line flex items-center gap-2"
              style={{ animationDelay: `${reduced.current ? 0 : 250 + i * 780}ms` }}
            >
              <span className="text-primary">›</span> {line}
            </p>
          ))}
        </div>

        <div className="intro-progress-track">
          <span style={{ animationDuration: `${holdMs}ms` }} />
        </div>
      </div>

      <button
        type="button"
        onClick={skip}
        className="absolute bottom-6 right-6 flex items-center gap-1.5 rounded-md border border-border/60 bg-card/60 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur transition-colors hover:border-primary/40 hover:text-foreground"
      >
        Skip intro <X className="h-3 w-3" />
      </button>
    </div>
  );
}
