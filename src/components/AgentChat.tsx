import { useEffect, useRef, useState } from "react";
import type { ChatAgent, ChatMessage } from "../types";
import { C } from "./constants";
import LobsterAvatar from "./LobsterAvatar";
import MarkdownRenderer from "./MarkdownRenderer";
import { btnPrimaryStyle, inputStyle, panelStyle } from "./styles";
import ToolCard from "./ToolCard";
import TypingDots from "./TypingDots";

export default function AgentChat({
  agents = [],
  onSendMessage,
  initialActiveId,
  expanded,
}: {
  agents?: ChatAgent[];
  onSendMessage?: (
    agentId: string,
    text: string,
    onDelta?: (partial: ChatMessage) => void,
  ) => Promise<ChatMessage>;
  initialActiveId?: string | null;
  expanded?: boolean;
}) {
  const [active, setActive] = useState(
    () =>
      (initialActiveId && agents.find((a) => a.id === initialActiveId)) ||
      agents[0] ||
      null,
  );
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const msgs = active ? messages[active.id] || [] : [];
  const sc: Record<string, string> = {
    active: C.green,
    busy: C.amber,
    idle: C.textDim,
  };

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
    const agentId = active.id;
    setInput("");

    // Add user message
    const userMsg: ChatMessage = {
      from: "user",
      blocks: [{ type: "text", text }],
    };

    // Add streaming placeholder for agent
    const placeholderMsg: ChatMessage = {
      from: "agent",
      blocks: [{ type: "text", text: "" }],
      streaming: true,
    };

    setMessages((p) => ({
      ...p,
      [agentId]: [...(p[agentId] || []), userMsg, placeholderMsg],
    }));
    setTyping(true);

    const onDelta = (partial: ChatMessage) => {
      setMessages((p) => {
        const list = p[agentId] || [];
        // Replace the last message (streaming agent message)
        return {
          ...p,
          [agentId]: [...list.slice(0, -1), partial],
        };
      });
    };

    if (onSendMessage) {
      Promise.resolve(onSendMessage(agentId, text, onDelta))
        .then((finalMsg) => {
          setMessages((p) => {
            const list = p[agentId] || [];
            return {
              ...p,
              [agentId]: [...list.slice(0, -1), finalMsg],
            };
          });
          setTyping(false);
        })
        .catch(() => {
          setTyping(false);
        });
    } else {
      setTimeout(
        () => {
          const mockMsg: ChatMessage = {
            from: "agent",
            blocks: [{ type: "text", text: `[${agentId}] Message received.` }],
          };
          setMessages((p) => ({
            ...p,
            [agentId]: [...(p[agentId] || []).slice(0, -1), mockMsg],
          }));
          setTyping(false);
        },
        1000 + Math.random() * 1200,
      );
    }
  };

  // Auto-scroll on new messages / streaming updates
  const msgCount = msgs.length;
  const lastMsg = msgs[msgCount - 1];
  const lastTextLen = lastMsg?.blocks.reduce(
    (n, b) => n + (b.type === "text" ? b.text.length : 0),
    0,
  );
  const scrollKey = lastMsg?.streaming
    ? `${msgCount}-${lastMsg.blocks.length}-${lastTextLen}`
    : `${msgCount}`;
  // biome-ignore lint/correctness/useExhaustiveDependencies: scrollKey intentionally triggers scroll on content changes
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [scrollKey]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  if (!active) {
    return null;
  }

  return (
    <div
      style={{
        ...(panelStyle as React.CSSProperties),
        padding: 0,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        height: expanded ? "100%" : 560,
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
        <LobsterAvatar color={active.color} size={32} style={{}} />
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
        {msgs.map((m, idx) => {
          if (m.from === "user") {
            // User messages: plain text
            const text = m.blocks
              .filter((b) => b.type === "text")
              .map((b) => (b as { type: "text"; text: string }).text)
              .join("");
            return (
              <div
                key={`user-${idx}`}
                style={{
                  display: "flex",
                  flexDirection: "row-reverse",
                  gap: 8,
                  alignItems: "flex-end",
                }}
              >
                <div
                  style={{
                    maxWidth: "78%",
                    padding: "8px 12px",
                    borderRadius: "8px 8px 2px 8px",
                    background: C.chatUser,
                    border: `1px solid ${C.amber}18`,
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: C.text,
                  }}
                >
                  {text}
                </div>
              </div>
            );
          }

          // Agent messages: render blocks
          const hasContent = m.blocks.some(
            (b) => (b.type === "text" && b.text) || b.type === "tool_call",
          );

          // Skip empty streaming placeholders with no content yet
          if (!hasContent && m.streaming) {
            return (
              <div
                key={`agent-${idx}`}
                style={{ display: "flex", gap: 8, alignItems: "flex-end" }}
              >
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
            );
          }

          return (
            <div
              key={`agent-${idx}`}
              style={{
                display: "flex",
                gap: 8,
                alignItems: "flex-start",
              }}
            >
              <LobsterAvatar
                color={active.color}
                size={22}
                style={{ flexShrink: 0, marginTop: 4 }}
              />
              <div style={{ maxWidth: "85%", minWidth: 0, flex: 1 }}>
                {m.blocks.map((block, bi) => {
                  if (block.type === "tool_call") {
                    return (
                      <ToolCard
                        key={block.toolCallId || `tc-${bi}`}
                        block={block}
                        agentColor={active.color}
                      />
                    );
                  }
                  // Text block
                  if (!block.text) {
                    return null;
                  }
                  return (
                    <div
                      key={`text-${bi}`}
                      style={{
                        padding: "8px 12px",
                        borderRadius: "8px 8px 8px 2px",
                        background: C.chatAgent,
                        border: `1px solid ${active.color}18`,
                        marginBottom: bi < m.blocks.length - 1 ? 4 : 0,
                      }}
                    >
                      <MarkdownRenderer content={block.text} />
                    </div>
                  );
                })}
                {/* Inline typing indicator at end of streaming message */}
                {m.streaming && (
                  <div style={{ marginTop: 4, paddingLeft: 4 }}>
                    <TypingDots color={active.color} />
                  </div>
                )}
              </div>
            </div>
          );
        })}
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
