"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { colorName } from "@/lib/color";
import Tilt from "@/components/Tilt";

const SIZE = 240; // 캔버스 내부 해상도
const SHOW = 200; // 화면에 보이는 크기(px)
const ZOOM_PX = 11; // 확대 창이 보여 주는 원본 픽셀 수(가로세로)
const ZOOM_OUT = 110;
const LOUPE = 88; // 마우스를 따라다니는 확대 창 크기(px)

// 옷에서 자주 보이는 색. 색상환만으로는 고르기 어려운 무채색·어스 톤을 바로 고른다.
const BASICS = [
  ["블랙", "#1a1a1a"], ["차콜", "#3d4148"], ["그레이", "#9a9ea6"], ["화이트", "#f5f5f2"],
  ["아이보리", "#efe6d2"], ["베이지", "#d6c3a1"], ["카키", "#8a8460"], ["브라운", "#6b4a32"],
  ["네이비", "#1f2a44"], ["데님", "#4a6a94"], ["올리브", "#5e6b3a"], ["버건디", "#6e1f2e"],
] as const;

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("").toUpperCase();

export default function ColorPicker({ value, onChange }: { value: string; onChange: (hex: string) => void }) {
  const wheel = useRef<HTMLCanvasElement>(null);
  const zoom = useRef<HTMLCanvasElement>(null);
  const [light, setLight] = useState(50);
  const [hover, setHover] = useState<string | null>(null);
  const [marker, setMarker] = useState<{ x: number; y: number } | null>(null);

  // 확대 창은 마우스 위치를 스프링으로 따라간다.
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const lx = useSpring(mx, { stiffness: 420, damping: 34 });
  const ly = useSpring(my, { stiffness: 420, damping: 34 });

  // 명도가 바뀔 때마다 색상환을 다시 그린다. 각도=색상, 중심에서의 거리=채도.
  useEffect(() => {
    const ctx = wheel.current?.getContext("2d");
    if (!ctx) return;
    const img = ctx.createImageData(SIZE, SIZE);
    const R = SIZE / 2;
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const dx = x + 0.5 - R;
        const dy = y + 0.5 - R;
        const dist = Math.hypot(dx, dy) / R;
        const i = (y * SIZE + x) * 4;
        if (dist > 1) continue; // 원 밖은 투명
        const h = ((Math.atan2(dy, dx) * 180) / Math.PI + 360) % 360;
        const [r, g, b] = hslToRgb(h, dist, light / 100);
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }, [light]);

  const readAt = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const cv = wheel.current;
      const ctx = cv?.getContext("2d", { willReadFrequently: true });
      if (!cv || !ctx) return null;
      const rect = cv.getBoundingClientRect();
      // 화면에 그려진 크기와 캔버스 내부 크기가 다를 수 있어 비율로 보정한다.
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      const x = Math.floor((px / rect.width) * SIZE);
      const y = Math.floor((py / rect.height) * SIZE);
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
      const [r, g, b, a] = ctx.getImageData(x, y, 1, 1).data;
      if (a === 0) return null;
      // 확대 창: 마우스 주변 몇 픽셀을 크게 그린다.
      const zctx = zoom.current?.getContext("2d");
      if (zctx) {
        zctx.imageSmoothingEnabled = false;
        zctx.clearRect(0, 0, ZOOM_OUT, ZOOM_OUT);
        const half = Math.floor(ZOOM_PX / 2);
        zctx.drawImage(cv, x - half, y - half, ZOOM_PX, ZOOM_PX, 0, 0, ZOOM_OUT, ZOOM_OUT);
      }
      // 손가락에 가리지 않게 확대 창은 포인터 위쪽에 둔다.
      mx.set(px - LOUPE / 2);
      my.set(py - LOUPE - 14);
      return { hex: toHex(r, g, b), px, py };
    },
    [mx, my],
  );

  const shown = hover ?? value;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <div className="relative shrink-0" style={{ width: SHOW, height: SHOW }}>
          <canvas
            ref={wheel}
            width={SIZE}
            height={SIZE}
            aria-label="색상환. 눌러서 색을 고릅니다"
            className="size-full cursor-crosshair touch-none rounded-full shadow-[0_2px_10px_rgba(28,27,25,.22)]"
            onPointerMove={(e) => setHover(readAt(e)?.hex ?? null)}
            onPointerLeave={() => setHover(null)}
            onPointerDown={(e) => {
              const hit = readAt(e);
              if (hit) {
                setHover(hit.hex);
                setMarker({ x: hit.px, y: hit.py });
                onChange(hit.hex);
              }
            }}
          />

          {/* 고른 자리를 알려 주는 고리. 새로 고르면 그 자리로 미끄러진다. */}
          {marker && (
            <motion.span
              aria-hidden
              initial={false}
              animate={{ x: marker.x - 10, y: marker.y - 10 }}
              transition={{ type: "spring", stiffness: 380, damping: 28 }}
              className="pointer-events-none absolute left-0 top-0 size-5 rounded-full border-2 border-white shadow-[0_1px_4px_rgba(0,0,0,.5)]"
              style={{ backgroundColor: value }}
            />
          )}

          {/* 마우스를 따라다니는 확대 창 */}
          <motion.div
            aria-hidden
            style={{ x: lx, y: ly, width: LOUPE, height: LOUPE }}
            animate={{ opacity: hover ? 1 : 0, scale: hover ? 1 : 0.85 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
            className="pointer-events-none absolute left-0 top-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-[0_4px_14px_rgba(0,0,0,.3)]"
          >
            <canvas ref={zoom} width={ZOOM_OUT} height={ZOOM_OUT} className="size-full" />
            {/* 가운데 네모가 지금 읽는 한 점이다 */}
            <span className="absolute left-1/2 top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 border border-white outline outline-1 outline-black/60" />
          </motion.div>
        </div>

        <div className="flex flex-col items-start gap-3">
          <motion.span
            aria-hidden
            initial={false}
            animate={{ backgroundColor: shown }}
            transition={{ duration: 0.25 }}
            className="size-24 rounded-full border border-black/15"
          />
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-black/60">{hover ? "마우스를 올린 색" : "고른 색"}</span>
            <span className="text-base font-semibold">{colorName(shown)}</span>
            <span className="font-mono text-sm tabular-nums text-black/70">{shown.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm">
        <span className="w-10 shrink-0 text-black/65">밝기</span>
        <input
          type="range"
          min={8}
          max={92}
          value={light}
          onChange={(e) => setLight(Number(e.target.value))}
          className="h-11 w-full accent-moss"
        />
      </label>

      <div className="grid grid-cols-6 gap-2.5" role="group" aria-label="자주 쓰는 옷 색">
        {BASICS.map(([name, hex]) => {
          const on = value.toUpperCase() === hex.toUpperCase();
          return (
            // 마우스를 올리면 카드가 커서 쪽으로 기울고 빛이 따라온다
            <Tilt key={hex} max={14} className="rounded-lg">
              <motion.button
                type="button"
                title={name}
                aria-label={`${name} ${hex}`}
                aria-pressed={on}
                onClick={() => {
                  setMarker(null); // 팔레트로 고른 색은 색상환 위에 자리가 없다
                  onChange(hex);
                }}
                whileTap={{ scale: 0.94 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                style={{ backgroundColor: hex }}
                className={`block h-16 w-full rounded-lg border ${on ? "border-2 border-moss ring-2 ring-moss/25" : "border-black/15"}`}
              />
            </Tilt>
          );
        })}
      </div>
    </div>
  );
}
