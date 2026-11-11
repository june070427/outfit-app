"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

// 두꺼운 아래 그림자가 있는 버튼. 마우스를 올리면 살짝 뜨고, 누르면 그림자만큼 눌려 내려간다.
const SHADOW = "#1b3a31";
const variants = {
  rest: { y: 0, boxShadow: `0px 4px 0px 0px ${SHADOW}` },
  hover: { y: -1, boxShadow: `0px 5px 0px 0px ${SHADOW}` },
  tap: { y: 4, boxShadow: `0px 0px 0px 0px ${SHADOW}` },
};
const spring = { type: "spring", stiffness: 650, damping: 32 } as const;
const base =
  "inline-flex h-12 items-center justify-center rounded-xl bg-moss px-6 text-base font-semibold text-white";

export default function PopButton({
  children,
  href,
  onClick,
  type = "button",
  className = "",
}: {
  children: ReactNode;
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  className?: string;
}) {
  const common = { variants, initial: "rest", animate: "rest", whileHover: "hover", whileTap: "tap", transition: spring } as const;
  if (href) {
    return (
      <motion.a {...common} href={href} target="_blank" rel="noopener noreferrer" className={`${base} ${className}`}>
        {children}
      </motion.a>
    );
  }
  return (
    <motion.button {...common} type={type} onClick={onClick} className={`${base} ${className}`}>
      {children}
    </motion.button>
  );
}
