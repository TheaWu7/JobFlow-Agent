import { createLocalStore } from "@/lib/localStore";
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

const store = createLocalStore<WorkspaceDraft>({
  key: WORKSPACE_KEY,
  defaultValue: defaultWorkspaceDraft,
  eventName: "interviewflow-workspace-updated"
});

export const loadWorkspaceDraft = store.load;
export const saveWorkspaceDraft = store.save;
export const clearWorkspaceDraft = store.clear;
