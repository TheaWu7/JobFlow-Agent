"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import styles from "./ThemeToggle.module.css";

type Theme = "light" | "dark";

function readInitialTheme(): Theme {
  if (typeof document !== "undefined") {
    const t = document.documentElement.getAttribute("data-theme");
    if (t === "dark" || t === "light") return t;
  }
  return "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  // 首屏之后同步真实主题（初始值由 layout 里的内联脚本决定）
  useEffect(() => {
    setTheme(readInitialTheme());
  }, []);

  const toggle = () => {
    setTheme((prev) => {
      const next: Theme = prev === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next);
      try {
        localStorage.setItem("theme", next);
      } catch {}
      return next;
    });
  };

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className={styles.toggle}
      onClick={toggle}
      aria-label={dark ? "切换为浅色主题" : "切换为深色主题"}
      title={dark ? "浅色主题" : "深色主题"}
    >
      {dark ? <Sun className={styles.icon} /> : <Moon className={styles.icon} />}
    </button>
  );
}
