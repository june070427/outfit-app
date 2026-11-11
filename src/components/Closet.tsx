"use client";

import { useEffect, useMemo, useState } from "react";
import ColorPicker from "@/components/ColorPicker";
import { recommend, type Garment } from "@/lib/color";

type Part = "top" | "bottom";
const STORAGE_KEY = "outfit-closet-v1";
const EXAMPLES = ["차분한 미니멀", "발랄한 Y2K", "따뜻한 빈티지", "시크한 모노"];

const LABEL: Record<Part, { title: string; placeholder: string }> = {
  top: { title: "상의", placeholder: "예: 흰 셔츠, 회색 맨투맨" },
  bottom: { title: "하의", placeholder: "예: 검정 슬랙스, 연청 데님" },
};

const field =
  "h-11 w-full rounded-lg border border-black/20 bg-white px-3 text-base outline-none transition-colors focus-visible:border-moss focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss/30";

function ClosetPanel({
  part,
  items,
  onAdd,
  onRemove,
}: {
  part: Part;
  items: Garment[];
  onAdd: (g: Garment) => void;
  onRemove: (id: string) => void;
}) {
  const [hex, setHex] = useState("#1A1A1A");
  const [name, setName] = useState("");
  const title = LABEL[part].title;

  return (
    <section className="flex flex-col gap-5 rounded-2xl border border-black/10 bg-white p-5 sm:p-6">
      <h2 className="flex items-baseline gap-2 text-xl font-bold">
        {title}
        {items.length > 0 && <span className="text-sm font-normal text-black/60">{items.length}벌</span>}
      </h2>
      <ColorPicker value={hex} onChange={setHex} />

      <form
        className="flex flex-col gap-3 border-t border-black/10 pt-5"
        onSubmit={(e) => {
          e.preventDefault();
          onAdd({ id: crypto.randomUUID(), name: name.trim() || `${title} ${hex}`, hex });
          setName("");
        }}
      >
        <div className="flex items-center gap-3">
          <span className="size-11 shrink-0 rounded-lg border border-black/15" style={{ backgroundColor: hex }} aria-hidden />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={LABEL[part].placeholder}
            aria-label={`${title} 이름`}
            maxLength={30}
            className={field}
          />
        </div>
        <button
          type="submit"
          className="h-11 rounded-lg bg-moss px-4 text-base font-medium text-white transition-[transform,background-color] duration-150 hover:-translate-y-0.5 hover:bg-moss-deep active:translate-y-0 active:scale-[.99]"
        >
          {title} 옷장에 넣기
        </button>
      </form>

      {items.length > 0 && (
        <ul className="flex flex-col gap-1 border-t border-black/10 pt-3">
          {items.map((g) => (
            <li key={g.id} className="flex items-center gap-3">
              <span className="size-5 shrink-0 rounded-full border border-black/15" style={{ backgroundColor: g.hex }} aria-hidden />
              <span className="min-w-0 flex-1 truncate text-sm">{g.name}</span>
              <button
                type="button"
                onClick={() => onRemove(g.id)}
                aria-label={`${g.name} 빼기`}
                className="h-11 rounded-md px-3 text-sm text-black/65 transition-colors hover:bg-black/5 hover:text-ink"
              >
                빼기
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// 브라우저에 저장해 둔 옷장을 읽는다. 이 화면은 브라우저에서만 그려지므로 localStorage를 바로 써도 된다.
const HEX_RE = /^#[0-9a-f]{6}$/i;
const isGarment = (g: unknown): g is Garment => {
  const o = g as Record<string, unknown> | null;
  return !!o && typeof o.id === "string" && typeof o.name === "string" && typeof o.hex === "string" && HEX_RE.test(o.hex);
};
// 저장값은 믿지 않는다. 모양이 틀린 항목은 버려서, 깨진 값 때문에 화면이 멈추지 않게 한다.
const cleanList = (v: unknown): Garment[] => (Array.isArray(v) ? v.filter(isGarment).slice(0, 100) : []);

function load(): { tops: Garment[]; bottoms: Garment[]; aesthetic: string } {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return {
      tops: cleanList(saved?.tops),
      bottoms: cleanList(saved?.bottoms),
      aesthetic: typeof saved?.aesthetic === "string" ? saved.aesthetic.slice(0, 60) : "",
    };
  } catch {
    return { tops: [], bottoms: [], aesthetic: "" }; // 저장된 값이 깨져 있으면 빈 옷장으로 시작
  }
}

export default function Closet() {
  const [saved] = useState(load);
  const [tops, setTops] = useState<Garment[]>(saved.tops);
  const [bottoms, setBottoms] = useState<Garment[]>(saved.bottoms);
  const [aesthetic, setAesthetic] = useState(saved.aesthetic);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tops, bottoms, aesthetic }));
  }, [tops, bottoms, aesthetic]);

  const outfits = useMemo(() => recommend(tops, bottoms, aesthetic, 3), [tops, bottoms, aesthetic]);

  const emptyHint =
    tops.length === 0 && bottoms.length === 0
      ? "상의와 하의를 하나씩 넣으면 조합이 나옵니다."
      : tops.length === 0
        ? "상의도 하나 넣어 주세요."
        : "하의도 하나 넣어 주세요.";

  return (
    <main className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-8 sm:py-16">
      <header className="mb-10 flex flex-col gap-4 sm:mb-14">
        <h1 className="max-w-3xl text-balance text-3xl font-bold leading-tight tracking-tight sm:text-5xl sm:leading-[1.15]">
          내 옷장 안에서 색으로 코디 고르기
        </h1>
        <p className="max-w-xl text-base leading-7 text-black/70 sm:text-lg sm:leading-8">
          가진 상의와 하의의 색을 색상환에서 골라 넣으면, 추구미에 맞는 조합 세 가지를 보여 줍니다.
        </p>
      </header>

      <div className="mb-8 flex flex-col gap-3 sm:mb-10">
        <label htmlFor="aesthetic" className="text-xl font-bold">
          추구미
        </label>
        <input
          id="aesthetic"
          value={aesthetic}
          onChange={(e) => setAesthetic(e.target.value)}
          placeholder="원하는 분위기를 적어 보세요"
          maxLength={60}
          className={`${field} h-12 text-lg`}
        />
        <div className="flex flex-wrap gap-2" role="group" aria-label="추구미 예시">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => setAesthetic(ex)}
              aria-pressed={aesthetic === ex}
              className={`h-11 rounded-full border px-4 text-sm transition-[transform,background-color,border-color] duration-150 hover:-translate-y-0.5 active:translate-y-0 ${
                aesthetic === ex ? "border-moss bg-moss text-white" : "border-black/20 bg-white hover:border-moss"
              }`}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ClosetPanel part="top" items={tops} onAdd={(g) => setTops((p) => [...p, g])} onRemove={(id) => setTops((p) => p.filter((x) => x.id !== id))} />
        <ClosetPanel part="bottom" items={bottoms} onAdd={(g) => setBottoms((p) => [...p, g])} onRemove={(id) => setBottoms((p) => p.filter((x) => x.id !== id))} />
      </div>

      <section className="mt-14 sm:mt-20" aria-live="polite">
        <h2 className="mb-6 text-2xl font-bold sm:text-3xl">오늘의 조합</h2>
        {outfits.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-black/25 p-8 text-base text-black/70">{emptyHint}</p>
        ) : (
          <ol className="grid gap-5 md:grid-cols-3">
            {outfits.map((o, i) => (
              <li
                key={o.top.id + o.bottom.id}
                style={{ animationDelay: `${i * 70}ms` }}
                className="rise flex flex-col gap-4 rounded-2xl border border-black/10 bg-white p-5 transition-transform duration-200 hover:-translate-y-0.5"
              >
                <div className="flex items-baseline justify-between">
                  <span className="text-sm font-medium text-black/65">{i + 1}번 조합</span>
                  <span className="text-3xl font-bold tabular-nums">
                    {o.score}
                    <span className="ml-0.5 text-base font-medium text-black/65">점</span>
                  </span>
                </div>
                {/* 위가 상의, 아래가 하의 */}
                <div className="flex h-44 flex-col overflow-hidden rounded-xl border border-black/10" aria-hidden>
                  <div className="flex-1" style={{ backgroundColor: o.top.hex }} />
                  <div className="flex-1" style={{ backgroundColor: o.bottom.hex }} />
                </div>
                <p className="text-sm leading-6">
                  <span className="font-semibold">{o.top.name}</span>
                  <span className="text-black/50"> · </span>
                  <span className="font-semibold">{o.bottom.name}</span>
                </p>
                <p className="text-sm leading-6 text-black/70">{o.reason}</p>
              </li>
            ))}
          </ol>
        )}
      </section>
    </main>
  );
}
