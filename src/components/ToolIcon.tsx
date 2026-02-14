import { useEffect, useRef } from "react";
import { C } from "./constants";
import { shadeColor } from "./helpers";

type DrawFn = (ctx: CanvasRenderingContext2D, accent: string) => void;

/* ── Pixel helpers ─────────────────────────────────────────── */
const px = (ctx: CanvasRenderingContext2D, x: number, y: number, w = 1, h = 1) =>
  ctx.fillRect(x, y, w, h);

/* ── Sprite draw functions (16×16 grid) ────────────────────── */

/** Open scroll / parchment with text lines */
const drawRead: DrawFn = (ctx) => {
  // Parchment body
  ctx.fillStyle = C.shell1;
  px(ctx, 3, 2, 10, 12);
  // Top & bottom rolls
  ctx.fillStyle = C.shell2;
  px(ctx, 3, 2, 10, 2);
  px(ctx, 3, 12, 10, 2);
  // Roll shadows
  ctx.fillStyle = C.shellD;
  px(ctx, 3, 4, 10, 1);
  px(ctx, 3, 12, 10, 1);
  // Roll ends (circles)
  ctx.fillStyle = C.shell0;
  px(ctx, 2, 2, 1, 2);
  px(ctx, 13, 2, 1, 2);
  px(ctx, 2, 12, 1, 2);
  px(ctx, 13, 12, 1, 2);
  // Text lines
  ctx.fillStyle = C.sea1;
  px(ctx, 5, 5, 6, 1);
  px(ctx, 5, 7, 5, 1);
  px(ctx, 5, 9, 6, 1);
  px(ctx, 5, 11, 3, 1);
};

/** Quill feather with ink drop */
const drawWrite: DrawFn = (ctx) => {
  // Feather shaft
  ctx.fillStyle = C.shell1;
  px(ctx, 4, 2, 1, 10);
  // Feather vane (left)
  ctx.fillStyle = C.shell2;
  px(ctx, 2, 2, 2, 1);
  px(ctx, 1, 3, 3, 1);
  px(ctx, 1, 4, 3, 1);
  px(ctx, 2, 5, 2, 1);
  px(ctx, 2, 6, 2, 1);
  px(ctx, 3, 7, 1, 1);
  // Feather vane (right)
  ctx.fillStyle = shadeColor(C.shell1, 15);
  px(ctx, 5, 2, 2, 1);
  px(ctx, 5, 3, 3, 1);
  px(ctx, 5, 4, 3, 1);
  px(ctx, 5, 5, 2, 1);
  px(ctx, 5, 6, 2, 1);
  px(ctx, 5, 7, 1, 1);
  // Feather tip highlight
  ctx.fillStyle = C.shell2;
  px(ctx, 3, 1, 3, 1);
  // Nib
  ctx.fillStyle = C.shellD;
  px(ctx, 4, 12, 1, 2);
  px(ctx, 4, 14, 1, 1);
  // Ink drop
  ctx.fillStyle = C.cyan;
  px(ctx, 4, 15, 1, 1);
  px(ctx, 3, 14, 1, 1);
  // Ink on nib
  ctx.fillStyle = shadeColor(C.cyan, -30);
  px(ctx, 4, 13, 1, 1);
};

/** Needle & thread (mending) */
const drawEdit: DrawFn = (ctx) => {
  // Needle body
  ctx.fillStyle = C.shell2;
  px(ctx, 7, 1, 2, 10);
  // Needle tip
  ctx.fillStyle = C.shellD;
  px(ctx, 7, 11, 2, 1);
  ctx.fillStyle = shadeColor(C.shell2, -20);
  px(ctx, 7, 12, 2, 1);
  px(ctx, 8, 13, 1, 1);
  // Eye of needle
  ctx.fillStyle = C.deep1;
  px(ctx, 7, 2, 2, 1);
  // Thread coming through eye
  ctx.fillStyle = C.kelp1;
  px(ctx, 6, 1, 1, 1);
  px(ctx, 5, 2, 1, 1);
  px(ctx, 4, 3, 1, 1);
  px(ctx, 3, 4, 1, 1);
  px(ctx, 2, 5, 1, 1);
  px(ctx, 3, 6, 1, 1);
  px(ctx, 4, 7, 1, 1);
  px(ctx, 5, 8, 1, 1);
  px(ctx, 4, 9, 1, 1);
  px(ctx, 3, 10, 1, 1);
  // Thread shadow
  ctx.fillStyle = C.kelpD;
  px(ctx, 2, 6, 1, 1);
  px(ctx, 3, 7, 1, 1);
};

