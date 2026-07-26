"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BriefcaseBusiness, History, Settings } from "lucide-react";
import styles from "../app/layout.module.css";

function NavLink({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      className={`${styles.navLink} ${active ? styles.navLinkActive : ""}`}
      href={href}
    >
      <span className={styles.navLinkLabel}>{label}</span>
      <Icon className={styles.navLinkIcon} />
    </Link>
  );
}

export function NavLinks() {
  return (
    <>
      <NavLink href="/" label="Workspace" icon={BriefcaseBusiness} />
      <NavLink href="/history" label="History" icon={History} />
      <NavLink href="/settings" label="Settings" icon={Settings} />
    </>
  );
}
