import type React from "react";
import { C } from "./constants";

export const panelStyle: React.CSSProperties = {
  background: C.uiBg,
  border: `2px solid ${C.uiBorder}`,
  borderRadius: 6,
  padding: 20,
  width: 400,
  position: "relative",
  overflow: "hidden",
};

export const labelStyle = {
  display: "block",
  fontSize: 9,
  letterSpacing: 2,
  color: C.amber,
  marginBottom: 6,
  fontWeight: "bold",
  fontFamily: "'Courier New', monospace",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  background: C.inputBg,
  border: `1px solid ${C.inputBorder}`,
  borderRadius: 3,
  color: C.text,
  fontFamily: "'Courier New', monospace",
  fontSize: 13,
  outline: "none",
  boxSizing: "border-box",
};

export const counterStyle: React.CSSProperties = {
  fontSize: 9,
  color: C.textDim,
  marginTop: 2,
  marginBottom: 14,
  textAlign: "right",
};

export function btnPrimaryStyle(c: string): React.CSSProperties {
  return {
    padding: "11px 20px",
    background: `${c}18`,
    border: `2px solid ${c}`,
    borderRadius: 4,
    color: c,
    fontFamily: "'Courier New', monospace",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 2,
    cursor: "pointer",
  };
}

export const btnSecondaryStyle: React.CSSProperties = {
  padding: "11px 20px",
  background: "transparent",
  border: `1px solid ${C.textDim}`,
  borderRadius: 4,
  color: C.textDim,
  fontFamily: "'Courier New', monospace",
  fontSize: 11,
  letterSpacing: 1,
  cursor: "pointer",
};
