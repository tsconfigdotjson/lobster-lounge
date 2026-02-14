// Gateway protocol types

// ─── Chat message content blocks ─────────────────────────────
export type ContentBlock =
  | { type: "text"; text: string }
  | {
      type: "tool_call";
      toolCallId: string;
      toolName: string;
      args: Record<string, unknown>;
      output: string | null;
      phase: "start" | "update" | "result";
    };

export interface ChatMessage {
  id: string;
  from: "user" | "agent";
  blocks: ContentBlock[];
  runId?: string;
  streaming?: boolean;
}

export interface GatewayAgent {
  id: string;
  identity?: { name?: string; theme?: string };
  name?: string;
}

export interface HqAgent {
  id: string;
  role: string;
  color: string;
  x: number;
  y: number;
  dir: number;
  _gatewayId: string;
}

export interface ChatAgent {
  id: string;
  role: string;
  color: string;
  status: string;
  _gatewayId: string;
}

export interface LogEntry {
  agent: string;
  action: string;
  color: string;
  t: number;
}

export interface Skill {
  id: string;
  name: string;
  icon: string;
  desc: string;
  cat: string;
}

export interface SkillWithStatus extends Skill {
  enabled: boolean;
}

export interface ServerInfo {
  host?: string;
  version?: string;
}

export interface EditAgentData {
  _gatewayId: string;
  name: string;
  color: string;
}

// Gateway protocol frame — the JSON envelope for all WebSocket messages
export interface GatewayFrame {
  type: string;
  id?: string;
  method?: string;
  event?: string;
  ok?: boolean;
  payload?: Record<string, unknown>;
  error?: { code?: string; message?: string };
  [key: string]: unknown;
}

// Generic payload from gateway protocol responses/events.
// Index signature allows property access while returning `unknown`.
export interface GatewayPayload {
  [key: string]: unknown;
}

// Hello-ok payload with known fields for type-safe access
export interface HelloPayload extends GatewayPayload {
  type?: string;
  server?: ServerInfo;
  features?: Record<string, unknown>;
  auth?: { deviceToken?: string };
  policy?: { tickIntervalMs?: number };
  snapshot?: { uptimeMs?: number };
}

// Skill status entry from the gateway protocol
export interface GatewaySkillEntry {
  skillKey?: string;
  name: string;
  emoji?: string;
  description?: string;
  source?: string;
  eligible?: boolean;
  disabled?: boolean;
  blockedByAllowlist?: boolean;
}

// Chat event payload
export interface ChatEventPayload extends GatewayPayload {
  runId?: string;
  state?: string;
  errorMessage?: string;
  message?: {
    content?: Array<{ text?: string }>;
    text?: string;
    delta?: string;
  };
}

// Agent event payload
export interface AgentEventPayload extends GatewayPayload {
  runId?: string;
  seq?: number;
  ts?: number;
  stream?: string;
  data?: {
    agentId?: string;
    toolCallId?: string;
    name?: string;
    phase?: string;
    args?: Record<string, unknown>;
    result?: unknown;
    partialResult?: unknown;
  };
}

// Ack response from agent request
export interface AgentAckPayload extends GatewayPayload {
  runId?: string;
  status?: string;
  result?: {
    payloads?: Array<{ text?: string }>;
  };
}
