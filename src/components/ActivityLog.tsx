import { C } from "./constants";

export default function ActivityLog({
  logs = [],
  tick,
}: {
  logs?: { agent: string; action: string; color: string; t: number }[];
  tick: number;
}) {
  const visible = logs.filter((l) => tick % 24 >= l.t).slice(-7);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {visible.map((l, i) => (
        <div
          key={`${l.agent}-${l.action}`}
          style={{
            fontSize: 11,
            lineHeight: 1.4,
            opacity: 0.4 + (i / visible.length) * 0.6,
            borderLeft: `2px solid ${l.color}`,
            paddingLeft: 6,
          }}
        >
          <span style={{ color: l.color, fontWeight: "bold" }}>{l.agent}</span>
          <div style={{ color: C.textDim }}>{l.action}</div>
        </div>
      ))}
    </div>
  );
}
