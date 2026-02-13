import { useState } from "react";
import { C } from "./constants";

const PAGE_SIZE = 8;

export default function SkillsPanel({ skills = [], onToggle }) {
  const [page, setPage] = useState(0);

  const sorted = [...skills].sort((a, b) => {
    if (a.enabled !== b.enabled) {
      return a.enabled ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const clamped = Math.min(page, totalPages - 1);
  const slice = sorted.slice(clamped * PAGE_SIZE, (clamped + 1) * PAGE_SIZE);

  return (
    <div style={{ padding: "8px 10px", width: 220 }}>
      {sorted.length === 0 ? (
        <div
          style={{
            fontSize: 10,
            color: C.textDim,
            textAlign: "center",
            padding: 12,
          }}
        >
          No skills available
        </div>
      ) : (
        <>
          {slice.map((s) => (
            <div
              key={s.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 4px",
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              <span
                style={{
                  fontSize: 14,
                  width: 20,
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
                  fontWeight: s.enabled ? "bold" : "normal",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {s.name}
              </span>
              {s.cat && (
                <span
                  style={{
                    fontSize: 8,
                    color: C.amber,
                    padding: "1px 5px",
                    background: `${C.amber}12`,
                    borderRadius: 2,
                    flexShrink: 0,
                  }}
                >
                  {s.cat}
                </span>
              )}
              <button
                type="button"
                onClick={() => onToggle?.(s.id, !s.enabled)}
                style={{
                  width: 34,
                  height: 18,
                  borderRadius: 9,
                  border: "none",
                  cursor: "pointer",
                  background: s.enabled ? C.green : "rgba(255,255,255,0.08)",
                  position: "relative",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                <span
                  style={{
                    position: "absolute",
                    top: 2,
                    left: s.enabled ? 18 : 2,
                    width: 14,
                    height: 14,
                    borderRadius: 7,
                    background: s.enabled ? "#fff" : C.textDim,
                    transition: "left 0.2s",
                  }}
                />
              </button>
            </div>
          ))}

          {totalPages > 1 && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                marginTop: 8,
                fontSize: 10,
              }}
            >
              <button
                type="button"
                onClick={() => setPage(Math.max(0, clamped - 1))}
                disabled={clamped === 0}
                style={{
                  background: "none",
                  border: "none",
                  color: clamped === 0 ? C.textDim : C.amber,
                  cursor: clamped === 0 ? "default" : "pointer",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  padding: "2px 6px",
                  opacity: clamped === 0 ? 0.3 : 1,
                }}
              >
                {"<"}
              </button>
              <span style={{ color: C.textDim }}>
                {clamped + 1}/{totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage(Math.min(totalPages - 1, clamped + 1))}
                disabled={clamped >= totalPages - 1}
                style={{
                  background: "none",
                  border: "none",
                  color: clamped >= totalPages - 1 ? C.textDim : C.amber,
                  cursor: clamped >= totalPages - 1 ? "default" : "pointer",
                  fontFamily: "'Courier New', monospace",
                  fontSize: 11,
                  padding: "2px 6px",
                  opacity: clamped >= totalPages - 1 ? 0.3 : 1,
                }}
              >
                {">"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