/** Conch shell with > prompt cursor */
const drawBash: DrawFn = (ctx) => {
  // Conch shell body
  ctx.fillStyle = C.coral2;
  px(ctx, 4, 3, 8, 10);
  // Shell spiral outer
  ctx.fillStyle = C.coral1;
  px(ctx, 3, 4, 1, 8);
  px(ctx, 4, 3, 8, 1);
  px(ctx, 12, 4, 1, 8);
  px(ctx, 4, 12, 8, 1);
  // Shell spiral inner
  ctx.fillStyle = shadeColor(C.coral2, -20);
  px(ctx, 6, 5, 4, 1);
  px(ctx, 5, 6, 1, 4);
  px(ctx, 6, 10, 4, 1);
  px(ctx, 10, 6, 1, 4);
  // Shell core
  ctx.fillStyle = C.lob0;
  px(ctx, 7, 7, 2, 2);
  // Shell highlight
  ctx.fillStyle = shadeColor(C.coral2, 25);
  px(ctx, 5, 4, 2, 2);
  // Spire tip
  ctx.fillStyle = C.coral1;
  px(ctx, 4, 2, 3, 1);
  px(ctx, 5, 1, 1, 1);
  // > prompt cursor
  ctx.fillStyle = C.green;
  px(ctx, 6, 6, 1, 1);
  px(ctx, 7, 7, 1, 1);
  px(ctx, 6, 8, 1, 1);
  // Cursor blink
  ctx.fillStyle = C.green;
  px(ctx, 9, 8, 2, 1);
};

/** Spyglass / telescope */
const drawGlob: DrawFn = (ctx) => {
  // Telescope tube
  ctx.fillStyle = C.shell0;
  px(ctx, 3, 7, 8, 3);
  // Tube highlight
  ctx.fillStyle = C.shell1;
  px(ctx, 3, 7, 8, 1);
  // Tube shadow
  ctx.fillStyle = C.shellD;
  px(ctx, 3, 9, 8, 1);
  // Brass rings
  ctx.fillStyle = C.sand1;
  px(ctx, 5, 6, 1, 5);
  px(ctx, 8, 6, 1, 5);
  // Lens end
  ctx.fillStyle = C.cyan;
  px(ctx, 11, 6, 2, 5);
  ctx.fillStyle = shadeColor(C.cyan, 20);
  px(ctx, 11, 7, 2, 1);
  // Lens rim
  ctx.fillStyle = C.sand0;
  px(ctx, 13, 6, 1, 5);
  // Eyepiece
  ctx.fillStyle = C.shellD;
  px(ctx, 2, 7, 1, 3);
  ctx.fillStyle = C.sand0;
  px(ctx, 1, 7, 1, 3);
  // Handle
  ctx.fillStyle = C.lounge1;
  px(ctx, 6, 10, 3, 2);
  px(ctx, 7, 12, 1, 2);
};

/** Magnifying glass over sand */
const drawGrep: DrawFn = (ctx) => {
  // Glass ring
  ctx.fillStyle = C.sand0;
  px(ctx, 5, 2, 6, 1);
  px(ctx, 4, 3, 1, 1);
  px(ctx, 11, 3, 1, 1);
  px(ctx, 3, 4, 1, 4);
  px(ctx, 12, 4, 1, 4);
  px(ctx, 4, 8, 1, 1);
  px(ctx, 11, 8, 1, 1);
  px(ctx, 5, 9, 6, 1);
  // Brass rim highlight
  ctx.fillStyle = C.sand1;
  px(ctx, 5, 2, 6, 1);
  px(ctx, 4, 3, 1, 1);
  // Glass fill
  ctx.fillStyle = shadeColor(C.cyan, -20);
  px(ctx, 5, 3, 6, 1);
  px(ctx, 4, 4, 8, 4);
  px(ctx, 5, 8, 6, 1);
  // Glass highlight
  ctx.fillStyle = shadeColor(C.cyan, 30);
  px(ctx, 5, 4, 2, 2);
  // Handle
  ctx.fillStyle = C.lounge1;
  px(ctx, 10, 10, 2, 1);
  px(ctx, 11, 11, 2, 1);
  px(ctx, 12, 12, 2, 1);
  px(ctx, 13, 13, 2, 1);
  // Handle shadow
  ctx.fillStyle = C.loungeD;
  px(ctx, 13, 14, 2, 1);
};

