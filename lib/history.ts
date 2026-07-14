import type { Artifact, ArtifactType, HistoryRecord } from "@/types/agent";
import { uid } from "@/lib/utils";
import { createLocalStore } from "@/lib/localStore";

const HISTORY_KEY = "interviewflow.history.v1";
const MAX_HISTORY = 30;

const store = createLocalStore<HistoryRecord[]>({
  key: HISTORY_KEY,
  defaultValue: [],
  eventName: "interviewflow-history-updated"
});

export const loadHistory = store.load;
export const clearHistory = store.clear;

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
  store.save(next);
  window.dispatchEvent(new Event("interviewflow-history-updated"));
}
