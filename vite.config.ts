import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { routesManifest } from "./src/plugins/routesManifest";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  // BASE_URL is optional for local development
  // In production, set BASE_URL in your .env or Cloudflare build settings
  const baseUrl = env.BASE_URL || "/";

  return {
    base: baseUrl,
    plugins: [react(), tailwindcss(), cloudflare(), routesManifest()],
  };
});
