import { describe, expect, it } from "vitest";
import { AGES, GENDERS, LOOKS, pickLooks } from "./looks";
import { hexToHsl } from "./color";
import { PALETTES } from "./palettes";

describe("looks", () => {
  it("성별×연령대마다 분위기 수만큼 코디가 있다", () => {
    for (const g of GENDERS) for (const a of AGES) expect(pickLooks(g, a)).toHaveLength(PALETTES.length);
  });
  it("고르지 않은 쪽은 모두 보여 주고, 아무것도 안 고르면 전부", () => {
    expect(pickLooks("여성", "")).toHaveLength(PALETTES.length * AGES.length);
    expect(pickLooks("", "30대 이상")).toHaveLength(PALETTES.length * GENDERS.length);
    expect(pickLooks("", "")).toHaveLength(LOOKS.length);
  });
  it("모든 코디에 Unsplash 사진과 출처가 있고 같은 사진이 겹치지 않는다", () => {
    const srcs = LOOKS.map((l) => l.photo?.src);
    for (const l of LOOKS) {
      expect(l.photo?.src).toMatch(/^https:\/\/images\.unsplash\.com\/photo-/);
      expect(l.photo?.creditUrl).toMatch(/^https:\/\/unsplash\.com\/photos\//);
    }
    expect(new Set(srcs).size).toBe(LOOKS.length);
  });
  it("모든 색 코드가 올바르다", () => {
    for (const l of LOOKS) {
      expect(() => hexToHsl(l.top)).not.toThrow();
      expect(() => hexToHsl(l.bottom)).not.toThrow();
    }
  });
});
