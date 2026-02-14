import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  createLogEntry,
  mapToChatAgents,
  mapToHqAgents,
} from "../services/data-mappers";
import { getOrCreateIdentity } from "../services/device-identity";
import GatewayClient from "../services/gateway-client";
import type {
  AgentAckPayload,
  AgentEventPayload,
  ChatAgent,
  ChatEventPayload,
  ChatMessage,
  ContentBlock,
  GatewayAgent,
  GatewayPayload,
  GatewaySkillEntry,
  HelloPayload,
  HqAgent,
  LogEntry,
  ServerInfo,
  Skill,
  SkillWithStatus,
} from "../types";

/** Wire format: { content: [{ type: "text", text: "..." }] } */
function extractToolText(value: unknown): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value === "string") {
    return value;
  }
  const rec = value as Record<string, unknown>;
  const content = rec?.content;
  if (Array.isArray(content)) {
    return (
      content
        .filter(
          (c): c is { text: string } =>
            typeof (c as Record<string, unknown>)?.text === "string",
        )
        .map((c) => c.text)
        .join("\n") || null
    );
  }
  return null;
}

const STORAGE_KEY = "openclaw-gateway";
const HISTORY_KEY = "openclaw-gateway-history";
const MAX_HISTORY = 5;

interface HistoryEntry {
  url: string;
  ts?: number;
}

function loadSavedConnection() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null") || null;
  } catch {
    return null;
  }
}

function saveConnection(url: string) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url }));
  // also add to history
  let history = loadConnectionHistory();
  history = history.filter((h) => h.url !== url);
  history.unshift({ url, ts: Date.now() });
  if (history.length > MAX_HISTORY) {
    history = history.slice(0, MAX_HISTORY);
  }
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function loadConnectionHistory(): HistoryEntry[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]") || [];
  } catch {
    return [];
  }
}

interface GatewayContextValue {
  connectionState: string;
  connectionError: string | null;
  connectionPhase: string;
  pairingState: string | null;
  deviceId: string | null;
  connect: (url: string, gatewayToken?: string) => void;
  disconnect: () => void;
  agents: HqAgent[];
  rawAgents: GatewayAgent[];
  chatAgents: ChatAgent[];
  activityLogs: LogEntry[];
  serverInfo: ServerInfo | null;
  features: Record<string, unknown> | null;
  sendAgentMessage: (
    agentDisplayId: string,
    text: string,
    onDelta?: (partial: ChatMessage) => void,
  ) => Promise<ChatMessage>;
  createAgent: (params: {
    name: string;
    workspace: string;
    emoji: string;
  }) => Promise<GatewayAgent[]>;
  updateAgent: (params: {
    agentId: string;
    name?: string;
    workspace?: string;
    model?: string;
    avatar?: string;
  }) => Promise<void>;
  updateSkill: (params: {
    skillKey: string;
    enabled: boolean;
  }) => Promise<void>;
  refreshSkills: () => Promise<void>;
  remapAgents: (gwAgents?: GatewayAgent[]) => void;
  skills: Skill[];
  allSkills: SkillWithStatus[];
  client: GatewayClient | null;
  helloPayload: HelloPayload | null;
  savedConnection: { url: string } | null;
  connectionHistory: HistoryEntry[];
}

const GatewayContext = createContext<GatewayContextValue | null>(null);

