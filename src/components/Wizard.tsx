"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion, useReducedMotion, useSpring, useTransform } from "motion/react";
import ColorPicker from "@/components/ColorPicker";
import Highlight from "@/components/Highlight";
import Intro from "@/components/Intro";
import LiquidCarousel from "@/components/LiquidCarousel";
import LiquidReveal from "@/components/LiquidReveal";
import Stars from "@/components/Stars";
import OutfitPreview from "@/components/OutfitPreview";
import PopButton from "@/components/PopButton";
import Tilt from "@/components/Tilt";
import MeshCard from "@/components/MeshCard";
import { colorName, describeOutfit, mixHex } from "@/lib/color";
import { PALETTES } from "@/lib/palettes";
import { searchLinks } from "@/lib/search";

const EXAMPLES = ["차분한 미니멀", "발랄한 Y2K", "따뜻한 빈티지", "시크한 모노"];
const STEPS = ["추구미", "상의 색", "하의 색", "결과"];
const SPRING = { type: "spring", stiffness: 420, damping: 32 } as const;

const secondary =
  "inline-flex h-12 items-center justify-center rounded-xl border border-ink/25 bg-ink/[0.07] px-6 text-base font-medium hover:border-moss";
const field =
  "h-12 w-full rounded-lg border border-ink/20 bg-ink/[0.07] px-4 text-lg outline-none transition-colors focus-visible:border-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/30";

