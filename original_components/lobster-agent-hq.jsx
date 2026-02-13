import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// 🦞 OPEN CLAW — LOBSTER AGENT COORDINATION HQ
// Underwater pixel art dashboard — lobster hotel meets ops center
// ═══════════════════════════════════════════════════════════════

const TILE = 16;
const COLS = 22;
const ROWS = 16;
const SCALE = 3;

// ─── OCEAN PALETTE ────────────────────────────────────────────
const C = {
  // Ocean depths
  deep0: "#0a1628", deep1: "#0e1f3a", deep2: "#132a4a",
  sea0: "#1a3a5c", sea1: "#1e4d6e", sea2: "#236480",
  // Sand
  sand0: "#c2a24e", sand1: "#d4b65c", sand2: "#e6ca72", sandD: "#a08838",
  // Coral
  coral0: "#e74c6f", coral1: "#ff6b8a", coralD: "#b33a58",
  coral2: "#f4a261", coral3: "#e76f51",
  // Kelp & sea plants
  kelp0: "#1b6b3a", kelp1: "#228b4a", kelp2: "#2ecc71", kelpD: "#145228",
  // Lobster reds
  lob0: "#c0392b", lob1: "#e74c3c", lob2: "#ff6b5c", lobD: "#8b1a10",
  // Shell / lodge
  shell0: "#d4a06a", shell1: "#e8be8a", shell2: "#f5d6a8", shellD: "#b08040",
  lodge0: "#8b4513", lodge1: "#a0522d", lodge2: "#cd853f", lodgeD: "#5c2e0a",
  // Bubbles & highlights
  bubble: "rgba(180,220,255,0.5)", bubbleH: "rgba(220,240,255,0.7)",
  // UI
  uiBg: "rgba(10, 22, 40, 0.93)", uiBorder: "#e74c3c", uiBorderAlt: "#f4a261",
  text: "#e8e0d0", textDim: "#6a8090", textBright: "#ffffff",
  green: "#2ecc71", amber: "#f4a261", red: "#e74c3c", cyan: "#5dade2",
  black: "#0a0a14",
};

// ─── TILEMAP ──────────────────────────────────────────────────
// 0=ocean, 1=sand path, 2=deep water, 3=lodge wall, 4=lodge roof (shell),
// 5=door, 6=porthole window, 7=coral, 8=kelp, 9=shell deco
const MAP = [
  [2,2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2,2,2],
  [2,2,0,0,8,0,0,4,4,4,4,4,4,4,4,0,0,8,0,0,2,2],
  [2,0,0,0,0,4,4,4,4,4,4,4,4,4,4,4,4,0,0,0,0,2],
  [0,0,8,0,0,3,3,6,3,3,3,3,3,3,6,3,3,0,0,8,0,0],
  [0,0,0,0,0,3,3,3,3,3,3,3,3,3,3,3,3,0,0,0,0,0],
  [0,0,7,0,0,3,3,6,3,3,3,3,3,3,6,3,3,0,0,7,0,0],
  [0,0,0,0,0,3,3,3,3,3,5,5,3,3,3,3,3,0,0,0,0,0],
  [0,0,9,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,9,0,0,0],
  [0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0,0],
  [0,7,0,1,0,0,9,0,0,0,1,1,0,0,0,9,0,0,1,0,7,0],
  [0,0,0,1,0,0,0,0,0,0,1,1,0,0,0,0,0,0,1,0,0,0],
  [0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0],
  [0,8,0,0,0,1,0,0,7,0,0,0,0,7,0,0,1,0,0,0,8,0],
  [0,0,0,0,0,1,0,9,0,0,0,0,0,0,9,0,1,0,0,0,0,0],
  [2,0,0,0,0,1,1,1,1,1,1,1,1,1,1,1,1,0,0,0,0,2],
  [2,2,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,2,2],
];

// ─── AGENTS (Lobster-themed) ──────────────────────────────────
const AGENTS = [
  { id: "CLAWZ", role: "Coordinator", task: "Coordinating the pod", color: "#e74c3c", x: 10, y: 8, dir: 0 },
  { id: "CORAL", role: "Scanner", task: "Scanning tide pools", color: "#ff6b8a", x: 7, y: 9, dir: 2 },
  { id: "PINCH", role: "Executor", task: "Executing shell trades", color: "#f4a261", x: 14, y: 9, dir: 1 },
  { id: "REEF", role: "Security", task: "Guarding the reef", color: "#9b59b6", x: 4, y: 11, dir: 3 },
  { id: "TIDE", role: "Scout", task: "Scouting deep currents", color: "#2ecc71", x: 17, y: 11, dir: 1 },
  { id: "SHELL", role: "Analyst", task: "Analyzing sea data", color: "#1abc9c", x: 12, y: 7, dir: 0 },
];