/** Message in a bottle */
const drawWebFetch: DrawFn = (ctx) => {
  // Bottle body
  ctx.fillStyle = shadeColor(C.cyan, -30);
  px(ctx, 5, 5, 6, 8);
  // Bottle highlight
  ctx.fillStyle = shadeColor(C.cyan, -10);
  px(ctx, 5, 5, 2, 8);
  // Bottle dark side
  ctx.fillStyle = shadeColor(C.cyan, -50);
  px(ctx, 10, 5, 1, 8);
  // Bottle neck
  ctx.fillStyle = shadeColor(C.cyan, -25);
  px(ctx, 6, 3, 4, 2);
  // Cork
  ctx.fillStyle = C.sand0;
  px(ctx, 7, 1, 2, 2);
  ctx.fillStyle = C.sandD;
  px(ctx, 7, 2, 2, 1);
  // Message inside (visible through glass)
  ctx.fillStyle = C.shell2;
  px(ctx, 7, 7, 3, 1);
  px(ctx, 7, 9, 2, 1);
  // Water line at bottom
  ctx.fillStyle = C.cyan;
  px(ctx, 5, 12, 6, 1);
  ctx.fillStyle = shadeColor(C.cyan, 15);
  px(ctx, 6, 13, 4, 1);
  // Bottle bottom
  ctx.fillStyle = shadeColor(C.cyan, -40);
  px(ctx, 5, 13, 6, 1);
};

/** Small crab (baby lobster) — tinted with agent color */
const drawTask: DrawFn = (ctx, accent) => {
  const c = accent;
  // Body
  ctx.fillStyle = c;
  px(ctx, 5, 6, 6, 5);
  // Body highlight
  ctx.fillStyle = shadeColor(c, 20);
  px(ctx, 6, 6, 4, 2);
  // Body shadow
  ctx.fillStyle = shadeColor(c, -15);
  px(ctx, 5, 9, 6, 2);
  // Eyes
  ctx.fillStyle = "#0a0a14";
  px(ctx, 6, 5, 1, 1);
  px(ctx, 9, 5, 1, 1);
  // Eye stalks
  ctx.fillStyle = shadeColor(c, 10);
  px(ctx, 6, 4, 1, 1);
  px(ctx, 9, 4, 1, 1);
  // Eye whites
  ctx.fillStyle = "#fff";
  px(ctx, 6, 3, 1, 1);
  px(ctx, 9, 3, 1, 1);
  // Claws
  ctx.fillStyle = shadeColor(c, 15);
  px(ctx, 3, 5, 2, 2);
  px(ctx, 2, 4, 1, 2);
  px(ctx, 11, 5, 2, 2);
  px(ctx, 13, 4, 1, 2);
  // Claw shadow
  ctx.fillStyle = shadeColor(c, -10);
  px(ctx, 2, 6, 1, 1);
  px(ctx, 13, 6, 1, 1);
  // Legs
  ctx.fillStyle = shadeColor(c, -20);
  px(ctx, 4, 10, 1, 2);
  px(ctx, 3, 11, 1, 1);
  px(ctx, 11, 10, 1, 2);
  px(ctx, 12, 11, 1, 1);
  px(ctx, 6, 11, 1, 2);
  px(ctx, 9, 11, 1, 2);
};

/** Porthole window */
const drawBrowser: DrawFn = (ctx) => {
  // Brass ring outer
  ctx.fillStyle = C.sand0;
  px(ctx, 4, 1, 8, 1);
  px(ctx, 3, 2, 1, 1);
  px(ctx, 12, 2, 1, 1);
  px(ctx, 2, 3, 1, 2);
  px(ctx, 13, 3, 1, 2);
  px(ctx, 1, 5, 1, 6);
  px(ctx, 14, 5, 1, 6);
  px(ctx, 2, 11, 1, 2);
  px(ctx, 13, 11, 1, 2);
  px(ctx, 3, 13, 1, 1);
  px(ctx, 12, 13, 1, 1);
  px(ctx, 4, 14, 8, 1);
  // Brass ring highlight
  ctx.fillStyle = C.sand1;
  px(ctx, 4, 1, 8, 1);
  px(ctx, 3, 2, 1, 1);
  px(ctx, 2, 3, 1, 2);
  // Glass fill
  ctx.fillStyle = shadeColor(C.cyan, -25);
  px(ctx, 4, 2, 8, 1);
  px(ctx, 3, 3, 10, 2);
  px(ctx, 2, 5, 12, 6);
  px(ctx, 3, 11, 10, 2);
  px(ctx, 4, 13, 8, 1);
  // Glass highlight
  ctx.fillStyle = shadeColor(C.cyan, 15);
  px(ctx, 4, 3, 3, 2);
  px(ctx, 3, 5, 2, 2);
  // Bolts
  ctx.fillStyle = C.sandD;
  px(ctx, 4, 1, 1, 1);
  px(ctx, 11, 1, 1, 1);
  px(ctx, 1, 6, 1, 1);
  px(ctx, 14, 6, 1, 1);
  px(ctx, 1, 9, 1, 1);
  px(ctx, 14, 9, 1, 1);
  px(ctx, 4, 14, 1, 1);
  px(ctx, 11, 14, 1, 1);
};

