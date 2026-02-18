import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    // The OpenClaw gateway intercepts "/assets/" in any URL path and strips
    // everything before it, breaking sub-directory deployments like /lounge/.
    // Using a different directory name avoids that special-case handling.
    assetsDir: "_",
  },
});