const slide = {
  enter: (d: number) => ({ opacity: 0, x: d * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (d: number) => ({ opacity: 0, x: d * -28, transition: { duration: 0.14 } }),
};

// 점수가 바뀌면 숫자가 올라가듯 움직인다.
function Score({ value }: { value: number }) {
  const spring = useSpring(0, { stiffness: 90, damping: 20 });
  const text = useTransform(spring, (v) => Math.round(v));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span>{text}</motion.span>;
}

// 결과 블록이 위에서부터 차례로 흐릿함을 벗고 또렷해진다.
const reveal = (i: number, reduce: boolean | null) => ({
  initial: reduce ? (false as const) : { opacity: 0, filter: "blur(12px)", y: 10 },
  animate: { opacity: 1, filter: "blur(0px)", y: 0 },
  transition: { duration: 0.7, delay: 0.5 + i * 0.09, ease: [0.16, 1, 0.3, 1] as const },
});

// 옷 느낌 카드 한 장: 색이 번진 유리판 위에 입은 모습, 팔레트, 점수가 놓인다.
function FeelCard({ title, colors, top, bottom, chips, note }: { title: string; colors: string[]; top: string; bottom: string; chips: string[]; note: string }) {
  return (
    <MeshCard colors={colors} className="h-[25rem] ring-1 ring-white/30">
      <div className="flex h-full flex-col justify-between p-4">
        <div className="flex items-start justify-between gap-2 text-xs">
          <span className="rounded-full bg-black/25 px-3 py-1 backdrop-blur">{title}</span>
          <span className="rounded-full bg-black/25 px-3 py-1 backdrop-blur">{note}</span>
        </div>
        <div className="h-[15rem]">
          <OutfitPreview top={top} bottom={bottom} label={`${title} 코디`} />
        </div>
        <div className="flex justify-center gap-2" aria-hidden>
          {chips.map((c) => (
            <span key={c} className="size-5 rounded-full border border-white/60" style={{ backgroundColor: c }} />
          ))}
        </div>
      </div>
    </MeshCard>
  );
}

function Result({
  top,
  bottom,
  aesthetic,
  onRestart,
  onBack,
}: {
  top: string;
  bottom: string;
  aesthetic: string;
  onRestart: () => void;
  onBack: () => void;
}) {
  const reduce = useReducedMotion();
  const feel = describeOutfit(top, bottom, aesthetic);
  const tn = colorName(top);
  const bn = colorName(bottom);
  const links = searchLinks(tn, bn, aesthetic);

  return (
    <div className="relative -m-2 overflow-hidden rounded-3xl p-2">
      {/* 결과가 나올 때 아래에서 빛이 솟아올랐다가 걷힌다 */}
      {!reduce && (
        <motion.div
          aria-hidden
          initial={{ opacity: 0, y: "40%", scale: 0.85 }}
          animate={{ opacity: [0, 0.95, 0], y: ["40%", "0%", "-35%"], scale: [0.85, 1.1, 1.25] }}
          transition={{ duration: 1.6, ease: "easeOut", times: [0, 0.38, 1] }}
          style={{
            background:
              "radial-gradient(55% 45% at 28% 78%, rgba(255,110,200,.95), transparent 70%), radial-gradient(50% 45% at 74% 70%, rgba(110,185,255,.9), transparent 70%), radial-gradient(45% 40% at 52% 92%, rgba(255,190,120,.85), transparent 70%)",
          }}
          className="pointer-events-none absolute inset-0 z-10 blur-2xl"
        />
      )}

      <div className="grid gap-8 md:grid-cols-[minmax(0,320px)_1fr] md:gap-12">
        <motion.div {...reveal(0, reduce)}>
          <Tilt max={7} className="rounded-2xl">
            <div className="rounded-2xl border border-ink/10 bg-ink/[0.07] p-6">
              <div className="h-[340px]">
                <OutfitPreview top={top} bottom={bottom} label={`${tn} 상의와 ${bn} 하의를 입은 모습`} />
              </div>
              <p className="mt-4 text-center text-sm">
                {tn} 상의 · {bn} 하의
              </p>
            </div>
          </Tilt>
        </motion.div>

        <div className="flex flex-col gap-7">
          {/* 고른 두 색이 번진 그라데이션 카드 위에 점수와 느낌이 놓인다 */}
          <motion.div {...reveal(1, reduce)}>
            <MeshCard
              live
              colors={[top, bottom, mixHex(top, "#8bb8ff", 0.4), mixHex(bottom, "#ff9ad5", 0.4)]}
              className="shadow-[0_30px_60px_-38px_rgba(20,22,26,0.5)] ring-1 ring-white/60"
            >
              <div className="flex flex-col gap-5 p-6 sm:p-8">
                <div className="w-fit rounded-[1.75rem] bg-ink/[0.07] px-7 py-5 backdrop-blur-md">
                  <p className="flex items-baseline gap-2">
                    <span className="text-7xl font-semibold leading-none tracking-[-0.04em] tabular-nums">
                      <Score value={feel.score} />
                    </span>
                    <span className="text-xl text-ink/65">점</span>
                  </p>
                </div>
                <ul className="flex flex-wrap gap-2" aria-label="이 조합의 느낌">
                  {feel.keywords.map((k) => (
                    <li key={k} className="rounded-full bg-ink/[0.07] px-3 py-1.5 text-sm font-medium text-ink/85 backdrop-blur">
                      {k}
                    </li>
                  ))}
                </ul>
              </div>
            </MeshCard>
          </motion.div>

          <motion.section {...reveal(2, reduce)} className="flex flex-col gap-3" aria-labelledby="photo-title">
            <h3 id="photo-title" className="text-xl font-bold">
              이 조합을 입은 사진 보기
            </h3>
            <div className="flex flex-wrap gap-3 pb-1">
              {links.map((l) => (
                <PopButton key={l.name} href={l.href}>
                  {l.name}
                </PopButton>
              ))}
            </div>
            <p className="text-sm leading-6 text-ink/65">
              새 탭에서 열리는 외부 사이트입니다. 사진은 올린 사람과 각 사이트의 것이며, 이 앱에는 저장하지 않습니다.
            </p>
          </motion.section>

          <motion.div {...reveal(3, reduce)} className="flex flex-col gap-2 text-base leading-7">
            <p>{feel.reason}</p>
            <p className="font-medium">{feel.match}</p>
            <p className="text-ink/70">{feel.tip}</p>
          </motion.div>

          <motion.div {...reveal(4, reduce)} className="flex flex-wrap gap-3">
            <motion.button type="button" onClick={onBack} whileTap={{ scale: 0.97 }} className={secondary}>
              하의 색 다시 고르기
            </motion.button>
            <motion.button type="button" onClick={onRestart} whileTap={{ scale: 0.97 }} className={secondary}>
              처음부터 다시
            </motion.button>
          </motion.div>
        </div>
      </div>

      {/* 옷 느낌 카드: 내 조합이 가운데에 있고, 좌우로 넘기면 분위기별 코디가 옆에서 늘어나며 나타난다 */}
      <motion.section {...reveal(5, reduce)} className="mt-14 flex flex-col gap-4 pb-2" aria-labelledby="mood-title">
        <h3 id="mood-title" className="text-xl sm:text-2xl">
          다른 분위기로 입으면
        </h3>
        <LiquidCarousel
          label="분위기별 코디 카드"
          items={[
            <FeelCard key="mine" title="내가 고른 조합" colors={[top, bottom, mixHex(top, "#8bb8ff", 0.4), mixHex(bottom, "#ff9ad5", 0.4)]} top={top} bottom={bottom} chips={[top, bottom]} note={`${feel.score}점`} />,
            ...PALETTES.map((p) => (
              <FeelCard
                key={p.mood}
                title={p.mood}
                colors={[...p.glow, ...p.colors]}
                top={p.top}
                bottom={p.bottom}
                chips={p.colors}
                note={`${describeOutfit(p.top, p.bottom, p.mood).score}점`}
              />
            )),
          ]}
        />
      </motion.section>
    </div>
  );
}

export default function Wizard() {
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [aesthetic, setAesthetic] = useState("");
  const [top, setTop] = useState("#F5F5F2");
  const [bottom, setBottom] = useState("#1A1A1A");
  const moved = useRef(false);

  // 단계가 바뀐 뒤 새 제목으로 초점을 옮겨, 키보드와 화면 읽기 프로그램이 바뀐 것을 알게 한다.
  const focusOnMount = useCallback((el: HTMLHeadingElement | null) => {
    if (el && moved.current) el.focus({ preventScroll: true });
  }, []);

  const go = (to: number) => {
    moved.current = true;
    setDir(to > step ? 1 : -1);
    setStep(to);
  };

  // 배경에 번지는 색: 지금 고르는 색을 따라간다.
  const accent = step === 2 ? bottom : step === 0 ? "#9AA7FF" : top;

  const heading = (content: ReactNode) => (
    <h2 ref={focusOnMount} tabIndex={-1} className="text-2xl leading-snug outline-none sm:text-4xl">
      {content}
    </h2>
  );

  // 모든 화면 뒤에 깔리는 것: 투명한 별, 그리고 마우스(손가락)를 따라오는 색
  const backdrop = (
    <>
      <Stars />
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <LiquidReveal demo={!started} />
      </div>
    </>
  );

  // 처음에는 "옷 정하기" 소개 화면을 보여 주고, 시작하면 단계 화면으로 넘어간다.
  if (!started) {
    return (
      <MotionConfig reducedMotion="user">
        {backdrop}
        <Intro
          onStart={() => {
            moved.current = true;
            setStarted(true);
          }}
        />
      </MotionConfig>
    );
  }

  return (
    <MotionConfig reducedMotion="user">
      {backdrop}
      <motion.div
        aria-hidden
        initial={false}
        animate={{ backgroundColor: accent }}
        transition={{ duration: 0.9, ease: "easeOut" }}
        className="pointer-events-none fixed -top-48 right-[-12%] -z-10 size-[560px] rounded-full opacity-30 blur-[120px]"
      />
      <main className="mx-auto w-full max-w-4xl px-5 py-10 sm:px-8 sm:py-16">
        <header className="mb-8 flex flex-col gap-4 sm:mb-10">
          <h1 className="max-w-3xl text-balance text-3xl leading-tight sm:text-5xl sm:leading-[1.15]">이 색으로 입으면 어떤 느낌일까</h1>
          <p className="max-w-xl text-base leading-7 text-ink/75 sm:text-lg sm:leading-8">
            추구미와 상의, 하의 색을 고르면 입은 모습과 느낌, 코디 사진 검색을 알려 드려요.
          </p>
        </header>

        <ol className="mb-8 flex flex-wrap gap-x-6 gap-y-2 text-sm" aria-label="진행 단계">
          {STEPS.map((s, i) => (
            <li key={s} aria-current={i === step ? "step" : undefined} className={i === step ? "text-moss" : i < step ? "text-ink/80" : "text-ink/50"}>
              {i + 1}. {s}
            </li>
          ))}
        </ol>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={slide}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 380, damping: 34 }}
            className="flex flex-col gap-6"
          >
            {step === 0 && (
              <form
                className="flex flex-col gap-5"
                onSubmit={(e) => {
                  e.preventDefault();
                  go(1);
                }}
              >
                {heading(
                  <>
                    어떤 <span className="whitespace-nowrap"><Highlight>분위기</Highlight>로</span> 입고 싶나요?
                  </>,
                )}
                <input
                  value={aesthetic}
                  onChange={(e) => setAesthetic(e.target.value)}
                  placeholder="예: 차분한 미니멀"
                  aria-label="추구미"
                  maxLength={60}
                  className={field}
                />
                <div className="flex flex-wrap gap-2" role="group" aria-label="추구미 예시">
                  {EXAMPLES.map((ex) => (
                    <motion.button
                      key={ex}
                      type="button"
                      onClick={() => setAesthetic(ex)}
                      aria-pressed={aesthetic === ex}
                      whileHover={{ y: -2 }}
                      whileTap={{ scale: 0.96 }}
                      transition={SPRING}
                      className={`h-11 rounded-full border px-4 text-sm ${
                        aesthetic === ex ? "border-moss bg-moss text-black" : "border-ink/20 bg-ink/[0.07]"
                      }`}
                    >
                      {ex}
                    </motion.button>
                  ))}
                </div>
                <div className="pb-1">
                  <PopButton type="submit">다음: 상의 색 고르기</PopButton>
                </div>
              </form>
            )}

            {(step === 1 || step === 2) && (
              <>
                {heading(
                  <>
                    {step === 1 ? "상의" : "하의"}는 무슨 <span className="whitespace-nowrap"><Highlight>색</Highlight>인가요?</span>
                  </>,
                )}
                <p className="text-base text-ink/70">색상환에 마우스를 올리면 색 이름이 보이고, 눌러서 고릅니다.</p>
                <div className="rounded-2xl border border-ink/10 bg-ink/[0.07] p-5 sm:p-8">
                  <ColorPicker value={step === 1 ? top : bottom} onChange={step === 1 ? setTop : setBottom} />
                </div>
                <div className="flex flex-wrap gap-3 pb-1">
                  <motion.button type="button" onClick={() => go(step - 1)} whileTap={{ scale: 0.97 }} className={secondary}>
                    이전
                  </motion.button>
                  <PopButton onClick={() => go(step + 1)}>{step === 1 ? "다음: 하의 색 고르기" : "결과 보기"}</PopButton>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                {heading(
                  <>
                    이 조합은 이런 <span className="whitespace-nowrap"><Highlight>느낌</Highlight>이에요</span>
                  </>,
                )}
                <Result top={top} bottom={bottom} aesthetic={aesthetic} onBack={() => go(2)} onRestart={() => go(0)} />
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </main>
    </MotionConfig>
  );
}
