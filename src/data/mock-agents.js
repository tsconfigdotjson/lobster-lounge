// ─── HQ Map Agents ───────────────────────────────────────────
export const HQ_AGENTS = [
  { id: "CLAWZ", role: "Coordinator", task: "Coordinating the pod", color: "#e74c3c", x: 10, y: 8, dir: 0 },
  { id: "CORAL", role: "Scanner", task: "Scanning tide pools", color: "#ff6b8a", x: 7, y: 9, dir: 2 },
  { id: "PINCH", role: "Executor", task: "Executing shell trades", color: "#f4a261", x: 14, y: 9, dir: 1 },
  { id: "REEF", role: "Security", task: "Guarding the reef", color: "#9b59b6", x: 4, y: 11, dir: 3 },
  { id: "TIDE", role: "Scout", task: "Scouting deep currents", color: "#2ecc71", x: 17, y: 11, dir: 1 },
  { id: "SHELL", role: "Analyst", task: "Analyzing sea data", color: "#1abc9c", x: 12, y: 7, dir: 0 },
];

// ─── Chat Agents ─────────────────────────────────────────────
export const CHAT_AGENTS = [
  { id: "CLAWZ", role: "Coordinator", color: "#e74c3c", status: "active" },
  { id: "CORAL", role: "Scanner", color: "#ff6b8a", status: "active" },
  { id: "PINCH", role: "Executor", color: "#f4a261", status: "busy" },
  { id: "REEF", role: "Security", color: "#9b59b6", status: "active" },
  { id: "TIDE", role: "Scout", color: "#2ecc71", status: "idle" },
  { id: "SHELL", role: "Analyst", color: "#1abc9c", status: "active" },
];

// ─── Activity Log Entries ────────────────────────────────────
export const ACTIVITY_LOGS = [
  { agent: "CLAWZ", action: "Pod sync initiated", color: "#e74c3c", t: 0 },
  { agent: "CORAL", action: "Detected warm current", color: "#ff6b8a", t: 2 },
  { agent: "TIDE", action: "New kelp bed found", color: "#2ecc71", t: 4 },
  { agent: "PINCH", action: "Shell trade #421 done", color: "#f4a261", t: 6 },
  { agent: "REEF", action: "Perimeter secure", color: "#9b59b6", t: 8 },
  { agent: "SHELL", action: "Current data compiled", color: "#1abc9c", t: 10 },
  { agent: "CORAL", action: "3 tide pools mapped", color: "#ff6b8a", t: 12 },
  { agent: "CLAWZ", action: "Tasks redistributed", color: "#e74c3c", t: 14 },
  { agent: "TIDE", action: "Deep trench scouted", color: "#2ecc71", t: 16 },
  { agent: "PINCH", action: "Trade #422 queued", color: "#f4a261", t: 18 },
  { agent: "REEF", action: "Predator scan clear", color: "#9b59b6", t: 20 },
  { agent: "SHELL", action: "Anomaly in thermocline", color: "#1abc9c", t: 22 },
];
