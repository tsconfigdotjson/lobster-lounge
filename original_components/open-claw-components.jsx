import { useState, useEffect, useRef } from "react";

// ═══════════════════════════════════════════════════════════════
// 🦞 OPEN CLAW — COMPONENT LIBRARY
// Gateway Connect | Agent Creator (with Preview) | Agent Chat
// Displayed as standalone components for future integration
// ═══════════════════════════════════════════════════════════════

const C = {
  deep0: "#0a1628", deep1: "#0e1f3a", deep2: "#132a4a",
  sea0: "#1a3a5c", sea1: "#1e4d6e", sea2: "#236480",
  sand1: "#d4b65c", sand2: "#e6ca72", sandD: "#a08838",
  coral0: "#e74c6f", coral1: "#ff6b8a", coralD: "#b33a58",
  coral2: "#f4a261", coral3: "#e76f51",
  kelp1: "#228b4a", kelp2: "#2ecc71",
  lob0: "#c0392b", lob1: "#e74c3c", lob2: "#ff6b5c", lobD: "#8b1a10",
  shell0: "#d4a06a", shell1: "#e8be8a", shell2: "#f5d6a8", shellD: "#b08040",
  lodge1: "#a0522d", lodge2: "#cd853f",
  uiBg: "rgba(10, 22, 40, 0.94)", uiBg2: "rgba(14, 28, 50, 0.97)",
  uiBorder: "#f4a261", uiBorderDim: "rgba(244,162,97,0.25)",
  inputBg: "rgba(15, 30, 55, 0.9)", inputBorder: "rgba(244,162,97,0.35)",
  text: "#e8e0d0", textDim: "#5a7585", textBright: "#ffffff",
  green: "#2ecc71", greenDim: "rgba(46,204,113,0.15)",
  amber: "#f4a261", red: "#e74c3c", cyan: "#5dade2", purple: "#9b59b6",
  black: "#0a0a14",
  chatUser: "rgba(244,162,97,0.10)", chatAgent: "rgba(46,204,113,0.08)",
};

const ALL_SKILLS = [
  { id: "market-scan", name: "Market Scanning", icon: "📡", desc: "Monitor markets for signals and trends", cat: "Intelligence" },
  { id: "trade-exec", name: "Trade Execution", icon: "⚡", desc: "Execute trades with precision timing", cat: "Operations" },
  { id: "sentiment", name: "Sentiment Analysis", icon: "🧠", desc: "Gauge community mood and social signals", cat: "Intelligence" },
  { id: "security", name: "Threat Detection", icon: "🛡️", desc: "Monitor for security threats and exploits", cat: "Security" },
  { id: "data-agg", name: "Data Aggregation", icon: "📊", desc: "Collect and normalize multi-source data", cat: "Data" },
  { id: "report", name: "Report Generation", icon: "📋", desc: "Compile findings into structured reports", cat: "Data" },
  { id: "scout", name: "Opportunity Scouting", icon: "🔭", desc: "Discover new opportunities across chains", cat: "Intelligence" },
  { id: "alert", name: "Alert Management", icon: "🔔", desc: "Trigger notifications on key events", cat: "Operations" },
  { id: "comms", name: "Team Communication", icon: "💬", desc: "Relay updates between pod members", cat: "Coordination" },
  { id: "risk", name: "Risk Assessment", icon: "⚖️", desc: "Evaluate risk profiles and exposure", cat: "Security" },
  { id: "whale", name: "Whale Tracking", icon: "🐋", desc: "Track large wallet movements", cat: "Intelligence" },
  { id: "defi", name: "DeFi Navigation", icon: "🌊", desc: "Navigate and interact with DeFi protocols", cat: "Operations" },
];

const EXISTING_GATEWAYS = [
  { id: "gw-1", name: "Reef Alpha", status: "online", agents: 4, lastSync: "2 min ago", region: "Pacific Shelf" },
  { id: "gw-2", name: "Deep Trench Node", status: "online", agents: 6, lastSync: "30 sec ago", region: "Mariana Basin" },
  { id: "gw-3", name: "Coral Outpost", status: "offline", agents: 2, lastSync: "3 hrs ago", region: "Caribbean Reef" },
];

