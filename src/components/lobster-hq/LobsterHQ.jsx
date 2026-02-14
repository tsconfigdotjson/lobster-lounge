import { useEffect, useRef } from "react";
import { setAgentPosition } from "../../services/data-mappers";
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

// Precompute walkable tile lookup
const WALKABLE = new Set([0, 1]);
const WALKABLE_SET = new Set();
for (let y = 0; y < ROWS; y++) {
  for (let x = 0; x < COLS; x++) {
    if (WALKABLE.has(MAP[y]?.[x])) {
      WALKABLE_SET.add(`${x},${y}`);
    }
  }
}

function isWalkable(x, y) {
  return WALKABLE_SET.has(`${x},${y}`);
}

const MOVE_SPEED = 0.04; // tiles per frame

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
  const movementRef = useRef({}); // keyed by agent id
  const hoverTileRef = useRef(null); // {x, y} of tile under cursor

  selectedAgentRef.current = selectedAgent;
  agentsRef.current = agents;

  // Track mouse position for tile highlighting
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }
    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = (COLS * TILE) / rect.width;
      const scaleY = (ROWS * TILE) / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      const tx = Math.floor(mx / TILE);
      const ty = Math.floor(my / TILE);
      if (tx >= 0 && tx < COLS && ty >= 0 && ty < ROWS) {
        hoverTileRef.current = { x: tx, y: ty };
      } else {
        hoverTileRef.current = null;
      }
    };
    const onMouseLeave = () => {
      hoverTileRef.current = null;
    };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);
    return () => {
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

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

      const sel = selectedAgentRef.current;
      const hover = hoverTileRef.current;

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

          // Highlight hovered walkable tile when an agent is selected
          if (
            sel &&
            hover &&
            hover.x === x &&
            hover.y === y &&
            isWalkable(x, y)
          ) {
            const pulse = Math.sin(f * 0.15) * 0.15 + 0.35;
            ctx.fillStyle = `rgba(244, 162, 97, ${pulse})`;
            ctx.fillRect(x * TILE, y * TILE, TILE, TILE);
            ctx.strokeStyle = `rgba(244, 162, 97, 0.6)`;
            ctx.lineWidth = 1;
            ctx.strokeRect(x * TILE + 0.5, y * TILE + 0.5, TILE - 1, TILE - 1);
          }
        }
      }

      drawSignpost(ctx, 2 * TILE, 7 * TILE);

      ctx.fillStyle = "rgba(10,22,40,0.85)";
      ctx.fillRect(7 * TILE + 8, 5 * TILE + 10, 7 * TILE, 9);
      ctx.fillStyle = C.amber;
      drawPixelText(ctx, "LOBSTER LODGE", 7 * TILE + 12, 5 * TILE + 12, 1);

      drawBubbles(ctx, f);

      // Update movement and build draw list
      const currentAgents = agentsRef.current;
      const drawAgents = [];

      for (const a of currentAgents) {
        let m = movementRef.current[a.id];
        if (!m) {
          m = { cx: a.x, cy: a.y, tx: a.x, ty: a.y };
          movementRef.current[a.id] = m;
        }

        // Move toward target — one axis at a time (no diagonals)
        const dx = m.tx - m.cx;
        const dy = m.ty - m.cy;
        if (Math.abs(dx) > 0.05) {
          m.cx += Math.sign(dx) * Math.min(MOVE_SPEED, Math.abs(dx));
        } else if (Math.abs(dy) > 0.05) {
          m.cx = m.tx;
          m.cy += Math.sign(dy) * Math.min(MOVE_SPEED, Math.abs(dy));
        } else if (m.cx !== m.tx || m.cy !== m.ty) {
          m.cx = m.tx;
          m.cy = m.ty;
          setAgentPosition(a._gatewayId, m.tx, m.ty);
        }

        drawAgents.push({ ...a, x: m.cx, y: m.cy });
      }

      const sorted = drawAgents.sort((a, b) => a.y - b.y);
      for (const a of sorted) {
        drawLobsterAgent(ctx, a, f);
      }

      if (sel) {
        const a = drawAgents.find((ag) => ag.id === sel);
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

    const sel = selectedAgentRef.current;

    // If an agent is selected and user clicks a walkable tile, move the agent there
    if (sel) {
      const tx = Math.floor(mx / TILE);
      const ty = Math.floor(my / TILE);

      // Check if they clicked on another agent
      const clickedAgent = agentsRef.current.find((a) => {
        const m = movementRef.current[a.id];
        const ax = m ? m.cx : a.x;
        const ay = m ? m.cy : a.y;
        return (
          mx >= ax * TILE - 4 &&
          mx <= (ax + 1) * TILE + 4 &&
          my >= ay * TILE - 10 &&
          my <= (ay + 1) * TILE + 6
        );
      });

      if (clickedAgent) {
        // Select the clicked agent instead
        onSelectAgent?.(clickedAgent.id === sel ? null : clickedAgent.id);
        return;
      }

      if (isWalkable(tx, ty)) {
        const m = movementRef.current[sel];
        if (m) {
          m.tx = tx;
          m.ty = ty;
        }
        return;
      }

      // Clicked non-walkable tile — deselect
      onSelectAgent?.(null);
      return;
    }

    // No agent selected — check if clicking on an agent
    const clicked = agentsRef.current.find((a) => {
      const m = movementRef.current[a.id];
      const ax = m ? m.cx : a.x;
      const ay = m ? m.cy : a.y;
      return (
        mx >= ax * TILE - 4 &&
        mx <= (ax + 1) * TILE + 4 &&
        my >= ay * TILE - 10 &&
        my <= (ay + 1) * TILE + 6
      );
    });
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
