import { useCallback, useLayoutEffect, useRef, useState } from "react";
import { C } from "./constants";

export default function DraggablePanel({
  children,
  defaultX = 0,
  defaultY = 0,
  centered = false,
  title,
  style,
}) {
  const [pos, setPos] = useState({ x: defaultX, y: defaultY });
  const [ready, setReady] = useState(!centered);
  const dragRef = useRef(null);

  useLayoutEffect(() => {
    if (centered && dragRef.current && !ready) {
      const rect = dragRef.current.getBoundingClientRect();
      setPos({
        x: Math.max(16, (window.innerWidth - rect.width) / 2),
        y: Math.max(16, (window.innerHeight - rect.height) / 2),
      });
      setReady(true);
    }
  }, [centered, ready]);

  const onPointerDown = useCallback(
    (e) => {
      if (e.target.closest("button, input, textarea, select")) {
        return;
      }
      e.preventDefault();
      const startX = e.clientX - pos.x;
      const startY = e.clientY - pos.y;
      const onMove = (ev) =>
        setPos({ x: ev.clientX - startX, y: ev.clientY - startY });
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [pos.x, pos.y],
  );

  return (
    <div
      ref={dragRef}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        zIndex: 50,
        background: C.uiBg,
        border: `2px solid ${C.uiBorderAlt}`,
        borderRadius: 4,
        backdropFilter: "blur(8px)",
        boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        opacity: ready ? 1 : 0,
        ...style,
      }}
    >
      <div
        onPointerDown={onPointerDown}
        style={{
          cursor: "grab",
          padding: "5px 10px",
          borderBottom: `1px solid rgba(255,255,255,0.05)`,
          fontSize: 11,
          color: C.textDim,
          letterSpacing: 2,
          userSelect: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <span style={{ opacity: 0.3, fontSize: 10 }}>&#x2630;</span>
        {title}
      </div>
      {children}
    </div>
  );
}
