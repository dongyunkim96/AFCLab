import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AFC Lab · 요금징수 운영 시뮬레이터",
  description: "가상 교통카드와 개찰 단말기로 요금징수, 로그 분석, 장애 복구를 체험하세요.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">{children}</body>
    </html>
  );
}
