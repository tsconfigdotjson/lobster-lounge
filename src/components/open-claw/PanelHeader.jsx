import { C } from "./constants";

export default function PanelHeader({ icon, title }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <span style={{ fontSize: 14 }}>{icon}</span>
      <div style={{ fontSize: 12, fontWeight: "bold", letterSpacing: 3, color: C.amber }}>{title}</div>
    </div>
  );
}
