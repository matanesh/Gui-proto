import { useEffect } from "react";
import { RouterProvider } from "react-router-dom";
import { Providers } from "@/app/providers";
import { router } from "@/app/router";
import { BootSplash } from "@/components/intro/BootSplash";
import { APP_NAME } from "@/config/app";

export default function App() {
  // Keep the browser tab title in sync with the editable system name.
  useEffect(() => {
    document.title = APP_NAME;
  }, []);

  return (
    <Providers>
      <BootSplash />
      <RouterProvider router={router} />
    </Providers>
  );
}
