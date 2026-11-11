export type Hsl = { h: number; s: number; l: number };

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

// 두 색을 t(0~1) 비율로 섞는다. 그라데이션 카드의 색을 만들 때 쓴다.
export function mixHex(a: string, b: string, t: number): string {
  const rgb = (hex: string) => {
    const m = HEX.exec(hex.trim());
    if (!m) throw new Error(`잘못된 색 코드: ${hex}`);
    const n = parseInt(m[1], 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const A = rgb(a);
  const B = rgb(b);
  return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join("").toUpperCase();
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

// 옷 색을 한국어 이름으로 바꾼다. 검색어와 화면 표시에 쓴다.
// shortcut: 색상(h)·채도·명도 구간으로 나눈 대략의 이름이다, 더 세밀한 이름이 필요하면 색 이름 표로 교체.
export function colorName(hex: string): string {
  const { h, s, l } = hexToHsl(hex);
  if (l < 0.12) return "블랙";
  if (l > 0.93 && s < 0.3) return "화이트";
  if (s < 0.12) return l > 0.75 ? "연한 회색" : l > 0.45 ? "회색" : "차콜";
  if (h >= 20 && h <= 55 && s < 0.5) {
    if (l > 0.86) return "아이보리";
    if (l > 0.62) return "베이지";
    if (l < 0.42 && s >= 0.2) return "브라운";
  }
  if (h >= 10 && h < 45 && l < 0.4 && s > 0.25) return "브라운";
  if (h >= 205 && h < 250 && l < 0.3) return "네이비";
  if (h >= 50 && h < 100 && s < 0.55 && l < 0.55) return l < 0.38 ? "올리브" : "카키";
  if ((h < 15 || h >= 330) && l < 0.35 && s > 0.3) return "버건디";
  const tone = l > 0.78 ? "연한 " : l < 0.3 ? "진한 " : "";
  const hue =
    h < 15 || h >= 345 ? "빨강"
    : h < 40 ? "주황"
    : h < 65 ? "노랑"
    : h < 90 ? "연두"
    : h < 160 ? "초록"
    : h < 190 ? "청록"
    : h < 215 ? (l > 0.5 ? "하늘색" : "파랑")
    : h < 255 ? "파랑"
    : h < 290 ? "보라"
    : l > 0.6 ? "분홍" : "자주";
  return tone + hue;
}

export type Feel = { score: number; reason: string; keywords: string[]; match: string; tip: string };

// 상의·하의 색과 추구미로 "입으면 어떤 느낌인지"를 말로 풀어 준다.
export function describeOutfit(topHex: string, bottomHex: string, aesthetic = ""): Feel {
  const a = hexToHsl(topHex);
  const b = hexToHsl(bottomHex);
  const { score, reason } = scorePair(topHex, bottomHex, aesthetic);
  const avgS = (a.s + b.s) / 2;
  const avgL = (a.l + b.l) / 2;
  const gapL = Math.abs(a.l - b.l);
  const chromatic = [a, b].filter((c) => !isNeutral(c));
  const warm = chromatic.filter((c) => c.h < 70 || c.h > 330).length;
  const cool = chromatic.length - warm;

  const keywords: string[] = [];
  if (chromatic.length === 0) keywords.push("차분한", "단정한");
  else if (avgS > 0.6) keywords.push("발랄한", "시선을 끄는");
  else if (warm > cool) keywords.push("따뜻한", "편안한");
  else keywords.push("시원한", "깨끗한");
  if (gapL > 0.35) keywords.push("대비가 뚜렷한");
  else if (gapL < 0.12) keywords.push("톤이 비슷한");
  if (avgL < 0.3) keywords.push("묵직한");
  else if (avgL > 0.7) keywords.push("가벼운");

  const style = parseAesthetic(aesthetic);
  const hasAesthetic = aesthetic.trim() !== "";
  let match = hasAesthetic ? "추구미와 잘 맞아요." : "추구미를 적으면 더 맞춰 드려요.";
  let tip = "";
  if (hasAesthetic && style.sat < 0 && avgS > 0.5) {
    match = "추구미보다 색이 진한 편이에요.";
    tip = "한쪽을 무채색이나 연한 색으로 바꾸면 더 차분해져요.";
  } else if (hasAesthetic && style.sat > 0 && avgS < 0.2) {
    match = "추구미에 비해 무난한 편이에요.";
    tip = "한 곳에 선명한 포인트 색을 더해 보세요.";
  }
  if (!tip) {
    tip = gapL < 0.12 ? "상의와 하의의 밝기를 조금 다르게 하면 더 또렷해 보여요." : "신발이나 가방은 두 색 중 하나에 맞추면 안정적이에요.";
  }
  return { score, reason, keywords: keywords.slice(0, 3), match, tip };
}
