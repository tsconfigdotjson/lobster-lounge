import { useEffect, useRef } from "react";
import { C, COLS, MAP, ROWS, TILE } from "./constants";
import { drawPixelText } from "./helpers";
import {
  drawBubbles,
  drawCoral,
  drawDeep,
  drawDoor,
  drawKelp,
  drawLobsterAgent,
  drawLodgeWall,
  drawOcean,
  drawPorthole,
  drawSand,
  drawShellDeco,
  drawShellRoof,
  drawSignpost,
} from "./renderers";

export default function LobsterHQ({
  agents = [],
  onSelectAgent,
  selectedAgent,
}) {
  const canvasRef = useRef(null);
  const frameRef = useRef(0);
  const rafRef = useRef(0);
  const selectedAgentRef = useRef(selectedAgent);
  const agentsRef = useRef(agents);

  selectedAgentRef.current = selectedAgent;
  agentsRef.current = agents;

  useEffect(() => {
    const render = () => {
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(render);
        return;
      }
      const ctx = canvas.getContext("2d");
      const f = frameRef.current++;

      ctx.clearRect(0, 0, COLS * TILE, ROWS * TILE);

      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          const tile = MAP[y]?.[x] ?? 0;
          switch (tile) {
            case 0:
              drawOcean(ctx, x, y, f);
              break;
            case 1:
              drawSand(ctx, x, y);
              break;
            case 2:
              drawDeep(ctx, x, y, f);
              break;
            case 3:
              drawLodgeWall(ctx, x, y);
              break;
            case 4:
              drawShellRoof(ctx, x, y);
              break;
            case 5:
              drawDoor(ctx, x, y);
              break;
            case 6:
              drawPorthole(ctx, x, y);
              break;
            case 7:
              drawCoral(ctx, x, y, f);
              break;
            case 8:
              drawKelp(ctx, x, y, f);
              break;
            case 9:
              drawShellDeco(ctx, x, y, f);
              break;
          }
        }
      }

      drawSignpost(ctx, 2 * TILE, 7 * TILE);

      ctx.fillStyle = "rgba(10,22,40,0.85)";
      ctx.fillRect(7 * TILE + 8, 5 * TILE + 10, 7 * TILE, 9);
      ctx.fillStyle = C.amber;
      drawPixelText(ctx, "LOBSTER LODGE", 7 * TILE + 12, 5 * TILE + 12, 1);

      drawBubbles(ctx, f);

      const currentAgents = agentsRef.current;
      const sorted = [...currentAgents].sort((a, b) => a.y - b.y);
      for (const a of sorted) {
        drawLobsterAgent(ctx, a, f);
      }

      const sel = selectedAgentRef.current;
      if (sel) {
        const a = currentAgents.find((ag) => ag.id === sel);
        if (a) {
          const pulse = Math.sin(f * 0.15) * 0.5 + 0.5;
          ctx.strokeStyle = `rgba(244, 162, 97, ${0.4 + pulse * 0.6})`;
          ctx.lineWidth = 1;
          ctx.strokeRect(a.x * TILE - 2, a.y * TILE - 10, TILE + 4, TILE + 14);
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    rafRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const handleCanvasClick = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = (COLS * TILE) / rect.width;
    const scaleY = (ROWS * TILE) / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const clicked = agents.find(
      (a) =>
        mx >= a.x * TILE - 4 &&
        mx <= (a.x + 1) * TILE + 4 &&
        my >= a.y * TILE - 10 &&
        my <= (a.y + 1) * TILE + 6,
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
