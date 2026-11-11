// 분위기별 팔레트 다섯 칸. glow는 배경에 번지는 색 세 가지, top/bottom은 그 분위기의 코디 예시 색이다.
export type Palette = { mood: string; colors: string[]; glow: string[]; top: string; bottom: string };

export const PALETTES: Palette[] = [
  { mood: "차분한 미니멀", colors: ["#1A1A1A", "#3D4148", "#9A9EA6", "#EFE6D2", "#F5F5F2"], glow: ["#9A9EA6", "#D6C3A1", "#3D4148"], top: "#EFE6D2", bottom: "#1A1A1A" },
  { mood: "따뜻한 빈티지", colors: ["#6B4A32", "#D6C3A1", "#8A8460", "#C98A3D", "#EFE6D2"], glow: ["#C98A3D", "#D6C3A1", "#6B4A32"], top: "#EFE6D2", bottom: "#6B4A32" },
  { mood: "발랄한 Y2K", colors: ["#FF4DA6", "#FF9A3D", "#FFE066", "#5CC8FF", "#FFFFFF"], glow: ["#FF4DA6", "#5CC8FF", "#FFE066"], top: "#FFFFFF", bottom: "#FF4DA6" },
  { mood: "시원한 데님", colors: ["#1F2A44", "#4A6A94", "#9DB7D5", "#F5F5F2", "#1A1A1A"], glow: ["#4A6A94", "#9DB7D5", "#1F2A44"], top: "#F5F5F2", bottom: "#4A6A94" },
  { mood: "깊은 가을", colors: ["#5E6B3A", "#8A8460", "#D6C3A1", "#6E1F2E", "#1C1B19"], glow: ["#6E1F2E", "#8A8460", "#5E6B3A"], top: "#D6C3A1", bottom: "#5E6B3A" },
];
