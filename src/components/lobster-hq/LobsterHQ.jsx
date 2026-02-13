import { useState, useEffect, useRef, useCallback } from "react";
import { TILE, COLS, ROWS, SCALE, C, MAP } from "./constants";
import { drawPixelText } from "./helpers";
import {
  drawOcean, drawSand, drawDeep, drawLodgeWall, drawShellRoof,
  drawDoor, drawPorthole, drawCoral, drawKelp, drawShellDeco,
  drawBubbles, drawLobsterAgent, drawSignpost,
} from "./renderers";
import HudItem from "./HudItem";
import Divider from "./Divider";
import ActivityLog from "./ActivityLog";

export default function LobsterHQ({ agents = [], logs = [] }) {
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
    const sorted = [...agents].sort((a, b) => a.y - b.y);
    sorted.forEach(a => drawLobsterAgent(ctx, a, f));

    // Selection ring
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
    setSelectedAgent(clicked ? clicked.id : null);
  };

  const sel = agents.find(a => a.id === selectedAgent);

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
        <HudItem label="POD" value={`${agents.length} ACTIVE`} color={C.green} />
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
          {agents.map(a => (
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
          <ActivityLog logs={logs} tick={tick} />
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
