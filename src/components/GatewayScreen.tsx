import { useEffect, useState } from "react";
import { loadConnectionHistory } from "../context/GatewayContext";
import { getDeviceToken } from "../services/device-identity";
import type { HelloPayload, ServerInfo } from "../types";
import { C, CONNECTION_STEPS } from "./constants";
import LobsterAvatar from "./LobsterAvatar";
import PanelHeader from "./PanelHeader";
import Spinner from "./Spinner";
import { btnPrimaryStyle, inputStyle, labelStyle, panelStyle } from "./styles";

const STATE_TO_STEP: Record<string, number> = {
  connecting: 0,
  challenged: 1,
  handshaking: 2,
  pairing: 2,
  syncing: 3,
  connected: 4,
};

export default function GatewayScreen({
  onConnect,
  connectionState,
  connectionError,
  onStartConnect,
  serverInfo,
  helloPayload,
  deviceId,
}: {
  onConnect?: () => void;
  connectionState: string;
  connectionError?: string | null;
  onStartConnect?: (url: string, token?: string) => void;
  serverInfo?: ServerInfo | null;
  helloPayload?: HelloPayload | null;
  deviceId?: string | null;
}) {
  const defaultGatewayUrl = (() => {
    const proto = location.protocol === "https:" ? "wss" : "ws";
    return `${proto}://${location.host}`;
  })();

  const [phase, setPhase] = useState("select");
  const [url, setUrl] = useState(defaultGatewayUrl);
  const [token, setToken] = useState("");
  const [connectStep, setConnectStep] = useState(0);
  const history = loadConnectionHistory();

  // Load saved connection on mount (overrides default if present)
  useEffect(() => {
    try {
      const saved = JSON.parse(
        localStorage.getItem("openclaw-gateway") ?? "null",
      );
      if (saved?.url) {
        setUrl(saved.url);
      }
    } catch {
      /* ignore */
    }
  }, []);

  // Derive connectStep from connectionState prop
  useEffect(() => {
    if (phase === "connecting" || phase === "done") {
      const step =
        STATE_TO_STEP[connectionState] ?? STATE_TO_STEP[connectionState];
      if (step !== undefined) {
        setConnectStep(step);
      }
      if (connectionState === "connected") {
        setPhase("done");
      }
    }
  }, [connectionState, phase]);

  // Switch to error phase
  useEffect(() => {
    if (connectionError && (phase === "connecting" || phase === "done")) {
      setPhase("error");
    }
  }, [connectionError, phase]);

  const startConnect = () => {
    if (!url.trim()) {
      return;
    }
    setPhase("connecting");
    setConnectStep(0);
    onStartConnect?.(url.trim(), token || undefined);
  };

  const fillFromHistory = (entry: { url: string }) => {
    setUrl(entry.url);
  };

  const truncatedDeviceId = deviceId
    ? `${deviceId.slice(0, 4)}...${deviceId.slice(-4)}`
    : null;

  // Check if device is already paired for current URL
  let hasPairedToken = false;
  try {
    const host = url.trim() ? new URL(url.trim()).host : null;
    hasPairedToken = host ? !!getDeviceToken(host) : false;
  } catch {
    /* invalid URL, ignore */
  }

  const isPairing = connectionState === "pairing";

  if (phase === "select") {
    return (
      <div style={panelStyle as React.CSSProperties}>
        <PanelHeader icon="🌊" title="GATEWAY LOGIN" />
        <div
          style={{
            fontSize: 11,
            color: C.textDim,
            marginBottom: 16,
            lineHeight: 1.5,
          }}
        >
          Connect to an OpenClaw Gateway. Your device will be paired
          automatically.
        </div>

        <label style={labelStyle} htmlFor="gateway-url">
          GATEWAY URL
        </label>
        <input
          id="gateway-url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder={defaultGatewayUrl}
          style={inputStyle}
          onKeyDown={(e) => e.key === "Enter" && startConnect()}
        />

        <div style={{ marginBottom: 14 }} />

        {/* Device auth status */}
        <div
          style={{
            padding: "10px 12px",
            borderRadius: 4,
            marginBottom: 14,
            background: hasPairedToken ? `${C.green}08` : `${C.purple}08`,
            border: `1px solid ${hasPairedToken ? C.green : C.purple}20`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: 8,
                background: hasPairedToken ? C.green : C.purple,
                boxShadow: hasPairedToken ? `0 0 6px ${C.green}60` : "none",
              }}
            />
            <span
              style={{
                fontSize: 10,
                fontWeight: "bold",
                color: hasPairedToken ? C.green : C.purple,
                letterSpacing: 0.5,
              }}
            >
              {hasPairedToken ? "DEVICE PAIRED" : "NEW DEVICE"}
            </span>
          </div>
          {truncatedDeviceId && (
            <div
              style={{
                fontSize: 9,
                color: C.textDim,
                marginTop: 5,
                marginLeft: 16,
              }}
            >
              {hasPairedToken
                ? `Device ${truncatedDeviceId} has a stored token for this gateway`
                : `Device ${truncatedDeviceId} — gateway token required for first pairing`}
            </div>
          )}
        </div>

        {!hasPairedToken && (
          <>
            <label style={labelStyle} htmlFor="gateway-token">
              GATEWAY TOKEN
            </label>
            <input
              id="gateway-token"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste gateway token to pair this device"
              type="password"
              style={inputStyle}
              onKeyDown={(e) => e.key === "Enter" && startConnect()}
            />
            <div style={{ marginBottom: 6 }} />
          </>
        )}

        <div style={{ marginBottom: 20 }} />

        <button
          type="button"
          onClick={startConnect}
          disabled={!url.trim()}
          style={{
            ...btnPrimaryStyle(C.green),
            width: "100%",
            opacity: url.trim() ? 1 : 0.35,
            cursor: url.trim() ? "pointer" : "not-allowed",
          }}
        >
          🦞 CONNECT
        </button>

        {history.length > 0 && (
          <>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                margin: "20px 0 16px",
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
              <span style={{ fontSize: 9, color: C.textDim, letterSpacing: 2 }}>
                RECENT
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.06)",
                }}
              />
            </div>

            <span style={labelStyle}>RECENT CONNECTIONS</span>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {history.map((entry) => {
                const ts = entry.ts ? new Date(entry.ts) : null;
                const timeStr = ts
                  ? ts.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    }) +
                    " " +
                    ts.toLocaleTimeString(undefined, {
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "";
                let hostname = entry.url;
                try {
                  hostname = new URL(entry.url).host;
                } catch {
                  /* use raw url */
                }
                return (
                  <button
                    type="button"
                    key={entry.url}
                    onClick={() => fillFromHistory(entry)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "12px 14px",
                      background: "rgba(46,204,113,0.04)",
                      border: `1px solid ${C.green}30`,
                      borderRadius: 4,
                      cursor: "pointer",
                      color: C.text,
                      fontFamily: "'Courier New', monospace",
                      textAlign: "left",
                      width: "100%",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background =
                        "rgba(46,204,113,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background =
                        "rgba(46,204,113,0.04)";
                    }}
                  >
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 4,
                        background: `linear-gradient(135deg, ${C.sea0}, ${C.sea2})`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: `1px solid ${C.green}30`,
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      🦞
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                        }}
                      >
                        <span style={{ fontSize: 12, fontWeight: "bold" }}>
                          {hostname}
                        </span>
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: C.textDim,
                          marginTop: 3,
                          display: "flex",
                          gap: 12,
                        }}
                      >
                        <span
                          style={{
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            maxWidth: 180,
                          }}
                        >
                          {entry.url}
                        </span>
                        {timeStr && (
                          <>
                            <span>·</span>
                            <span>{timeStr}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div
                      style={{ fontSize: 14, color: C.amber, flexShrink: 0 }}
                    >
                      →
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        )}
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div style={panelStyle as React.CSSProperties}>
        <PanelHeader icon="\u26A0" title="CONNECTION FAILED" />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: 16,
              borderRadius: 8,
              background: `radial-gradient(circle, ${C.red}15 0%, transparent 70%)`,
            }}
          >
            <LobsterAvatar color={C.red} size={56} />
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            color: C.red,
            textAlign: "center",
            marginBottom: 20,
            lineHeight: 1.5,
          }}
        >
          {connectionError || "Unable to connect to gateway."}
        </div>
        <button
          type="button"
          onClick={() => {
            setPhase("select");
          }}
          style={{ ...btnPrimaryStyle(C.amber), width: "100%" }}
        >
          TRY AGAIN
        </button>
      </div>
    );
  }

  if (phase === "connecting" || phase === "done") {
    let hostname = url;
    try {
      hostname = new URL(url).host;
    } catch {
      /* use raw */
    }

    return (
      <div style={panelStyle as React.CSSProperties}>
        <PanelHeader
          icon={phase === "done" ? "\u2713" : "\u27F3"}
          title={phase === "done" ? "CONNECTED" : "CONNECTING..."}
        />
        <div style={{ textAlign: "center", marginBottom: 20 }}>
          <div
            style={{
              display: "inline-block",
              padding: 16,
              borderRadius: 8,
              background:
                phase === "done"
                  ? `radial-gradient(circle, ${C.green}15 0%, transparent 70%)`
                  : `radial-gradient(circle, ${C.amber}10 0%, transparent 70%)`,
            }}
          >
            <LobsterAvatar
              color={phase === "done" ? C.green : C.amber}
              size={56}
            />
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: "bold",
              color: C.text,
              marginTop: 8,
            }}
          >
            {hostname}
          </div>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 2,
            marginBottom: 20,
          }}
        >
          {CONNECTION_STEPS.map((step, i) => {
            const isActive = i === connectStep && phase === "connecting";
            const isDone = i < connectStep || phase === "done";
            const isPairingStep = isPairing && i === 2;
            const stepColor = isPairingStep
              ? C.purple
              : isActive
                ? C.amber
                : isDone
                  ? C.green
                  : C.textDim;
            return (
              <div
                key={step.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 12px",
                  borderRadius: 3,
                  background: isPairingStep
                    ? `${C.purple}08`
                    : isActive
                      ? `${C.amber}08`
                      : isDone
                        ? `${C.green}06`
                        : "transparent",
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 28,
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 11,
                    fontWeight: "bold",
                    background: isDone
                      ? `${C.green}20`
                      : isPairingStep
                        ? `${C.purple}15`
                        : isActive
                          ? `${C.amber}15`
                          : "rgba(255,255,255,0.03)",
                    border: `2px solid ${isDone ? C.green : isPairingStep ? C.purple : isActive ? C.amber : "rgba(255,255,255,0.06)"}`,
                    color: isDone
                      ? C.green
                      : isPairingStep
                        ? C.purple
                        : isActive
                          ? C.amber
                          : C.textDim,
                  }}
                >
                  {isDone ? "\u2713" : i + 1}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: "bold",
                      color: stepColor,
                    }}
                  >
                    {step.label.toUpperCase()}
                  </div>
                  <div style={{ fontSize: 9, color: C.textDim, marginTop: 2 }}>
                    {isPairingStep
                      ? "Waiting for operator approval..."
                      : step.desc}
                  </div>
                  {isActive && !isPairingStep && (
                    <div
                      style={{
                        marginTop: 6,
                        height: 3,
                        borderRadius: 3,
                        background: "rgba(255,255,255,0.06)",
                        overflow: "hidden",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          borderRadius: 3,
                          background: `linear-gradient(90deg, transparent, ${C.amber}, ${C.coral2}, transparent)`,
                          backgroundSize: "200% 100%",
                          animation: "shimmer 1.5s infinite linear",
                          width: "100%",
                        }}
                      />
                    </div>
                  )}
                  {isPairingStep && (
                    <div
                      style={{
                        marginTop: 6,
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: 6,
                          background: C.purple,
                          animation: "pulse 1.5s infinite ease-in-out",
                        }}
                      />
                      <span style={{ fontSize: 9, color: C.purple }}>
                        Pairing in progress
                      </span>
                    </div>
                  )}
                </div>
                {isDone && (
                  <span style={{ fontSize: 9, color: C.green, flexShrink: 0 }}>
                    ✓
                  </span>
                )}
                {isActive && !isPairingStep && <Spinner color={C.amber} />}
                {isPairingStep && <Spinner color={C.purple} />}
              </div>
            );
          })}
        </div>
        {isPairing && (
          <div
            style={{
              background: `${C.purple}08`,
              border: `1px solid ${C.purple}25`,
              borderRadius: 4,
              padding: "14px",
              marginBottom: 20,
            }}
          >
            <div style={{ fontSize: 10, color: C.textDim, lineHeight: 1.5 }}>
              This device needs to be approved by an existing operator. Ask them
              to check their pairing requests.
            </div>
          </div>
        )}
        {phase === "done" && (
          <div style={{ animation: "fadeIn 0.4s ease" }}>
            <div
              style={{
                display: "flex",
                gap: 1,
                marginBottom: 16,
                borderRadius: 4,
                overflow: "hidden",
              }}
            >
              {[
                {
                  label: "VERSION",
                  value: serverInfo?.version || "—",
                  color: C.green,
                },
                {
                  label: "UPTIME",
                  value: formatUptime(helloPayload),
                  color: C.green,
                },
                { label: "STATUS", value: "READY", color: C.cyan },
              ].map((s) => (
                <div
                  key={s.label}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    textAlign: "center",
                    background: `${s.color}08`,
                  }}
                >
                  <div
                    style={{
                      fontSize: 8,
                      color: C.textDim,
                      letterSpacing: 1,
                      marginBottom: 3,
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{ fontSize: 12, fontWeight: "bold", color: s.color }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onConnect?.()}
              style={{ ...btnPrimaryStyle(C.green), width: "100%" }}
            >
              🦞 ENTER THE REEF →
            </button>
          </div>
        )}
        <style>{`
          @keyframes fadeIn { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:translateY(0); } }
          @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
          @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        `}</style>
      </div>
    );
  }

  return null;
}

function formatUptime(helloPayload: HelloPayload | null | undefined) {
  const ms = helloPayload?.snapshot?.uptimeMs;
  if (ms == null) {
    return "\u2014";
  }
  if (ms < 60000) {
    return `${Math.round(ms / 1000)}s`;
  }
  if (ms < 3600000) {
    return `${Math.round(ms / 60000)}m`;
  }
  return `${Math.round(ms / 3600000)}h`;
}