// ═══════════════════════════════════════════════════════════════
// TILE RENDERERS
// ═══════════════════════════════════════════════════════════════

function drawOcean(ctx, x, y, frame) {
  const hash = (x * 7 + y * 13) % 5;
  ctx.fillStyle = hash < 2 ? C.sea0 : hash < 4 ? C.sea1 : C.sea2;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Subtle caustic light ripples
  const ripple = Math.sin(frame * 0.04 + x * 1.2 + y * 0.8);
  if (ripple > 0.6) {
    ctx.fillStyle = "rgba(93,173,226,0.08)";
    ctx.fillRect(x * TILE + ((frame + x * 3) % 12), y * TILE + ((frame + y * 5) % 12), 5, 2);
  }
  // Tiny sand particles floating
  if ((x * 11 + y * 7) % 13 === 0) {
    const py = (y * TILE + (frame * 0.3 + x * 5) % TILE) % (ROWS * TILE);
    ctx.fillStyle = "rgba(210,180,120,0.15)";
    ctx.fillRect(x * TILE + 6, py, 1, 1);
  }
}

function drawDeep(ctx, x, y, frame) {
  const hash = (x * 3 + y * 11) % 3;
  ctx.fillStyle = hash === 0 ? C.deep0 : hash === 1 ? C.deep1 : C.deep2;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Dark murky shimmer
  const s = Math.sin(frame * 0.025 + x + y * 2);
  if (s > 0.7) {
    ctx.fillStyle = "rgba(30,77,110,0.12)";
    ctx.fillRect(x * TILE + ((frame * 0.5 + x * 4) % 14), y * TILE + 5, 4, 1);
  }
}

function drawSand(ctx, x, y) {
  ctx.fillStyle = C.sand1;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Sand texture
  ctx.fillStyle = C.sand2;
  if ((x + y) % 3 === 0) ctx.fillRect(x * TILE + 3, y * TILE + 5, 2, 1);
  if ((x * 5 + y) % 4 === 0) ctx.fillRect(x * TILE + 10, y * TILE + 11, 3, 1);
  ctx.fillStyle = C.sandD;
  if ((x + y * 3) % 5 === 0) ctx.fillRect(x * TILE + 7, y * TILE + 2, 1, 1);
  // Edge darkening
  if (y > 0 && MAP[y - 1]?.[x] !== 1) {
    ctx.fillStyle = C.sandD;
    ctx.fillRect(x * TILE, y * TILE, TILE, 1);
  }
}

function drawLodgeWall(ctx, x, y) {
  ctx.fillStyle = C.lodge1;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Wood plank lines
  ctx.fillStyle = C.lodgeD;
  ctx.fillRect(x * TILE, y * TILE + 4, TILE, 1);
  ctx.fillRect(x * TILE, y * TILE + 10, TILE, 1);
  // Knot detail
  if ((x + y) % 4 === 0) {
    ctx.fillStyle = C.lodge0;
    ctx.fillRect(x * TILE + 6, y * TILE + 6, 3, 3);
    ctx.fillStyle = C.lodge2;
    ctx.fillRect(x * TILE + 7, y * TILE + 7, 1, 1);
  }
  // Right edge shadow
  ctx.fillStyle = C.lodgeD;
  ctx.fillRect(x * TILE + TILE - 1, y * TILE, 1, TILE);
}

function drawShellRoof(ctx, x, y) {
  // Shell-like curved roof in lobster red
  ctx.fillStyle = C.lob0;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Shell ridge pattern
  ctx.fillStyle = C.lob1;
  const ridge = (x + y) % 2;
  ctx.fillRect(x * TILE + (ridge ? 2 : 0), y * TILE + 3, 6, 2);
  ctx.fillRect(x * TILE + (ridge ? 8 : 10), y * TILE + 9, 5, 2);
  // Highlight
  ctx.fillStyle = C.lob2;
  if ((x + y) % 3 === 0) ctx.fillRect(x * TILE + 4, y * TILE + 1, 3, 1);
  // Bottom shadow
  ctx.fillStyle = C.lobD;
  ctx.fillRect(x * TILE, y * TILE + TILE - 2, TILE, 2);
}

