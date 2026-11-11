"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

const SPACING = 0.62; // 카드 사이 간격(카드 폭 기준)

function Card({ i, smooth, reduce, children }: { i: number; smooth: MotionValue<number>; reduce: boolean | null; children: ReactNode }) {
  // rel: 이 카드가 가운데에서 얼마나 떨어져 있는지(0이면 정면)
  const rel = useTransform(smooth, (v) => i - v);
  const x = useTransform(rel, (r) => `${r * SPACING * 100}%`);
  const rotateY = useTransform(rel, (r) => (reduce ? 0 : Math.max(-68, Math.min(68, -r * 44))));
  // 옆 카드는 화면 바깥쪽으로 늘어나고 흐려진다
  const scaleX = useTransform(rel, (r) => (reduce ? 1 : 1 + Math.max(0, Math.abs(r) - 0.3) * 0.6));
  const scale = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 2) * 0.06);
  const filter = useTransform(rel, (r) => {
    const a = Math.min(Math.abs(r), 2);
    return reduce ? "none" : `blur(${(a ** 1.5 * 3.4).toFixed(2)}px) saturate(${(1 + a * 0.3).toFixed(2)})`;
  });
  const opacity = useTransform(rel, (r) => 1 - Math.min(Math.abs(r), 3) * 0.2);
  const originX = useTransform(rel, (r) => (r > 0.01 ? "0%" : r < -0.01 ? "100%" : "50%"));
  const zIndex = useTransform(rel, (r) => 100 - Math.round(Math.abs(r) * 10));

  return (
    <motion.div
      style={{ x, rotateY, scaleX, scale, filter, opacity, originX, zIndex, transformPerspective: 1300, left: "calc(50% - var(--cw) / 2)" }}
      className="absolute top-0 w-[var(--cw)] will-change-transform"
    >
      {children}
    </motion.div>
  );
}

// 카드가 한 줄로 늘어선 캐러셀. 가운데는 정면이고, 옆 카드는 바깥으로 늘어나며 흐려진다.
// 드래그, 휠, 방향키, 아래 버튼으로 넘길 수 있다.
export default function LiquidCarousel({ items, label, height = "26rem" }: { items: ReactNode[]; label: string; height?: string }) {
  const reduce = useReducedMotion();
  const pos = useMotionValue(0);
  const smooth = useSpring(pos, { stiffness: 120, damping: 20, mass: 0.9 });
  const [index, setIndex] = useState(0);
  const idx = useRef(0);
  const drag = useRef<{ x: number; p: number; moved: boolean } | null>(null);
  const wheelLock = useRef(false);
  const box = useRef<HTMLDivElement>(null);

  const goTo = useCallback(
    (i: number) => {
      const n = Math.max(0, Math.min(items.length - 1, i));
      idx.current = n;
      setIndex(n);
      pos.set(n);
    },
    [items.length, pos],
  );

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0; // 세로 휠은 페이지 스크롤에 맡긴다
      if (Math.abs(d) < 12 || wheelLock.current) return;
      e.preventDefault();
      wheelLock.current = true;
      window.setTimeout(() => (wheelLock.current = false), 420);
      goTo(idx.current + (d > 0 ? 1 : -1));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [goTo]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    drag.current = { x: e.clientX, p: pos.get(), moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const w = e.currentTarget.getBoundingClientRect().width;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 4) d.moved = true;
    pos.set(Math.max(0, Math.min(items.length - 1, d.p - dx / (w * 0.32))));
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    goTo(Math.round(pos.get()));
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(idx.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(idx.current - 1);
    }
  };

  return (
    <div className="[--cw:clamp(14.5rem,64vw,17rem)]">
      <div
        ref={box}
        tabIndex={0}
        role="region"
        aria-roledescription="캐러셀"
        aria-label={label}
        onKeyDown={onKey}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        style={{ height, maskImage: "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)" }}
      >
        {items.map((it, i) => (
          <Card key={i} i={i} smooth={smooth} reduce={reduce}>
            <div aria-hidden={i !== index}>{it}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => goTo(index - 1)}
          disabled={index === 0}
          aria-label="이전 카드"
          className="grid size-11 place-items-center rounded-full border border-ink/20 bg-ink/[0.07] text-lg disabled:opacity-30"
        >
          ‹
        </button>
        <div role="group" aria-label={`${label} 이동`} className="flex">
          {items.map((_, i) => (
            <button key={i} type="button" onClick={() => goTo(i)} aria-label={`${i + 1}번째 카드`} aria-current={i === index} className="grid size-11 place-items-center">
              <span className={`h-1 rounded-full transition-all duration-300 ${i === index ? "w-6 bg-moss" : "w-2 bg-ink/30"}`} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goTo(index + 1)}
          disabled={index === items.length - 1}
          aria-label="다음 카드"
          className="grid size-11 place-items-center rounded-full border border-ink/20 bg-ink/[0.07] text-lg disabled:opacity-30"
        >
          ›
        </button>
      </div>
      <p className="mt-1 text-center text-xs text-ink/50">드래그, 가로 스크롤 또는 ← → 로 넘겨 보세요</p>
    </div>
  );
}
