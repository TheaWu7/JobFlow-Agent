"use client";

import type { Artifact, ArtifactType, HistoryRecord } from "@/types/agent";
import { uid } from "@/lib/utils";

const HISTORY_KEY = "interviewflow.history.v1";
const MAX_HISTORY = 30;

export function loadHistory(): HistoryRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  const raw = window.localStorage.getItem(HISTORY_KEY);
  if (!raw) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw) as HistoryRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveArtifactToHistory(artifact: Artifact, summary: string) {
  const record: HistoryRecord = {
    id: uid("hist"),
    type: artifact.type as ArtifactType,
    title: artifact.title,
    createdAt: new Date().toISOString(),
    summary,
    artifact
  };
  const next = [record, ...loadHistory()].slice(0, MAX_HISTORY);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("interviewflow-history-updated"));
}

export function clearHistory() {
  window.localStorage.removeItem(HISTORY_KEY);
  window.dispatchEvent(new Event("interviewflow-history-updated"));
}
