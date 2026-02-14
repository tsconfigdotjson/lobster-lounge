import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Plugin } from "vite";

// Inlines JS and CSS into index.html after build so the entire app
// is a single file — no separate asset requests for the gateway to resolve.
export default function singleFile(): Plugin {
  return {
    name: "single-file",
    enforce: "post",
    apply: "build",
    closeBundle() {
      const outDir = "dist";
      let html = readFileSync(join(outDir, "index.html"), "utf8");

      const assetsDir = join(outDir, "assets");
      let files: string[];
      try {
        files = readdirSync(assetsDir);
      } catch {
        return;
      }

      for (const file of files) {
        const content = readFileSync(join(assetsDir, file), "utf8");
        const escaped = file.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        if (file.endsWith(".css")) {
          html = html.replace(
            new RegExp(`<link[^>]+href="[^"]*${escaped}"[^>]*>`),
            () => `<style>${content}</style>`,
          );
        } else if (file.endsWith(".js")) {
          html = html.replace(
            new RegExp(`<script[^>]+src="[^"]*${escaped}"[^>]*></script>`),
            () => `<script type="module">${content}</script>`,
          );
        }
      }

      writeFileSync(join(outDir, "index.html"), html);
    },
  };
}
