import { useState } from "react";
import type { ContentBlock } from "../types";
import { C } from "./constants";
import Spinner from "./Spinner";

type ToolCallBlock = Extract<ContentBlock, { type: "tool_call" }>;

// Tool config: icon, label, and key to extract for the detail line
const TOOL_CONFIG: Record<
  string,
  { icon: string; label: string; detailKey?: string }
> = {
  Read: { icon: "\uD83D\uDCC4", label: "Read File", detailKey: "file_path" },
  Write: { icon: "\u270D\uFE0F", label: "Write File", detailKey: "file_path" },
  Edit: { icon: "\u2702\uFE0F", label: "Edit File", detailKey: "file_path" },
  Bash: { icon: "\uD83D\uDCBB", label: "Run Command", detailKey: "command" },
  Glob: { icon: "\uD83D\uDD0D", label: "Find Files", detailKey: "pattern" },
  Grep: { icon: "\uD83D\uDD0E", label: "Search Code", detailKey: "pattern" },
  WebFetch: { icon: "\uD83C\uDF10", label: "Fetch URL", detailKey: "url" },
  WebSearch: { icon: "\uD83C\uDF10", label: "Web Search", detailKey: "query" },
  Task: { icon: "\uD83E\uDD16", label: "Sub-Agent", detailKey: "prompt" },
};

const FALLBACK_CONFIG = { icon: "\u2699\uFE0F", label: "Tool Call" };

const INLINE_THRESHOLD = 80;
const PREVIEW_MAX_CHARS = 100;

function getDetail(block: ToolCallBlock): string | null {
  const cfg = TOOL_CONFIG[block.toolName];
  if (!cfg?.detailKey) {
    return null;
  }
  const val = block.args?.[cfg.detailKey];
  if (typeof val !== "string" || !val) {
    return null;
  }
  return val.length > 120 ? `${val.slice(0, 117)}...` : val;
}

function getPreview(
  output: string | null,
): { inline: boolean; text: string } | null {
  if (!output) {
    return null;
  }
  const trimmed = output.trim();
  if (!trimmed) {
    return null;
  }
  if (trimmed.length <= INLINE_THRESHOLD) {
    return { inline: true, text: trimmed };
  }
  // Truncate for collapsed preview
  const lines = trimmed.split("\n").slice(0, 2).join("\n");
  const text =
    lines.length > PREVIEW_MAX_CHARS
      ? `${lines.slice(0, PREVIEW_MAX_CHARS)}...`
      : lines;
  return { inline: false, text };
}

export default function ToolCard({
  block,
  agentColor,
}: {
  block: ToolCallBlock;
  agentColor: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TOOL_CONFIG[block.toolName] || FALLBACK_CONFIG;
  const isRunning = block.phase !== "result";
  const detail = getDetail(block);
  const preview = getPreview(block.output);

  return (
    <div
      role={block.output ? "button" : undefined}
      tabIndex={block.output ? 0 : undefined}
      style={{
        border: `1px solid ${isRunning ? `${agentColor}30` : `${C.green}25`}`,
        borderRadius: 6,
        background: "rgba(10,22,40,0.6)",
        margin: "4px 0",
        overflow: "hidden",
        cursor: block.output ? "pointer" : "default",
        transition: "border-color 0.2s",
      }}
      onClick={() => block.output && setExpanded((e) => !e)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          block.output && setExpanded((p) => !p);
        }
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "7px 10px",
        }}
      >
        <span style={{ fontSize: 14, flexShrink: 0 }}>{cfg.icon}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: "bold",
            fontFamily: "'Courier New', monospace",
            letterSpacing: 0.5,
            color: C.text,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
          {cfg.label === "Tool Call" && (
            <span style={{ color: C.textDim, fontWeight: "normal" }}>
              {" "}
              ({block.toolName})
            </span>
          )}
        </span>
        {isRunning ? (
          <Spinner color={agentColor} />
        ) : (
          <span style={{ fontSize: 13, color: C.green, flexShrink: 0 }}>
            {"\u2713"}
          </span>
        )}
        {block.output && (
          <span
            style={{
              fontSize: 10,
              color: C.textDim,
              flexShrink: 0,
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            {"\u25BC"}
          </span>
        )}
      </div>

      {/* Detail line */}
      {detail && (
        <div
          style={{
            padding: "0 10px 6px 32px",
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: C.textDim,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {detail}
        </div>
      )}

      {/* Output preview (collapsed) */}
      {!expanded && preview && (
        <div
          style={{
            padding: "0 10px 7px 32px",
            fontSize: 11,
            fontFamily: "'Courier New', monospace",
            color: preview.inline ? C.text : C.textDim,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: preview.inline ? "nowrap" : "pre-wrap",
            maxHeight: preview.inline ? "auto" : 34,
            lineHeight: 1.4,
          }}
        >
          {preview.text}
        </div>
      )}

      {/* "Completed" badge if no output and done */}
      {!expanded && !preview && !isRunning && (
        <div
          style={{
            padding: "0 10px 7px 32px",
            fontSize: 10,
            color: C.green,
            letterSpacing: 0.5,
          }}
        >
          Completed
        </div>
      )}

      {/* Expanded output */}
      {expanded && block.output && (
        <div
          style={{
            borderTop: `1px solid rgba(255,255,255,0.05)`,
            maxHeight: 300,
            overflowY: "auto",
            padding: "8px 10px",
          }}
        >
          <pre
            style={{
              margin: 0,
              fontSize: 11,
              fontFamily: "'Courier New', monospace",
              color: C.text,
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              lineHeight: 1.45,
            }}
          >
            {block.output}
          </pre>
        </div>
      )}
    </div>
  );
}
