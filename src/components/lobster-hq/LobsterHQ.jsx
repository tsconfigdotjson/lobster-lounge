import { useState, useEffect, useRef, useCallback } from "react";
import { TILE, COLS, ROWS, C, MAP } from "./constants";
import { drawPixelText } from "./helpers";
import {
  drawOcean, drawSand, drawDeep, drawLodgeWall, drawShellRoof,
  drawDoor, drawPorthole, drawCoral, drawKelp, drawShellDeco,
  drawBubbles, drawLobsterAgent, drawSignpost,
} from "./renderers";

export default function LobsterHQ({ agents = [], onSelectAgent, selectedAgent }) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const f = frameRef.current++;

    ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);

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

    drawSignpost(ctx, 2 * TILE, 7 * TILE);

    ctx.fillStyle = "rgba(10,22,40,0.85)";
    ctx.fillRect(7 * TILE + 8, 5 * TILE + 10, 7 * TILE, 9);
    ctx.fillStyle = C.amber;
    drawPixelText(ctx, "LOBSTER LODGE", 7 * TILE + 12, 5 * TILE + 12, 1);

    drawBubbles(ctx, f);

    const sorted = [...agents].sort((a, b) => a.y - b.y);
    sorted.forEach(a => drawLobsterAgent(ctx, a, f));

    if (selectedAgent) {
      const a = agents.find(ag => ag.id === selectedAgent);
      if (a) {
        const pulse = Math.sin(f * 0.15) * 0.5 + 0.5;
        ctx.strokeStyle = `rgba(244, 162, 97, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 1;
        ctx.strokeRect(a.x * TILE - 2, a.y * TILE - 10, TILE + 4, TILE + 14);
      }
    }

    requestAnimationFrame(render);
  }, [selectedAgent, agents]);

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
    const clicked = agents.find(a =>
      mx >= a.x * TILE - 4 && mx <= (a.x + 1) * TILE + 4 &&
      my >= a.y * TILE - 10 && my <= (a.y + 1) * TILE + 6
    );
    onSelectAgent?.(clicked ? clicked.id : null);
  };

  return (
    <canvas
      ref={canvasRef}
      width={COLS * TILE}
      height={ROWS * TILE}
      onClick={handleCanvasClick}
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        imageRendering: "pixelated",
        cursor: "pointer",
        display: "block",
      }}
    />
  );
}
