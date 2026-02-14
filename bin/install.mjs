#!/usr/bin/env node

import { execSync, spawnSync } from "node:child_process";
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { dirname, join, resolve } from "node:path";

const LODGE_DIR = "lodge";
const CONTROL_UI_SUBDIR = join("dist", "control-ui", LODGE_DIR);

// ── CLI args ─────────────────────────────────────────────────────

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h") {
  console.log(`
  lobster-lodge install [--openclaw-root <path>]

  Locates your OpenClaw installation and copies the Lodge UI
  into its control-ui static directory.

  Options:
    --openclaw-root <path>   Specify OpenClaw root manually
    --help                   Show this message
`);
  process.exit(0);
}

if (command !== "install") {
  console.error(`Unknown command: ${command}`);
  console.error(`Run "lobster-lodge --help" for usage.`);
  process.exit(1);
}

// ── Locate OpenClaw ──────────────────────────────────────────────

let openclawRoot = null;

const rootIdx = args.indexOf("--openclaw-root");
if (rootIdx !== -1 && args[rootIdx + 1]) {
  openclawRoot = resolve(args[rootIdx + 1]);
  if (!existsSync(openclawRoot)) {
    console.error(`Specified OpenClaw root does not exist: ${openclawRoot}`);
    process.exit(1);
  }
} else {
  openclawRoot = findOpenClawRoot();
}

if (!openclawRoot) {
  console.error(
    "Could not locate your OpenClaw installation.\n" +
    "Make sure 'openclaw' is installed and on your PATH, or use:\n\n" +
    "  npx lobster-lodge install --openclaw-root /path/to/openclaw\n"
  );
  process.exit(1);
}

console.log(`Found OpenClaw at: ${openclawRoot}`);

// ── Build Lodge ──────────────────────────────────────────────────

const lodgeRoot = findLodgeRoot();
const distDir = join(lodgeRoot, "dist");

if (!existsSync(distDir) || readdirSync(distDir).length === 0) {
  console.log("Building Lobster Lodge...");
  const buildResult = spawnSync("npm", ["run", "build"], {
    cwd: lodgeRoot,
    stdio: "inherit",
    shell: true,
  });
  if (buildResult.status !== 0) {
    console.error("Build failed.");
    process.exit(1);
  }
}

if (!existsSync(distDir)) {
  console.error("Build output not found at: " + distDir);
  process.exit(1);
}

// ── Copy to OpenClaw ─────────────────────────────────────────────

const targetDir = join(openclawRoot, CONTROL_UI_SUBDIR);

console.log(`Installing to: ${targetDir}`);

// Clean previous install
if (existsSync(targetDir)) {
  rmSync(targetDir, { recursive: true });
}
mkdirSync(targetDir, { recursive: true });

// Copy built assets
cpSync(distDir, targetDir, { recursive: true });

console.log(`
  Done! Lobster Lodge has been installed.

  Open your gateway in a browser and go to:

    /lodge/

  (The trailing slash is important.)

  After upgrading OpenClaw, run this command again to reinstall.
`);

// ── Helpers ──────────────────────────────────────────────────────

function findOpenClawRoot() {
  // Strategy 1: resolve the 'openclaw' binary and walk up to the package root
  try {
    const bin = execSync("which openclaw", { encoding: "utf8" }).trim();
    if (bin) {
      // Follow symlinks (npm .bin symlinks -> actual package)
      const realBin = execSync(`readlink -f "${bin}" 2>/dev/null || realpath "${bin}" 2>/dev/null || echo "${bin}"`, {
        encoding: "utf8",
      }).trim();
      // Walk up from the binary looking for package.json with name "openclaw"
      let dir = dirname(realBin);
      for (let i = 0; i < 8; i++) {
        const pkgPath = join(dir, "package.json");
        if (existsSync(pkgPath)) {
          try {
            const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
            if (pkg.name === "openclaw" || pkg.name === "@openclaw/openclaw") {
              return dir;
            }
          } catch {
            // not valid JSON, keep walking
          }
        }
        const parent = dirname(dir);
        if (parent === dir) break;
        dir = parent;
      }
    }
  } catch {
    // openclaw not on PATH
  }

  // Strategy 2: check common global node_modules locations
  const globalDirs = [
    join(process.env.HOME || "", ".npm-global", "lib", "node_modules", "openclaw"),
    join(process.env.HOME || "", ".nvm", "versions", "node"),
    "/usr/local/lib/node_modules/openclaw",
    "/usr/lib/node_modules/openclaw",
  ];

  for (const dir of globalDirs) {
    if (existsSync(join(dir, "package.json"))) {
      return dir;
    }
  }

  // Strategy 3: check if we're in a monorepo or workspace with openclaw
  let dir = process.cwd();
  for (let i = 0; i < 10; i++) {
    const candidate = join(dir, "node_modules", "openclaw");
    if (existsSync(join(candidate, "package.json"))) {
      return candidate;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }

  return null;
}

function findLodgeRoot() {
  // The script lives at <lodge-root>/bin/install.mjs
  const scriptDir = dirname(new URL(import.meta.url).pathname);
  return resolve(scriptDir, "..");
}
