import { describe, expect, it } from "vitest";
import { hexToHsl, isNeutral, parseAesthetic, recommend, scorePair } from "./color";

describe("hexToHsl", () => {
  it("순수한 빨강·흰색·검정을 읽는다", () => {
    expect(hexToHsl("#FF0000")).toEqual({ h: 0, s: 1, l: 0.5 });
    expect(hexToHsl("#ffffff")).toEqual({ h: 0, s: 0, l: 1 });
    expect(hexToHsl("000000").l).toBe(0);
  });
  it("잘못된 색 코드는 오류를 낸다", () => {
    expect(() => hexToHsl("빨강")).toThrow();
  });
});

describe("isNeutral", () => {
  it("검정·회색·흰색은 무채색, 빨강은 아니다", () => {
    expect(isNeutral(hexToHsl("#111111"))).toBe(true);
    expect(isNeutral(hexToHsl("#888888"))).toBe(true);
    expect(isNeutral(hexToHsl("#FF0000"))).toBe(false);
  });
});

describe("scorePair", () => {
  it("무채색 + 색 조합은 두 원색 조합보다 높다", () => {
    const safe = scorePair("#000000", "#FF0000").score;
    const loud = scorePair("#FF0000", "#00FF00").score;
    expect(safe).toBeGreaterThan(loud);
  });
  it("점수는 0~100 안에 있다", () => {
    for (const [t, b] of [["#FF0000", "#FF0000"], ["#000000", "#FFFFFF"], ["#00FF00", "#FF00FF"]]) {
      const { score } = scorePair(t, b, "y2k 화려");
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });
  it("미니멀 추구미는 무채색 조합을, y2k는 색이 있는 조합을 더 높게 본다", () => {
    const mono = scorePair("#000000", "#EEEEEE", "미니멀").score - scorePair("#000000", "#EEEEEE", "").score;
    const color = scorePair("#FF4DA6", "#7C3AED", "y2k").score - scorePair("#FF4DA6", "#7C3AED", "").score;
    expect(mono).toBeGreaterThan(0);
    expect(color).toBeGreaterThan(0);
  });
});

describe("parseAesthetic", () => {
  it("키워드가 없으면 중립이다", () => {
    expect(parseAesthetic("아무말")).toEqual({ sat: 0, neutral: 0, warm: 0 });
  });
});

describe("recommend", () => {
  const g = (id: string, hex: string) => ({ id, name: id, hex });
  it("점수 높은 순으로 최대 count개를 돌려준다", () => {
    const res = recommend([g("t1", "#FF0000"), g("t2", "#FFFFFF")], [g("b1", "#00FF00"), g("b2", "#111111")], "", 2);
    expect(res).toHaveLength(2);
    expect(res[0].score).toBeGreaterThanOrEqual(res[1].score);
  });
  it("옷이 없으면 빈 목록이다", () => {
    expect(recommend([], [g("b", "#000000")])).toEqual([]);
  });
});
