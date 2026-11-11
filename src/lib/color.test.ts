import { describe, expect, it } from "vitest";
import { colorName, describeOutfit, hexToHsl, isNeutral, mixHex, parseAesthetic, scorePair } from "./color";
import { searchLinks } from "./search";

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
    expect(scorePair("#000000", "#FF0000").score).toBeGreaterThan(scorePair("#FF0000", "#00FF00").score);
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

describe("mixHex", () => {
  it("두 색을 비율대로 섞는다", () => {
    expect(mixHex("#000000", "#FFFFFF", 0.5)).toBe("#808080");
    expect(mixHex("#112233", "#FFFFFF", 0)).toBe("#112233");
    expect(mixHex("#112233", "#FFFFFF", 1)).toBe("#FFFFFF");
  });
  it("잘못된 색 코드는 오류를 낸다", () => {
    expect(() => mixHex("빨강", "#FFFFFF", 0.5)).toThrow();
  });
});

describe("parseAesthetic", () => {
  it("키워드가 없으면 중립이다", () => {
    expect(parseAesthetic("아무말")).toEqual({ sat: 0, neutral: 0, warm: 0 });
  });
});

describe("colorName", () => {
  it("옷에서 흔한 색을 한국어 이름으로 부른다", () => {
    expect(colorName("#1A1A1A")).toBe("블랙");
    expect(colorName("#F5F5F2")).toBe("화이트");
    expect(colorName("#9A9EA6")).toBe("회색");
    expect(colorName("#D6C3A1")).toBe("베이지");
    expect(colorName("#EFE6D2")).toBe("아이보리");
    expect(colorName("#1F2A44")).toBe("네이비");
    expect(colorName("#4A6A94")).toBe("파랑");
    expect(colorName("#8A8460")).toBe("카키");
    expect(colorName("#5E6B3A")).toBe("올리브");
    expect(colorName("#6B4A32")).toBe("브라운");
    expect(colorName("#6E1F2E")).toBe("버건디");
  });
  it("어떤 색이든 이름이 비지 않는다", () => {
    for (const hex of ["#FF0000", "#00FF00", "#0000FF", "#FF00FF", "#FFFF00", "#00FFFF", "#7F7F7F"]) {
      expect(colorName(hex).length).toBeGreaterThan(0);
    }
  });
});

describe("describeOutfit", () => {
  it("무채색 조합은 차분한 느낌으로 설명한다", () => {
    const f = describeOutfit("#F5F5F2", "#1A1A1A");
    expect(f.keywords).toContain("차분한");
    expect(f.keywords.length).toBeLessThanOrEqual(3);
  });
  it("선명한 색은 발랄한 느낌으로 설명한다", () => {
    expect(describeOutfit("#FF3399", "#FFDD00").keywords).toContain("발랄한");
  });
  it("미니멀 추구미에 진한 색이면 톤을 낮추라고 알려 준다", () => {
    const f = describeOutfit("#FF0000", "#0000FF", "차분한 미니멀");
    expect(f.match).toContain("진한");
    expect(f.tip.length).toBeGreaterThan(0);
  });
  it("추구미가 없으면 적어 보라고 안내한다", () => {
    expect(describeOutfit("#000000", "#FFFFFF").match).toContain("추구미를 적으면");
  });
});

describe("searchLinks", () => {
  it("색 이름과 추구미를 검색어로 만들어 세 사이트 링크를 준다", () => {
    const links = searchLinks("베이지", "블랙", "차분한 미니멀");
    expect(links).toHaveLength(3);
    const q = encodeURIComponent("베이지 상의 블랙 하의 코디 차분한 미니멀");
    for (const l of links) expect(l.href).toContain(q);
  });
  it("추구미가 비어 있어도 검색어가 깨지지 않는다", () => {
    expect(searchLinks("블랙", "화이트", "  ")[0].href).toContain(encodeURIComponent("블랙 상의 화이트 하의 코디"));
  });
});
