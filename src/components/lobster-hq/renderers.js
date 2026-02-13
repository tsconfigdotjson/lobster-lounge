import { TILE, COLS, ROWS, C, MAP, BUBBLES } from "./constants";
import { shadeColor, drawPixelText } from "./helpers";

export function drawOcean(ctx, x, y, frame) {
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

export function drawDeep(ctx, x, y, frame) {
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

export function drawSand(ctx, x, y) {
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

export function drawLodgeWall(ctx, x, y) {
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

export function drawShellRoof(ctx, x, y) {
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

export function drawDoor(ctx, x, y) {
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

export function drawPorthole(ctx, x, y) {
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

export function drawCoral(ctx, x, y, frame) {
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

export function drawKelp(ctx, x, y, frame) {
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

export function drawShellDeco(ctx, x, y, frame) {
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

export function drawBubbles(ctx, frame) {
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

export function drawLobsterAgent(ctx, agent, frame) {
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

export function drawSignpost(ctx, x, y) {
  ctx.fillStyle = C.lodge0;
  ctx.fillRect(x + 7, y + 6, 2, 10);
  ctx.fillStyle = C.shellD;
  ctx.fillRect(x + 0, y + 0, 16, 8);
  ctx.fillStyle = C.shell1;
  ctx.fillRect(x + 1, y + 1, 14, 6);
  ctx.fillStyle = C.lob0;
  drawPixelText(ctx, "CLAW", x + 2, y + 2, 1);
}
