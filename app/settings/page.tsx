"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/settings";
import type { SettingsState } from "@/types/agent";
import styles from "./settings.module.css";

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  function update<K extends keyof SettingsState>(key: K, value: SettingsState[K]) {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      saveSettings(next);
      return next;
    });
    setStatus("idle");
    setMessage("");
  }

  async function checkConnection() {
    setStatus("checking");
    setMessage("");
    try {
      const response = await fetch("/api/deepseek/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" }
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      setStatus(data.ok ? "ok" : "error");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage("连通性校验失败，请检查服务端环境变量是否配置正确。");
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>
          这里只保留 Demo 模式。真实模型配置请放在 `.env.local` 或 Vercel Environment Variables 中。
        </p>
      </div>

      <section className={styles.section}>
        <button
          className={styles.toggleRow}
          type="button"
          onClick={() => update("demoMode", !settings.demoMode)}
        >
          <span>
            <span className={styles.toggleLabel}>Demo 模式</span>
            <span className={styles.toggleHint}>开启后不调用真实模型，使用内置样例完成端到端演示。</span>
          </span>
          {settings.demoMode ? <ToggleRight className={styles.toggleIconOn} /> : <ToggleLeft className={styles.toggleIconOff} />}
        </button>

        <div className={styles.buttonRow}>
          <button
            className={styles.actionButton}
            type="button"
            onClick={checkConnection}
            disabled={status === "checking" || settings.demoMode}
          >
            {status === "checking" ? <Loader2 className="animate-spin" size={16} /> : <CheckCircle2 size={16} />}
            校验连接
          </button>
        </div>

        <p className={styles.hint}>
          本地测试时，在项目根目录创建 `.env.local`，写入 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`。
        </p>

        {message && (
          <p className={`${styles.statusMessage} ${status === "error" ? styles.statusError : styles.statusOk}`}>
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
