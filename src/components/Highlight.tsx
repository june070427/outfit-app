"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

// 핵심 단어 뒤에 형광펜이 한쪽에서 쓱 그어진다. 동작 줄이기 설정에서는 처음부터 그어진 채로 보인다.
export default function Highlight({
  children,
  delay = 0.3,
  from = "left",
}: {
  children: ReactNode;
  delay?: number;
  from?: "left" | "right";
}) {
  return (
    <span className="relative isolate inline-block text-[#0b0d0c]">
      <motion.span
        aria-hidden
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: from === "left" ? 0 : 1 }}
        className="absolute -inset-x-1 -bottom-[0.08em] -top-[0.04em] -z-10 rounded-sm bg-[#c6f24e]"
      />
      {children}
    </span>
  );
}
