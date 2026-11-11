"use client";

import type { CSSProperties, PointerEvent, ReactNode } from "react";
import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";

// 마우스를 올리면 카드가 커서 쪽으로 기울고, 카드 안에서 빛이 커서를 따라다닌다.
// 터치와 "동작 줄이기" 설정에서는 움직이지 않는다.
export default function Tilt({
  children,
  className = "",
  max = 10,
  style,
}: {
  children: ReactNode;
  className?: string;
  max?: number;
  style?: CSSProperties;
}) {
  const reduce = useReducedMotion();
  const rx = useSpring(0, { stiffness: 220, damping: 20 });
  const ry = useSpring(0, { stiffness: 220, damping: 20 });
  const glow = useSpring(0, { stiffness: 160, damping: 22 });
  const gx = useMotionValue(50);
  const gy = useMotionValue(50);
  const light = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,255,255,0.26), rgba(255,255,255,0) 60%)`;

  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (reduce || e.pointerType === "touch") return;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width;
    const py = (e.clientY - r.top) / r.height;
    ry.set((px - 0.5) * 2 * max);
    rx.set(-(py - 0.5) * 2 * max);
    gx.set(px * 100);
    gy.set(py * 100);
    glow.set(1);
  };
  const reset = () => {
    rx.set(0);
    ry.set(0);
    glow.set(0);
  };

  return (
    <motion.div
      onPointerMove={move}
      onPointerLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 700, ...style }}
      className={`relative ${className}`}
    >
      {children}
      <motion.span
        aria-hidden
        style={{ background: light, opacity: glow }}
        className="pointer-events-none absolute inset-0 rounded-[inherit] mix-blend-overlay"
      />
    </motion.div>
  );
}
