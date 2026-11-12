"use client";

import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useSpring, useTransform, type MotionValue } from "motion/react";

const STEP = 40; // 카드 한 장 사이의 각도(도). 카드들이 가운데를 바라보는 원통 안쪽에 놓인다.
const RING = 1.2; // 원통 반지름(카드 폭 기준)
const rad = (d: number) => (d * Math.PI) / 180;

const DRIFT = 0.35; // 가만히 둘 때 흐르는 속도(카드/초)

// 카드가 원을 따라 계속 돌므로 거리는 -n/2 ~ n/2 사이로 접는다
const wrap = (x: number, n: number) => x - n * Math.round(x / n);

function Card({ i, n, smooth, reduce, children }: { i: number; n: number; smooth: MotionValue<number>; reduce: boolean | null; children: ReactNode }) {
  // rel: 이 카드가 가운데에서 얼마나 떨어져 있는지(0이면 정면)
  const rel = useTransform(smooth, (v) => wrap(i - v, n));
  const theta = useTransform(rel, (r) => Math.max(-84, Math.min(84, r * STEP)));
  // 원통을 따라 옆으로 가고, 가운데를 바라보며 돌아선다. 바깥쪽 끝이 카메라에 가까워져 나팔처럼 커진다.
  const x = useTransform(theta, (t) => `${Math.sin(rad(t)) * RING * 100}%`);
  const z = useTransform(theta, (t) => (reduce ? 0 : -(1 - Math.cos(rad(t))) * 120));
  const rotateY = useTransform(theta, (t) => (reduce ? 0 : -t));
  const scaleX = useTransform(rel, (r) => (reduce ? 1 : 1 + Math.max(0, Math.abs(r) - 0.4) * 0.35));
  const filter = useTransform(rel, (r) => {
    const a = Math.min(Math.abs(r), 2.5);
    return reduce ? "none" : `blur(${(a ** 1.6 * 2.2).toFixed(2)}px) saturate(${(1 + a * 0.25).toFixed(2)})`;
  });
  // 바깥 카드는 세로로 길어져 색 기둥처럼 보이고, 끝에서 사라진다
  const scaleY = useTransform(rel, (r) => (reduce ? 1 : 1 + Math.min(Math.max(0, Math.abs(r) - 0.7), 1.8) * 0.28));
  const opacity = useTransform(rel, (r) => Math.max(0, Math.min(1, (2.9 - Math.abs(r)) / 1.2)));
  const fade = useTransform(rel, (r) => Math.max(0, Math.min(1, 1 - (Math.abs(r) - 0.9) * 1.6)));
  const zIndex = useTransform(rel, (r) => 100 - Math.round(Math.abs(r) * 10));

  return (
    <motion.div
      style={{ x, z, rotateY, scaleX, scaleY, filter, opacity, zIndex, "--fade": fade, left: "calc(50% - var(--cw) / 2)" } as never}
      className="absolute top-1/2 w-[var(--cw)] -translate-y-1/2 will-change-transform"
    >
      {children}
    </motion.div>
  );
}

// 카드가 한 줄로 늘어선 캐러셀. 가운데는 정면이고, 옆 카드는 바깥으로 늘어나며 흐려진다.
// 드래그, 휠, 방향키, 아래 버튼으로 넘길 수 있다.
export default function LiquidCarousel({ items, label, height = "31rem", below }: { items: ReactNode[]; label: string; height?: string; below?: (index: number) => ReactNode }) {
  const reduce = useReducedMotion();
  const pos = useMotionValue(0);
  const smooth = useSpring(pos, { stiffness: 90, damping: 20, mass: 1 });
  const [index, setIndex] = useState(0);
  const [flow, setFlow] = useState(true); // 사용자가 흐름을 켜 둔 상태
  const hov = useRef({ over: false, focus: false }); // 마우스가 올라와 있거나 포커스가 있거나 드래그 중이면 흐름을 멈춘다
  const drag = useRef<{ x: number; p: number; moved: boolean } | null>(null);
  const wheelLock = useRef(false);
  const box = useRef<HTMLDivElement>(null);
  const n = items.length;

  const sync = useCallback((p: number) => setIndex((((Math.round(p) % n) + n) % n)), [n]);

  // 가장 가까운 같은 카드로 이동한다(원이라 어느 쪽으로든 갈 수 있다)
  const goTo = useCallback(
    (i: number) => {
      const t = Math.round(pos.get());
      const next = t + wrap(i - t, n);
      pos.set(next);
      sync(next);
    },
    [n, pos, sync],
  );
  const step = useCallback((d: number) => {
    const next = Math.round(pos.get()) + d;
    pos.set(next);
    sync(next);
  }, [pos, sync]);

  const drifting = flow && !reduce;
  useAnimationFrame((_, dt) => {
    if (!drifting || hov.current.over || hov.current.focus || drag.current) return;
    const next = pos.get() + (Math.min(dt, 64) / 1000) * DRIFT;
    pos.set(next);
    sync(next);
  });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : 0; // 세로 휠은 페이지 스크롤에 맡긴다
      if (Math.abs(d) < 12 || wheelLock.current) return;
      e.preventDefault();
      wheelLock.current = true;
      window.setTimeout(() => (wheelLock.current = false), 420);
      step(d > 0 ? 1 : -1);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [step]);

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
    pos.set(d.p - dx / (w * 0.32));
    sync(pos.get());
  };
  const onPointerUp = () => {
    if (!drag.current) return;
    drag.current = null;
    goTo(Math.round(pos.get()));
  };  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      step(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      step(-1);
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
        onPointerEnter={() => (hov.current.over = true)}
        onPointerLeave={() => (hov.current.over = false)}
        onFocus={() => (hov.current.focus = true)}
        onBlur={() => (hov.current.focus = false)}
        className="relative cursor-grab touch-pan-y select-none overflow-hidden active:cursor-grabbing"
        style={{ height, perspective: "440px", maskImage: "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)", WebkitMaskImage: "linear-gradient(90deg, transparent, #000 14%, #000 86%, transparent)" }}
      >
        {items.map((it, i) => (
          <Card key={i} i={i} n={n} smooth={smooth} reduce={reduce}>
            <div aria-hidden={i !== index}>{it}</div>
          </Card>
        ))}
      </div>

      <div className="mt-4 flex items-center justify-center gap-1">
        <button
          type="button"
          onClick={() => step(-1)}
          aria-label="이전 카드"
          className="grid size-11 place-items-center rounded-full border border-ink/20 bg-ink/[0.07] text-lg"
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
          onClick={() => step(1)}
          aria-label="다음 카드"
          className="grid size-11 place-items-center rounded-full border border-ink/20 bg-ink/[0.07] text-lg"
        >
          ›
        </button>
        {!reduce && (
          <button
            type="button"
            onClick={() => setFlow((f) => !f)}
            aria-pressed={!flow}
            aria-label={flow ? "자동 흐름 멈춤" : "자동 흐름 재생"}
            className="ml-1 grid size-11 place-items-center rounded-full border border-ink/20 bg-ink/[0.07] text-sm"
          >
            {flow ? "❚❚" : "▶"}
          </button>
        )}
      </div>
      <p className="mt-1 text-center text-xs text-ink/50">드래그, 가로 스크롤 또는 ← → 로 넘겨 보세요</p>
      {below?.(index)}
    </div>
  );
}
