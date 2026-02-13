export function shadeColor(hex, amt) {
  if (hex.startsWith("rgb")) {
    return hex;
  }
  const r = parseInt(hex.slice(1, 3), 16) + amt;
  const g = parseInt(hex.slice(3, 5), 16) + amt;
  const b = parseInt(hex.slice(5, 7), 16) + amt;
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
}
