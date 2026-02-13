import { useGateway } from "../context/GatewayContext";
import { LobsterHQ } from "./lobster-hq";
import { AgentChat } from "./open-claw";
import { C } from "./open-claw/constants";
import { btnSecondaryStyle } from "./open-claw/styles";

export default function DashboardView() {
  const { agents, chatAgents, activityLogs, sendAgentMessage, disconnect, serverInfo, helloPayload } = useGateway();

  const uptimeMs = helloPayload?.snapshot?.uptimeMs;
  const uptimeStr = uptimeMs != null
    ? uptimeMs < 60000 ? `${Math.round(uptimeMs / 1000)}s`
    : uptimeMs < 3600000 ? `${Math.round(uptimeMs / 60000)}m`
    : `${Math.round(uptimeMs / 3600000)}h`
    : null;

  return (
    <div style={{ position: "relative", minHeight: "100vh" }}>
      {/* Status bar */}
      <div style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", gap: 10,
        padding: "6px 16px",
        background: C.uiBg, borderBottom: `1px solid rgba(255,255,255,0.06)`,
        fontFamily: "'Courier New', monospace",
      }}>
        <span style={{
          width: 6, height: 6, borderRadius: 6,
          background: C.green, boxShadow: `0 0 6px ${C.green}60`,
          flexShrink: 0,
        }} />
        <span style={{ fontSize: 10, color: C.textDim }}>
          {serverInfo?.host || "gateway"}
          {serverInfo?.version ? ` v${serverInfo.version}` : ""}
          {uptimeStr ? ` \u00b7 up ${uptimeStr}` : ""}
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={disconnect}
          style={{
            ...btnSecondaryStyle,
            fontSize: 9,
            padding: "4px 12px",
            color: C.red,
            borderColor: C.red + "40",
          }}
        >
          DISCONNECT
        </button>
      </div>

      {/* Main content - LobsterHQ takes the viewport */}
      <div style={{ paddingTop: 32 }}>
        <LobsterHQ agents={agents} logs={activityLogs} />
      </div>

      {/* AgentChat overlay - fixed bottom-right */}
      {chatAgents.length > 0 && (
        <div style={{
          position: "fixed", bottom: 16, right: 16, zIndex: 200,
          width: 420,
          boxShadow: "0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px rgba(244,162,97,0.15)",
          borderRadius: 6,
          overflow: "hidden",
        }}>
          <AgentChat agents={chatAgents} onSendMessage={sendAgentMessage} />
        </div>
      )}
    </div>
  );
}