function drawDoor(ctx, x, y) {
  ctx.fillStyle = C.lodge1;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Arched doorway
  ctx.fillStyle = C.deep0;
  ctx.fillRect(x * TILE + 2, y * TILE + 3, 12, 13);
  ctx.fillStyle = C.deep1;
  ctx.fillRect(x * TILE + 4, y * TILE + 1, 8, 2);
  // Door frame
  ctx.fillStyle = C.shell0;
  ctx.fillRect(x * TILE + 1, y * TILE + 3, 1, 13);
  ctx.fillRect(x * TILE + 14, y * TILE + 3, 1, 13);
  ctx.fillRect(x * TILE + 2, y * TILE + 2, 12, 1);
  // Shell doorknob
  ctx.fillStyle = C.amber;
  ctx.fillRect(x * TILE + 11, y * TILE + 9, 2, 2);
  ctx.fillStyle = C.sand2;
  ctx.fillRect(x * TILE + 11, y * TILE + 9, 1, 1);
}

function drawPorthole(ctx, x, y) {
  ctx.fillStyle = C.lodge1;
  ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
  // Wood plank bg
  ctx.fillStyle = C.lodgeD;
  ctx.fillRect(x * TILE, y * TILE + 4, TILE, 1);
  ctx.fillRect(x * TILE, y * TILE + 10, TILE, 1);
  // Porthole frame (brass)
  ctx.fillStyle = C.shell0;
  ctx.fillRect(x * TILE + 3, y * TILE + 2, 10, 12);
  ctx.fillStyle = C.shellD;
  ctx.fillRect(x * TILE + 4, y * TILE + 3, 8, 10);
  // Glass
  ctx.fillStyle = C.cyan;
  ctx.fillRect(x * TILE + 5, y * TILE + 4, 6, 8);
  // Cross frame
  ctx.fillStyle = C.shell0;
  ctx.fillRect(x * TILE + 7, y * TILE + 4, 2, 8);
  ctx.fillRect(x * TILE + 5, y * TILE + 7, 6, 2);
  // Glass highlight
  ctx.fillStyle = "rgba(255,255,255,0.3)";
  ctx.fillRect(x * TILE + 5, y * TILE + 4, 2, 3);
}

function drawCoral(ctx, x, y, frame) {
  drawOcean(ctx, x, y, frame);
  const variant = (x * 7 + y * 3) % 3;
  const colors = [
    [C.coral0, C.coral1, C.coralD],
    [C.coral2, C.coral3, "#c45a30"],
    [C.coral0, "#ff8fa3", C.coralD],
  ][variant];
  // Coral branches
  const sway = Math.sin(frame * 0.05 + x * 2) > 0 ? 1 : 0;
  ctx.fillStyle = colors[0];
  ctx.fillRect(x * TILE + 4, y * TILE + 5 + sway, 3, 8);
  ctx.fillRect(x * TILE + 2, y * TILE + 4 + sway, 2, 5);
  ctx.fillRect(x * TILE + 7, y * TILE + 6 + sway, 3, 6);
  ctx.fillStyle = colors[1];
  ctx.fillRect(x * TILE + 3, y * TILE + 3 + sway, 4, 3);
  ctx.fillRect(x * TILE + 8, y * TILE + 4 + sway, 3, 3);
  ctx.fillRect(x * TILE + 10, y * TILE + 7 + sway, 3, 4);
  // Coral tips
  ctx.fillStyle = colors[2];
  ctx.fillRect(x * TILE + 4, y * TILE + 13, 3, 2);
  ctx.fillRect(x * TILE + 8, y * TILE + 12, 2, 2);
}

function drawKelp(ctx, x, y, frame) {
  drawOcean(ctx, x, y, frame);
  // Kelp strands swaying
  const sway1 = Math.sin(frame * 0.06 + y) * 2;
  const sway2 = Math.sin(frame * 0.06 + y + 2) * 2;
  // Strand 1
  ctx.fillStyle = C.kelp0;
  for (let i = 0; i < 12; i++) {
    const sx = Math.round(Math.sin(i * 0.4 + frame * 0.04) * 1.5 + sway1);
    ctx.fillRect(x * TILE + 5 + sx, y * TILE + 3 + i, 3, 2);
  }
  // Strand 2
  ctx.fillStyle = C.kelp1;
  for (let i = 0; i < 10; i++) {
    const sx = Math.round(Math.sin(i * 0.5 + frame * 0.04 + 1) * 1 + sway2);
    ctx.fillRect(x * TILE + 10 + sx, y * TILE + 5 + i, 2, 2);
  }
  // Leaf detail
  ctx.fillStyle = C.kelp2;
  ctx.fillRect(x * TILE + 3 + Math.round(sway1), y * TILE + 3, 4, 2);
  ctx.fillRect(x * TILE + 9 + Math.round(sway2), y * TILE + 5, 3, 2);
}

