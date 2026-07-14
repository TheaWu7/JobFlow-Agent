import type { Metadata } from "next";
import { NavHeader } from "@/components/layout/NavHeader";
import "./globals.css";

export const metadata: Metadata = {
  title: "InterviewFlow-AI",
  description: "AI Agent 求职准备工作台",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen">
          <NavHeader />
          {children}
        </div>
      </body>
    </html>
  );
}
