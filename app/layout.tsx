"use client";

import Link from "next/link";
import { BriefcaseBusiness, History, Settings } from "lucide-react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="h-screen flex flex-col">
          <header className="sticky top-0 z-20 border-b border-line bg-white/88 backdrop-blur">
            <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
              <Link href="/" className="flex items-center gap-2 font-semibold text-ink">
                <BriefcaseBusiness className="h-5 w-5 text-brand" />
                InterviewFlow-AI
              </Link>
              <nav className="flex items-center gap-1 text-sm text-muted">
                <Link className="rounded-md px-3 py-2 hover:bg-panel hover:text-ink" href="/">
                  Workspace
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-panel hover:text-ink" href="/history">
                  <span className="hidden sm:inline">History</span>
                  <History className="h-4 w-4 sm:hidden" />
                </Link>
                <Link className="rounded-md px-3 py-2 hover:bg-panel hover:text-ink" href="/settings">
                  <span className="hidden sm:inline">Settings</span>
                  <Settings className="h-4 w-4 sm:hidden" />
                </Link>
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
