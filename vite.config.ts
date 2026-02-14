import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import singleFile from "./vite-plugin-single-file";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), singleFile()],
  base: "./",
});
