"use client";

import { motion } from "motion/react";
import PopButton from "@/components/PopButton";

const EASE = [0.16, 1, 0.3, 1] as const;

// 첫 화면: 글자와 버튼만 있는 유리판 한 장. 뒤의 별과 마우스(손가락)를 따라오는 색은 화면 전체에 깔려 있다.
export default function Intro({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative isolate flex min-h-[100svh] items-center justify-center overflow-hidden px-5 py-10" aria-labelledby="intro-title">
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 1, ease: EASE }}
        className="relative z-10 flex w-full max-w-3xl flex-col items-center gap-7 rounded-[2rem] border border-white/20 bg-white/[0.08] px-6 py-14 text-center shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_40px_80px_-40px_rgba(8,10,40,0.7)] backdrop-blur-2xl sm:px-12 sm:py-20"
      >
        <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.1] px-4 py-1.5 text-sm text-ink/90">
          <span aria-hidden className="size-1.5 rounded-full bg-moss shadow-[0_0_10px_#c6f24e]" />
          색으로 입은 느낌 미리보기
        </p>
        <h1 id="intro-title" className="text-[clamp(3.5rem,14vw,8.5rem)] leading-[1.05]">
          옷 정하기
        </h1>
        <p className="max-w-md text-base leading-8 text-ink/80 sm:text-lg sm:leading-9">추구미와 색만 고르면, 입은 모습과 느낌이 보여요.</p>
        <PopButton onClick={onStart}>시작하기</PopButton>
      </motion.div>

      <p className="pointer-events-none absolute inset-x-0 bottom-6 text-center text-sm text-ink/55">마우스나 손가락을 움직여 보세요</p>
    </section>
  );
}
