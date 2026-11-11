"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; depth: number; phase: number; speed: number; tint: string; spark: boolean };

const TINTS = ["255,255,255", "255,255,255", "255,255,255", "198,242,78", "170,205,255"];

// 뒤에 박혀 있는 투명한 별. 천천히 반짝이고, 마우스(손가락)를 따라 깊이에 맞춰 살짝 밀린다.
export default function Stars() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0;
    let H = 0;
    let stars: Star[] = [];
    let raf = 0;
    let px = 0;
    let py = 0;
    let tx = 0;
    let ty = 0;

    const build = () => {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.min(260, Math.round((W * H) / 8500));
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.5 + Math.random() ** 3 * 2.1,
        depth: Math.random(),
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 1.6,
        tint: TINTS[Math.floor(Math.random() * TINTS.length)],
        spark: Math.random() < 0.05,
      }));
    };

    const draw = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      px += (tx - px) * 0.05;
      py += (ty - py) * 0.05;
      for (const s of stars) {
        const twinkle = reduce ? 1 : 0.55 + 0.45 * Math.sin((t / 1000) * s.speed + s.phase);
        const a = (0.22 + 0.6 * s.depth) * twinkle;
        const x = s.x + px * (4 + s.depth * 18);
        const y = s.y + py * (4 + s.depth * 18);
        if (s.r > 1.2 || s.spark) {
          const g = ctx.createRadialGradient(x, y, 0, x, y, s.r * 6);
          g.addColorStop(0, `rgba(${s.tint},${a * 0.45})`);
          g.addColorStop(1, `rgba(${s.tint},0)`);
          ctx.fillStyle = g;
          ctx.fillRect(x - s.r * 6, y - s.r * 6, s.r * 12, s.r * 12);
        }
        ctx.beginPath();
        ctx.fillStyle = `rgba(${s.tint},${a})`;
        ctx.arc(x, y, s.r, 0, Math.PI * 2);
        ctx.fill();
        if (s.spark) {
          // 네 갈래로 뻗는 반짝임
          const L = s.r * 7 * (0.6 + 0.4 * twinkle);
          ctx.strokeStyle = `rgba(${s.tint},${a * 0.8})`;
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.moveTo(x - L, y);
          ctx.lineTo(x + L, y);
          ctx.moveTo(x, y - L);
          ctx.lineTo(x, y + L);
          ctx.stroke();
        }
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };

    const onMove = (e: PointerEvent) => {
      tx = (e.clientX / W - 0.5) * -1;
      ty = (e.clientY / H - 0.5) * -1;
    };

    build();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", build);
    window.addEventListener("pointermove", onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", build);
      window.removeEventListener("pointermove", onMove);
    };
  }, []);

  return <canvas ref={ref} aria-hidden className="pointer-events-none fixed inset-0 -z-20" />;
}