export function GatewayProvider({ children }: { children: ReactNode }) {
  const [connectionState, setConnectionState] = useState("disconnected");
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [agents, setAgents] = useState<HqAgent[]>([]);
  const [rawAgents, setRawAgents] = useState<GatewayAgent[]>([]);
  const [chatAgents, setChatAgents] = useState<ChatAgent[]>([]);
  const [activityLogs, setActivityLogs] = useState<LogEntry[]>([]);
  const [serverInfo, setServerInfo] = useState<ServerInfo | null>(null);
  const [features, setFeatures] = useState<Record<string, unknown> | null>(
    null,
  );
  const [helloPayload, setHelloPayload] = useState<HelloPayload | null>(null);
  const [connectionPhase, setConnectionPhase] = useState("disconnected");
  const [pairingState, setPairingState] = useState<string | null>(null);
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [allSkills, setAllSkills] = useState<SkillWithStatus[]>([]);
  const clientRef = useRef<GatewayClient | null>(null);
  const unsubsRef = useRef<Array<() => void>>([]);

  // Initialize device ID on mount
  useEffect(() => {
    getOrCreateIdentity().then((id) => setDeviceId(id.deviceId));
  }, []);

  const cleanup = useCallback(() => {
    for (const fn of unsubsRef.current) {
      fn();
    }
    unsubsRef.current = [];
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, []);

  const fetchSkills = useCallback(
    async (client: GatewayClient, agentId?: string): Promise<Skill[]> => {
      try {
        const params = agentId ? { agentId } : {};
        const res = await client.request("skills.status", params);
        const entries = (res.skills ||
          res.entries ||
          []) as GatewaySkillEntry[];
        return entries
          .filter((s: GatewaySkillEntry) => s.eligible !== false && !s.disabled)
          .map((s: GatewaySkillEntry) => ({
            id: s.skillKey || s.name,
            name: s.name,
            icon: s.emoji || "\u2699\uFE0F",
            desc: s.description || "",
            cat: s.source || "skill",
          }));
      } catch (_err) {
        return [];
      }
    },
    [],
  );

  const fetchAllSkills = useCallback(
    async (client: GatewayClient): Promise<SkillWithStatus[]> => {
      try {
        const res = await client.request("skills.status", {});
        const entries = (res.skills ||
          res.entries ||
          []) as GatewaySkillEntry[];
        return entries
          .filter(
            (s: GatewaySkillEntry) =>
              !s.blockedByAllowlist && (s.eligible !== false || s.disabled),
          )
          .map((s: GatewaySkillEntry) => ({
            id: s.skillKey || s.name,
            name: s.name,
            icon: s.emoji || "\u2699\uFE0F",
            desc: s.description || "",
            cat: s.source || "skill",
            enabled: !s.disabled,
          }));
      } catch (_err) {
        return [];
      }
    },
    [],
  );

  const syncAgents = useCallback(
    async (client: GatewayClient): Promise<GatewayAgent[]> => {
      setConnectionPhase("syncing");
      try {
        const res = await client.request("agents.list");
        const gwAgents = (res.agents || []) as GatewayAgent[];
        setRawAgents(gwAgents);
        setAgents(mapToHqAgents(gwAgents));
        setChatAgents(mapToChatAgents(gwAgents));
        gwAgents.forEach((a: GatewayAgent) => {
          const name = (a.identity?.name || a.name || a.id)
            .toUpperCase()
            .slice(0, 8);
          setActivityLogs((prev) => [
            ...prev,
            createLogEntry(name, "Connected", "#2ecc71"),
          ]);
        });
        // Fetch available skills after syncing agents
        const [skillsList, allSkillsList] = await Promise.all([
          fetchSkills(client),
          fetchAllSkills(client),
        ]);
        setSkills(skillsList);
        setAllSkills(allSkillsList);
        setConnectionPhase("connected");
        return gwAgents;
      } catch (_err) {
        setConnectionPhase("connected");
        return [];
      }
    },
    [fetchSkills, fetchAllSkills],
  );

  const createAgent = useCallback(
    async ({
      name,
      workspace,
      emoji,
    }: {
      name: string;
      workspace: string;
      emoji: string;
    }) => {
      const client = clientRef.current;
      if (!client?.connected) {
        throw new Error("Not connected");
      }
      await client.request("agents.create", { name, workspace, emoji });
      return syncAgents(client);
    },
    [syncAgents],
  );

  const updateAgent = useCallback(
    async ({
      agentId,
      name,
      workspace,
      model,
      avatar,
    }: {
      agentId: string;
      name?: string;
      workspace?: string;
      model?: string;
      avatar?: string;
    }) => {
      const client = clientRef.current;
      if (!client?.connected) {
        throw new Error("Not connected");
      }
      const params: Record<string, unknown> = { agentId };
      if (name !== undefined) {
        params.name = name;
      }
      if (workspace !== undefined) {
        params.workspace = workspace;
      }
      if (model !== undefined) {
        params.model = model;
      }
      if (avatar !== undefined) {
        params.avatar = avatar;
      }
      await client.request("agents.update", params);
      await syncAgents(client);
    },
    [syncAgents],
  );

  const updateSkill = useCallback(
    async ({ skillKey, enabled }: { skillKey: string; enabled: boolean }) => {
      const client = clientRef.current;
      if (!client?.connected) {
        throw new Error("Not connected");
      }
      await client.request("skills.update", { skillKey, enabled });
    },
    [],
  );

  const refreshSkills = useCallback(async () => {
    const client = clientRef.current;
    if (!client?.connected) {
      return;
    }
    const [skillsList, allSkillsList] = await Promise.all([
      fetchSkills(client),
      fetchAllSkills(client),
    ]);
    setSkills(skillsList);
    setAllSkills(allSkillsList);
  }, [fetchSkills, fetchAllSkills]);

  const connect = useCallback(
    (url: string, gatewayToken?: string) => {
      cleanup();
      setConnectionError(null);
      setAgents([]);
      setRawAgents([]);
      setChatAgents([]);
      setActivityLogs([]);
      setServerInfo(null);
      setFeatures(null);
      setHelloPayload(null);
      setPairingState(null);

      const client = new GatewayClient({
        onStateChange: (state: string) => {
          setConnectionState(state);
          if (state === "pairing") {
            setConnectionPhase("pairing");
            setPairingState("pending");
          }
          if (state === "connected") {
            setPairingState(null);
            const hello = client.helloPayload as HelloPayload | null;
            if (hello) {
              setHelloPayload(hello);
              setServerInfo(hello.server ?? null);
              setFeatures(hello.features ?? null);
            }
            saveConnection(url);
            syncAgents(client);
          }
          if (state === "disconnected") {
            setConnectionPhase("disconnected");
          }
        },
        onEvent: (event: string, payload: GatewayPayload) => {
          if (event === "agent") {
            const agentPayload = payload as AgentEventPayload;
            const label = agentPayload?.data?.agentId || "AGENT";
            setActivityLogs((prev) => [
              ...prev.slice(-50),
              createLogEntry(
                label.toUpperCase().slice(0, 8),
                String(agentPayload?.stream || "event"),
                "#f4a261",
              ),
            ]);
          }
          if (event === "presence") {
            setActivityLogs((prev) => [
              ...prev.slice(-50),
              createLogEntry("SYSTEM", "Presence update", "#5dade2"),
            ]);
          }
        },
      });

      clientRef.current = client;

      // subscribe to events
      const unsub1 = client.on("agent", (_payload) => {
        // already handled in onEvent
      });
      unsubsRef.current.push(unsub1);

      client.connect(url, gatewayToken);
    },
    [cleanup, syncAgents],
  );

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("disconnected");
    setConnectionPhase("disconnected");
    setConnectionError(null);
    setPairingState(null);
    setAgents([]);
    setRawAgents([]);
    setChatAgents([]);
    setActivityLogs([]);
    setServerInfo(null);
    setFeatures(null);
    setHelloPayload(null);
    setSkills([]);
    setAllSkills([]);
  }, [cleanup]);

  const sendAgentMessage = useCallback(
    (
      agentDisplayId: string,
      text: string,
      onDelta?: (partial: ChatMessage) => void,
    ) => {
      const client = clientRef.current;
      if (!client?.connected) {
        return Promise.reject(new Error("Not connected"));
      }

      // find gateway ID from chat agents
      const chatAgent = chatAgents.find(
        (a: ChatAgent) => a.id === agentDisplayId,
      );
      const agentId = chatAgent?._gatewayId || undefined;

      return new Promise<ChatMessage>((resolve, reject) => {
        const idempotencyKey = crypto.randomUUID();
        let resolved = false;
        let runId: string | null = null;

        // Build mutable ChatMessage for streaming
        const msg: ChatMessage = {
          id: crypto.randomUUID(),
          from: "agent",
          blocks: [{ type: "text", text: "" }],
          streaming: true,
        };

        // Current text block pointer — always the last text block
        const currentTextBlock = () => {
          const last = msg.blocks[msg.blocks.length - 1];
          if (last?.type === "text") {
            return last;
          }
          // Shouldn't happen, but push a new one if needed
          const nb: ContentBlock = { type: "text", text: "" };
          msg.blocks.push(nb);
          return nb;
        };

        const fireDelta = () => {
          if (!onDelta) {
            return;
          }
          onDelta({ ...msg, blocks: msg.blocks.map((b) => ({ ...b })) });
        };

        const finish = (finalMsg: ChatMessage) => {
          if (resolved) {
            return;
          }
          resolved = true;
          clearTimeout(timeout);
          unsubChat?.();
          unsubAgent?.();
          finalMsg.streaming = false;
          const cloned = {
            ...finalMsg,
            blocks: finalMsg.blocks.map((b) => ({ ...b })),
          };
          if (onDelta) {
            onDelta(cloned);
          }
          resolve(cloned);
        };

        const fail = (err: Error) => {
          if (resolved) {
            return;
          }
          resolved = true;
          clearTimeout(timeout);
          unsubChat?.();
          unsubAgent?.();
          reject(err);
        };

        const timeout = setTimeout(
          () => fail(new Error("Agent response timed out")),
          120000,
        );

        // Subscribe to chat events BEFORE sending the request,
        // per the ack-with-final streaming pattern (protocol §10).
        const unsubChat = client.on("chat", (rawPayload: GatewayPayload) => {
          const payload = rawPayload as ChatEventPayload;
          if (runId && payload.runId !== runId) {
            return;
          }

          if (payload.state === "delta") {
            const text =
              payload.message?.content?.[0]?.text ||
              payload.message?.text ||
              payload.message?.delta ||
              "";
            currentTextBlock().text = text;
            fireDelta();
          } else if (
            payload.state === "final" ||
            payload.state === "error" ||
            payload.state === "aborted"
          ) {
            if (payload.state === "error") {
              fail(new Error(payload.errorMessage || "Agent error"));
            } else {
              // Final payload text is authoritative — always prefer it
              const finalText =
                payload.message?.content?.[0]?.text || payload.message?.text;
              if (finalText) {
                currentTextBlock().text = finalText;
              } else if (!currentTextBlock().text) {
                currentTextBlock().text = "[No response]";
              }
              finish(msg);
            }
          }
        });

        // Subscribe to agent events for tool streaming
        const unsubAgent = client.on("agent", (rawPayload: GatewayPayload) => {
          const payload = rawPayload as AgentEventPayload;
          if (payload.stream !== "tool") {
            return;
          }
          if (runId && payload.runId !== runId) {
            return;
          }

          const data = payload.data ?? {};
          const toolCallId =
            typeof data.toolCallId === "string" ? data.toolCallId : "";
          const toolName = typeof data.name === "string" ? data.name : "tool";
          const phase = data.phase as "start" | "update" | "result";

          if (phase === "start") {
            // Insert tool_call block before the trailing text block
            const toolBlock: ContentBlock = {
              type: "tool_call",
              toolCallId,
              toolName,
              args: (data.args as Record<string, unknown>) ?? {},
              output: null,
              phase: "start",
            };
            // Insert before last text block
            const lastIdx = msg.blocks.length - 1;
            if (msg.blocks[lastIdx]?.type === "text") {
              msg.blocks.splice(lastIdx, 0, toolBlock);
            } else {
              msg.blocks.push(toolBlock);
            }
            // Ensure trailing text block exists
            if (msg.blocks[msg.blocks.length - 1]?.type !== "text") {
              msg.blocks.push({ type: "text", text: "" });
            }
            fireDelta();
          } else if (phase === "update") {
            const block = msg.blocks.find(
              (b) => b.type === "tool_call" && b.toolCallId === toolCallId,
            );
            if (block && block.type === "tool_call") {
              block.output =
                extractToolText(data.partialResult) ?? block.output;
              block.phase = "update";
            }
            fireDelta();
          } else if (phase === "result") {
            const block = msg.blocks.find(
              (b) => b.type === "tool_call" && b.toolCallId === toolCallId,
            );
            if (block && block.type === "tool_call") {
              block.output = extractToolText(data.result) ?? block.output;
              block.phase = "result";
            }
            fireDelta();
          }
        });

        client
          .request("agent", {
            message: text,
            agentId,
            idempotencyKey,
          })
          .then((rawAck: GatewayPayload) => {
            const ack = rawAck as AgentAckPayload;
            runId = ack?.runId ?? null;
            msg.runId = runId ?? undefined;

            // If the server returned the complete result inline (status "ok"
            // with result payload), resolve immediately — no streaming follows.
            if (ack?.status === "ok" && ack?.result) {
              const payloads = ack.result.payloads || [];
              const finalText =
                payloads
                  .map((p: { text?: string }) => p.text)
                  .filter(Boolean)
                  .join("\n") || "[No response]";
              currentTextBlock().text = finalText;
              finish(msg);
            }
            // Otherwise status is "accepted" (ack-with-final) — chat events
            // will stream in via the listener we set up above.
          })
          .catch((err: unknown) => {
            fail(err instanceof Error ? err : new Error(String(err)));
          });
      });
    },
    [chatAgents],
  );

  // listen for connection errors from the WS
  useEffect(() => {
    const client = clientRef.current;
    if (!client) {
      return;
    }
    const unsub = client.on("error", (payload: GatewayPayload) => {
      setConnectionError(String(payload?.message || "Connection error"));
    });
    return () => {
      unsub();
    };
  }, []);

  const remapAgents = useCallback(
    (gwAgents?: GatewayAgent[]) => {
      const src = gwAgents || rawAgents;
      setAgents(mapToHqAgents(src));
      setChatAgents(mapToChatAgents(src));
    },
    [rawAgents],
  );

  const value = {
    connectionState,
    connectionError,
    connectionPhase,
    pairingState,
    deviceId,
    connect,
    disconnect,
    agents,
    rawAgents,
    chatAgents,
    activityLogs,
    serverInfo,
    features,
    sendAgentMessage,
    createAgent,
    updateAgent,
    updateSkill,
    refreshSkills,
    remapAgents,
    skills,
    allSkills,
    client: clientRef.current,
    helloPayload,
    savedConnection: loadSavedConnection(),
    connectionHistory: loadConnectionHistory(),
  };

  return (
    <GatewayContext.Provider value={value}>{children}</GatewayContext.Provider>
  );
}

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) {
    throw new Error("useGateway must be used within GatewayProvider");
  }
  return ctx;
}
