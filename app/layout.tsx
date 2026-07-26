import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
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
                JobFlow Agent
              </Link>
              <nav className={styles.nav}>
                <NavLinks />
              </nav>
            </div>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
