"use client";

import { FormEvent, useEffect, useState } from "react";
import { CheckCircle2, KeyRound, Loader2, Server, ToggleLeft, ToggleRight } from "lucide-react";
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
    setSettings((current) => ({ ...current, [key]: value }));
    setStatus("idle");
    setMessage("");
  }

  function handleSave(event: FormEvent) {
    event.preventDefault();
    saveSettings(settings);
    setStatus("ok");
    setMessage("设置已保存到当前浏览器。");
  }

  async function checkConnection() {
    setStatus("checking");
    setMessage("");
    saveSettings(settings);
    try {
      const response = await fetch("/api/deepseek/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = (await response.json()) as { ok: boolean; message: string };
      setStatus(data.ok ? "ok" : "error");
      setMessage(data.message);
    } catch {
      setStatus("error");
      setMessage("连通性校验失败，请检查网络、Base URL 或 API Key。");
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <div className="mb-5">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="mt-1 text-sm text-muted">配置 DeepSeek 服务和演示模式。API Key 只保存到当前浏览器，并在请求时发送到本项目的服务端代理。</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4 rounded-lg border border-line bg-white p-5 shadow-soft">
        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-medium" htmlFor="baseUrl">
            <Server className="h-4 w-4 text-brand" />
            DeepSeek Base URL
          </label>
          <input
            id="baseUrl"
            className="h-11 rounded-md border border-line px-3 text-sm outline-none focus:border-brand"
            value={settings.baseUrl}
            onChange={(event) => update("baseUrl", event.target.value)}
            placeholder="https://api.deepseek.com"
          />
        </div>

        <div className="grid gap-2">
          <label className="flex items-center gap-2 text-sm font-medium" htmlFor="apiKey">
            <KeyRound className="h-4 w-4 text-brand" />
            API Key
          </label>
          <input
            id="apiKey"
            className="h-11 rounded-md border border-line px-3 text-sm outline-none focus:border-brand"
            value={settings.apiKey}
            onChange={(event) => update("apiKey", event.target.value)}
            placeholder="sk-..."
            type="password"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium" htmlFor="model">
            模型
          </label>
          <input
            id="model"
            className="h-11 rounded-md border border-line px-3 text-sm outline-none focus:border-brand"
            value={settings.model}
            onChange={(event) => update("model", event.target.value)}
            placeholder="deepseek-chat"
          />
        </div>

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
          <button className="h-10 rounded-md bg-brand px-4 text-sm text-white hover:bg-brand/90" type="submit">
            保存设置
          </button>
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

        {message && (
          <p className={`rounded-md px-3 py-2 text-sm ${status === "error" ? "bg-accent/10 text-accent" : "bg-brand/10 text-brand"}`}>
            {message}
          </p>
        )}
      </form>
    </main>
  );
}
