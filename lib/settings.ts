"use client";

import type { SettingsState } from "@/types/agent";

const SETTINGS_KEY = "interviewflow.settings.v1";

export const defaultSettings: SettingsState = {
  apiKey: "",
  baseUrl: "https://api.deepseek.com",
  demoMode: true,
  modelProvider: "deepseek",
  model: "deepseek-chat"
};

export function loadSettings(): SettingsState {
  if (typeof window === "undefined") {
    return defaultSettings;
  }
  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return defaultSettings;
  }
  try {
    return { ...defaultSettings, ...JSON.parse(raw), modelProvider: "deepseek" };
  } catch {
    return defaultSettings;
  }
}

export function saveSettings(settings: SettingsState) {
  window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
