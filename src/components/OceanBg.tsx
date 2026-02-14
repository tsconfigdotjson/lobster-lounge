import { useEffect, useRef } from "react";

export default function OceanBg() {
  const ref = useRef(null);
  const bubblesRef = useRef(
    Array.from({ length: 20 }, () => ({
      x: Math.random() * 300,
      y: Math.random() * 400,
      s: 0.1 + Math.random() * 0.3,
      sz: 1 + Math.floor(Math.random() * 2),
      w: Math.random() * Math.PI * 2,
    })),
  );
  useEffect(() => {
    let raf,
      fr = 0;
    const render = () => {
      const cv = ref.current;
      if (!cv) {
        return;
      }
      const ctx = cv.getContext("2d");
      fr++;
      for (let y = 0; y < 400; y++) {
        const t = y / 400;
        ctx.fillStyle = `rgb(${Math.round(10 + t * 16)},${Math.round(22 + t * 32)},${Math.round(40 + t * 42)})`;
        ctx.fillRect(0, y, 300, 1);
      }
      for (let i = 0; i < 6; i++) {
        const cx = (Math.sin(fr * 0.018 + i * 1.7) * 0.5 + 0.5) * 300;
        const cy = (Math.cos(fr * 0.012 + i * 2.3) * 0.5 + 0.5) * 400;
        ctx.fillStyle = "rgba(93,173,226,0.04)";
        ctx.fillRect(cx - 20, cy - 1, 40, 2);
      }
      bubblesRef.current.forEach((b) => {
        b.y -= b.s;
        b.x += Math.sin(fr * 0.02 + b.w) * 0.15;
        if (b.y < -4) {
          b.y = 404;
          b.x = Math.random() * 300;
        }
        ctx.fillStyle = "rgba(180,220,255,0.3)";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), b.sz, b.sz);
        ctx.fillStyle = "rgba(220,240,255,0.5)";
        ctx.fillRect(Math.round(b.x), Math.round(b.y), 1, 1);
      });
      raf = requestAnimationFrame(render);
    };
    render();
    return () => cancelAnimationFrame(raf);
  }, []);
  return (
    <canvas
      ref={ref}
      width={300}
      height={400}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        imageRendering: "pixelated",
        opacity: 0.5,
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
}