function drawShellDeco(ctx, x, y, frame) {
  // Background depends on whether it's on sand or ocean
  const onSand = MAP[y]?.[x - 1] === 1 || MAP[y]?.[x + 1] === 1;
  if (onSand) {
    drawSand(ctx, x, y);
  } else {
    drawOcean(ctx, x, y, frame);
  }
  // Spiral shell
  const variant = (x * 3 + y * 7) % 2;
  if (variant === 0) {
    // Conch shell
    ctx.fillStyle = C.shell1;
    ctx.fillRect(x * TILE + 4, y * TILE + 8, 8, 6);
    ctx.fillRect(x * TILE + 6, y * TILE + 6, 6, 2);
    ctx.fillStyle = C.shell2;
    ctx.fillRect(x * TILE + 5, y * TILE + 9, 3, 3);
    ctx.fillStyle = C.shellD;
    ctx.fillRect(x * TILE + 9, y * TILE + 10, 2, 3);
    // Spiral
    ctx.fillStyle = C.coral0;
    ctx.fillRect(x * TILE + 7, y * TILE + 10, 1, 1);
  } else {
    // Starfish
    ctx.fillStyle = C.coral2;
    ctx.fillRect(x * TILE + 7, y * TILE + 8, 3, 6);
    ctx.fillRect(x * TILE + 4, y * TILE + 10, 9, 2);
    ctx.fillRect(x * TILE + 5, y * TILE + 8, 2, 2);
    ctx.fillRect(x * TILE + 10, y * TILE + 8, 2, 2);
    ctx.fillStyle = C.coral3;
    ctx.fillRect(x * TILE + 8, y * TILE + 10, 1, 1);
  }
}

// ─── BUBBLES (ambient particles) ──────────────────────────────
const BUBBLES = Array.from({ length: 18 }, (_, i) => ({
  x: Math.random() * COLS * TILE,
  y: Math.random() * ROWS * TILE,
  speed: 0.2 + Math.random() * 0.4,
  size: 1 + Math.floor(Math.random() * 2),
  wobble: Math.random() * Math.PI * 2,
}));

function drawBubbles(ctx, frame) {
  BUBBLES.forEach(b => {
    b.y -= b.speed;
    b.x += Math.sin(frame * 0.03 + b.wobble) * 0.3;
    if (b.y < -4) { b.y = ROWS * TILE + 4; b.x = Math.random() * COLS * TILE; }
    ctx.fillStyle = C.bubble;
    ctx.fillRect(Math.round(b.x), Math.round(b.y), b.size, b.size);
    ctx.fillStyle = C.bubbleH;
    ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
  });
}

