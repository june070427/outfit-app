"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SIZE = 240;
const ZOOM_PX = 11; // 확대 창이 보여 주는 원본 픽셀 수(가로세로)
const ZOOM_OUT = 110;

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

  const readAt = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const cv = wheel.current;
    const ctx = cv?.getContext("2d", { willReadFrequently: true });
    if (!cv || !ctx) return null;
    const rect = cv.getBoundingClientRect();
    // 화면에 그려진 크기와 캔버스 내부 크기가 다를 수 있어 비율로 보정한다.
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * SIZE);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * SIZE);
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
    return toHex(r, g, b);
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-4">
        <canvas
          ref={wheel}
          width={SIZE}
          height={SIZE}
          aria-label="색상환. 눌러서 색을 고릅니다"
          className="size-[200px] shrink-0 cursor-crosshair touch-none rounded-full shadow-[0_2px_10px_rgba(28,27,25,.22)]"
          onPointerMove={(e) => setHover(readAt(e))}
          onPointerLeave={() => setHover(null)}
          onPointerDown={(e) => {
            const hex = readAt(e);
            if (hex) {
              setHover(hex);
              onChange(hex);
            }
          }}
        />
        <div className="flex flex-col items-start gap-3">
          <div className="relative size-24 overflow-hidden rounded-full border border-black/15 bg-black/[.04]">
            <canvas ref={zoom} width={ZOOM_OUT} height={ZOOM_OUT} aria-hidden className="size-full" />
            {/* 가운데 네모가 지금 읽는 한 점이다 */}
            <span className="pointer-events-none absolute left-1/2 top-1/2 size-[9px] -translate-x-1/2 -translate-y-1/2 border border-white outline outline-1 outline-black/60" />
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-black/60">{hover ? "마우스를 올린 색" : "고른 색"}</span>
            <span className="flex items-center gap-2 font-mono text-sm tabular-nums">
              <span className="size-3.5 rounded-full border border-black/20" style={{ backgroundColor: hover ?? value }} />
              {hover ?? value.toUpperCase()}
            </span>
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

      <div className="grid grid-cols-6 gap-2" role="group" aria-label="자주 쓰는 옷 색">
        {BASICS.map(([name, hex]) => (
          <button
            key={hex}
            type="button"
            title={name}
            aria-label={`${name} ${hex}`}
            onClick={() => onChange(hex)}
            aria-pressed={value.toUpperCase() === hex.toUpperCase()}
            style={{ backgroundColor: hex }}
            className={`h-10 rounded-md border transition-transform duration-150 hover:-translate-y-0.5 active:translate-y-0 ${
              value.toUpperCase() === hex.toUpperCase() ? "border-2 border-moss ring-2 ring-moss/25" : "border-black/15"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
