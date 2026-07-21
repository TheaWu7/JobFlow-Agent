export type TaskType =
  | "resume"
  | "interview"
  | "review"
  | "clarify"
  | "unknown";

export type MessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  createdAt: string;
  attachments?: UploadedAttachment[];
}

export interface UploadedAttachment {
  id: string;
  name: string;
  type: string;
  text: string;
  status: "ready" | "error";
  error?: string;
}

export interface AgentTraceStep {
  id: string;
  label: string;
  status: "pending" | "running" | "done" | "error";
}

export interface WorkspaceContext {
  jd?: string;
  resume?: string;
  project?: string;
  interview?: InterviewArtifact;
  lastTask?: TaskType;
}

export interface AgentDecision {
  task: TaskType;
  intendedTask: TaskType;
  missing: Array<"jd" | "resume" | "interview">;
  userPrompt: string;
}

export interface ResumeArtifact {
  type: "resume";
  title: string;
  jdSummary: {
    role: string;
    seniority: string;
    mustHave: string[];
    niceToHave: string[];
  };
  matchScore: number;
  strengths: string[];
  gaps: string[];
  optimizations: Array<{
    section: string;
    before: string;
    after: string;
    reason: string;
  }>;
}

export interface InterviewQuestion {
  id: string;
  question: string;
  focus: string;
  answer?: string;
  feedback?: string;
  followUp?: string;
}

export interface InterviewArtifact {
  type: "interview";
  title: string;
  currentIndex: number;
  status: "ready" | "in_progress" | "completed";
  questions: InterviewQuestion[];
  finalReview?: ReviewArtifact;
}

export interface ReviewArtifact {
  type: "review";
  title: string;
  overallScore: number;
  dimensionScores: Array<{
    name: string;
    score: number;
    evidence: string;
  }>;
  weaknessTags: string[];
  improvements: string[];
  practicePlan: string[];
}

export interface ClarifyArtifact {
  type: "clarify";
  title: string;
  missing: string[];
  nextQuestion: string;
}

export type Artifact =
  | ResumeArtifact
  | InterviewArtifact
  | ReviewArtifact
  | ClarifyArtifact;

export interface HistoryRecord {
  id: string;
  type: TaskType;
  title: string;
  createdAt: string;
  summary: string;
  artifact: Artifact;
}

export interface SettingsState {
  demoMode: boolean;
}

export type StreamEvent =
  | { type: "trace"; label: string }
  | { type: "delta"; text: string }
  | { type: "artifact"; artifact: Artifact }
  | { type: "error"; message: string }
  | { type: "done" };