// ─── LOBSTER AGENT SPRITE ─────────────────────────────────────
function drawLobsterAgent(ctx, agent, frame) {
  const px = agent.x * TILE;
  const py = agent.y * TILE;
  const bob = Math.sin(frame * 0.08 + agent.x * 1.5) > 0 ? -1 : 0;
  const ac = agent.color;

  // Shadow on ocean floor
  ctx.fillStyle = "rgba(0,0,0,0.3)";
  ctx.fillRect(px + 2, py + 14, 12, 2);

  // Tail (behind body)
  ctx.fillStyle = shadeColor(ac, -25);
  ctx.fillRect(px + 6, py + 12 + bob, 4, 4);
  ctx.fillRect(px + 5, py + 14 + bob, 6, 2);
  // Tail fan
  ctx.fillStyle = shadeColor(ac, -40);
  ctx.fillRect(px + 4, py + 15, 3, 1);
  ctx.fillRect(px + 9, py + 15, 3, 1);

  // Body (carapace)
  ctx.fillStyle = ac;
  ctx.fillRect(px + 4, py + 5 + bob, 8, 8);
  ctx.fillRect(px + 5, py + 4 + bob, 6, 1);
  // Body highlight
  ctx.fillStyle = shadeColor(ac, 30);
  ctx.fillRect(px + 5, py + 5 + bob, 3, 2);
  // Body segments
  ctx.fillStyle = shadeColor(ac, -15);
  ctx.fillRect(px + 4, py + 8 + bob, 8, 1);
  ctx.fillRect(px + 4, py + 11 + bob, 8, 1);

  // Head
  ctx.fillStyle = shadeColor(ac, 10);
  ctx.fillRect(px + 5, py + 2 + bob, 6, 4);
  ctx.fillRect(px + 6, py + 1 + bob, 4, 1);

  // Eyes (on stalks!)
  ctx.fillStyle = ac;
  ctx.fillRect(px + 4, py + 1 + bob, 2, 2);
  ctx.fillRect(px + 10, py + 1 + bob, 2, 2);
  ctx.fillStyle = C.black;
  ctx.fillRect(px + 4, py + 1 + bob, 1, 1);
  ctx.fillRect(px + 11, py + 1 + bob, 1, 1);
  // Eye shine
  ctx.fillStyle = "#fff";
  ctx.fillRect(px + 4, py + bob, 1, 1);
  ctx.fillRect(px + 11, py + bob, 1, 1);

  // Antennae
  ctx.fillStyle = shadeColor(ac, -20);
  const antSway = Math.sin(frame * 0.1 + agent.x) * 1.5;
  ctx.fillRect(px + 3 + Math.round(antSway), py - 2 + bob, 1, 3);
  ctx.fillRect(px + 12 - Math.round(antSway), py - 2 + bob, 1, 3);
  ctx.fillRect(px + 2 + Math.round(antSway), py - 3 + bob, 1, 2);
  ctx.fillRect(px + 13 - Math.round(antSway), py - 3 + bob, 1, 2);

  // CLAWS! (the star feature)
  const clawSnap = Math.sin(frame * 0.06 + agent.x * 3) > 0.7 ? 1 : 0;
  // Left claw
  ctx.fillStyle = shadeColor(ac, 15);
  ctx.fillRect(px + 1, py + 5 + bob, 3, 4);
  ctx.fillRect(px - 1, py + 4 + bob, 3, 2 + clawSnap);
  ctx.fillStyle = shadeColor(ac, -10);
  ctx.fillRect(px - 1, py + 7 + bob - clawSnap, 3, 2);
  // Right claw
  ctx.fillStyle = shadeColor(ac, 15);
  ctx.fillRect(px + 12, py + 5 + bob, 3, 4);
  ctx.fillRect(px + 14, py + 4 + bob, 3, 2 + clawSnap);
  ctx.fillStyle = shadeColor(ac, -10);
  ctx.fillRect(px + 14, py + 7 + bob - clawSnap, 3, 2);

  // Legs (3 pairs)
  ctx.fillStyle = shadeColor(ac, -30);
  for (let i = 0; i < 3; i++) {
    const legBob = Math.sin(frame * 0.12 + i * 1.5) > 0 ? 1 : 0;
    ctx.fillRect(px + 2, py + 8 + i * 2 + bob + legBob, 2, 1);
    ctx.fillRect(px + 12, py + 8 + i * 2 + bob - legBob, 2, 1);
  }

  // Name tag
  const nameY = py - 8 + bob;
  const nameWidth = agent.id.length * 4 + 6;
  ctx.fillStyle = C.uiBg;
  ctx.fillRect(px + 8 - nameWidth / 2, nameY - 1, nameWidth, 7);
  ctx.fillStyle = ac;
  drawPixelText(ctx, agent.id, px + 8 - (agent.id.length * 4) / 2 + 2, nameY, 1);
}

function shadeColor(hex, amount) {
  let r = parseInt(hex.slice(1, 3), 16) + amount;
  let g = parseInt(hex.slice(3, 5), 16) + amount;
  let b = parseInt(hex.slice(5, 7), 16) + amount;
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
}

