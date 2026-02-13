import { useRef, useEffect } from "react";
import { shadeColor } from "./helpers";

export default function LobsterAvatar({ color, size = 48, style: extra }) {
  const ref = useRef(null);
  const f = useRef(Math.random() * 100);
  useEffect(() => {
    let raf;
    const draw = () => {
      const cv = ref.current;
      if (!cv) return;
      const ctx = cv.getContext("2d");
      const fr = f.current++;
      ctx.clearRect(0, 0, 16, 16);
      const bob = Math.sin(fr * 0.08) > 0 ? -1 : 0;
      const c = color;
      ctx.fillStyle = c;
      ctx.fillRect(4, 5 + bob, 8, 7);
      ctx.fillStyle = shadeColor(c, 25);
      ctx.fillRect(5, 5 + bob, 3, 2);
      ctx.fillStyle = shadeColor(c, -15);
      ctx.fillRect(4, 8 + bob, 8, 1);
      ctx.fillStyle = shadeColor(c, 10);
      ctx.fillRect(5, 2 + bob, 6, 4);
      ctx.fillStyle = "#0a0a14";
      ctx.fillRect(4, 2 + bob, 2, 2);
      ctx.fillRect(10, 2 + bob, 2, 2);
      ctx.fillStyle = "#fff";
      ctx.fillRect(4, 1 + bob, 1, 1);
      ctx.fillRect(11, 1 + bob, 1, 1);
      ctx.fillStyle = shadeColor(c, -20);
      const a = Math.sin(fr * 0.1) * 1.5;
      ctx.fillRect(3 + Math.round(a), bob, 1, 2);
      ctx.fillRect(12 - Math.round(a), bob, 1, 2);
      const snap = Math.sin(fr * 0.06) > 0.7 ? 1 : 0;
      ctx.fillStyle = shadeColor(c, 15);
      ctx.fillRect(1, 5 + bob, 3, 3);
      ctx.fillRect(0, 4 + bob, 2, 2 + snap);
      ctx.fillStyle = shadeColor(c, -10);
      ctx.fillRect(0, 7 + bob - snap, 2, 2);
      ctx.fillStyle = shadeColor(c, 15);
      ctx.fillRect(12, 5 + bob, 3, 3);
      ctx.fillRect(14, 4 + bob, 2, 2 + snap);
      ctx.fillStyle = shadeColor(c, -10);
      ctx.fillRect(14, 7 + bob - snap, 2, 2);
      ctx.fillStyle = shadeColor(c, -25);
      ctx.fillRect(6, 12 + bob, 4, 3);
      ctx.fillRect(4, 14, 3, 1);
      ctx.fillRect(9, 14, 3, 1);
      ctx.fillStyle = shadeColor(c, -30);
      for (let i = 0; i < 3; i++) {
        const lb = Math.sin(fr * 0.12 + i * 1.5) > 0 ? 1 : 0;
        ctx.fillRect(2, 8 + i * 2 + bob + lb, 2, 1);
        ctx.fillRect(12, 8 + i * 2 + bob - lb, 2, 1);
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(raf);
  }, [color]);
  return <canvas ref={ref} width={16} height={16} style={{ width: size, height: size, imageRendering: "pixelated", ...extra }} />;
}
