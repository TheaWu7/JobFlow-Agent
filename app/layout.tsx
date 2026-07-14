"use client";

import Link from "next/link";
import { BriefcaseBusiness, History, Settings } from "lucide-react";
import "./globals.css";
import styles from "./layout.module.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.logo}>
                <BriefcaseBusiness className={styles.logoIcon} />
                InterviewFlow-AI
              </Link>
              <nav className={styles.nav}>
                <Link className={styles.navLink} href="/">
                  Workspace
                </Link>
                <Link className={styles.navLink} href="/history">
                  <span className={styles.navLinkLabel}>History</span>
                  <History className={styles.navLinkIcon} />
                </Link>
                <Link className={styles.navLink} href="/settings">
                  <span className={styles.navLinkLabel}>Settings</span>
                  <Settings className={styles.navLinkIcon} />
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
