import { useEffect, useRef } from "react";

type DrawFn = (ctx: CanvasRenderingContext2D) => void;

/* ── Pixel helper ──────────────────────────────────────────── */
const px = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w = 1,
  h = 1,
) => ctx.fillRect(x, y, w, h);

/* ── Flag draw functions (16×10 region, y offset = 3) ──────── */

/** USA — red/white stripes + blue canton */
const drawUS: DrawFn = (ctx) => {
  // White base
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 3, 16, 10);
  // Red stripes (5 of them in 10px height — each 2px)
  ctx.fillStyle = "#b22234";
  px(ctx, 0, 3, 16, 2);
  px(ctx, 0, 7, 16, 2);
  px(ctx, 0, 11, 16, 2);
  // Blue canton
  ctx.fillStyle = "#3c3b6e";
  px(ctx, 0, 3, 7, 6);
  // Stars (simplified dots)
  ctx.fillStyle = "#ffffff";
  px(ctx, 1, 4, 1, 1);
  px(ctx, 3, 4, 1, 1);
  px(ctx, 5, 4, 1, 1);
  px(ctx, 2, 5, 1, 1);
  px(ctx, 4, 5, 1, 1);
  px(ctx, 1, 6, 1, 1);
  px(ctx, 3, 6, 1, 1);
  px(ctx, 5, 6, 1, 1);
  px(ctx, 2, 7, 1, 1);
  px(ctx, 4, 7, 1, 1);
};

/** China — red field + yellow star */
const drawCN: DrawFn = (ctx) => {
  ctx.fillStyle = "#de2910";
  px(ctx, 0, 3, 16, 10);
  // Large star
  ctx.fillStyle = "#ffde00";
  px(ctx, 2, 5, 2, 2);
  px(ctx, 3, 4, 1, 1);
  px(ctx, 1, 6, 1, 1);
  // Small stars
  px(ctx, 5, 4, 1, 1);
  px(ctx, 6, 5, 1, 1);
  px(ctx, 6, 7, 1, 1);
  px(ctx, 5, 8, 1, 1);
};

/** India — saffron/white/green + navy circle */
const drawIN: DrawFn = (ctx) => {
  // Saffron
  ctx.fillStyle = "#ff9933";
  px(ctx, 0, 3, 16, 3);
  // White
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 6, 16, 4);
  // Green
  ctx.fillStyle = "#138808";
  px(ctx, 0, 10, 16, 3);
  // Ashoka Chakra (navy circle center)
  ctx.fillStyle = "#000080";
  px(ctx, 7, 7, 2, 2);
  px(ctx, 6, 7, 1, 1);
  px(ctx, 9, 8, 1, 1);
};

/** Indonesia — red top, white bottom */
const drawID: DrawFn = (ctx) => {
  ctx.fillStyle = "#ff0000";
  px(ctx, 0, 3, 16, 5);
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 8, 16, 5);
};

/** Brazil — green field + yellow diamond + blue circle */
const drawBR: DrawFn = (ctx) => {
  ctx.fillStyle = "#009c3b";
  px(ctx, 0, 3, 16, 10);
  // Yellow diamond
  ctx.fillStyle = "#ffdf00";
  px(ctx, 7, 4, 2, 1);
  px(ctx, 5, 5, 6, 1);
  px(ctx, 3, 6, 10, 1);
  px(ctx, 2, 7, 12, 2);
  px(ctx, 3, 9, 10, 1);
  px(ctx, 5, 10, 6, 1);
  px(ctx, 7, 11, 2, 1);
  // Blue circle
  ctx.fillStyle = "#002776";
  px(ctx, 6, 7, 4, 2);
  px(ctx, 7, 6, 2, 1);
  px(ctx, 7, 9, 2, 1);
};

/** Russia — white/blue/red horizontal thirds */
const drawRU: DrawFn = (ctx) => {
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 3, 16, 3);
  ctx.fillStyle = "#0039a6";
  px(ctx, 0, 6, 16, 4);
  ctx.fillStyle = "#d52b1e";
  px(ctx, 0, 10, 16, 3);
};

/** Mexico — green/white/red vertical thirds */
const drawMX: DrawFn = (ctx) => {
  ctx.fillStyle = "#006847";
  px(ctx, 0, 3, 5, 10);
  ctx.fillStyle = "#ffffff";
  px(ctx, 5, 3, 6, 10);
  ctx.fillStyle = "#ce1126";
  px(ctx, 11, 3, 5, 10);
  // Eagle emblem (simplified)
  ctx.fillStyle = "#6b3e26";
  px(ctx, 7, 7, 2, 2);
  px(ctx, 7, 6, 1, 1);
};

/** Japan — white field + red circle */
const drawJP: DrawFn = (ctx) => {
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 3, 16, 10);
  ctx.fillStyle = "#bc002d";
  px(ctx, 6, 6, 4, 4);
  px(ctx, 7, 5, 2, 1);
  px(ctx, 7, 10, 2, 1);
  px(ctx, 5, 7, 1, 2);
  px(ctx, 10, 7, 1, 2);
};

/** Egypt — red/white/black + gold eagle */
const drawEG: DrawFn = (ctx) => {
  ctx.fillStyle = "#ce1126";
  px(ctx, 0, 3, 16, 3);
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 6, 16, 4);
  ctx.fillStyle = "#000000";
  px(ctx, 0, 10, 16, 3);
  // Eagle of Saladin (simplified)
  ctx.fillStyle = "#c09300";
  px(ctx, 7, 7, 2, 2);
  px(ctx, 6, 7, 1, 1);
  px(ctx, 9, 7, 1, 1);
};

