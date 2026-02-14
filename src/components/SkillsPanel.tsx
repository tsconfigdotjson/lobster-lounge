import { useState } from "react";
import type { SkillWithStatus } from "../types";
import { C } from "./constants";

export default function SkillsPanel({
  skills = [],
  onToggle,
}: {
  skills?: SkillWithStatus[];
  onToggle?: (skillId: string, enabled: boolean) => void;
}) {
  const [filter, setFilter] = useState("");

  const filtered = filter.trim()
    ? skills.filter((s) =>
        [s.name, s.desc, s.cat]
          .join(" ")
          .toLowerCase()
          .includes(filter.trim().toLowerCase()),
      )
    : skills;

  const sorted = [...filtered].sort((a, b) => {
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const enabledCount = skills.filter((s) => s.enabled).length;

  return (
    <div style={{ width: 300 }}>
      {/* Search input */}
      <div style={{ padding: "8px 10px" }}>
        <div style={{ position: "relative" }}>
          <input
            type="text"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search skills..."
            style={{
              width: "100%",
              padding: "6px 10px",
              paddingRight: 50,
              background: C.inputBg,
              border: `1px solid ${C.inputBorder}`,
              borderRadius: 3,
              color: C.text,
              fontSize: 11,
              fontFamily: "'Courier New', monospace",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
          <span
            style={{
              position: "absolute",
              right: 10,
              top: "50%",
              transform: "translateY(-50%)",
              fontSize: 9,
              color: C.textDim,
              pointerEvents: "none",
            }}
          >
            {enabledCount}/{skills.length}
          </span>
        </div>
      </div>

      {/* Skills list */}
      <div
        style={{
          maxHeight: 280,
          overflowY: "auto",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: 6,
        }}
      >
        {sorted.length === 0 ? (
          <div
            style={{
              fontSize: 10,
              color: C.textDim,
              textAlign: "center",
              padding: 16,
            }}
          >
            {filter ? "No matching skills" : "No skills available"}
          </div>
        ) : (
          sorted.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => onToggle?.(s.id, !s.enabled)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                width: "100%",
                padding: "6px 12px",
                background: "transparent",
                border: "none",
                borderBottom: "1px solid rgba(255,255,255,0.03)",
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "'Courier New', monospace",
              }}
            >
              <span
                style={{
                  fontSize: 13,
                  width: 18,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {s.icon}
              </span>
              <span
                style={{
                  flex: 1,
                  fontSize: 11,
                  color: s.enabled ? C.text : C.textDim,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.name}
              </span>
              {s.enabled && (
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: "bold",
                    color: C.green,
                    letterSpacing: 1,
                    flexShrink: 0,
                  }}
                >
                  ON
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
