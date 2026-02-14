import { useEffect, useRef, useState } from "react";
import { C } from "./constants";
import LobsterAvatar from "./LobsterAvatar";
import { btnPrimaryStyle, inputStyle, panelStyle } from "./styles";
import TypingDots from "./TypingDots";

export default function AgentChat({ agents = [], onSendMessage, initialActiveId }) {
  const [active, setActive] = useState(
    () => (initialActiveId && agents.find((a) => a.id === initialActiveId)) || agents[0] || null,
  );
  const [messages, setMessages] = useState({});
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const inputRef = useRef(null);
  const msgs = active ? messages[active.id] || [] : [];
  const sc = { active: C.green, busy: C.amber, idle: C.textDim };

  useEffect(() => {
    if (agents.length > 0 && !active) {
      setActive(agents[0]);
    }
  }, [agents, active]);

  useEffect(() => {
    if (initialActiveId) {
      const match = agents.find((a) => a.id === initialActiveId);
      if (match) {
        setActive(match);
      }
      inputRef.current?.focus();
    }
  }, [initialActiveId, agents]);

  const send = () => {
    if (!input.trim() || typing || !active) {
      return;
    }
    const text = input.trim();
    setInput("");
    setMessages((p) => ({
      ...p,
      [active.id]: [...(p[active.id] || []), { from: "user", text }],
    }));
    setTyping(true);
    if (onSendMessage) {
      Promise.resolve(onSendMessage(active.id, text)).then((response) => {
        setMessages((p) => ({
          ...p,
          [active.id]: [
            ...(p[active.id] || []),
            { from: "agent", text: response },
          ],
        }));
        setTyping(false);
      });
    } else {
      setTimeout(
        () => {
          setMessages((p) => ({
            ...p,
            [active.id]: [
              ...(p[active.id] || []),
              { from: "agent", text: `[${active.id}] Message received.` },
            ],
          }));
          setTyping(false);
        },
        1000 + Math.random() * 1200,
      );
    }
  };

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
    inputRef.current?.focus();
  }, []);

  if (!active) {
    return null;
  }

  return (
    <div
      style={{
        ...panelStyle,
        padding: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: 560,
        boxSizing: "border-box",
        border: "none",
        borderRadius: 0,
      }}
    >
      <div
        style={{
          display: "flex",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
          overflowX: "auto",
          flexShrink: 0,
        }}
      >
        {agents.map((a) => (
          <button
            type="button"
            key={a.id}
            onClick={() => setActive(a)}
            style={{
              padding: "10px 12px",
              background: active.id === a.id ? `${a.color}10` : "transparent",
              border: "none",
              borderBottom: `2px solid ${active.id === a.id ? a.color : "transparent"}`,
              cursor: "pointer",
              color: active.id === a.id ? a.color : C.textDim,
              fontFamily: "'Courier New', monospace",
              fontSize: 11,
              fontWeight: "bold",
              letterSpacing: 1,
              display: "flex",
              alignItems: "center",
              gap: 5,
              whiteSpace: "nowrap",
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 6,
                background: sc[a.status],
                boxShadow:
                  a.status === "active" ? `0 0 4px ${C.green}60` : "none",
              }}
            />
            {a.id}
          </button>
        ))}
      </div>
      <div
        style={{
          padding: "10px 16px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          borderBottom: "1px solid rgba(255,255,255,0.03)",
          flexShrink: 0,
        }}
      >
        <LobsterAvatar color={active.color} size={32} />
        <div style={{ flex: 1 }}>
          <div
            style={{ fontSize: 15, fontWeight: "bold", color: active.color }}
          >
            {active.id}
          </div>
          <div style={{ fontSize: 11, color: C.textDim }}>
            {active.role} · {active.status.toUpperCase()}
          </div>
        </div>
        <div
          style={{
            padding: "3px 8px",
            borderRadius: 2,
            background: `${sc[active.status]}12`,
            border: `1px solid ${sc[active.status]}35`,
            fontSize: 10,
            color: sc[active.status],
            letterSpacing: 1,
          }}
        >
          {active.status.toUpperCase()}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {msgs.length === 0 && !typing && (
          <div
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              opacity: 0.4,
            }}
          >
            <LobsterAvatar color={active.color} size={44} />
            <div
              style={{
                fontSize: 12,
                color: C.textDim,
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              Send a message to {active.id}
              <br />
              <span style={{ fontSize: 11 }}>
                Try: "Status report" or "What did you find?"
              </span>
            </div>
          </div>
        )}
        {msgs.map((m, idx) => (
          <div
            key={`${m.from}-${idx}`}
            style={{
              display: "flex",
              flexDirection: m.from === "user" ? "row-reverse" : "row",
              gap: 8,
              alignItems: "flex-end",
            }}
          >
            {m.from === "agent" && (
              <LobsterAvatar
                color={active.color}
                size={22}
                style={{ flexShrink: 0 }}
              />
            )}
            <div
              style={{
                maxWidth: "78%",
                padding: "8px 12px",
                borderRadius:
                  m.from === "user" ? "8px 8px 2px 8px" : "8px 8px 8px 2px",
                background: m.from === "user" ? C.chatUser : C.chatAgent,
                border: `1px solid ${m.from === "user" ? `${C.amber}18` : `${active.color}18`}`,
                fontSize: 13,
                lineHeight: 1.55,
                color: C.text,
              }}
            >
              {m.text}
            </div>
          </div>
        ))}
        {typing && (
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <LobsterAvatar
              color={active.color}
              size={22}
              style={{ flexShrink: 0 }}
            />
            <div
              style={{
                padding: "10px 16px",
                borderRadius: "8px 8px 8px 2px",
                background: C.chatAgent,
                border: `1px solid ${active.color}18`,
              }}
            >
              <TypingDots color={active.color} />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div
        style={{
          padding: "10px 12px",
          borderTop: "1px solid rgba(255,255,255,0.05)",
          display: "flex",
          gap: 8,
          flexShrink: 0,
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder={`Message ${active.id}...`}
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || typing}
          style={{
            ...btnPrimaryStyle(active.color),
            opacity: input.trim() && !typing ? 1 : 0.3,
            padding: "8px 16px",
            fontSize: 12,
          }}
        >
          SEND
        </button>
      </div>
    </div>
  );
}
