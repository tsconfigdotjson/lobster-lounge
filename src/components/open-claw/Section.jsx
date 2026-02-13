import { C } from "./constants";

export default function Section({ label, desc, children }) {
  return (
    <div style={{ zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 10, width: "100%" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 10, color: C.amber, letterSpacing: 3, fontWeight: "bold" }}>{label}</div>
        <div style={{ fontSize: 9, color: C.textDim, marginTop: 3 }}>{desc}</div>
      </div>
      {children}
    </div>
  );
}
