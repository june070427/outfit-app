"use client";

import { useEffect, useRef } from "react";

const BRUSH = 143; // 붓 반지름(CSS px)
const DECAY = 0.016; // 프레임마다 지워지는 정도
const IDLE_FRAMES = 120;
const VIVID = ["#C6F24E", "#2FE0C8", "#4AA3FF", "#8B7BFF", "#FF7AC8"];

// 칠해질 선명한 색 바탕. 마우스나 손가락이 지나간 자리에만 이 색이 드러난다.
function paintVivid(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const g = ctx.createLinearGradient(0, 0, w, h * 0.5);
  VIVID.forEach((c, i) => g.addColorStop(i / (VIVID.length - 1), c));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

// 어두운 바탕 위를 마우스나 손가락이 지나가면 그 자리가 색으로 칠해지고, 천천히 지워진다.
// demo이면 처음 몇 초 동안 스스로 한 번 그어서 움직임을 알려 준다(손가락만 쓰는 화면에서 특히 필요하다).
export default function LiquidReveal({ demo = false }: { demo?: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const el = box.current;
    const canvas = cv.current;
    const ctx = canvas?.getContext("2d");
    if (!el || !canvas || !ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cover = document.createElement("canvas");
    const brush = document.createElement("canvas");
    let W = 1;
    let H = 1;
    let R = BRUSH * dpr;
    let points: { x: number; y: number }[] = [];
    let last: { x: number; y: number } | null = null;
    let idle = 0;
    let raf = 0;
    let demoRaf = 0;
    let running = false;

    const size = () => {
      const r = el.getBoundingClientRect();
      W = Math.max(1, Math.round(r.width * dpr));
      H = Math.max(1, Math.round(r.height * dpr));
      canvas.width = cover.width = W;
      canvas.height = cover.height = H;
      R = BRUSH * dpr;
      brush.width = brush.height = Math.ceil(R * 2);
      const c = cover.getContext("2d");
      if (c) paintVivid(c, W, H);
    };

    const stamp = (x: number, y: number) => {
      const b = brush.getContext("2d");
      if (!b) return;
      const d = brush.width;
      b.globalCompositeOperation = "source-over";
      b.clearRect(0, 0, d, d);
      const g = b.createRadialGradient(R, R, 0, R, R, R);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.55, "rgba(255,255,255,0.82)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      b.fillStyle = g;
      b.fillRect(0, 0, d, d);
      b.globalCompositeOperation = "source-in";
      b.drawImage(cover, x - R, y - R, d, d, 0, 0, d, d);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(brush, x - R, y - R);
    };

    const tick = () => {
      const drawing = points.length > 0;
      if (drawing) idle = 0;
      else {
        idle++;
        if (idle > IDLE_FRAMES) {
          running = false;
          return;
        }
      }
      const fade = drawing ? DECAY : Math.min(DECAY + idle * 0.004, 0.5);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = `rgba(0,0,0,${fade})`;
      ctx.fillRect(0, 0, W, H);
      if (drawing) {
        for (const p of points) stamp(p.x, p.y);
        points = [];
      }
      if (idle >= IDLE_FRAMES) ctx.clearRect(0, 0, W, H);
      raf = requestAnimationFrame(tick);
    };

    // 한 점을 더한다. 이전 점과 이어서 빈틈 없이 칠한다.
    const addPoint = (x: number, y: number) => {
      if (last) {
        const dx = x - last.x;
        const dy = y - last.y;
        const n = Math.min(Math.ceil(Math.hypot(dx, dy) / Math.max(R * 0.3, 1)), 60);
        for (let i = 1; i <= n; i++) points.push({ x: last.x + (dx * i) / n, y: last.y + (dy * i) / n });
      } else points.push({ x, y });
      last = { x, y };
      if (!running) {
        running = true;
        idle = 0;
        raf = requestAnimationFrame(tick);
      }
    };

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) * dpr;
      const y = (e.clientY - r.top) * dpr;
      if (x < -R || y < -R || x > W + R || y > H + R) {
        last = null;
        return;
      }
      addPoint(x, y);
    };

    size();
    const ro = new ResizeObserver(size);
    ro.observe(el);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onMove);

    if (demo) {
      const t0 = performance.now();
      const run = (now: number) => {
        const t = (now - t0) / 1000;
        if (t > 2.6) return;
        addPoint(W * (0.18 + 0.64 * (t / 2.6)), H * (0.5 + 0.22 * Math.sin(t * 3.2)));
        demoRaf = requestAnimationFrame(run);
      };
      demoRaf = requestAnimationFrame(run);
    }

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(demoRaf);
      ro.disconnect();
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onMove);
    };
  }, [demo]);

  return (
    <div ref={box} className="absolute inset-0 -z-10">
      <canvas ref={cv} aria-hidden className="pointer-events-none absolute inset-0 size-full opacity-90" />
    </div>
  );
}
