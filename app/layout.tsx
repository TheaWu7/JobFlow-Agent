import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { NavLinks } from "@/components/NavLinks";
import AuthHeader from "@/components/AuthHeader";
import { WorkspaceProvider } from "@/components/WorkspaceProvider";
import { MosaicDecor } from "@/components/MosaicDecor";
import { ThemeToggle } from "@/components/ThemeToggle";
import "./globals.css";
import styles from "./layout.module.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
        <div className={styles.root}>
          <MosaicDecor />
          <MosaicDecor corner="bl" />
          <header className={styles.header}>
            <div className={styles.headerInner}>
              <Link href="/" className={styles.logo}>
                <BriefcaseBusiness className={styles.logoIcon} />
                JobFlow Agent
              </Link>
              <nav className={styles.nav}>
                <NavLinks />
                <ThemeToggle />
                <AuthHeader />
              </nav>
            </div>
          </header>
          <div className={styles.content}>
            <WorkspaceProvider>{children}</WorkspaceProvider>
          </div>
        </div>
      </body>
    </html>
  );
}
