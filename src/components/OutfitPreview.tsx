"use client";

import { motion } from "motion/react";

// 상의(티셔츠)와 하의(바지)를 고른 색으로 칠한 단순한 그림. 직접 그린 도형이다.
const TOP = "M60 20 L90 10 Q100 24 110 10 L140 20 L175 55 L152 80 L138 68 L138 150 L62 150 L62 68 L48 80 L25 55 Z";
const BOTTOM = "M62 140 L138 140 L145 305 L108 305 L100 205 L92 305 L55 305 Z";

export default function OutfitPreview({ top, bottom, label }: { top: string; bottom: string; label: string }) {
  return (
    <svg viewBox="0 0 200 320" role="img" aria-label={label} className="mx-auto h-full max-h-[420px] w-full">
      <motion.path
        d={BOTTOM}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0, fill: bottom }}
        transition={{ type: "spring", stiffness: 160, damping: 20, delay: 0.08 }}
        stroke="rgba(255,255,255,.4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <motion.path
        d={TOP}
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0, fill: top }}
        transition={{ type: "spring", stiffness: 160, damping: 20 }}
        stroke="rgba(255,255,255,.4)"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
