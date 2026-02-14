const PALETTE = [
  "#e74c3c",
  "#ff6b8a",
  "#f4a261",
  "#9b59b6",
  "#2ecc71",
  "#1abc9c",
  "#5dade2",
  "#e76f51",
  "#f39c12",
  "#8e44ad",
  "#3498db",
  "#e74c6f",
];

const POSITIONS = [
  { x: 10, y: 8, dir: 0 },
  { x: 7, y: 9, dir: 2 },
  { x: 14, y: 9, dir: 1 },
  { x: 4, y: 11, dir: 3 },
  { x: 17, y: 11, dir: 1 },
  { x: 12, y: 7, dir: 0 },
  { x: 9, y: 10, dir: 2 },
  { x: 15, y: 8, dir: 0 },
  { x: 6, y: 12, dir: 1 },
  { x: 18, y: 9, dir: 3 },
  { x: 3, y: 9, dir: 0 },
  { x: 13, y: 11, dir: 2 },
];

const AGENT_COLORS_KEY = "openclaw-agent-colors";

function loadAgentColors() {
  try {
    return JSON.parse(localStorage.getItem(AGENT_COLORS_KEY)) || {};
  } catch {
    return {};
  }
}

export function getAgentColor(agentId) {
  return loadAgentColors()[agentId] || null;
}

export function setAgentColor(agentId, color) {
  const colors = loadAgentColors();
  colors[agentId] = color;
  localStorage.setItem(AGENT_COLORS_KEY, JSON.stringify(colors));
}

export function mapToHqAgents(gatewayAgents) {
  if (!gatewayAgents) {
    return [];
  }
  return gatewayAgents.map((agent, i) => {
    const pos = POSITIONS[i % POSITIONS.length];
    const color = getAgentColor(agent.id) || PALETTE[i % PALETTE.length];
    const name = agent.identity?.name || agent.name || agent.id;
    return {
      id: name.toUpperCase().slice(0, 8),
      role: agent.identity?.theme || "Agent",
      task: `Active - ${agent.id}`,
      color,
      x: pos.x,
      y: pos.y,
      dir: pos.dir,
      _gatewayId: agent.id,
    };
  });
}

export function mapToChatAgents(gatewayAgents) {
  if (!gatewayAgents) {
    return [];
  }
  return gatewayAgents.map((agent, i) => {
    const color = getAgentColor(agent.id) || PALETTE[i % PALETTE.length];
    const name = agent.identity?.name || agent.name || agent.id;
    return {
      id: name.toUpperCase().slice(0, 8),
      role: agent.identity?.theme || "Agent",
      color,
      status: "active",
      _gatewayId: agent.id,
    };
  });
}

export function createLogEntry(agent, action, color) {
  return { agent, action, color, t: 0 };
}
