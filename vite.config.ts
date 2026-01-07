import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { routesManifest } from "./src/plugins/routesManifest";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  if (!env.WORKER_DOMAIN_BASE) {
    throw new Error(
      "WORKER_DOMAIN_BASE was not provided during the build. Please set WORKER_DOMAIN_BASE in your .env or if you are using Cloudflare Builds, get the deployed worker domain and put it into WORKER_DOMAIN_BASE."
    );
  }

  return {
    base: env.WORKER_DOMAIN_BASE,
    plugins: [react(), tailwindcss(), cloudflare(), routesManifest()],
  };
});
