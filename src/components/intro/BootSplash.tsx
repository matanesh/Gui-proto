import { useEffect, useRef, useState } from "react";
import { APP_NAME } from "@/config/app";
import { cn } from "@/lib/utils";

type Phase = "visible" | "leaving" | "done";

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * One-shot boot animation shown on entry. Deliberately lightweight:
 *  - animates only opacity/transform (GPU-friendly, no canvas, no JS loop),
 *  - unmounts itself once finished (zero ongoing cost),
 *  - respects prefers-reduced-motion (near-instant),
 *  - skippable via any key/pointer press.
 * The system name comes from APP_NAME (editable via VITE_SYSTEM_NAME).
 */
export function BootSplash() {
  const reduced = useRef(prefersReducedMotion());
  const [phase, setPhase] = useState<Phase>("visible");

  // Auto-advance: hold, then leave.
  useEffect(() => {
    const holdMs = reduced.current ? 350 : 1900;
    const timer = setTimeout(() => setPhase((p) => (p === "visible" ? "leaving" : p)), holdMs);
    return () => clearTimeout(timer);
  }, []);

  // Once leaving, finish after the fade completes.
  useEffect(() => {
    if (phase !== "leaving") return;
    const leaveMs = reduced.current ? 120 : 550;
    const timer = setTimeout(() => setPhase("done"), leaveMs);
    return () => clearTimeout(timer);
  }, [phase]);

  // Allow skipping.
  useEffect(() => {
    if (phase === "done") return;
    const skip = () => setPhase((p) => (p === "visible" ? "leaving" : p));
    window.addEventListener("keydown", skip);
    window.addEventListener("pointerdown", skip);
    return () => {
      window.removeEventListener("keydown", skip);
      window.removeEventListener("pointerdown", skip);
    };
  }, [phase]);

  if (phase === "done") return null;

  return (
    <div
      className={cn(
        "boot-splash",
        phase === "leaving" && "boot-splash--leaving",
        reduced.current && "boot-splash--reduced",
      )}
      role="status"
      aria-label={`${APP_NAME} — initializing`}
    >
      <div className="boot-splash__inner">
        <div className="boot-splash__glyph" aria-hidden>
          <span className="boot-splash__ring" />
          <span className="boot-splash__core" />
        </div>
        <h1 className="boot-splash__title">{APP_NAME}</h1>
        <p className="boot-splash__subtitle">Initializing console</p>
        <div className="boot-splash__bar" aria-hidden>
          <span />
        </div>
      </div>
    </div>
  );
}
