"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, History, Settings } from "lucide-react";
import "./globals.css";
import styles from "./layout.module.css";

function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ className?: string }> }) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`} href={href}>
      <span className={styles.navLinkLabel}>{label}</span>
      <Icon className={styles.navLinkIcon} />
    </Link>
  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className={styles.root}>
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.logo}>
                <BriefcaseBusiness className={styles.logoIcon} />
                JobFlow Agent
              </Link>
              <nav className={styles.nav}>
                <NavLink href="/" label="Workspace" icon={BriefcaseBusiness} />
                <NavLink href="/history" label="History" icon={History} />
                <NavLink href="/settings" label="Settings" icon={Settings} />
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