// ─── PIXEL FONT ───────────────────────────────────────────────
const FONT = {
  A:[0b010,0b101,0b111,0b101,0b101],B:[0b110,0b101,0b110,0b101,0b110],
  C:[0b011,0b100,0b100,0b100,0b011],D:[0b110,0b101,0b101,0b101,0b110],
  E:[0b111,0b100,0b110,0b100,0b111],F:[0b111,0b100,0b110,0b100,0b100],
  G:[0b011,0b100,0b101,0b101,0b011],H:[0b101,0b101,0b111,0b101,0b101],
  I:[0b111,0b010,0b010,0b010,0b111],J:[0b001,0b001,0b001,0b101,0b010],
  K:[0b101,0b110,0b100,0b110,0b101],L:[0b100,0b100,0b100,0b100,0b111],
  M:[0b101,0b111,0b111,0b101,0b101],N:[0b101,0b111,0b111,0b101,0b101],
  O:[0b010,0b101,0b101,0b101,0b010],P:[0b110,0b101,0b110,0b100,0b100],
  Q:[0b010,0b101,0b101,0b110,0b011],R:[0b110,0b101,0b110,0b101,0b101],
  S:[0b011,0b100,0b010,0b001,0b110],T:[0b111,0b010,0b010,0b010,0b010],
  U:[0b101,0b101,0b101,0b101,0b010],V:[0b101,0b101,0b101,0b010,0b010],
  W:[0b101,0b101,0b111,0b111,0b101],X:[0b101,0b101,0b010,0b101,0b101],
  Y:[0b101,0b101,0b010,0b010,0b010],Z:[0b111,0b001,0b010,0b100,0b111],
  "0":[0b010,0b101,0b101,0b101,0b010],"1":[0b010,0b110,0b010,0b010,0b111],
  "2":[0b110,0b001,0b010,0b100,0b111],"3":[0b110,0b001,0b010,0b001,0b110],
  "4":[0b101,0b101,0b111,0b001,0b001],"5":[0b111,0b100,0b110,0b001,0b110],
  "6":[0b011,0b100,0b110,0b101,0b010],"7":[0b111,0b001,0b010,0b010,0b010],
  "8":[0b010,0b101,0b010,0b101,0b010],"9":[0b010,0b101,0b011,0b001,0b110],
  ":":[0b000,0b010,0b000,0b010,0b000],"/":[0b001,0b001,0b010,0b100,0b100],
  " ":[0b000,0b000,0b000,0b000,0b000],"-":[0b000,0b000,0b111,0b000,0b000],
  ".":[0b000,0b000,0b000,0b000,0b010],
};

