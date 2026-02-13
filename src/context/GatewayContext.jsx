import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import GatewayClient from "../services/gateway-client";
import { mapToHqAgents, mapToChatAgents, createLogEntry } from "../services/data-mappers";

const STORAGE_KEY = "openclaw-gateway";
const HISTORY_KEY = "openclaw-gateway-history";
const MAX_HISTORY = 5;

function loadSavedConnection() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null;
  } catch { return null; }
}

function saveConnection(url, token) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ url, token }));
  // also add to history
  let history = loadConnectionHistory();
  history = history.filter(h => h.url !== url);
  history.unshift({ url, token, ts: Date.now() });
  if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function loadConnectionHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch { return []; }
}

const GatewayContext = createContext(null);

export function GatewayProvider({ children }) {
  const [connectionState, setConnectionState] = useState("disconnected");
  const [connectionError, setConnectionError] = useState(null);
  const [agents, setAgents] = useState([]);
  const [chatAgents, setChatAgents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [serverInfo, setServerInfo] = useState(null);
  const [features, setFeatures] = useState(null);
  const [helloPayload, setHelloPayload] = useState(null);
  const [connectionPhase, setConnectionPhase] = useState("disconnected");
  const clientRef = useRef(null);
  const unsubsRef = useRef([]);

  const cleanup = useCallback(() => {
    unsubsRef.current.forEach(fn => fn());
    unsubsRef.current = [];
    if (clientRef.current) {
      clientRef.current.disconnect();
      clientRef.current = null;
    }
  }, []);

  const syncAgents = useCallback(async (client) => {
    setConnectionPhase("syncing");
    try {
      const res = await client.request("agents.list");
      const gwAgents = res.agents || [];
      setAgents(mapToHqAgents(gwAgents));
      setChatAgents(mapToChatAgents(gwAgents));
      gwAgents.forEach(a => {
        const name = (a.identity?.name || a.name || a.id).toUpperCase().slice(0, 8);
        setActivityLogs(prev => [...prev, createLogEntry(name, "Connected", "#2ecc71")]);
      });
      setConnectionPhase("connected");
    } catch (err) {
      setConnectionPhase("connected");
    }
  }, []);

  const connect = useCallback((url, token) => {
    cleanup();
    setConnectionError(null);
    setAgents([]);
    setChatAgents([]);
    setActivityLogs([]);
    setServerInfo(null);
    setFeatures(null);
    setHelloPayload(null);

    const client = new GatewayClient({
      onStateChange: (state) => {
        setConnectionState(state);
        if (state === "connected") {
          const hello = client.helloPayload;
          if (hello) {
            setHelloPayload(hello);
            setServerInfo(hello.server);
            setFeatures(hello.features);
          }
          saveConnection(url, token);
          syncAgents(client);
        }
        if (state === "disconnected") {
          setConnectionPhase("disconnected");
        }
      },
      onEvent: (event, payload) => {
        if (event === "agent") {
          const label = payload?.data?.agentId || "AGENT";
          setActivityLogs(prev => [...prev.slice(-50), createLogEntry(
            label.toUpperCase().slice(0, 8),
            payload?.stream || "event",
            "#f4a261"
          )]);
        }
        if (event === "presence") {
          setActivityLogs(prev => [...prev.slice(-50), createLogEntry(
            "SYSTEM",
            "Presence update",
            "#5dade2"
          )]);
        }
      },
    });

    clientRef.current = client;

    // subscribe to events
    const unsub1 = client.on("agent", (payload) => {
      // already handled in onEvent
    });
    unsubsRef.current.push(unsub1);

    client.connect(url, token);
  }, [cleanup, syncAgents]);

  const disconnect = useCallback(() => {
    cleanup();
    setConnectionState("disconnected");
    setConnectionPhase("disconnected");
    setConnectionError(null);
    setAgents([]);
    setChatAgents([]);
    setActivityLogs([]);
    setServerInfo(null);
    setFeatures(null);
    setHelloPayload(null);
  }, [cleanup]);

  const sendAgentMessage = useCallback((agentDisplayId, text) => {
    const client = clientRef.current;
    if (!client?.connected) return Promise.reject(new Error("Not connected"));

    // find gateway ID from chat agents
    const chatAgent = chatAgents.find(a => a.id === agentDisplayId);
    const agentId = chatAgent?._gatewayId || undefined;

    return new Promise((resolve, reject) => {
      const idempotencyKey = crypto.randomUUID();
      let accumulated = "";
      let resolved = false;
      let unsub;

      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          unsub?.();
          reject(new Error("Agent response timed out"));
        }
      }, 60000);

      client.request("agent", {
        message: text,
        agentId,
        idempotencyKey,
      }).then(ack => {
        // ack has runId or status
        const runId = ack?.runId;

        unsub = client.on("chat", (payload) => {
          if (runId && payload.runId !== runId) return;

          if (payload.state === "delta") {
            const delta = payload.message?.content?.[0]?.text
              || payload.message?.text
              || payload.message?.delta
              || "";
            accumulated += delta;
          } else if (payload.state === "final" || payload.state === "error" || payload.state === "aborted") {
            clearTimeout(timeout);
            if (!resolved) {
              resolved = true;
              unsub?.();
              if (payload.state === "error") {
                reject(new Error(payload.errorMessage || "Agent error"));
              } else {
                // grab final text if available
                const finalText = payload.message?.content?.[0]?.text
                  || payload.message?.text
                  || accumulated
                  || "[No response]";
                resolve(finalText);
              }
            }
          }
        });
      }).catch(err => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
          reject(err);
        }
      });
    });
  }, [chatAgents]);

  // listen for connection errors from the WS
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;
    const unsub = client.on("error", (payload) => {
      setConnectionError(payload?.message || "Connection error");
    });
    return unsub;
  }, [connectionState]);

  const value = {
    connectionState,
    connectionError,
    connectionPhase,
    connect,
    disconnect,
    agents,
    chatAgents,
    activityLogs,
    serverInfo,
    features,
    sendAgentMessage,
    client: clientRef.current,
    helloPayload,
    savedConnection: loadSavedConnection(),
    connectionHistory: loadConnectionHistory(),
  };

  return (
    <GatewayContext.Provider value={value}>
      {children}
    </GatewayContext.Provider>
  );
}

export function useGateway() {
  const ctx = useContext(GatewayContext);
  if (!ctx) throw new Error("useGateway must be used within GatewayProvider");
  return ctx;
}
