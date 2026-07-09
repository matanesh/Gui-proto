import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";
import { CinematicIntro } from "@/components/intro/CinematicIntro";
import { APP_NAME } from "@/config/app";
import { useUiStore } from "@/store/uiStore";

export default function App() {
  // Keep the browser tab title in sync with the editable system name.
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  const introReplayToken = useUiStore((s) => s.introReplayToken);

  return (
    <Providers>
      {/* key forces a remount on "Replay intro", bypassing the session-seen gate */}
      <CinematicIntro key={introReplayToken} forceShow={introReplayToken > 0} />
      <RouterProvider router={router} />
    </Providers>
  );
}
