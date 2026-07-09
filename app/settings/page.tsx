"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, ToggleLeft, ToggleRight } from "lucide-react";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/settings";
import type { SettingsState } from "@/types/agent";

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
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">
          这里只保留 Demo 模式。真实模型配置请放在 `.env.local` 或 Vercel Environment Variables 中。
        </p>
      </div>

      <section className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-soft">
        <button
          className="flex w-full items-center justify-between rounded-lg border border-line bg-panel p-3 text-left"
          type="button"
          onClick={() => update("demoMode", !settings.demoMode)}
        >
          <span>
            <span className="block text-sm font-medium">Demo 模式</span>
            <span className="mt-1 block text-xs text-muted">开启后不调用真实模型，使用内置样例完成端到端演示。</span>
          </span>
          {settings.demoMode ? <ToggleRight className="h-7 w-7 text-brand" /> : <ToggleLeft className="h-7 w-7 text-muted" />}
        </button>

        <div className="flex flex-wrap gap-2">
          <button
            className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-4 text-sm text-muted hover:text-ink disabled:cursor-not-allowed"
            type="button"
            onClick={checkConnection}
            disabled={status === "checking" || settings.demoMode}
          >
            {status === "checking" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            校验连接
          </button>
        </div>

        <p className="rounded-md bg-panel px-3 py-2 text-xs leading-6 text-muted">
          本地测试时，在项目根目录创建 `.env.local`，写入 `DEEPSEEK_API_KEY`、`DEEPSEEK_BASE_URL`、`DEEPSEEK_MODEL`。
        </p>

        {message && (
          <p className={`rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-accent/10 text-accent" : "bg-brand/10 text-brand"}`}>
            {message}
          </p>
        )}
      </section>
    </main>
  );
}