function drawPixelText(ctx, text, x, y, scale = 1) {
  const chars = text.toUpperCase().split("");
  let cx = x;
  chars.forEach(ch => {
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

// ─── SIGNPOST ─────────────────────────────────────────────────
function drawSignpost(ctx, x, y) {
  ctx.fillStyle = C.lodge0;
  ctx.fillRect(x + 7, y + 6, 2, 10);
  ctx.fillStyle = C.shellD;
  ctx.fillRect(x + 0, y + 0, 16, 8);
  ctx.fillStyle = C.shell1;
  ctx.fillRect(x + 1, y + 1, 14, 6);
  ctx.fillStyle = C.lob0;
  drawPixelText(ctx, "CLAW", x + 2, y + 2, 1);
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function LobsterHQ() {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [time, setTime] = useState("08:00");
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => {
      setTick(t => t + 1);
      const h = 8 + Math.floor((Date.now() / 3000) % 10);
      const m = Math.floor((Date.now() / 500) % 60);
      setTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const f = frameRef.current++;

    ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);

    // Draw tilemap
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const tile = MAP[y]?.[x] ?? 0;
        switch (tile) {
          case 0: drawOcean(ctx, x, y, f); break;
          case 1: drawSand(ctx, x, y); break;
          case 2: drawDeep(ctx, x, y, f); break;
          case 3: drawLodgeWall(ctx, x, y); break;
          case 4: drawShellRoof(ctx, x, y); break;
          case 5: drawDoor(ctx, x, y); break;
          case 6: drawPorthole(ctx, x, y); break;
          case 7: drawCoral(ctx, x, y, f); break;
          case 8: drawKelp(ctx, x, y, f); break;
          case 9: drawShellDeco(ctx, x, y, f); break;
        }
      }
    }

    // Signpost near entrance
    drawSignpost(ctx, 2 * TILE, 7 * TILE);

    // Lodge banner
    ctx.fillStyle = "rgba(10,22,40,0.85)";
    ctx.fillRect(7 * TILE + 8, 5 * TILE + 10, 7 * TILE, 9);
    ctx.fillStyle = C.amber;
    drawPixelText(ctx, "LOBSTER LODGE", 7 * TILE + 12, 5 * TILE + 12, 1);

    // Bubbles
    drawBubbles(ctx, f);

    // Draw agents sorted by Y
    const sorted = [...AGENTS].sort((a, b) => a.y - b.y);
    sorted.forEach(a => drawLobsterAgent(ctx, a, f));

    // Selection ring
    if (selectedAgent) {
      const a = AGENTS.find(ag => ag.id === selectedAgent);
      if (a) {
        const pulse = Math.sin(f * 0.15) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(244, 162, 97, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(a.x * TILE - 2, a.y * TILE - 10, TILE + 4, TILE + 14);
      }
    }

    requestAnimationFrame(render);
  }, [selectedAgent]);

  useEffect(() => {
    const raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, [render]);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = (COLS * TILE) / rect.width;
    const scaleY = (ROWS * TILE) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const clicked = AGENTS.find(a =>
      mx >= a.x * TILE - 4 && mx <= (a.x + 1) * TILE + 4 &&
      my >= a.y * TILE - 10 && my <= (a.y + 1) * TILE + 6
    );
    setSelectedAgent(clicked ? clicked.id : null);
  };

  const sel = AGENTS.find(a => a.id === selectedAgent);

  return (
    <div style={{
      background: `linear-gradient(180deg, ${C.deep0} 0%, ${C.deep2} 40%, ${C.sea0} 100%)`,
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "'Courier New', monospace",
      padding: 16,
      gap: 12,
      color: C.text,
    }}>
      {/* ── TITLE ──────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 28 }}>🦞</span>
        <div>
          <div style={{
            fontSize: 20, fontWeight: "bold", color: C.lob1,
            letterSpacing: 4, textShadow: `0 0 20px rgba(231,76,60,0.4)`,
          }}>
            OPEN CLAW
          </div>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 3 }}>
            AUTONOMOUS LOBSTER AGENT COORDINATION
          </div>
        </div>
        <span style={{ fontSize: 28 }}>🦞</span>
      </div>

      {/* ── TOP HUD BAR ────────────────────────────────────── */}
      <div style={{
        display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap", justifyContent: "center",
        background: C.uiBg,
        border: `2px solid ${C.uiBorderAlt}`,
        borderRadius: 2,
        padding: "8px 20px",
        width: "100%",
        maxWidth: COLS * TILE * SCALE + 320,
        boxSizing: "border-box",
      }}>
        <HudItem label="MISSION" value="DEEP SEA OPS" color={C.lob1} />
        <Divider />
        <HudItem label="POD" value="6 ACTIVE" color={C.green} />
        <Divider />
        <HudItem label="TIDE" value={time} color={C.amber} />
        <Divider />
        <HudItem label="WINDOW" value="8:00-18:00" color={C.cyan} />
        <Divider />
        <HudItem label="SYNC" value="2/DAY" color={C.amber} />
        <Divider />
        <HudItem label="CURRENT" value="STRONG" color={C.green} pulse />
      </div>

      {/* ── MAIN AREA ──────────────────────────────────────── */}
      <div style={{
        display: "flex", gap: 12, alignItems: "flex-start",
        flexWrap: "wrap", justifyContent: "center",
      }}>
        {/* Agent Roster */}
        <div style={{
          background: C.uiBg,
          border: `2px solid ${C.uiBorderAlt}`,
          borderRadius: 2,
          padding: 12,
          width: 155,
        }}>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8, letterSpacing: 2 }}>
            🦞 POD ROSTER
          </div>
          {AGENTS.map(a => (
            <button
              key={a.id}
              onClick={() => setSelectedAgent(selectedAgent === a.id ? null : a.id)}
              style={{
                display: "flex", alignItems: "center", gap: 8, width: "100%",
                padding: "6px 8px", marginBottom: 4,
                background: selectedAgent === a.id ? "rgba(244,162,97,0.12)" : "transparent",
                border: selectedAgent === a.id ? `1px solid ${C.uiBorderAlt}` : "1px solid transparent",
                borderRadius: 2, cursor: "pointer", color: C.text,
                fontFamily: "'Courier New', monospace", fontSize: 11, textAlign: "left",
              }}
            >
              <span style={{
                width: 10, height: 10, borderRadius: 1,
                background: a.color, display: "inline-block", flexShrink: 0,
              }} />
              <span style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 10 }}>{a.id}</div>
                <div style={{ fontSize: 9, color: C.textDim }}>{a.role}</div>
              </span>
              <span style={{
                width: 6, height: 6, borderRadius: 6,
                background: C.green, animation: "pulse 2s infinite",
              }} />
            </button>
          ))}
          <div style={{
            marginTop: 16, padding: 8,
            borderTop: `1px solid rgba(255,255,255,0.06)`,
            fontSize: 9, color: C.textDim, fontStyle: "italic", lineHeight: 1.5,
          }}>
            "Small claws compound into empires."
            <div style={{ color: C.amber, marginTop: 4, fontStyle: "normal" }}>— OPEN CLAW CEO</div>
          </div>
        </div>

        {/* ── CANVAS ───────────────────────────────────────── */}
        <div style={{ position: "relative" }}>
          <canvas
            ref={canvasRef}
            width={COLS * TILE}
            height={ROWS * TILE}
            onClick={handleCanvasClick}
            style={{
              width: COLS * TILE * SCALE,
              height: ROWS * TILE * SCALE,
              imageRendering: "pixelated",
              border: `2px solid ${C.uiBorderAlt}`,
              borderRadius: 2,
              cursor: "pointer",
              display: "block",
            }}
          />
          {sel && (
            <div style={{
              position: "absolute", bottom: 8, left: 8, right: 8,
              background: C.uiBg, border: `2px solid ${sel.color}`,
              borderRadius: 2, padding: "8px 12px",
              display: "flex", alignItems: "center", gap: 12,
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 2,
                background: sel.color, opacity: 0.85,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 20,
              }}>
                🦞
              </div>
              <div style={{ flexGrow: 1 }}>
                <div style={{ fontSize: 14, fontWeight: "bold", color: sel.color }}>{sel.id}</div>
                <div style={{ fontSize: 10, color: C.textDim }}>
                  {sel.role} — {sel.task}
                </div>
              </div>
              <div style={{
                padding: "3px 10px", borderRadius: 2,
                background: "rgba(46,204,113,0.12)",
                border: `1px solid ${C.green}`,
                fontSize: 9, color: C.green, letterSpacing: 1,
              }}>
                AUTONOMOUS
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div style={{
          background: C.uiBg,
          border: `2px solid ${C.uiBorderAlt}`,
          borderRadius: 2,
          padding: 12,
          width: 155,
        }}>
          <div style={{ fontSize: 10, color: C.textDim, marginBottom: 8, letterSpacing: 2 }}>
            🫧 TIDE LOG
          </div>
          <ActivityLog tick={tick} />
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────

function HudItem({ label, value, color, pulse }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div style={{ fontSize: 8, letterSpacing: 2, color: C.textDim, marginBottom: 2 }}>{label}</div>
      <div style={{
        fontSize: 12, fontWeight: "bold", color,
        animation: pulse ? "pulse 2s infinite" : "none",
      }}>
        {value}
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.06)" }} />;
}

function ActivityLog({ tick }) {
  const logs = [
    { agent: "CLAWZ", action: "Pod sync initiated", color: "#e74c3c", t: 0 },
    { agent: "CORAL", action: "Detected warm current", color: "#ff6b8a", t: 2 },
    { agent: "TIDE", action: "New kelp bed found", color: "#2ecc71", t: 4 },
    { agent: "PINCH", action: "Shell trade #421 done", color: "#f4a261", t: 6 },
    { agent: "REEF", action: "Perimeter secure", color: "#9b59b6", t: 8 },
    { agent: "SHELL", action: "Current data compiled", color: "#1abc9c", t: 10 },
    { agent: "CORAL", action: "3 tide pools mapped", color: "#ff6b8a", t: 12 },
    { agent: "CLAWZ", action: "Tasks redistributed", color: "#e74c3c", t: 14 },
    { agent: "TIDE", action: "Deep trench scouted", color: "#2ecc71", t: 16 },
    { agent: "PINCH", action: "Trade #422 queued", color: "#f4a261", t: 18 },
    { agent: "REEF", action: "Predator scan clear", color: "#9b59b6", t: 20 },
    { agent: "SHELL", action: "Anomaly in thermocline", color: "#1abc9c", t: 22 },
  ];

  const visible = logs.filter(l => (tick % 24) >= l.t).slice(-7);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {visible.map((l, i) => (
        <div key={i} style={{
          fontSize: 9, lineHeight: 1.4,
          opacity: 0.4 + (i / visible.length) * 0.6,
          borderLeft: `2px solid ${l.color}`,
          paddingLeft: 6,
        }}>
          <span style={{ color: l.color, fontWeight: "bold" }}>{l.agent}</span>
          <div style={{ color: C.textDim }}>{l.action}</div>
        </div>
      ))}
    </div>
  );
}
