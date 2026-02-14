import { FONT } from "./constants";

export function shadeColor(hex, amt) {
  if (hex.startsWith("rgb")) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16) + amt;
  const g = parseInt(hex.slice(3, 5), 16) + amt;
  const b = parseInt(hex.slice(5, 7), 16) + amt;
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
}

export function drawPixelText(ctx, text, x, y, scale = 1) {
  const chars = text.toUpperCase().split("");
  let cx = x;
  chars.forEach((ch) => {
    const glyph = FONT[ch];
    if (glyph) {
      glyph.forEach((row, ry) => {
        for (let rx = 0; rx < 3; rx++) {
          if (row & (1 << (2 - rx))) {
            ctx.fillRect(cx + rx * scale, y + ry * scale, scale, scale);
          }
        }
      });
    }
    cx += 4 * scale;
  });
}
