import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "이 색으로 입으면 어떤 느낌일까",
  description: "추구미와 상의, 하의 색을 고르면 입은 모습과 느낌, 코디 사진 검색을 알려 줍니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
