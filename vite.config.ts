import path from "node:path";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// HOST/PORT let you bind the dev/preview server without editing this file:
//   localhost (default):   npm run dev
//   all interfaces / LAN:  npm run dev:host      (or HOST=0.0.0.0 npm run dev)
//   custom port:           PORT=8080 npm run dev
const host = process.env.HOST ?? "localhost";
const port = process.env.PORT ? Number(process.env.PORT) : undefined;

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host,
    ...(port ? { port } : {}),
  },
  preview: {
    host,
    ...(port ? { port } : {}),
  },
});
