"use client";

import type { AgentTraceStep, Artifact, ChatMessage, TaskType, UploadedAttachment, WorkspaceContext } from "@/types/agent";

const WORKSPACE_KEY = "interviewflow.workspace.v1";

export interface WorkspaceDraft {
  messages: ChatMessage[];
  input: string;
  attachments: UploadedAttachment[];
  context: WorkspaceContext;
  artifact: Artifact | null;
  trace: AgentTraceStep[];
  pendingTask: TaskType | null;
}

export const defaultWorkspaceDraft: WorkspaceDraft = {
  messages: [],
  input: "",
  attachments: [],
  context: {},
  artifact: null,
  trace: [],
  pendingTask: null
};

export function loadWorkspaceDraft(): WorkspaceDraft {
  if (typeof window === "undefined") {
    return defaultWorkspaceDraft;
  }
  const raw = window.localStorage.getItem(WORKSPACE_KEY);
  if (!raw) {
    return defaultWorkspaceDraft;
  }
  try {
    return { ...defaultWorkspaceDraft, ...JSON.parse(raw) };
  } catch {
    return defaultWorkspaceDraft;
  }
}

export function saveWorkspaceDraft(draft: WorkspaceDraft) {
  window.localStorage.setItem(WORKSPACE_KEY, JSON.stringify(draft));
}

export function clearWorkspaceDraft() {
  window.localStorage.removeItem(WORKSPACE_KEY);
  window.dispatchEvent(new Event("interviewflow-workspace-updated"));
}