/** Vietnam — red field + yellow star */
const drawVN: DrawFn = (ctx) => {
  ctx.fillStyle = "#da251d";
  px(ctx, 0, 3, 16, 10);
  // Star
  ctx.fillStyle = "#ffff00";
  px(ctx, 7, 5, 2, 1);
  px(ctx, 6, 6, 4, 1);
  px(ctx, 5, 7, 6, 2);
  px(ctx, 6, 9, 1, 1);
  px(ctx, 9, 9, 1, 1);
  px(ctx, 7, 10, 2, 1);
};

/** Germany — black/red/gold horizontal thirds */
const drawDE: DrawFn = (ctx) => {
  ctx.fillStyle = "#000000";
  px(ctx, 0, 3, 16, 3);
  ctx.fillStyle = "#dd0000";
  px(ctx, 0, 6, 16, 4);
  ctx.fillStyle = "#ffcc00";
  px(ctx, 0, 10, 16, 3);
};

/** Bangladesh — green field + red circle (offset left) */
const drawBD: DrawFn = (ctx) => {
  ctx.fillStyle = "#006a4e";
  px(ctx, 0, 3, 16, 10);
  // Red circle (slightly left of center)
  ctx.fillStyle = "#f42a41";
  px(ctx, 5, 6, 4, 4);
  px(ctx, 6, 5, 2, 1);
  px(ctx, 6, 10, 2, 1);
  px(ctx, 4, 7, 1, 2);
  px(ctx, 9, 7, 1, 2);
};

/** Pakistan — green field + white stripe left + crescent/star */
const drawPK: DrawFn = (ctx) => {
  // White stripe on left
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 3, 4, 10);
  // Green field
  ctx.fillStyle = "#01411c";
  px(ctx, 4, 3, 12, 10);
  // Crescent
  ctx.fillStyle = "#ffffff";
  px(ctx, 8, 5, 3, 1);
  px(ctx, 7, 6, 1, 1);
  px(ctx, 11, 6, 1, 1);
  px(ctx, 7, 7, 1, 2);
  px(ctx, 11, 7, 1, 2);
  px(ctx, 7, 9, 1, 1);
  px(ctx, 11, 9, 1, 1);
  px(ctx, 8, 10, 3, 1);
  // Star
  px(ctx, 12, 6, 1, 1);
  px(ctx, 12, 8, 1, 1);
  px(ctx, 13, 7, 1, 1);
};

/** South Korea — white field + red/blue taeguk */
const drawKR: DrawFn = (ctx) => {
  ctx.fillStyle = "#ffffff";
  px(ctx, 0, 3, 16, 10);
  // Red (top half of taeguk)
  ctx.fillStyle = "#cd2e3a";
  px(ctx, 6, 5, 4, 3);
  px(ctx, 5, 6, 1, 2);
  px(ctx, 10, 6, 1, 1);
  // Blue (bottom half of taeguk)
  ctx.fillStyle = "#0047a0";
  px(ctx, 6, 8, 4, 3);
  px(ctx, 5, 8, 1, 1);
  px(ctx, 10, 8, 1, 2);
  // Trigrams (simplified black bars)
  ctx.fillStyle = "#000000";
  px(ctx, 1, 4, 3, 1);
  px(ctx, 1, 6, 3, 1);
  px(ctx, 12, 4, 3, 1);
  px(ctx, 12, 6, 3, 1);
  px(ctx, 1, 9, 3, 1);
  px(ctx, 1, 11, 3, 1);
  px(ctx, 12, 9, 3, 1);
  px(ctx, 12, 11, 3, 1);
};

/** France — blue/white/red vertical thirds */
const drawFR: DrawFn = (ctx) => {
  ctx.fillStyle = "#002395";
  px(ctx, 0, 3, 5, 10);
  ctx.fillStyle = "#ffffff";
  px(ctx, 5, 3, 6, 10);
  ctx.fillStyle = "#ed2939";
  px(ctx, 11, 3, 5, 10);
};

/* ── Country code → draw function lookup ──────────────────── */
const DRAW_MAP: Record<string, DrawFn> = {
  US: drawUS,
  CN: drawCN,
  IN: drawIN,
  ID: drawID,
  BR: drawBR,
  RU: drawRU,
  MX: drawMX,
  JP: drawJP,
  EG: drawEG,
  VN: drawVN,
  DE: drawDE,
  BD: drawBD,
  PK: drawPK,
  KR: drawKR,
  FR: drawFR,
};

/* ── Component ─────────────────────────────────────────────── */
export default function FlagIcon({
  countryCode,
  size = 16,
}: {
  countryCode: string;
  size?: number;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const draw = DRAW_MAP[countryCode];

  useEffect(() => {
    const cv = ref.current;
    if (!cv || !draw) {
      return;
    }
    const ctx = cv.getContext("2d");
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, 16, 16);
    draw(ctx);
  }, [draw]);

  if (!draw) {
    return null;
  }

  return (
    <canvas
      ref={ref}
      width={16}
      height={16}
      style={{
        width: size * 1.5,
        height: size,
        imageRendering: "pixelated",
        flexShrink: 0,
      }}
    />
  );
}
