"use client";

import { useCallback, useEffect, useState } from "react";
import { defaultSettings, loadSettings, saveSettings } from "@/lib/settings";
import type { SettingsState } from "@/types/agent";

export function useSettingsState() {
  const [settings, setSettings] = useState<SettingsState>(defaultSettings);
  const [status, setStatus] = useState<"idle" | "checking" | "ok" | "error">("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setSettings(loadSettings());
  }, []);

  const update = useCallback(<K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((current) => {
      const next = { ...current, [key]: value };
      saveSettings(next);
      return next;
    });
    setStatus("idle");
    setMessage("");
  }, []);

  const checkConnection = useCallback(async () => {
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
  }, []);

  return { settings, update, status, message, checkConnection };
}
