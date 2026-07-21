import type { TaskType, WorkspaceContext } from "@/types/agent";

export interface ChatRequest {
  task: TaskType;
  input: string;
  context: WorkspaceContext;
  transcript: string;
  demoMode: boolean;
}