/** Barnacle/patch on wood plank */
const drawApplyPatch: DrawFn = (ctx) => {
  // Wood plank background
  ctx.fillStyle = C.lounge1;
  px(ctx, 1, 3, 14, 10);
  // Wood grain
  ctx.fillStyle = C.lounge2;
  px(ctx, 1, 4, 14, 1);
  px(ctx, 1, 8, 14, 1);
  px(ctx, 1, 11, 14, 1);
  // Wood dark grain
  ctx.fillStyle = C.loungeD;
  px(ctx, 1, 6, 14, 1);
  px(ctx, 1, 10, 14, 1);
  // Patch/barnacle
  ctx.fillStyle = C.shell1;
  px(ctx, 5, 5, 6, 6);
  // Patch highlight
  ctx.fillStyle = C.shell2;
  px(ctx, 5, 5, 6, 2);
  px(ctx, 5, 5, 2, 6);
  // Patch shadow
  ctx.fillStyle = C.shellD;
  px(ctx, 5, 10, 6, 1);
  px(ctx, 10, 5, 1, 6);
  // Nail/stitch marks
  ctx.fillStyle = C.sandD;
  px(ctx, 5, 5, 1, 1);
  px(ctx, 10, 5, 1, 1);
  px(ctx, 5, 10, 1, 1);
  px(ctx, 10, 10, 1, 1);
};

/** Starfish (fallback icon) */
const drawFallback: DrawFn = (ctx) => {
  // Center body
  ctx.fillStyle = C.coral2;
  px(ctx, 6, 6, 4, 4);
  // Top arm
  ctx.fillStyle = C.coral2;
  px(ctx, 7, 1, 2, 5);
  ctx.fillStyle = C.coral1;
  px(ctx, 7, 1, 1, 5);
  // Bottom arm
  ctx.fillStyle = C.coral2;
  px(ctx, 7, 10, 2, 5);
  ctx.fillStyle = shadeColor(C.coral2, -15);
  px(ctx, 8, 10, 1, 5);
  // Left arm
  ctx.fillStyle = C.coral2;
  px(ctx, 1, 7, 5, 2);
  ctx.fillStyle = C.coral1;
  px(ctx, 1, 7, 5, 1);
  // Right arm
  ctx.fillStyle = C.coral2;
  px(ctx, 10, 7, 5, 2);
  ctx.fillStyle = shadeColor(C.coral2, -15);
  px(ctx, 10, 8, 5, 1);
  // Top-left arm
  ctx.fillStyle = C.coral2;
  px(ctx, 3, 3, 2, 2);
  px(ctx, 2, 2, 1, 1);
  px(ctx, 4, 4, 1, 1);
  // Top-right arm
  px(ctx, 11, 3, 2, 2);
  px(ctx, 13, 2, 1, 1);
  px(ctx, 11, 4, 1, 1);
  // Body highlight
  ctx.fillStyle = shadeColor(C.coral2, 20);
  px(ctx, 7, 7, 2, 1);
  // Dots on arms
  ctx.fillStyle = shadeColor(C.coral2, 15);
  px(ctx, 7, 3, 1, 1);
  px(ctx, 3, 7, 1, 1);
  px(ctx, 12, 7, 1, 1);
  px(ctx, 7, 12, 1, 1);
};

/* ── Tool name → draw function lookup ──────────────────────── */
const DRAW_MAP: Record<string, DrawFn> = {
  read: drawRead,
  write: drawWrite,
  edit: drawEdit,
  bash: drawBash,
  exec: drawBash,
  glob: drawGlob,
  grep: drawGrep,
  web_fetch: drawWebFetch,
  webfetch: drawWebFetch,
  web_search: drawWebFetch,
  websearch: drawWebFetch,
  task: drawTask,
  browser: drawBrowser,
  apply_patch: drawApplyPatch,
};

function lookupDraw(toolName: string): DrawFn {
  return DRAW_MAP[toolName.trim().toLowerCase()] ?? drawFallback;
}

/* ── Component ─────────────────────────────────────────────── */
export default function ToolIcon({
  toolName,
  color,
  size = 22,
}: {
  toolName: string;
  color: string;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = ref.current;
    if (!cv) { return; }
    const ctx = cv.getContext("2d");
    if (!ctx) { return; }
    ctx.clearRect(0, 0, 16, 16);
    const draw = lookupDraw(toolName);
    draw(ctx, color);
  }, [toolName, color]);

  return (
    <canvas
      ref={ref}
      width={16}
      height={16}
      style={{
        width: size,
        height: size,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
}
