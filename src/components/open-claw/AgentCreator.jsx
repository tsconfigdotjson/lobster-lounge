import { useEffect, useRef, useState } from "react";
import { C } from "./constants";
import LobsterAvatar from "./LobsterAvatar";
import PanelHeader from "./PanelHeader";
import {
  btnPrimaryStyle,
  btnSecondaryStyle,
  counterStyle,
  inputStyle,
  labelStyle,
  panelStyle,
} from "./styles";

export default function AgentCreator({
  skills: availableSkills = [],
  onDeploy,
}) {
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [skillSearch, setSkillSearch] = useState("");
  const [skills, setSkills] = useState([]);
  const [color, setColor] = useState("#e74c3c");
  const [phase, setPhase] = useState("edit");
  const [showDrop, setShowDrop] = useState(false);
  const dropRef = useRef(null);
  const MAX = 3;
  const colors = [
    "#e74c3c",
    "#ff6b8a",
    "#f4a261",
    "#2ecc71",
    "#1abc9c",
    "#5dade2",
    "#9b59b6",
    "#e67e22",
  ];

  const filtered = availableSkills.filter(
    (s) =>
      !skills.find((sel) => sel.id === s.id) &&
      (s.name.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.cat.toLowerCase().includes(skillSearch.toLowerCase()) ||
        s.desc.toLowerCase().includes(skillSearch.toLowerCase())),
  );
  const isValid =
    name.trim().length > 0 && desc.trim().length > 0 && skills.length > 0;

  useEffect(() => {
    const h = (e) => {
      if (dropRef.current && !dropRef.current.contains(e.target)) {
        setShowDrop(false);
      }
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  if (phase === "deployed") {
    return (
      <div style={panelStyle}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            padding: "32px 0 16px",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 80,
              background: `${C.green}15`,
              border: `3px solid ${C.green}40`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: "fadeIn 0.4s ease",
            }}
          >
            <span style={{ fontSize: 36, color: C.green }}>✓</span>
          </div>
          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: "bold",
                color: C.green,
                letterSpacing: 2,
              }}
            >
              AGENT DEPLOYED
            </div>
            <div
              style={{ fontSize: 12, color, marginTop: 6, fontWeight: "bold" }}
            >
              {name.toUpperCase()}
            </div>
            <div style={{ fontSize: 10, color: C.textDim, marginTop: 4 }}>
              has joined the pod
            </div>
          </div>
          <LobsterAvatar color={color} size={56} />
          <button
            type="button"
            onClick={() => {
              setPhase("edit");
              setName("");
              setDesc("");
              setSkills([]);
              onDeploy?.({ name, desc, skills, color });
            }}
            style={{ ...btnPrimaryStyle(C.amber), marginTop: 8 }}
          >
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
        <div
          style={{
            background: `linear-gradient(135deg, ${C.deep1}, ${C.deep2})`,
            border: `1px solid ${color}30`,
            borderRadius: 6,
            padding: 20,
            marginBottom: 16,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              right: 0,
              width: 60,
              height: 60,
              background: `linear-gradient(135deg, transparent 50%, ${color}10 50%)`,
            }}
          />
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            <div
              style={{
                background: `radial-gradient(circle, ${color}20 0%, transparent 70%)`,
                padding: 8,
                borderRadius: 6,
                border: `1px solid ${color}25`,
              }}
            >
              <LobsterAvatar color={color} size={64} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  marginBottom: 6,
                }}
              >
                <span
                  style={{
                    fontSize: 18,
                    fontWeight: "bold",
                    color,
                    letterSpacing: 2,
                  }}
                >
                  {name.toUpperCase()}
                </span>
                <span
                  style={{
                    padding: "2px 8px",
                    borderRadius: 2,
                    background: `${C.amber}15`,
                    border: `1px solid ${C.amber}40`,
                    fontSize: 8,
                    color: C.amber,
                    letterSpacing: 1,
                  }}
                >
                  NEW
                </span>
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: C.text,
                  lineHeight: 1.55,
                  marginBottom: 12,
                  opacity: 0.85,
                }}
              >
                {desc}
              </div>
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {skills.map((s) => (
                  <div
                    key={s.id}
                    style={{
                      padding: "4px 10px",
                      borderRadius: 3,
                      background: `${color}12`,
                      border: `1px solid ${color}30`,
                      fontSize: 10,
                      color,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {s.icon} {s.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div
          style={{
            background: "rgba(255,255,255,0.02)",
            borderRadius: 4,
            padding: 14,
            marginBottom: 16,
            border: "1px solid rgba(255,255,255,0.04)",
          }}
        >
          <div
            style={{
              fontSize: 9,
              color: C.textDim,
              letterSpacing: 2,
              marginBottom: 10,
            }}
          >
            DEPLOYMENT SPECS
          </div>
          {[
            ["Designation", name.toUpperCase()],
            ["Shell Color", color],
            ["Skills Loaded", `${skills.length}/${MAX}`],
            ["Mode", "Autonomous"],
            ["Pod Assignment", "Default"],
            ["Est. Boot Time", "~3.2s"],
          ].map(([k, v]) => (
            <div
              key={k}
              style={{
                display: "flex",
                justifyContent: "space-between",
                padding: "5px 0",
                borderBottom:
                  i < 5 ? "1px solid rgba(255,255,255,0.03)" : "none",
                fontSize: 10,
              }}
            >
              <span style={{ color: C.textDim }}>{k}</span>
              <span
                style={{
                  color: k === "Shell Color" ? v : C.text,
                  fontWeight: "bold",
                }}
              >
                {k === "Shell Color" ? (
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 2,
                        background: v,
                        display: "inline-block",
                      }}
                    />
                    {v}
                  </span>
                ) : (
                  v
                )}
              </span>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            type="button"
            onClick={() => setPhase("edit")}
            style={{ ...btnSecondaryStyle, flex: 1 }}
          >
            ← EDIT
          </button>
          <button
            type="button"
            onClick={() => setPhase("deployed")}
            style={{ ...btnPrimaryStyle(C.green), flex: 2 }}
          >
            🦞 CONFIRM AND DEPLOY
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={panelStyle}>
      <PanelHeader icon="✦" title="SPAWN NEW AGENT" />
      <div
        style={{
          display: "flex",
          gap: 14,
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div
          style={{
            background: `${color}10`,
            border: `1px solid ${color}25`,
            borderRadius: 4,
            padding: 6,
          }}
        >
          <LobsterAvatar color={color} size={48} />
        </div>
        <div style={{ flex: 1 }}>
          <span style={labelStyle}>SHELL COLOR</span>
          <div
            style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 4 }}
          >
            {colors.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 3,
                  background: c,
                  border:
                    color === c ? "2px solid #fff" : "2px solid transparent",
                  cursor: "pointer",
                  transform: color === c ? "scale(1.15)" : "scale(1)",
                }}
              />
            ))}
          </div>
        </div>
      </div>
      <label style={labelStyle} htmlFor="agent-name">
        AGENT DESIGNATION
      </label>
      <input
        id="agent-name"
        value={name}
        onChange={(e) => setName(e.target.value.slice(0, 12))}
        placeholder="e.g. CLAWZ, REEF, CORAL..."
        maxLength={12}
        style={inputStyle}
      />
      <div style={counterStyle}>{name.length}/12</div>
      <label style={labelStyle} htmlFor="agent-mission">
        MISSION BRIEF
      </label>
      <textarea
        id="agent-mission"
        value={desc}
        onChange={(e) => setDesc(e.target.value.slice(0, 160))}
        placeholder="Describe what this agent should do..."
        maxLength={160}
        rows={3}
        style={{ ...inputStyle, resize: "none", lineHeight: 1.5 }}
      />
      <div style={counterStyle}>{desc.length}/160</div>
      <span style={labelStyle}>
        SKILLS{" "}
        <span style={{ color: C.textDim, fontWeight: "normal" }}>
          ({skills.length}/{MAX})
        </span>
      </span>
      {skills.length > 0 && (
        <div
          style={{
            display: "flex",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 8,
            marginTop: 4,
          }}
        >
          {skills.map((s) => (
            <div
              key={s.id}
              style={{
                padding: "4px 8px 4px 10px",
                borderRadius: 3,
                background: `${color}15`,
                border: `1px solid ${color}35`,
                fontSize: 10,
                color,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              {s.icon} {s.name}
              <button
                type="button"
                onClick={() => setSkills(skills.filter((sk) => sk.id !== s.id))}
                style={{
                  background: "none",
                  border: "none",
                  color: C.textDim,
                  cursor: "pointer",
                  padding: 0,
                  fontSize: 13,
                  lineHeight: 1,
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div ref={dropRef} style={{ position: "relative", marginBottom: 16 }}>
        <input
          value={skillSearch}
          onChange={(e) => {
            setSkillSearch(e.target.value);
            setShowDrop(true);
          }}
          onFocus={() => setShowDrop(true)}
          placeholder={
            skills.length >= MAX ? "Max skills reached" : "Search skills..."
          }
          disabled={skills.length >= MAX}
          style={{ ...inputStyle, opacity: skills.length >= MAX ? 0.4 : 1 }}
        />
        <span
          style={{
            position: "absolute",
            right: 10,
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: 10,
            color: C.textDim,
            pointerEvents: "none",
          }}
        >
          🔍
        </span>
        {showDrop && skills.length < MAX && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              zIndex: 10,
              background: C.deep0,
              border: `1px solid ${C.uiBorder}`,
              borderTop: "none",
              borderRadius: "0 0 4px 4px",
              maxHeight: 170,
              overflowY: "auto",
            }}
          >
            {filtered.length === 0 ? (
              <div
                style={{
                  padding: 12,
                  fontSize: 10,
                  color: C.textDim,
                  textAlign: "center",
                }}
              >
                No matching skills
              </div>
            ) : (
              filtered.map((s) => (
                <button
                  type="button"
                  key={s.id}
                  onClick={() => {
                    setSkills([...skills, s]);
                    setSkillSearch("");
                    setShowDrop(false);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    width: "100%",
                    padding: "8px 12px",
                    background: "transparent",
                    border: "none",
                    cursor: "pointer",
                    color: C.text,
                    fontFamily: "'Courier New', monospace",
                    fontSize: 10,
                    textAlign: "left",
                    borderBottom: "1px solid rgba(255,255,255,0.03)",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.background = `${C.amber}08`)
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = "transparent")
                  }
                >
                  <span
                    style={{ fontSize: 15, width: 22, textAlign: "center" }}
                  >
                    {s.icon}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: "bold" }}>{s.name}</div>
                    <div
                      style={{ color: C.textDim, fontSize: 9, marginTop: 1 }}
                    >
                      {s.desc}
                    </div>
                  </div>
                  <span
                    style={{
                      fontSize: 8,
                      color: C.amber,
                      padding: "2px 6px",
                      background: `${C.amber}12`,
                      borderRadius: 2,
                    }}
                  >
                    {s.cat}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
      <button
        type="button"
        onClick={() => isValid && setPhase("preview")}
        disabled={!isValid}
        style={{
          ...btnPrimaryStyle(isValid ? color : "#444"),
          width: "100%",
          opacity: isValid ? 1 : 0.35,
          cursor: isValid ? "pointer" : "not-allowed",
        }}
      >
        PREVIEW AGENT →
      </button>
      {!isValid && (
        <div
          style={{
            fontSize: 9,
            color: C.textDim,
            marginTop: 6,
            textAlign: "center",
          }}
        >
          Fill in name, mission, and at least 1 skill
        </div>
      )}
    </div>
  );
}