const CONNECTION_STEPS = [
  { id: "discover", label: "Discovering gateway", desc: "Scanning local reef network...", duration: 1800 },
  { id: "handshake", label: "Claw handshake", desc: "Establishing secure pinch protocol...", duration: 2200 },
  { id: "auth", label: "Pod authentication", desc: "Verifying shell credentials...", duration: 1600 },
  { id: "sync", label: "Syncing tide data", desc: "Downloading current maps and agent roster...", duration: 2400 },
  { id: "ready", label: "Gateway connected", desc: "All systems nominal. Welcome to the reef.", duration: 0 },
];

// ─── HELPERS ──────────────────────────────────────────────────
function shadeColor(hex, amt) {
  if (hex.startsWith("rgb")) return hex;
  let r = parseInt(hex.slice(1, 3), 16) + amt;
  let g = parseInt(hex.slice(3, 5), 16) + amt;
  let b = parseInt(hex.slice(5, 7), 16) + amt;
  return `rgb(${Math.max(0, Math.min(255, r))},${Math.max(0, Math.min(255, g))},${Math.max(0, Math.min(255, b))})`;
}

// ─── LOBSTER AVATAR ───────────────────────────────────────────
function LobsterAvatar({ color, size = 48, style: extra }) {
  const ref = useRef(null);
  const f = useRef(Math.random() * 100);
  useEffect(() => {
    let raf;
    const draw = () => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      const fr = f.current++;
      ctx.clearRect(0, 0, 16, 16);
      const bob = Math.sin(fr * 0.08) > 0 ? -1 : 0;
      const c = color;
      ctx.fillStyle = c;
      ctx.fillRect(4, 5 + bob, 8, 7);
      ctx.fillStyle = shadeColor(c, 25);
      ctx.fillRect(5, 5 + bob, 3, 2);
      ctx.fillStyle = shadeColor(c, -15);
      ctx.fillRect(4, 8 + bob, 8, 1);
      ctx.fillStyle = shadeColor(c, 10);
      ctx.fillRect(5, 2 + bob, 6, 4);
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(4, 2 + bob, 2, 2);
      ctx.fillRect(10, 2 + bob, 2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(4, 1 + bob, 1, 1);
      ctx.fillRect(11, 1 + bob, 1, 1);
      ctx.fillStyle = shadeColor(c, -20);
      const a = Math.sin(fr * 0.1) * 1.5;
      ctx.fillRect(3 + Math.round(a), bob, 1, 2);
      ctx.fillRect(12 - Math.round(a), bob, 1, 2);
      const snap = Math.sin(fr * 0.06) > 0.7 ? 1 : 0;
      ctx.fillStyle = shadeColor(c, 15);
      ctx.fillRect(1, 5 + bob, 3, 3);
      ctx.fillRect(0, 4 + bob, 2, 2 + snap);
      ctx.fillStyle = shadeColor(c, -10);
      ctx.fillRect(0, 7 + bob - snap, 2, 2);
      ctx.fillStyle = shadeColor(c, 15);
      ctx.fillRect(12, 5 + bob, 3, 3);
      ctx.fillRect(14, 4 + bob, 2, 2 + snap);
      ctx.fillStyle = shadeColor(c, -10);
      ctx.fillRect(14, 7 + bob - snap, 2, 2);
      ctx.fillStyle = shadeColor(c, -25);
      ctx.fillRect(6, 12 + bob, 4, 3);
      ctx.fillRect(4, 14, 3, 1);
      ctx.fillRect(9, 14, 3, 1);
      ctx.fillStyle = shadeColor(c, -30);
      for (let i = 0; i < 3; i++) {
        const lb = Math.sin(fr * 0.12 + i * 1.5) > 0 ? 1 : 0;
        ctx.fillRect(2, 8 + i * 2 + bob + lb, 2, 1);
        ctx.fillRect(12, 8 + i * 2 + bob - lb, 2, 1);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [color]);
  return <canvas ref={ref} width={16} height={16} style={{ width: size, height: size, imageRendering: "pixelated", ...extra }} />;
}

// ─── OCEAN BACKGROUND ─────────────────────────────────────────
function OceanBg() {
  const ref = useRef(null);
  const bubblesRef = useRef(Array.from({ length: 20 }, () => ({
    x: Math.random() * 300, y: Math.random() * 400,
    s: 0.1 + Math.random() * 0.3, sz: 1 + Math.floor(Math.random() * 2),
    w: Math.random() * Math.PI * 2,
  })));
  useEffect(() => {
    let raf, fr = 0;
    const render = () => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      fr++;
      for (let y = 0; y < 400; y++) {
        const t = y / 400;
        ctx.fillStyle = `rgb(${Math.round(10 + t * 16)},${Math.round(22 + t * 32)},${Math.round(40 + t * 42)})`;
        ctx.fillRect(0, y, 300, 1);
      }
      for (let i = 0; i < 6; i++) {
        const cx = (Math.sin(fr * 0.018 + i * 1.7) * 0.5 + 0.5) * 300;
        const cy = (Math.cos(fr * 0.012 + i * 2.3) * 0.5 + 0.5) * 400;
        ctx.fillStyle = "rgba(93,173,226,0.04)";
        ctx.fillRect(cx - 20, cy - 1, 40, 2);
      }
      bubblesRef.current.forEach(b => {
        b.y -= b.s;
        b.x += Math.sin(fr * 0.02 + b.w) * 0.15;
        if (b.y < -4) { b.y = 404; b.x = Math.random() * 300; }
        ctx.fillStyle = "rgba(180,220,255,0.3)";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.sz, b.sz);
        ctx.fillStyle = "rgba(220,240,255,0.5)";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
      });
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);
  return <canvas ref={ref} width={300} height={400} style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", imageRendering: "pixelated", opacity: 0.5, pointerEvents: "none", zIndex: 0 }} />;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT 1: GATEWAY CONNECTION
// ═══════════════════════════════════════════════════════════════

function GatewayScreen({ onConnect }) {
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
          {EXISTING_GATEWAYS.map(gw => (
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

function Spinner({ color }) {
  return (
    <div style={{
      width: 14, height: 14, border: `2px solid ${color}30`,
      borderTop: `2px solid ${color}`, borderRadius: 14,
      animation: "spin 0.8s linear infinite", flexShrink: 0,
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT 2: AGENT CREATOR
// ═══════════════════════════════════════════════════════════════

function AgentCreator({ onDeploy }) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [skills, setSkills] = useState([]);
  const [color, setColor] = useState("#e74c3c");
  const [phase, setPhase] = useState("edit");
  const [showDrop, setShowDrop] = useState(false);
  const dropRef = useRef(null);
  const MAX = 3;
  const colors = ["#e74c3c", "#ff6b8a", "#f4a261", "#2ecc71", "#1abc9c", "#5dade2", "#9b59b6", "#e67e22"];

  const filtered = ALL_SKILLS.filter(s =>
    !skills.find(sel => sel.id === s.id) &&
    (s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
     s.cat.toLowerCase().includes(skillSearch.toLowerCase()) ||
     s.desc.toLowerCase().includes(skillSearch.toLowerCase()))
  );
  const isValid = name.trim().length > 0 && desc.trim().length > 0 && skills.length > 0;

  useEffect(() => {
    const h = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setShowDrop(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (phase === "deployed") {
    return (
      <div style={panelStyle}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16, padding: "32px 0 16px" }}>
          <div style={{
            width: 80, height: 80, borderRadius: 80, background: `${C.green}15`,
            border: `3px solid ${C.green}40`, display: "flex", alignItems: "center",
            justifyContent: "center", animation: "fadeIn 0.4s ease",
          }}>
            <span style={{ fontSize: 36, color: C.green }}>✓</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 14, fontWeight: "bold", color: C.green, letterSpacing: 2 }}>AGENT DEPLOYED</div>
            <div style={{ fontSize: 12, color, marginTop: 6, fontWeight: "bold" }}>{name.toUpperCase()}</div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>has joined the pod</div>
          </div>
          <LobsterAvatar color={color} size={56} />
          <button onClick={() => { setPhase("edit"); setName(""); setDesc(""); setSkills([]); onDeploy && onDeploy({ name, desc, skills, color }); }}
            style={{ ...btnPrimaryStyle(C.amber), marginTop: 8 }}>
            SPAWN ANOTHER
          </button>
        </div>
        <style>{`@keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }`}</style>
      </div>
    );
  }

  if (phase === "preview") {
    return (
      <div style={panelStyle}>
        <PanelHeader icon="🔍" title="PREVIEW AGENT" />
        <div style={{
          background: `linear-gradient(135deg, ${C.deep1}, ${C.deep2})`,
          border: `1px solid ${color}30`, borderRadius: 6, padding: 20, marginBottom: 16,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ position: "absolute", top: 0, right: 0, width: 60, height: 60, background: `linear-gradient(135deg, transparent 50%, ${color}10 50%)` }} />
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div style={{ background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`, padding: 8, borderRadius: 6, border: `1px solid ${color}25` }}>
              <LobsterAvatar color={color} size={64} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <span style={{ fontSize: 18, fontWeight: "bold", color, letterSpacing: 2 }}>{name.toUpperCase()}</span>
                <span style={{ padding: "2px 8px", borderRadius: 2, background: `${C.amber}15`, border: `1px solid ${C.amber}40`, fontSize: 8, color: C.amber, letterSpacing: 1 }}>NEW</span>
              </div>
              <div style={{ fontSize: 11, color: C.text, lineHeight: 1.55, marginBottom: 12, opacity: 0.85 }}>{desc}</div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {skills.map(s => (
                  <div key={s.id} style={{ padding: "4px 10px", borderRadius: 3, background: `${color}12`, border: `1px solid ${color}30`, fontSize: 10, color, display: "flex", alignItems: "center", gap: 4 }}>
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 4, padding: 14, marginBottom: 16, border: "1px solid rgba(255,255,255,0.04)" }}>
          <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 2, marginBottom: 10 }}>DEPLOYMENT SPECS</div>
          {[
            ["Designation", name.toUpperCase()],
            ["Shell Color", color],
            ["Skills Loaded", skills.length + "/" + MAX],
            ["Mode", "Autonomous"],
            ["Pod Assignment", "Default"],
            ["Est. Boot Time", "~3.2s"],
          ].map(([k, v], i) => (
            <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: i < 5 ? "1px solid rgba(255,255,255,0.03)" : "none", fontSize: 10 }}>
              <span style={{ color: C.textDim }}>{k}</span>
              <span style={{ color: k === "Shell Color" ? v : C.text, fontWeight: "bold" }}>
                {k === "Shell Color" ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                    <span style={{ width: 10, height: 10, borderRadius: 2, background: v, display: "inline-block" }} />
                    {v}
                  </span>
                ) : v}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setPhase("edit")} style={{ ...btnSecondaryStyle, flex: 1 }}>← EDIT</button>
          <button onClick={() => setPhase("deployed")} style={{ ...btnPrimaryStyle(C.green), flex: 2 }}>🦞 CONFIRM AND DEPLOY</button>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <PanelHeader icon="✦" title="SPAWN NEW AGENT" />
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 16 }}>
        <div style={{ background: `${color}10`, border: `1px solid ${color}25`, borderRadius: 4, padding: 6 }}>
          <LobsterAvatar color={color} size={48} />
        </div>
        <div style={{ flex: 1 }}>
          <label style={labelStyle}>SHELL COLOR</label>
          <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}>
            {colors.map(c => (
              <button key={c} onClick={() => setColor(c)} style={{
                width: 22, height: 22, borderRadius: 3, background: c,
                border: color === c ? "2px solid #fff" : "2px solid transparent",
                cursor: "pointer", transform: color === c ? "scale(1.15)" : "scale(1)",
              }} />
            ))}
          </div>
        </div>
      </div>
      <label style={labelStyle}>AGENT DESIGNATION</label>
      <input value={name} onChange={e => setName(e.target.value.slice(0, 12))} placeholder="e.g. CLAWZ, REEF, CORAL..." maxLength={12} style={inputStyle} />
      <div style={counterStyle}>{name.length}/12</div>
      <label style={labelStyle}>MISSION BRIEF</label>
      <textarea value={desc} onChange={e => setDesc(e.target.value.slice(0, 160))} placeholder="Describe what this agent should do..." maxLength={160} rows={3} style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }} />
      <div style={counterStyle}>{desc.length}/160</div>
      <label style={labelStyle}>SKILLS <span style={{ color: C.textDim, fontWeight: "normal" }}>({skills.length}/{MAX})</span></label>
      {skills.length > 0 && (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8, marginTop: 4 }}>
          {skills.map(s => (
            <div key={s.id} style={{ padding: "4px 8px 4px 10px", borderRadius: 3, background: `${color}15`, border: `1px solid ${color}35`, fontSize: 10, color, display: "flex", alignItems: "center", gap: 6 }}>
              {s.icon} {s.name}
              <button onClick={() => setSkills(skills.filter(sk => sk.id !== s.id))} style={{ background: "none", border: "none", color: C.textDim, cursor: "pointer", padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
            </div>
          ))}
        </div>
      )}
      <div ref={dropRef} style={{ position: "relative", marginBottom: 16 }}>
        <input value={skillSearch} onChange={e => { setSkillSearch(e.target.value); setShowDrop(true); }} onFocus={() => setShowDrop(true)}
          placeholder={skills.length >= MAX ? "Max skills reached" : "Search skills..."} disabled={skills.length >= MAX}
          style={{ ...inputStyle, opacity: skills.length >= MAX ? 0.4 : 1 }} />
        <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 10, color: C.textDim, pointerEvents: "none" }}>🔍</span>
        {showDrop && skills.length < MAX && (
          <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 10, background: C.deep0, border: `1px solid ${C.uiBorder}`, borderTop: "none", borderRadius: "0 0 4px 4px", maxHeight: 170, overflowY: "auto" }}>
            {filtered.length === 0 ? (
              <div style={{ padding: 12, fontSize: 10, color: C.textDim, textAlign: "center" }}>No matching skills</div>
            ) : filtered.map(s => (
              <button key={s.id} onClick={() => { setSkills([...skills, s]); setSkillSearch(""); setShowDrop(false); }}
                style={{ display: "flex", alignItems: "center", gap: 10, width: "100%", padding: "8px 12px", background: "transparent", border: "none", cursor: "pointer", color: C.text, fontFamily: "'Courier New', monospace", fontSize: 10, textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.03)" }}
                onMouseEnter={e => e.currentTarget.style.background = `${C.amber}08`}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                <span style={{ fontSize: 15, width: 22, textAlign: "center" }}>{s.icon}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: "bold" }}>{s.name}</div>
                  <div style={{ color: C.textDim, fontSize: 9, marginTop: 1 }}>{s.desc}</div>
                </div>
                <span style={{ fontSize: 8, color: C.amber, padding: "2px 6px", background: `${C.amber}12`, borderRadius: 2 }}>{s.cat}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button onClick={() => isValid && setPhase("preview")} disabled={!isValid}
        style={{ ...btnPrimaryStyle(isValid ? color : "#444"), width: "100%", opacity: isValid ? 1 : 0.35, cursor: isValid ? "pointer" : "not-allowed" }}>
        PREVIEW AGENT →
      </button>
      {!isValid && <div style={{ fontSize: 9, color: C.textDim, marginTop: 6, textAlign: "center" }}>Fill in name, mission, and at least 1 skill</div>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT 3: AGENT CHAT
// ═══════════════════════════════════════════════════════════════

const CHAT_AGENTS = [
  { id: "CLAWZ", role: "Coordinator", color: "#e74c3c", status: "active" },
  { id: "CORAL", role: "Scanner", color: "#ff6b8a", status: "active" },
  { id: "PINCH", role: "Executor", color: "#f4a261", status: "busy" },
  { id: "REEF", role: "Security", color: "#9b59b6", status: "active" },
  { id: "TIDE", role: "Scout", color: "#2ecc71", status: "idle" },
  { id: "SHELL", role: "Analyst", color: "#1abc9c", status: "active" },
];

const RESPONSES = {
  CLAWZ: ["Pod sync complete. All agents nominal. CORAL flagged 3 signals in sector 7 — TIDE assigned to investigate.", "Restructuring priorities. REEF scan clean, reallocating to offense. Let's capitalize."],
  CORAL: ["Unusual volume eastern reef — possible whale activity. Cross-referencing now, confidence score in ~2 min.", "Three pools mapped. Pool B strongest — 0.73 correlation with last week's breakout. Flagging to CLAWZ."],
  PINCH: ["Trade #423 executed, optimal slippage. Fill rate: 99.2%. Net position healthy.", "Standing by. 4 orders pre-staged from CORAL's scan. Awaiting CLAWZ confirmation."],
  REEF: ["Perimeter clear — no threats in 6 hours. Two suspicious patterns near outer shelf, low confidence. Watching.", "Security: GREEN. Comms encrypted. External probes deflected — background noise only."],
  TIDE: ["Deep current report: promising channel sector 12. Low competition, decent flow. CORAL should scope entries.", "Explored 3 zones. 12-B has potential — marked on shared map. SHELL should run numbers."],
  SHELL: ["Sector 7 done. Volatility 2.3x baseline, correlation cluster forming assets C and D. Report shared.", "Anomaly detection running. Preliminary: thermocline shift — opportunities in 4-6 hours. Will update."],
};

function AgentChat() {
  const [active, setActive] = useState(CHAT_AGENTS[0]);
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const msgs = messages[active.id] || [];
  const sc = { active: C.green, busy: C.amber, idle: C.textDim };

  const send = () => {
    if (!input.trim() || typing) return;
    const text = input.trim();
    setInput("");
    setMessages(p => ({ ...p, [active.id]: [...(p[active.id] || []), { from: "user", text }] }));
    setTyping(true);
    setTimeout(() => {
      const pool = RESPONSES[active.id];
      setMessages(p => ({ ...p, [active.id]: [...(p[active.id] || []), { from: "agent", text: pool[Math.floor(Math.random() * pool.length)] }] }));
      setTyping(false);
    }, 1000 + Math.random() * 1200);
  };

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs.length, typing]);

  return (
    <div style={{ ...panelStyle, padding: 0, display: "flex", flexDirection: "column", height: 560 }}>
      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.05)", overflowX: "auto", flexShrink: 0 }}>
        {CHAT_AGENTS.map(a => (
          <button key={a.id} onClick={() => setActive(a)} style={{
            padding: "10px 12px", background: active.id === a.id ? `${a.color}10` : "transparent",
            border: "none", borderBottom: `2px solid ${active.id === a.id ? a.color : "transparent"}`,
            cursor: "pointer", color: active.id === a.id ? a.color : C.textDim,
            fontFamily: "'Courier New', monospace", fontSize: 9, fontWeight: "bold",
            letterSpacing: 1, display: "flex", alignItems: "center", gap: 5, whiteSpace: "nowrap",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: 6, background: sc[a.status], boxShadow: a.status === "active" ? `0 0 4px ${C.green}60` : "none" }} />
            {a.id}
          </button>
        ))}
      </div>
      <div style={{ padding: "10px 16px", display: "flex", alignItems: "center", gap: 12, borderBottom: "1px solid rgba(255,255,255,0.03)", flexShrink: 0 }}>
        <LobsterAvatar color={active.color} size={32} />
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, fontWeight: "bold", color: active.color }}>{active.id}</div>
          <div style={{ fontSize: 9, color: C.textDim }}>{active.role} · {active.status.toUpperCase()}</div>
        </div>
        <div style={{ padding: "3px 8px", borderRadius: 2, background: `${sc[active.status]}12`, border: `1px solid ${sc[active.status]}35`, fontSize: 8, color: sc[active.status], letterSpacing: 1 }}>
          {active.status.toUpperCase()}
        </div>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 10 }}>
        {msgs.length === 0 && !typing && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, opacity: 0.4 }}>
            <LobsterAvatar color={active.color} size={44} />
            <div style={{ fontSize: 10, color: C.textDim, textAlign: "center", lineHeight: 1.6 }}>
              Send a message to {active.id}<br /><span style={{ fontSize: 9 }}>Try: "Status report" or "What did you find?"</span>
            </div>
          </div>
        )}
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", flexDirection: m.from === "user" ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
            {m.from === "agent" && <LobsterAvatar color={active.color} size={22} style={{ flexShrink: 0 }} />}
            <div style={{
              maxWidth: "78%", padding: "8px 12px",
              borderRadius: m.from === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
              background: m.from === "user" ? C.chatUser : C.chatAgent,
              border: `1px solid ${m.from === "user" ? `${C.amber}18` : `${active.color}18`}`,
              fontSize: 11, lineHeight: 1.55, color: C.text,
            }}>
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <LobsterAvatar color={active.color} size={22} style={{ flexShrink: 0 }} />
            <div style={{ padding: "10px 16px", borderRadius: "8px 8px 8px 2px", background: C.chatAgent, border: `1px solid ${active.color}18` }}>
              <TypingDots color={active.color} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: 8, flexShrink: 0 }}>
        <input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && send()}
          placeholder={`Message ${active.id}...`} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
        <button onClick={send} disabled={!input.trim() || typing}
          style={{ ...btnPrimaryStyle(active.color), opacity: input.trim() && !typing ? 1 : 0.3, padding: "8px 16px", fontSize: 10 }}>
          SEND
        </button>
      </div>
    </div>
  );
}

function TypingDots({ color }) {
  return (
    <div style={{ display: "flex", gap: 4, alignItems: "center", height: 12 }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 5, height: 5, borderRadius: 5, background: color, animation: `bounce 1s ${i * 0.15}s infinite ease-in-out` }} />
      ))}
      <style>{`@keyframes bounce { 0%,60%,100% { transform:translateY(0); opacity:0.3; } 30% { transform:translateY(-4px); opacity:1; } }`}</style>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// SHARED STYLES
// ═══════════════════════════════════════════════════════════════

const panelStyle = {
  background: C.uiBg, border: `2px solid ${C.uiBorder}`,
  borderRadius: 6, padding: 20, width: 400, position: "relative", overflow: "hidden",
};
const labelStyle = { display: "block", fontSize: 9, letterSpacing: 2, color: C.amber, marginBottom: 6, fontWeight: "bold", fontFamily: "'Courier New', monospace" };
const inputStyle = { width: "100%", padding: "10px 12px", background: C.inputBg, border: `1px solid ${C.inputBorder}`, borderRadius: 3, color: C.text, fontFamily: "'Courier New', monospace", fontSize: 12, outline: "none", boxSizing: "border-box" };
const counterStyle = { fontSize: 9, color: C.textDim, marginTop: 2, marginBottom: 14, textAlign: "right" };
function btnPrimaryStyle(c) { return { padding: "11px 20px", background: `${c}18`, border: `2px solid ${c}`, borderRadius: 4, color: c, fontFamily: "'Courier New', monospace", fontSize: 11, fontWeight: "bold", letterSpacing: 2, cursor: "pointer" }; }
const btnSecondaryStyle = { padding: "11px 20px", background: "transparent", border: `1px solid ${C.textDim}`, borderRadius: 4, color: C.textDim, fontFamily: "'Courier New', monospace", fontSize: 11, letterSpacing: 1, cursor: "pointer" };
function PanelHeader({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ fontSize: 12, fontWeight: "bold", letterSpacing: 3, color: C.amber }}>{title}</div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ROOT — ALL COMPONENTS DISPLAYED
// ═══════════════════════════════════════════════════════════════

export default function OpenClawComponents() {
  return (
    <div style={{
      background: `linear-gradient(180deg, ${C.deep0} 0%, ${C.deep2} 50%, ${C.sea0} 100%)`,
      minHeight: "100vh", display: "flex", flexDirection: "column",
      alignItems: "center", padding: "24px 16px 60px", gap: 32,
      fontFamily: "'Courier New', monospace", color: C.text, position: "relative",
    }}>
      <OceanBg />

      {/* Title */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, justifyContent: "center" }}>
          <span style={{ fontSize: 26 }}>🦞</span>
          <div>
            <div style={{ fontSize: 20, fontWeight: "bold", color: C.lob1, letterSpacing: 5, textShadow: `0 0 30px rgba(231,76,60,0.3)` }}>OPEN CLAW</div>
            <div style={{ fontSize: 9, color: C.textDim, letterSpacing: 3, marginTop: 2 }}>COMPONENT LIBRARY — LOBSTER AGENT PLATFORM</div>
          </div>
          <span style={{ fontSize: 26 }}>🦞</span>
        </div>
      </div>

      {/* Component: Gateway */}
      <Section label="GATEWAY CONNECTION" desc="Login flow — select existing gateway or deploy new, with connection progression">
        <GatewayScreen onConnect={() => {}} />
      </Section>

      {/* Component: Agent Creator */}
      <Section label="AGENT CREATOR" desc="Spawn flow — configure, preview specs, confirm and deploy">
        <AgentCreator onDeploy={() => {}} />
      </Section>

      {/* Component: Agent Chat */}
      <Section label="AGENT CHAT" desc="Direct messaging — talk to any agent in the pod">
        <AgentChat />
      </Section>
    </div>
  );
}

function Section({ label, desc, children }) {
  return (
    <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.amber, letterSpacing: 3, fontWeight: "bold" }}>{label}</div>
        <div style={{ fontSize: 9, color: C.textDim, marginTop: 3 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}
