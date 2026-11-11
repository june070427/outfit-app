export type Hsl = { h: number; s: number; l: number };
export type Garment = { id: string; name: string; hex: string };
export type Outfit = { top: Garment; bottom: Garment; score: number; reason: string };

const HEX = /^#?([0-9a-f]{6})$/i;

export function hexToHsl(hex: string): Hsl {
  const m = HEX.exec(hex.trim());
  if (!m) throw new Error(`잘못된 색 코드: ${hex}`);
  const n = parseInt(m[1], 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const d = max - min;
  if (d === 0) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

// 검정·흰색·회색 계열. 어떤 색과도 잘 어울리는 기준색으로 취급한다.
export const isNeutral = ({ s, l }: Hsl) => s < 0.15 || l < 0.1 || l > 0.93;

const hueGap = (a: number, b: number) => {
  const d = Math.abs(a - b) % 360;
  return d > 180 ? 360 - d : d;
};

type Style = { sat: number; neutral: number; warm: number };

// 추구미 문장에서 키워드를 찾아 취향 값으로 바꾼다. 못 찾으면 중립(0).
// shortcut: 키워드 사전 방식이라 낯선 표현은 못 읽는다, 필요해지면 AI 해석으로 교체.
export function parseAesthetic(text: string): Style {
  const has = (re: RegExp) => re.test(text.toLowerCase());
  const style: Style = { sat: 0, neutral: 0, warm: 0 };
  if (has(/미니멀|차분|심플|깔끔|모던|단정|고프코어/)) {
    style.sat -= 1;
    style.neutral += 1;
  }
  if (has(/시크|모노|블랙|무채색/)) {
    style.neutral += 1.5;
  }
  if (has(/y2k|화려|발랄|펑키|스트릿|힙|컬러풀|러블리/)) {
    style.sat += 1;
    style.neutral -= 0.5;
  }
  if (has(/빈티지|내추럴|어스|따뜻|레트로|캐주얼/)) {
    style.warm += 1;
  }
  return style;
}

export function scorePair(topHex: string, bottomHex: string, aesthetic = ""): { score: number; reason: string } {
  const a = hexToHsl(topHex);
  const b = hexToHsl(bottomHex);
  const na = isNeutral(a);
  const nb = isNeutral(b);
  let score: number;
  let reason: string;

  if (na && nb) {
    const gap = Math.abs(a.l - b.l);
    score = gap >= 0.3 ? 85 : gap >= 0.12 ? 72 : 55;
    reason = gap >= 0.3 ? "무채색끼리 밝기 차이가 뚜렷해요" : "비슷한 밝기의 무채색 조합이에요";
  } else if (na || nb) {
    const c = na ? b : a;
    score = c.s > 0.85 && c.l > 0.35 && c.l < 0.65 ? 78 : 88;
    reason = "무채색이 색을 받쳐 주는 안전한 조합이에요";
  } else {
    const gap = hueGap(a.h, b.h);
    const lightGap = Math.abs(a.l - b.l);
    if (gap <= 30) {
      score = 78 + (lightGap >= 0.2 ? 8 : 0);
      reason = "비슷한 색으로 맞춘 톤온톤 조합이에요";
    } else if (gap >= 150) {
      score = a.s > 0.7 && b.s > 0.7 ? 52 : 74;
      reason = "반대되는 색의 보색 대비 조합이에요";
    } else if (gap >= 105 && gap <= 135) {
      score = 55;
      reason = "색 차이가 큰 조합이라 한쪽은 톤을 낮추면 좋아요";
    } else {
      score = 42;
      reason = "색 계열이 애매하게 어긋나요";
    }
    if (a.s > 0.75 && b.s > 0.75) score -= 12;
  }

  const style = parseAesthetic(aesthetic);
  const avgS = (a.s + b.s) / 2;
  const neutralCount = Number(na) + Number(nb);
  score += style.sat * (avgS - 0.3) * 18;
  score += style.neutral * neutralCount * 2.5;
  const warm = (h: Hsl) => !isNeutral(h) && (h.h < 70 || h.h > 330);
  score += style.warm * (Number(warm(a)) + Number(warm(b))) * 5;

  return { score: Math.round(Math.max(0, Math.min(100, score))), reason };
}

export function recommend(tops: Garment[], bottoms: Garment[], aesthetic = "", count = 3): Outfit[] {
  const all: Outfit[] = [];
  for (const top of tops) {
    for (const bottom of bottoms) {
      all.push({ top, bottom, ...scorePair(top.hex, bottom.hex, aesthetic) });
    }
  }
  return all.sort((x, y) => y.score - x.score).slice(0, count);
}
