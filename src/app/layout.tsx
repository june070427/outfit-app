import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "내 옷장 색 코디",
  description: "가지고 있는 상의와 하의의 색을 고르면, 추구미에 맞는 조합을 골라 줍니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
