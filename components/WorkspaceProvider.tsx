"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import {
  buildClarifyMessage,
  classifyByRegex,
  createTrace,
  decideTask,
  materialLabel,
  mergeContextFromInput,
  messagesToTranscript,
  mightContainMaterial,
  taskLabel
} from "@/lib/agent";
import { readFiles } from "@/lib/fileReader";
import { saveArtifactToHistory } from "@/lib/history";
import { loadSettings } from "@/lib/settings";
import { clearWorkspaceDraft, loadWorkspaceDraft, saveWorkspaceDraft } from "@/lib/workspaceState";
import { useTypewriter } from "@/hooks/useTypewriter";
import { uid } from "@/lib/utils";
import type {
  AgentTraceStep,
  Artifact,
  ChatMessage,
  ClarifyArtifact,
  StreamEvent,
  TaskType,
  UploadedAttachment,
  WorkspaceContext
} from "@/types/agent";

const defaultGreeting: ChatMessage = {
  id: uid("msg"),
  role: "assistant",
  content:
    "你好，我是 JobFlow-Agent。直接告诉我你要做什么，或粘贴 JD、简历、面试记录，我会自动判断任务并在右侧生成结果。",
  createdAt: new Date().toISOString(),
};

interface WorkspaceApi {
  messages: ChatMessage[];
  input: string;
  attachments: UploadedAttachment[];
  artifact: Artifact | null;
  trace: AgentTraceStep[];
  isStreaming: boolean;
  isReadingFiles: boolean;
  mobileView: "chat" | "artifact";
  setInput: (value: string) => void;
  setMobileView: (view: "chat" | "artifact") => void;
  handleFileChange: (files: FileList | null) => void;
  handleRemoveAttachment: (id: string) => void;
  handleSubmit: (event: FormEvent) => void;
  handleReset: () => void;
}

