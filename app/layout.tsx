import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("host") ?? "localhost";
  const protocol = requestHeaders.get("x-forwarded-proto") ?? "https";
  return {
    metadataBase: new URL(`${protocol}://${host}`),
    title: { default: "JLPT N2 Study Atlas", template: "%s · JLPT N2 Study Atlas" },
    description: "覆盖语言知识、阅读、听力与分级词汇的 JLPT N2 学习、诊断和复习系统。",
    icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
    openGraph: { title: "JLPT N2 Study Atlas", description: "从学习地图到计时练习，让每次复习都有下一步。", images: [{ url: "/og.png", width: 1728, height: 960, alt: "JLPT N2 Study Garden learning map" }] },
    twitter: { card: "summary_large_image", title: "JLPT N2 Study Atlas", description: "从学习地图到计时练习，让每次复习都有下一步。", images: ["/og.png"] },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
