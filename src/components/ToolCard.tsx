import { useState } from "react";
import type { ContentBlock } from "../types";
import { C } from "./constants";
import Spinner from "./Spinner";
import ToolIcon from "./ToolIcon";

type ToolCallBlock = Extract<ContentBlock, { type: "tool_call" }>;

// Tool config: label and keys to try for the detail line
type ToolDef = { label: string; detailKeys?: string[] };

const TOOL_CONFIG: Record<string, ToolDef> = {
  read: { label: "Read File", detailKeys: ["file_path", "path"] },
  write: { label: "Write File", detailKeys: ["file_path", "path"] },
  edit: { label: "Edit File", detailKeys: ["file_path", "path"] },
  bash: { label: "Run Command", detailKeys: ["command", "cmd"] },
  exec: { label: "Run Command", detailKeys: ["command", "cmd"] },
  glob: { label: "Find Files", detailKeys: ["pattern", "path"] },
  grep: { label: "Search Code", detailKeys: ["pattern", "query"] },
  web_fetch: { label: "Fetch URL", detailKeys: ["url", "targetUrl"] },
  webfetch: { label: "Fetch URL", detailKeys: ["url", "targetUrl"] },
  web_search: { label: "Web Search", detailKeys: ["query"] },
  websearch: { label: "Web Search", detailKeys: ["query"] },
  task: { label: "Sub-Agent", detailKeys: ["prompt", "description"] },
  browser: { label: "Browser", detailKeys: ["targetUrl", "url"] },
  apply_patch: { label: "Apply Patch", detailKeys: ["path"] },
};

function lookupConfig(toolName: string): ToolDef {
  const key = toolName.trim().toLowerCase();
  return TOOL_CONFIG[key] ?? { label: toolName || "Tool Call" };
}

const INLINE_THRESHOLD = 80;
const PREVIEW_MAX_CHARS = 100;

/** Try to coerce args from a JSON string into an object */
function coerceArgs(args: Record<string, unknown>): Record<string, unknown> {
  // If args has a single string value that looks like JSON, parse it
  const keys = Object.keys(args);
  if (keys.length === 0) {
    return args;
  }
  // Sometimes the whole args is wrapped: { "0": "{...}" } or similar
  for (const k of keys) {
    const v = args[k];
    if (typeof v === "string" && v.startsWith("{")) {
      try {
        return JSON.parse(v) as Record<string, unknown>;
      } catch {
        // not JSON
      }
    }
  }
  return args;
}

function getDetail(block: ToolCallBlock): string | null {
  const cfg = lookupConfig(block.toolName);
  if (!cfg.detailKeys?.length) {
    return null;
  }
  const args = coerceArgs(block.args ?? {});
  for (const key of cfg.detailKeys) {
    const val = args[key];
    if (typeof val === "string" && val) {
      return val.length > 120 ? `${val.slice(0, 117)}...` : val;
    }
  }
  return null;
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
  const cfg = lookupConfig(block.toolName);
  const isRunning = block.phase !== "result";
  const detail = getDetail(block);
  const preview = getPreview(block.output);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: role is conditionally set
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
          padding: "6px 10px 2px",
        }}
      >
        <ToolIcon toolName={block.toolName} color={agentColor} size={22} />
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            fontFamily: "'Courier New', monospace",
            letterSpacing: 0.5,
            color: C.amber,
            opacity: 0.75,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cfg.label}
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
            padding: "0 10px 4px 32px",
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
            padding: "0 10px 4px 32px",
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
            padding: "0 10px 4px 32px",
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
