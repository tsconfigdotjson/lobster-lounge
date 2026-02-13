import { useState, useEffect } from "react";
import { C, CONNECTION_STEPS } from "./constants";
import { panelStyle, labelStyle, inputStyle, counterStyle, btnPrimaryStyle, btnSecondaryStyle } from "./styles";
import PanelHeader from "./PanelHeader";
import Spinner from "./Spinner";
import LobsterAvatar from "./LobsterAvatar";

export default function GatewayScreen({ gateways = [], onConnect }) {
  const [phase, setPhase] = useState("select");
  const [selectedGw, setSelectedGw] = useState(null);
  const [newName, setNewName] = useState("");
  const [newRegion, setNewRegion] = useState("");
  const [connectStep, setConnectStep] = useState(0);
  const [stepProgress, setStepProgress] = useState(0);

  useEffect(() => {
    if (phase !== "connecting") return;
    if (connectStep >= CONNECTION_STEPS.length - 1) { setPhase("done"); return; }
    const step = CONNECTION_STEPS[connectStep];
    const interval = 50;
    const increments = step.duration / interval;
    let count = 0;
    const timer = setInterval(() => {
      count++;
      setStepProgress(Math.min(count / increments, 1));
      if (count >= increments) {
        clearInterval(timer);
        setTimeout(() => { setConnectStep(s => s + 1); setStepProgress(0); }, 300);
      }
    }, interval);
    return () => clearInterval(timer);
  }, [phase, connectStep]);

  const startConnect = (gwName) => {
    setSelectedGw(gwName);
    setPhase("connecting");
    setConnectStep(0);
    setStepProgress(0);
  };

  if (phase === "select") {
    return (
      <div style={panelStyle}>
        <PanelHeader icon="🌊" title="GATEWAY SELECT" />
        <div style={{ fontSize: 11, color: C.textDim, marginBottom: 16, lineHeight: 1.5 }}>
          Choose an existing reef gateway or deploy a new one to begin operations.
        </div>
        <label style={labelStyle}>EXISTING GATEWAYS</label>
        <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
          {gateways.map(gw => (
            <button key={gw.id} onClick={() => gw.status === "online" && startConnect(gw.name)}
              style={{
                display: "flex", alignItems: "center", gap: 12, padding: "12px 14px",
                background: gw.status === "online" ? "rgba(46,204,113,0.04)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${gw.status === "online" ? C.green + "30" : "rgba(255,255,255,0.06)"}`,
                borderRadius: 4, cursor: gw.status === "online" ? "pointer" : "not-allowed",
                color: C.text, fontFamily: "'Courier New', monospace", textAlign: "left",
                opacity: gw.status === "online" ? 1 : 0.45, width: "100%",
              }}
              onMouseEnter={e => { if (gw.status === "online") e.currentTarget.style.background = "rgba(46,204,113,0.08)"; }}
              onMouseLeave={e => { if (gw.status === "online") e.currentTarget.style.background = "rgba(46,204,113,0.04)"; }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: 4,
                background: gw.status === "online" ? `linear-gradient(135deg, ${C.sea0}, ${C.sea2})` : `linear-gradient(135deg, ${C.deep0}, ${C.deep1})`,
                display: "flex", alignItems: "center", justifyContent: "center",
                border: `1px solid ${gw.status === "online" ? C.green + "30" : "rgba(255,255,255,0.06)"}`,
                fontSize: 18, flexShrink: 0,
              }}>
                {gw.status === "online" ? "🦞" : "💤"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: "bold" }}>{gw.name}</span>
                  <span style={{
                    width: 7, height: 7, borderRadius: 7,
                    background: gw.status === "online" ? C.green : C.red,
                    boxShadow: gw.status === "online" ? `0 0 6px ${C.green}60` : "none", flexShrink: 0,
                  }} />
                </div>
                <div style={{ fontSize: 9, color: C.textDim, marginTop: 3, display: "flex", gap: 12 }}>
                  <span>{gw.region}</span><span>·</span><span>{gw.agents} agents</span><span>·</span><span>{gw.lastSync}</span>
                </div>
              </div>
              <div style={{ fontSize: 14, color: gw.status === "online" ? C.amber : C.textDim, flexShrink: 0 }}>→</div>
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "4px 0 16px" }}>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>
        <button onClick={() => setPhase("new")}
          style={{
            width: "100%", padding: "14px 16px", background: "transparent",
            border: `2px dashed ${C.uiBorderDim}`, borderRadius: 4, cursor: "pointer",
            color: C.amber, fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: 1,
            display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = C.amber; e.currentTarget.style.background = `${C.amber}08`; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.uiBorderDim; e.currentTarget.style.background = "transparent"; }}
        >
          <span style={{ fontSize: 16 }}>+</span> DEPLOY NEW GATEWAY
        </button>
      </div>
    );
  }

  if (phase === "new") {
    const regions = ["Pacific Shelf", "Atlantic Ridge", "Arctic Basin", "Caribbean Reef", "Mariana Basin", "Mediterranean Bay"];
    return (
      <div style={panelStyle}>
        <PanelHeader icon="🛠️" title="DEPLOY NEW GATEWAY" />
        <label style={labelStyle}>GATEWAY NAME</label>
        <input value={newName} onChange={e => setNewName(e.target.value.slice(0, 24))} placeholder="e.g. Coral Nexus, Reef Station..." style={inputStyle} />
        <div style={counterStyle}>{newName.length}/24</div>
        <label style={labelStyle}>REEF REGION</label>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {regions.map(r => (
            <button key={r} onClick={() => setNewRegion(r)} style={{
              padding: "6px 12px", borderRadius: 3,
              background: newRegion === r ? `${C.amber}18` : "transparent",
              border: `1px solid ${newRegion === r ? C.amber : "rgba(255,255,255,0.08)"}`,
              color: newRegion === r ? C.amber : C.textDim,
              fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer",
            }} />
          ))}
          {/* re-render fix: show text */}
          {regions.map(r => null)}
        </div>
        {/* Redo region buttons properly */}
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20, marginTop: -20 }}>
          {regions.map(r => (
            <button key={r + "_v"} onClick={() => setNewRegion(r)} style={{
              padding: "6px 12px", borderRadius: 3,
              background: newRegion === r ? `${C.amber}18` : "transparent",
              border: `1px solid ${newRegion === r ? C.amber : "rgba(255,255,255,0.08)"}`,
              color: newRegion === r ? C.amber : C.textDim,
              fontFamily: "'Courier New', monospace", fontSize: 10, cursor: "pointer",
            }}>
              {r}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPhase("select")} style={btnSecondaryStyle}>← BACK</button>
          <button onClick={() => newName.trim() && newRegion && startConnect(newName.trim())}
            disabled={!newName.trim() || !newRegion}
            style={{ ...btnPrimaryStyle(C.green), flex: 1, opacity: newName.trim() && newRegion ? 1 : 0.35, cursor: newName.trim() && newRegion ? "pointer" : "not-allowed" }}>
            🦞 DEPLOY GATEWAY
          </button>
        </div>
      </div>
    );
  }

  if (phase === "connecting" || phase === "done") {
    return (
      <div style={panelStyle}>
        <PanelHeader icon={phase === "done" ? "✓" : "⟳"} title={phase === "done" ? "CONNECTED" : "CONNECTING..."} />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div style={{
            display: "inline-block", padding: 16, borderRadius: 8,
            background: phase === "done" ? `radial-gradient(circle, ${C.green}15 0%, transparent 70%)` : `radial-gradient(circle, ${C.amber}10 0%, transparent 70%)`,
          }}>
            <LobsterAvatar color={phase === "done" ? C.green : C.amber} size={56} />
          </div>
          <div style={{ fontSize: 13, fontWeight: "bold", color: C.text, marginTop: 8 }}>{selectedGw}</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 20 }}>
          {CONNECTION_STEPS.map((step, i) => {
            const isActive = i === connectStep && phase === "connecting";
            const isDone = i < connectStep || phase === "done";
            return (
              <div key={step.id} style={{
                display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 3,
                background: isActive ? `${C.amber}08` : isDone ? `${C.green}06` : "transparent",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 28, flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 11, fontWeight: "bold",
                  background: isDone ? `${C.green}20` : isActive ? `${C.amber}15` : "rgba(255,255,255,0.03)",
                  border: `2px solid ${isDone ? C.green : isActive ? C.amber : "rgba(255,255,255,0.06)"}`,
                  color: isDone ? C.green : isActive ? C.amber : C.textDim,
                }}>
                  {isDone ? "✓" : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: "bold", color: isDone ? C.green : isActive ? C.amber : C.textDim }}>
                    {step.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>{step.desc}</div>
                  {isActive && (
                    <div style={{ marginTop: 6, height: 3, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                      <div style={{
                        height: "100%", borderRadius: 3,
                        background: `linear-gradient(90deg, ${C.amber}, ${C.coral2})`,
                        width: `${stepProgress * 100}%`, boxShadow: `0 0 8px ${C.amber}40`,
                      }} />
                    </div>
                  )}
                </div>
                {isDone && <span style={{ fontSize: 9, color: C.green, flexShrink: 0 }}>{(CONNECTION_STEPS[i].duration / 1000).toFixed(1)}s</span>}
                {isActive && <Spinner color={C.amber} />}
              </div>
            );
          })}
        </div>
        {phase === "done" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div style={{ display: "flex", gap: 1, marginBottom: 16, borderRadius: 4, overflow: "hidden" }}>
              {[
                { label: "LATENCY", value: "12ms", color: C.green },
                { label: "STRENGTH", value: "98%", color: C.green },
                { label: "AGENTS", value: "READY", color: C.cyan },
              ].map((s, i) => (
                <div key={i} style={{ flex: 1, padding: "10px 8px", textAlign: "center", background: `${s.color}08` }}>
                  <div style={{ fontSize: 8, color: C.textDim, letterSpacing: 1, marginBottom: 3 }}>{s.label}</div>
                  <div style={{ fontSize: 12, fontWeight: "bold", color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>
            <button onClick={() => onConnect && onConnect(selectedGw)} style={{ ...btnPrimaryStyle(C.green), width: "100%" }}>
              🦞 ENTER THE REEF →
            </button>
          </div>
        )}
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }
  return null;
}