const WorkspaceStoreContext = createContext<WorkspaceApi | null>(null);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [workspaceContext, setWorkspaceContext] = useState<WorkspaceContext>({});
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [trace, setTrace] = useState<AgentTraceStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [pendingTask, setPendingTask] = useState<TaskType | null>(null);
  const [mobileView, setMobileView] = useState<"chat" | "artifact">("chat");

  const readyAttachments = useMemo(
    () => attachments.filter((item) => item.status === "ready"),
    [attachments]
  );

  // ── draft persistence ──
  useEffect(() => {
    const draft = loadWorkspaceDraft();
    if (draft.messages.length) {
      setMessages(draft.messages);
    } else {
      setMessages([defaultGreeting]);
    }
    setInput(draft.input);
    setAttachments(draft.attachments);
    setWorkspaceContext(draft.context);
    setArtifact(draft.artifact);
    setTrace(draft.trace);
    setPendingTask(draft.pendingTask);

    const sync = () => {
      const draft = loadWorkspaceDraft();
      setMessages(draft.messages.length ? draft.messages : [defaultGreeting]);
      setInput(draft.input);
      setAttachments(draft.attachments);
      setWorkspaceContext(draft.context);
      setArtifact(draft.artifact);
      setTrace(draft.trace);
      setPendingTask(draft.pendingTask);
    };
    window.addEventListener("interviewflow-workspace-updated", sync);
    return () => window.removeEventListener("interviewflow-workspace-updated", sync);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!messages.length) return;
    saveWorkspaceDraft({
      messages,
      input,
      attachments,
      context: workspaceContext,
      artifact,
      trace,
      pendingTask,
    });
  }, [messages, input, attachments, workspaceContext, artifact, trace, pendingTask]);

  // ── typewriter ──
  const { runTypewriter, clearTypewriter } = useTypewriter(setMessages);

  // ── handlers ──
  async function handleFileChange(files: FileList | null) {
    if (!files?.length) return;
    setIsReadingFiles(true);
    const parsed = await readFiles(Array.from(files));
    setAttachments((current) => [...current, ...parsed]);
    setIsReadingFiles(false);
  }

  function handleRemoveAttachment(id: string) {
    setAttachments((current) => current.filter((a) => a.id !== id));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (isStreaming) return;
    clearTypewriter();
    const trimmed = input.trim();
    if (!trimmed && readyAttachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: trimmed || "我上传了新的求职材料，请读取并继续当前任务。",
      attachments,
      createdAt: new Date().toISOString()
    };
    const assistantId = uid("msg");
    const nextMessages: ChatMessage[] = [
      ...messages,
      userMessage,
      { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() }
    ];
    setMessages(nextMessages);
    setInput("");
    setAttachments([]);
    setTrace([{ id: uid("trace"), label: "分析输入内容...", status: "running" }]);

    const pieces = [trimmed, ...readyAttachments.map((a) => a.text)].filter(Boolean);
    let classified:
      | Array<{ type: "jd" | "resume" | "interview" | "unknown"; text: string }>
      | undefined;

    // 仅当输入"可能包含求职素材"时才触发 classify，闲聊消息（hi、谢谢等）直接跳过
    if (mightContainMaterial(trimmed, readyAttachments.length > 0) && pieces.length) {
      // 本地正则预分类 — 高置信度命中直接采用，避免不必要的 LLM API 调用
      const regexResults: Array<{ type: "jd" | "resume" | "interview" | "unknown"; text: string }> = [];
      const unknownPieces: string[] = [];

      for (const piece of pieces) {
        const result = classifyByRegex(piece);
        if (result) {
          regexResults.push(result);
        } else {
          unknownPieces.push(piece);
        }
      }

      if (regexResults.length) {
        const labels = regexResults.map((r) => r.type).join("、");
        setTrace((current) => [
          ...current,
          { id: uid("trace"), label: `分类完成：${labels}`, status: "done" },
        ]);
      }

      // 仅对正则无法分类的片段调用 LLM
      if (unknownPieces.length) {
        try {
          const res = await fetch("/api/classify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pieces: unknownPieces }),
          });
          const data = await res.json();
          if (data.results?.length) {
            const llmLabels = data.results.map((r: { type: string }) => r.type).join("、");
            setTrace((current) => [
              ...current,
              { id: uid("trace"), label: `LLM 素材分类完成：${llmLabels}`, status: "done" },
            ]);
            regexResults.push(...data.results);
          }
        } catch {
          console.warn("LLM 解析失败，使用正则兜底");
        }
      }

      if (regexResults.length) {
        classified = regexResults;
      }
    }

    const mergedContext = mergeContextFromInput(workspaceContext, trimmed, readyAttachments, classified);
    setWorkspaceContext(mergedContext);

    const effectiveInput = pendingTask ? `${taskLabel(pendingTask)}\n${trimmed}` : trimmed;
    const decision = decideTask(effectiveInput, mergedContext);
    setTrace(createTrace(decision));

    if (decision.task === "clarify") {
      const message = buildClarifyMessage(decision.missing, decision.intendedTask);
      const clarifyArtifact: ClarifyArtifact = {
        type: "clarify",
        title: "需要补充素材",
        missing: decision.missing.length ? decision.missing.map(materialLabel) : ["任务类型未指明"],
        nextQuestion: message
      };
      setArtifact(clarifyArtifact);
      setPendingTask(decision.intendedTask);
      runTypewriter(assistantId, message);
      return;
    }

    setArtifact(null);
    setPendingTask(null);
    await runAgent(decision.task, trimmed || effectiveInput, mergedContext, nextMessages, assistantId);
  }

  function handleReset() {
    clearWorkspaceDraft();
  }

  async function runAgent(
    task: TaskType,
    userInput: string,
    nextContext: WorkspaceContext,
    nextMessages: ChatMessage[],
    placeholderId?: string
  ) {
    setIsStreaming(true);
    clearTypewriter();
    const assistantId = placeholderId ?? uid("msg");
    if (!placeholderId) {
      setMessages((current) => [
        ...current,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          createdAt: new Date().toISOString()
        }
      ]);
    }

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task,
          input: userInput,
          context: nextContext,
          transcript: messagesToTranscript(nextMessages),
          demoMode: loadSettings().demoMode
        })
      });

      if (!response.ok || !response.body) {
        throw new Error("Agent API 请求失败");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .find((item) => item.startsWith("data:"))
            ?.replace(/^data:\s*/, "");
          if (!line) continue;
          const eventData = JSON.parse(line) as StreamEvent;
          handleStreamEvent(eventData, assistantId);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Agent 执行失败";
      runTypewriter(assistantId, `\n${message}`);
      setTrace((current) => markLastTrace(current, "error"));
      setArtifact({
        type: "clarify",
        title: "请求失败",
        missing: [],
        nextQuestion: `调用模型服务时出错：${message}。请检查 API Key 配置或稍后重试。`
      });
    } finally {
      setIsStreaming(false);
    }
  }

  function handleStreamEvent(eventData: StreamEvent, assistantId: string) {
    if (eventData.type === "trace") {
      setTrace((current) => [...markLastTrace(current, "done"), { id: uid("trace"), label: eventData.label, status: "running" }]);
    }
    if (eventData.type === "delta") {
      appendAssistantDelta(assistantId, eventData.text);
    }
    if (eventData.type === "artifact") {
      setArtifact(eventData.artifact);
      if (eventData.artifact.type !== "clarify") {
        saveArtifactToHistory(eventData.artifact, historySummary(eventData.artifact));
      }
      setTrace((current) => markLastTrace(current, "done"));
      setMobileView("artifact");
    }
    if (eventData.type === "error") {
      runTypewriter(assistantId, `\n${eventData.message}`);
      setTrace((current) => markLastTrace(current, "error"));
    }
    if (eventData.type === "done") {
      setTrace((current) => markLastTrace(current, "done"));
    }
  }

  function appendAssistantDelta(id: string, delta: string) {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, content: `${message.content}${delta}` } : message))
    );
  }

  const api: WorkspaceApi = {
    messages,
    input,
    attachments,
    artifact,
    trace,
    isStreaming,
    isReadingFiles,
    mobileView,
    setInput,
    setMobileView,
    handleFileChange,
    handleRemoveAttachment,
    handleSubmit,
    handleReset,
  };

  return <WorkspaceStoreContext.Provider value={api}>{children}</WorkspaceStoreContext.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceStoreContext);
  if (!ctx) throw new Error("useWorkspace 必须在 WorkspaceProvider 内使用");
  return ctx;
}

// ── local helpers ──
function markLastTrace(trace: AgentTraceStep[], status: AgentTraceStep["status"]) {
  if (!trace.length) return trace;
  return trace.map((item, index) => (index === trace.length - 1 ? { ...item, status } : item));
}

function historySummary(artifact: Artifact) {
  if (artifact.type === "resume")
    return `匹配度 ${artifact.matchScore}，${
      Array.isArray(artifact.optimizations) ? artifact.optimizations.length : 0
    } 条优化建议`;
  if (artifact.type === "interview")
    return `${
      Array.isArray(artifact.questions) ? artifact.questions.length : 0
    } 道面试准备题目`;
  if (artifact.type === "review")
    return `综合评分 ${artifact.overallScore <= 10 ? artifact.overallScore * 10 : artifact.overallScore}，${
      Array.isArray(artifact.weaknessTags) ? artifact.weaknessTags.length : 0
    } 个短板标签`;

  return artifact.title;
}
