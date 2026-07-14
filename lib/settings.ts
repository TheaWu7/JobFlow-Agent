import { createLocalStore } from "@/lib/localStore";
import type { SettingsState } from "@/types/agent";

const SETTINGS_KEY = "interviewflow.settings.v1";

export const defaultSettings: SettingsState = {
  demoMode: true
};

const store = createLocalStore<SettingsState>({
  key: SETTINGS_KEY,
  defaultValue: defaultSettings,
  eventName: "interviewflow-settings-updated"
});

export const loadSettings = store.load;
export const saveSettings = store.save;
