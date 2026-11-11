"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import OutfitPreview from "@/components/OutfitPreview";
import PopButton from "@/components/PopButton";

// 분위기별 팔레트 다섯 칸. glow는 배경에 번지는 색 세 가지, top/bottom은 가운데 카드의 옷 색이다.
const PALETTES = [
  { mood: "차분한 미니멀", colors: ["#1A1A1A", "#3D4148", "#9A9EA6", "#EFE6D2", "#F5F5F2"], glow: ["#9A9EA6", "#D6C3A1", "#3D4148"], top: "#EFE6D2", bottom: "#1A1A1A" },
  { mood: "따뜻한 빈티지", colors: ["#6B4A32", "#D6C3A1", "#8A8460", "#C98A3D", "#EFE6D2"], glow: ["#C98A3D", "#D6C3A1", "#6B4A32"], top: "#EFE6D2", bottom: "#6B4A32" },
  { mood: "발랄한 Y2K", colors: ["#FF4DA6", "#FF9A3D", "#FFE066", "#5CC8FF", "#FFFFFF"], glow: ["#FF4DA6", "#5CC8FF", "#FFE066"], top: "#FFE066", bottom: "#5CC8FF" },
  { mood: "시원한 데님", colors: ["#1F2A44", "#4A6A94", "#9DB7D5", "#F5F5F2", "#1A1A1A"], glow: ["#4A6A94", "#9DB7D5", "#1F2A44"], top: "#F5F5F2", bottom: "#4A6A94" },
  { mood: "깊은 가을", colors: ["#5E6B3A", "#8A8460", "#D6C3A1", "#6E1F2E", "#1C1B19"], glow: ["#6E1F2E", "#8A8460", "#5E6B3A"], top: "#D6C3A1", bottom: "#5E6B3A" },
];
const SPRING = { type: "spring", stiffness: 420, damping: 30 } as const;
const GLOW_POS = ["-left-24 top-[-10%]", "right-[-12%] top-[18%]", "left-[28%] bottom-[-22%]"];

export default function Intro({ onStart }: { onStart: () => void }) {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  // 2.6초마다 다음 팔레트로 넘어간다. 동작 줄이기 설정이나 일시정지에서는 멈춘다.
  useEffect(() => {
    if (reduce || paused) return;
    const id = setInterval(() => setI((n) => (n + 1) % PALETTES.length), 2600);
    return () => clearInterval(id);
  }, [reduce, paused]);

  const p = PALETTES[i];

  return (
    <section className="relative isolate flex min-h-[100svh] items-center overflow-hidden" aria-labelledby="intro-title">
      {/* 팔레트의 색이 흐릿하게 번져 배경이 된다 */}
      {p.glow.map((c, k) => (
        <motion.div
          key={k}
          aria-hidden
          initial={false}
          animate={{ backgroundColor: c }}
          transition={{ duration: 1.3, ease: "easeInOut" }}
          className={`pointer-events-none absolute -z-10 size-[520px] rounded-full opacity-45 blur-[110px] ${GLOW_POS[k]}`}
        />
      ))}

      <div className="mx-auto grid w-full max-w-5xl items-center gap-12 px-5 py-16 sm:px-8 md:grid-cols-[1.05fr_1fr] md:gap-16">
        <div className="flex flex-col gap-6">
          <motion.h1
            id="intro-title"
            initial={{ opacity: 0, y: 18, filter: "blur(10px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-balance text-6xl font-extrabold leading-[1.02] tracking-[-0.04em] sm:text-8xl"
          >
            옷 정하기
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-md text-lg leading-8 text-black/70 sm:text-xl sm:leading-9"
          >
            추구미와 색만 고르면, 입은 모습과 느낌이 보여요.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-wrap items-center gap-5 pb-1"
          >
            <PopButton onClick={onStart}>시작하기</PopButton>
            {!reduce && (
              <button
                type="button"
                onClick={() => setPaused((v) => !v)}
                aria-pressed={paused}
                className="h-11 rounded-md px-2 text-sm text-black/60 underline-offset-4 hover:text-ink hover:underline"
              >
                {paused ? "움직임 다시 켜기" : "움직임 멈추기"}
              </button>
            )}
          </motion.div>
        </div>

        {/* 팔레트 한 줄 + 그 색으로 입은 모습 카드 */}
        <div className="flex flex-col gap-5" aria-hidden>
          <div className="flex gap-3">
            {p.colors.map((c, k) => (
              <motion.span
                key={`${i}-${k}`}
                initial={{ opacity: 0, scale: 0.55, y: 14 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ ...SPRING, delay: k * 0.05 }}
                className="size-14 rounded-2xl border border-black/10 sm:size-16"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="rounded-3xl border border-black/10 bg-white/85 p-6 shadow-[0_18px_50px_-24px_rgba(28,27,25,0.35)] backdrop-blur-sm">
            <div className="h-[300px] sm:h-[340px]">
              <OutfitPreview top={p.top} bottom={p.bottom} label="" />
            </div>
            <AnimatePresence mode="wait" initial={false}>
              <motion.p
                key={p.mood}
                initial={{ opacity: 0, y: 6, filter: "blur(6px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, y: -6, filter: "blur(6px)", transition: { duration: 0.15 } }}
                transition={{ duration: 0.3 }}
                className="mt-4 text-center text-base font-semibold"
              >
                {p.mood}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
