import { C } from "./constants";

export default function HudItem({ label, value, color, pulse, pulseRate = "2s" }) {
  return (
    <div style={{ textAlign: "center" }}>
      <div
        style={{
          fontSize: 10,
          letterSpacing: 2,
          color: C.textDim,
          marginBottom: 2,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 14,
          fontWeight: "bold",
          color,
          animation: pulse ? `pulse ${pulseRate} infinite` : "none",
        }}
      >
        {value}
      </div>
    </div>
  );
}
