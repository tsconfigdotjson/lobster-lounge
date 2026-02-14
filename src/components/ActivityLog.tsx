import type { LogEntry } from "../types";
import { C } from "./constants";

export default function ActivityLog({
  logs = [],
}: {
  logs?: LogEntry[];
  tick?: number;
}) {
  const visible = logs.slice(-15);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {visible.map((l, i) => (
        <div
          key={l.id}
          style={{
            fontSize: 11,
            lineHeight: 1.4,
            opacity: 0.4 + (i / visible.length) * 0.6,
            borderLeft: `2px solid ${l.color}`,
            paddingLeft: 6,
            animation: "tideFadeIn 0.3s ease-out",
          }}
        >
          <span style={{ color: l.color, fontWeight: "bold" }}>{l.agent}</span>
          <div style={{ color: C.textDim }}>{l.action}</div>
        </div>
      ))}
    </div>
  );
}
