import { useEffect, useState } from "react";
import { useGateway } from "../context/GatewayContext";
import {
  ActivityLog,
  Divider,
  DraggablePanel,
  HudItem,
  LobsterHQ,
} from "./lobster-hq";
import { C } from "./lobster-hq/constants";
import { AgentChat, AgentCreator } from "./open-claw";
import { btnSecondaryStyle } from "./open-claw/styles";

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
    skills,
    fetchAgentSkills,
  } = useGateway();
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [time, setTime] = useState("08:00");
  const [tick, setTick] = useState(0);
  const [showCreator, setShowCreator] = useState(false);
  const [editingAgent, setEditingAgent] = useState(null);

  useEffect(() => {
    const iv = setInterval(() => {
      setTick((t) => t + 1);
      const h = 8 + Math.floor((Date.now() / 3000) % 10);
      const m = Math.floor((Date.now() / 500) % 60);
      setTime(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  // Auto-show creator when no agents exist
  useEffect(() => {
    if (agents.length === 0) {
      setShowCreator(true);
    }
  }, [agents.length]);

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

  const handleCreate = async ({ name, skills: selSkills }) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
    const emoji = selSkills?.[0]?.icon || "\uD83E\uDD9E";
    await createAgent({ name, workspace: `agents/${slug}`, emoji });
    setShowCreator(false);
  };

  const handleUpdate = async (data) => {
    await updateAgent({ agentId: data._gatewayId, name: data.name });
    const originalSkillIds = new Set(
      (editingAgent?.skills || []).map((s) => s.id),
    );
    const newSkillIds = new Set((data.skills || []).map((s) => s.id));
    const skillUpdates = [];
    for (const id of originalSkillIds) {
      if (!newSkillIds.has(id)) {
        skillUpdates.push(updateSkill({ skillKey: id, enabled: false }));
      }
    }
    for (const id of newSkillIds) {
      if (!originalSkillIds.has(id)) {
        skillUpdates.push(updateSkill({ skillKey: id, enabled: true }));
      }
    }
    if (skillUpdates.length > 0) {
      await Promise.all(skillUpdates);
      await refreshSkills();
    }
    setEditingAgent(null);
  };

  const handleEditClick = async () => {
    if (!sel) {
      return;
    }
    const agentSkills = await fetchAgentSkills(sel._gatewayId);
    setEditingAgent({
      _gatewayId: sel._gatewayId,
      name: sel.id,
      skills: agentSkills,
      color: sel.color,
    });
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
          <HudItem label="TIDE" value={time} color={C.amber} />
          <Divider />
          <HudItem label="CURRENT" value="STRONG" color={C.green} pulse />
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
                    ? `1px solid ${C.uiBorderAlt}`
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

      {/* Activity Log overlay — top-right */}
      <DraggablePanel
        title="TIDE LOG"
        defaultX={window.innerWidth - 200}
        defaultY={120}
      >
        <div style={{ padding: "8px 10px", width: 155 }}>
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
            <div style={{ fontSize: 12, color: C.textDim }}>
              {sel.role} — {sel.task}
            </div>
          </div>
          <div
            style={{
              padding: "3px 10px",
              borderRadius: 2,
              background: "rgba(46,204,113,0.12)",
              border: `1px solid ${C.green}`,
              fontSize: 11,
              color: C.green,
              letterSpacing: 1,
            }}
          >
            AUTONOMOUS
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
        </div>
      )}

      {/* Agent Creator panel — create mode */}
      {showCreator && !editingAgent && (
        <DraggablePanel
          title="SPAWN AGENT"
          defaultX={Math.max(16, (window.innerWidth - 340) / 2)}
          defaultY={80}
        >
          <AgentCreator
            skills={skills}
            onDeploy={handleCreate}
            onCancel={() => setShowCreator(false)}
          />
        </DraggablePanel>
      )}

      {/* Agent Creator panel — edit mode */}
      {editingAgent && (
        <DraggablePanel
          title="EDIT AGENT"
          defaultX={Math.max(16, (window.innerWidth - 340) / 2)}
          defaultY={80}
        >
          <AgentCreator
            key={editingAgent._gatewayId}
            skills={skills}
            editAgent={editingAgent}
            onUpdate={handleUpdate}
            onCancel={() => setEditingAgent(null)}
          />
        </DraggablePanel>
      )}

      {/* Collapsible AgentChat overlay */}
      {chatAgents.length > 0 && (
        <div
          style={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 200,
            width: chatCollapsed ? "auto" : 420,
            border: `2px solid ${C.uiBorderAlt}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
            borderRadius: 6,
            overflow: "hidden",
            background: C.uiBg,
          }}
        >
          <button
            type="button"
            onClick={() => setChatCollapsed((c) => !c)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              background: "transparent",
              border: "none",
              borderBottom: chatCollapsed
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
              {chatCollapsed ? "\u25B6" : "\u25BC"}
            </span>
            AGENT CHAT
            <span style={{ marginLeft: "auto", fontSize: 10, opacity: 0.5 }}>
              {chatAgents.length}
            </span>
          </button>
          {!chatCollapsed && (
            <AgentChat agents={chatAgents} onSendMessage={sendAgentMessage} />
          )}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
