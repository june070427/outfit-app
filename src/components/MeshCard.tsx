"use client";

import type { CSSProperties, ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

const BLOBS = [
  { cls: "-left-1/4 -top-1/5 size-[85%]", move: { x: [0, 24, 0], y: [0, 18, 0] }, dur: 9 },
  { cls: "-right-1/4 top-[5%] size-[80%]", move: { x: [0, -22, 0], y: [0, 26, 0] }, dur: 11 },
  { cls: "-bottom-1/4 left-[10%] size-[90%]", move: { x: [0, 20, 0], y: [0, -20, 0] }, dur: 10 },
  { cls: "-bottom-[10%] -right-1/5 size-[60%]", move: { x: [0, -16, 0], y: [0, -14, 0] }, dur: 12 },
];

// 어두운 유리판 뒤에서 색 덩어리가 비쳐 보이는 카드. live이면 색 덩어리가 천천히 흘러 다닌다.
export default function MeshCard({
  colors,
  children,
  className = "",
  style,
  live = false,
}: {
  colors: string[];
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  live?: boolean;
}) {
  const reduce = useReducedMotion();
  const animate = live && !reduce;
  return (
    <div
      className={`relative isolate overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.04] backdrop-blur-xl ${className}`}
      style={style}
    >
      <div aria-hidden className="absolute inset-0 -z-10 overflow-hidden">
        {BLOBS.map((b, i) => (
          <motion.span
            key={i}
            className={`absolute rounded-full opacity-50 blur-[52px] ${b.cls}`}
            style={{ backgroundColor: colors[i % colors.length] }}
            animate={animate ? b.move : undefined}
            transition={{ duration: b.dur, repeat: Infinity, ease: "easeInOut" }}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/35" />
      </div>
      {children}
    </div>
  );
}
