import { useEffect, useRef, useState } from "react";
import { useGateway } from "../context/GatewayContext";
import { setAgentColor } from "../services/data-mappers";
import type { EditAgentData } from "../types";
import {
  ActivityLog,
  AgentChat,
  AgentCreator,
  Divider,
  DraggablePanel,
  HudItem,
  LobsterHQ,
} from ".";
import { C } from "./constants";
import SkillsPanel from "./SkillsPanel";
import { btnSecondaryStyle } from "./styles";

export default function DashboardView() {
  const {
    agents,
    chatAgents,
    activityLogs,
    sendAgentMessage,
    disconnect,
    serverInfo,
    helloPayload,
    createAgent,
    updateAgent,
    updateSkill,
    refreshSkills,
    remapAgents,
    allSkills,
  } = useGateway();
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [chatState, setChatState] = useState<
    "collapsed" | "normal" | "expanded"
  >("collapsed");
  const [chatInitialAgentId, setChatInitialAgentId] = useState<string | null>(
    null,
  );
  const [skillsCollapsed, setSkillsCollapsed] = useState(true);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`;
  });
  const [tick, setTick] = useState(0);
  const [currentStrength, setCurrentStrength] = useState("STRONG");
  const [showCreator, setShowCreator] = useState(false);
  const [editingAgent, setEditingAgent] = useState<EditAgentData | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const skillsRef = useRef<HTMLDivElement>(null);
  const tideLogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatState === "collapsed" && skillsCollapsed) {
      return;
    }
    const handleClickOutside = (e: MouseEvent) => {
      if (
        chatState !== "collapsed" &&
        chatRef.current &&
        !chatRef.current.contains(e.target as Node)
      ) {
        setChatState("collapsed");
      }
      if (
        !skillsCollapsed &&
        skillsRef.current &&
        !skillsRef.current.contains(e.target as Node)
      ) {
        setSkillsCollapsed(true);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [chatState, skillsCollapsed]);

  useEffect(() => {
    const CURRENT_OPTIONS = ["STRONG", "MEDIUM", "WEAK"];
    let nextChange = Date.now() + (60 + Math.random() * 180) * 1000;
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      const now = new Date();
      setTime(
        `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")}`,
      );
      if (Date.now() >= nextChange) {
        setCurrentStrength((prev) => {
          const others = CURRENT_OPTIONS.filter((o) => o !== prev);
          return others[Math.floor(Math.random() * others.length)];
        });
        nextChange = Date.now() + (60 + Math.random() * 180) * 1000;
      }
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Auto-show creator when no agents exist
  useEffect(() => {
    if (agents.length === 0) {
      setShowCreator(true);
    }
  }, [agents.length]);

  // Auto-scroll Tide log to bottom on new entries
  useEffect(() => {
    const el = tideLogRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [activityLogs]);

  const uptimeMs = helloPayload?.snapshot?.uptimeMs;
  const uptimeStr =
    uptimeMs != null
      ? uptimeMs < 60000
        ? `${Math.round(uptimeMs / 1000)}s`
        : uptimeMs < 3600000
          ? `${Math.round(uptimeMs / 60000)}m`
          : `${Math.round(uptimeMs / 3600000)}h`
      : null;

  const sel = agents.find((a) => a.id === selectedAgent);

  const handleCreate = async ({
    name,
    color,
  }: {
    name: string;
    color: string;
  }) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const gwAgents = await createAgent({
      name,
      workspace: `agents/${slug}`,
      emoji: "\uD83E\uDD9E",
    });
    if (color && gwAgents) {
      const created = gwAgents.find(
        (a) => (a.identity?.name || a.name) === name,
      );
      if (created) {
        setAgentColor(created.id, color);
        remapAgents(gwAgents);
      }
    }
    setShowCreator(false);
  };

  const handleUpdate = async (data: EditAgentData) => {
    if (data._gatewayId && data.color) {
      setAgentColor(data._gatewayId, data.color);
    }
    await updateAgent({ agentId: data._gatewayId, name: data.name });
    setEditingAgent(null);
  };

  const handleEditClick = () => {
    if (!sel) {
      return;
    }
    setEditingAgent({
      _gatewayId: sel._gatewayId,
      name: sel.id,
      color: sel.color,
    });
  };

  const handleSkillToggle = async (skillKey: string, enabled: boolean) => {
    await updateSkill({ skillKey, enabled });
    await refreshSkills();
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        fontFamily: "'Courier New', monospace",
        color: C.text,
      }}
    >
      {/* Full-viewport canvas */}
      <LobsterHQ
        agents={agents}
        selectedAgent={selectedAgent}
        onSelectAgent={setSelectedAgent}
      />

      {/* Status bar */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "6px 16px",
          background: "rgba(10,22,40,0.85)",
          borderBottom: `1px solid rgba(255,255,255,0.06)`,
          backdropFilter: "blur(8px)",
        }}
      >
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: 6,
            background: C.green,
            boxShadow: `0 0 6px ${C.green}60`,
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 12, color: C.textDim }}>
          {serverInfo?.host || "gateway"}
          {serverInfo?.version ? ` v${serverInfo.version}` : ""}
          {uptimeStr ? ` \u00b7 up ${uptimeStr}` : ""}
        </span>
        <div style={{ flex: 1 }} />
        <button
          type="button"
          onClick={() => {
            setEditingAgent(null);
            setShowCreator((v) => !v);
          }}
          style={{
            ...btnSecondaryStyle,
            fontSize: 11,
            padding: "4px 12px",
            color: C.green,
            borderColor: `${C.green}40`,
          }}
        >
          + SPAWN AGENT
        </button>
        <button
          type="button"
          onClick={disconnect}
          style={{
            ...btnSecondaryStyle,
            fontSize: 11,
            padding: "4px 12px",
            color: C.red,
            borderColor: `${C.red}40`,
          }}
        >
          DISCONNECT
        </button>
      </div>

      {/* HUD overlay — top center */}
      <DraggablePanel
        title="HUD"
        defaultX={Math.max(16, (window.innerWidth - 460) / 2)}
        defaultY={40}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            padding: "8px 16px",
            flexWrap: "wrap",
          }}
        >
          <HudItem label="MISSION" value="DEEP SEA OPS" color={C.lob1} />
          <Divider />
          <HudItem
            label="POD"
            value={`${agents.length} ACTIVE`}
            color={C.green}
          />
          <Divider />
          <HudItem label="TIME" value={`${time} UTC`} color={C.amber} />
          <Divider />
          <HudItem
            label="CURRENT"
            value={currentStrength}
            color={
              currentStrength === "STRONG"
                ? C.red
                : currentStrength === "MEDIUM"
                  ? C.amber
                  : C.green
            }
            pulse
            pulseRate={
              currentStrength === "STRONG"
                ? "0.8s"
                : currentStrength === "MEDIUM"
                  ? "2s"
                  : "4s"
            }
          />
        </div>
      </DraggablePanel>

      {/* Pod Roster overlay — top-left */}
      <DraggablePanel title="POD ROSTER" defaultX={16} defaultY={120}>
        <div style={{ padding: "8px 10px", width: 155 }}>
          {agents.map((a) => (
            <button
              type="button"
              key={a.id}
              onClick={() =>
                setSelectedAgent(selectedAgent === a.id ? null : a.id)
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 8px",
                marginBottom: 4,
                background:
                  selectedAgent === a.id
                    ? "rgba(244,162,97,0.12)"
                    : "transparent",
                border:
                  selectedAgent === a.id
                    ? `1px solid ${C.uiBorder}`
                    : "1px solid transparent",
                borderRadius: 2,
                cursor: "pointer",
                color: C.text,
                fontFamily: "'Courier New', monospace",
                fontSize: 12,
                textAlign: "left",
              }}
            >
              <span
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 1,
                  background: a.color,
                  display: "inline-block",
                  flexShrink: 0,
                }}
              />
              <span style={{ flexGrow: 1 }}>
                <div style={{ fontWeight: "bold", fontSize: 12 }}>{a.id}</div>
                <div style={{ fontSize: 11, color: C.textDim }}>{a.role}</div>
              </span>
              <span
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: 6,
                  background: C.green,
                  animation: "pulse 2s infinite",
                }}
              />
            </button>
          ))}
        </div>
      </DraggablePanel>

      {/* Skills panel — bottom-left collapsible */}
      <div
        ref={skillsRef}
        style={{
          position: "fixed",
          bottom: 16,
          left: 16,
          zIndex: 200,
          width: skillsCollapsed ? "auto" : 320,
          border: `2px solid ${C.uiBorder}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
          borderRadius: 6,
          overflow: "hidden",
          background: C.uiBg,
        }}
      >
        <button
          type="button"
          onClick={() => {
            if (skillsCollapsed) {
              setSelectedAgent(null);
            }
            setSkillsCollapsed((c) => !c);
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            width: "100%",
            padding: "8px 14px",
            background: "transparent",
            border: "none",
            borderBottom: skillsCollapsed
              ? "none"
              : "1px solid rgba(255,255,255,0.05)",
            cursor: "pointer",
            color: C.textDim,
            fontFamily: "'Courier New', monospace",
            fontSize: 11,
            letterSpacing: 2,
            textAlign: "left",
          }}
        >
          <span style={{ color: C.amber }}>
            {skillsCollapsed ? "\u25B6" : "\u25BC"}
          </span>
          SKILLS
          <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>
            {allSkills.filter((s) => s.enabled).length}/{allSkills.length}
          </span>
        </button>
        {!skillsCollapsed && (
          <SkillsPanel skills={allSkills} onToggle={handleSkillToggle} />
        )}
      </div>

      {/* Activity Log overlay — top-right */}
      <DraggablePanel
        title="TIDE LOG"
        defaultX={window.innerWidth - 200}
        defaultY={120}
      >
        <div
          ref={tideLogRef}
          className="thin-scroll"
          style={{
            padding: "8px 10px",
            width: 155,
            maxHeight: 200,
            overflowY: "auto",
          }}
        >
          <ActivityLog logs={activityLogs} tick={tick} />
        </div>
      </DraggablePanel>

      {/* Selected agent tooltip on canvas */}
      {sel && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 60,
            background: C.uiBg,
            border: `2px solid ${sel.color}`,
            borderRadius: 4,
            padding: "8px 16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
          }}
        >
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 2,
              background: sel.color,
              opacity: 0.85,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
            }}
          >
            {"\u{1F99E}"}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: "bold", color: sel.color }}>
              {sel.id}
            </div>
            <div style={{ fontSize: 12, color: C.textDim }}>{sel.role}</div>
          </div>
          <button
            type="button"
            onClick={handleEditClick}
            style={{
              background: "none",
              border: `1px solid ${C.amber}40`,
              borderRadius: 2,
              padding: "3px 10px",
              cursor: "pointer",
              fontSize: 11,
              color: C.amber,
              fontFamily: "'Courier New', monospace",
              letterSpacing: 1,
            }}
          >
            ✎ EDIT
          </button>
          <button
            type="button"
            onClick={() => {
              setChatInitialAgentId(selectedAgent);
              setSelectedAgent(null);
              setChatState("normal");
            }}
            style={{
              background: "rgba(46,204,113,0.12)",
              border: `1px solid ${C.green}`,
              borderRadius: 2,
              padding: "3px 10px",
              cursor: "pointer",
              fontSize: 11,
              color: C.green,
              fontFamily: "'Courier New', monospace",
              letterSpacing: 1,
            }}
          >
            CHAT
          </button>
        </div>
      )}

      {/* Agent Creator panel — create mode */}
      {showCreator && !editingAgent && (
        <DraggablePanel title="SPAWN AGENT" centered>
          <AgentCreator
            onDeploy={handleCreate}
            onCancel={() => setShowCreator(false)}
          />
        </DraggablePanel>
      )}

      {/* Agent Creator panel — edit mode */}
      {editingAgent && (
        <DraggablePanel title="EDIT AGENT" centered>
          <AgentCreator
            key={editingAgent._gatewayId}
            editAgent={editingAgent}
            onUpdate={handleUpdate}
            onCancel={() => setEditingAgent(null)}
          />
        </DraggablePanel>
      )}

      {/* Collapsible AgentChat overlay */}
      {chatAgents.length > 0 && (
        <div
          ref={chatRef}
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 200,
            width:
              chatState === "collapsed"
                ? "auto"
                : chatState === "expanded"
                  ? "max(50vw, 420px)"
                  : 420,
            maxWidth:
              chatState === "expanded" ? "calc(100vw - 32px)" : undefined,
            height: chatState === "expanded" ? "calc(100vh - 68px)" : undefined,
            display: chatState === "expanded" ? "flex" : undefined,
            flexDirection: chatState === "expanded" ? "column" : undefined,
            border: `2px solid ${C.uiBorder}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            borderRadius: 6,
            overflow: "hidden",
            background: C.uiBg,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              width: "100%",
              borderBottom:
                chatState === "collapsed"
                  ? "none"
                  : "1px solid rgba(255,255,255,0.05)",
            }}
          >
            {chatState !== "collapsed" && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setChatState(
                    chatState === "expanded" ? "normal" : "expanded",
                  );
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "8px 10px",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: C.amber,
                  flexShrink: 0,
                }}
                title={chatState === "expanded" ? "Contract" : "Expand"}
              >
                {chatState === "expanded" ? (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Contract</title>
                    <path d="m14 10 7-7" />
                    <path d="M20 10h-6V4" />
                    <path d="m3 21 7-7" />
                    <path d="M4 14h6v6" />
                  </svg>
                ) : (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <title>Expand</title>
                    <path d="M15 3h6v6" />
                    <path d="m21 3-7 7" />
                    <path d="m3 21 7-7" />
                    <path d="M9 21H3v-6" />
                  </svg>
                )}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (chatState === "collapsed") {
                  setChatInitialAgentId(selectedAgent);
                  setSelectedAgent(null);
                  setChatState("normal");
                } else {
                  setChatState("collapsed");
                }
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                flex: 1,
                padding:
                  chatState !== "collapsed" ? "8px 14px 8px 0" : "8px 14px",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: C.textDim,
                fontFamily: "'Courier New', monospace",
                fontSize: 11,
                letterSpacing: 2,
                textAlign: "left",
              }}
            >
              <span style={{ color: C.amber }}>
                {chatState === "collapsed" ? "\u25B6" : "\u25BC"}
              </span>
              AGENT CHAT
              <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>
                {chatAgents.length}
              </span>
            </button>
          </div>
          <div
            style={{
              display:
                chatState === "collapsed"
                  ? "none"
                  : chatState === "expanded"
                    ? "flex"
                    : "contents",
              flex: chatState === "expanded" ? 1 : undefined,
              minHeight: 0,
            }}
          >
            <AgentChat
              agents={chatAgents}
              onSendMessage={sendAgentMessage}
              initialActiveId={chatInitialAgentId}
              expanded={chatState === "expanded"}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes tideFadeIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
