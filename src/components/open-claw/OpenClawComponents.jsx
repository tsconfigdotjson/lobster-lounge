import { CHAT_AGENTS } from "../../data/mock-agents";
import { EXISTING_GATEWAYS } from "../../data/mock-gateways";
import { RESPONSES } from "../../data/mock-responses";
import { ALL_SKILLS } from "../../data/mock-skills";
import AgentChat from "./AgentChat";
import AgentCreator from "./AgentCreator";
import { C } from "./constants";
import GatewayScreen from "./GatewayScreen";
import OceanBg from "./OceanBg";
import Section from "./Section";

function mockSendMessage(agentId, _text) {
  const pool = RESPONSES[agentId];
  if (!pool) {
    return Promise.resolve("...");
  }
  return new Promise((resolve) => {
    setTimeout(
      () => {
        resolve(pool[Math.floor(Math.random() * pool.length)]);
      },
      1000 + Math.random() * 1200,
    );
  });
}

export default function OpenClawComponents() {
  return (
    <div
      style={{
        background: `linear-gradient(180deg, ${C.deep0} 0%, ${C.deep2} 50%, ${C.sea0} 100%)`,
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "24px 16px 60px",
        gap: 32,
        fontFamily: "'Courier New', monospace",
        color: C.text,
        position: "relative",
      }}
    >
      <OceanBg />

      {/* Title */}
      <div style={{ textAlign: "center", zIndex: 1 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            justifyContent: "center",
          }}
        >
          <span style={{ fontSize: 26 }}>🦞</span>
          <div>
            <div
              style={{
                fontSize: 20,
                fontWeight: "bold",
                color: C.lob1,
                letterSpacing: 5,
                textShadow: `0 0 30px rgba(231,76,60,0.3)`,
              }}
            >
              OPEN CLAW
            </div>
            <div
              style={{
                fontSize: 9,
                color: C.textDim,
                letterSpacing: 3,
                marginTop: 2,
              }}
            >
              COMPONENT LIBRARY — LOBSTER AGENT PLATFORM
            </div>
          </div>
          <span style={{ fontSize: 26 }}>🦞</span>
        </div>
      </div>

      {/* Component: Gateway */}
      <Section
        label="GATEWAY CONNECTION"
        desc="Login flow — select existing gateway or deploy new, with connection progression"
      >
        <GatewayScreen gateways={EXISTING_GATEWAYS} onConnect={() => {}} />
      </Section>

      {/* Component: Agent Creator */}
      <Section
        label="AGENT CREATOR"
        desc="Spawn flow — configure, preview specs, confirm and deploy"
      >
        <AgentCreator skills={ALL_SKILLS} onDeploy={() => {}} />
      </Section>

      {/* Component: Agent Chat */}
      <Section
        label="AGENT CHAT"
        desc="Direct messaging — talk to any agent in the pod"
      >
        <AgentChat agents={CHAT_AGENTS} onSendMessage={mockSendMessage} />
      </Section>
    </div>
  );
}
