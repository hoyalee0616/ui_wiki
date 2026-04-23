import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Utility Wiki",
  description: "계산, 변환, 측정 도구를 빠르게 찾는 유틸리티 위키",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
