"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatInput } from "@/components/ChatInput";
import { ChatPanelHeader } from "@/components/ChatPanelHeader";
import { MessageList } from "@/components/MessageList";
import {
  buildClarifyMessage,
  createTrace,
  decideTask,
  materialLabel,
  mergeContextFromInput,
  messagesToTranscript,
  taskLabel
} from "@/lib/agent";
import { readFiles } from "@/lib/fileReader";
import { saveArtifactToHistory } from "@/lib/history";
import { loadSettings } from "@/lib/settings";
import { clearWorkspaceDraft, loadWorkspaceDraft, saveWorkspaceDraft } from "@/lib/workspaceState";
import { cn, uid } from "@/lib/utils";
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
import styles from "./page.module.css";

const defaultGreeting: ChatMessage = {
  id: uid("msg"),
  role: "assistant",
  content:
    "你好，我是 JobFlow-Agent。直接告诉我你要做什么，或粘贴 JD、简历、项目材料，我会自动判断任务并在右侧生成结果。",
  createdAt: new Date().toISOString(),
};

export default function WorkspacePage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [attachments, setAttachments] = useState<UploadedAttachment[]>([]);
  const [context, setContext] = useState<WorkspaceContext>({});
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  const [trace, setTrace] = useState<AgentTraceStep[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isReadingFiles, setIsReadingFiles] = useState(false);
  const [pendingTask, setPendingTask] = useState<TaskType | null>(null);
  const [mobileView, setMobileView] = useState<"chat" | "artifact">("chat");
  const scrollRef = useRef<HTMLDivElement>(null);

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
    setContext(draft.context);
    setArtifact(draft.artifact);
    setTrace(draft.trace);
    setPendingTask(draft.pendingTask);

    const sync = () => {
      const draft = loadWorkspaceDraft();
      setMessages(draft.messages.length ? draft.messages : [defaultGreeting]);
      setInput(draft.input);
      setAttachments(draft.attachments);
      setContext(draft.context);
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
      context,
      artifact,
      trace,
      pendingTask,
    });
  }, [messages, input, attachments, context, artifact, trace, pendingTask]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

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
    const trimmed = input.trim();
    if (!trimmed && readyAttachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: trimmed || "我上传了新的求职材料，请读取并继续当前任务。",
      attachments,
      createdAt: new Date().toISOString()
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setAttachments([]);

    const pieces = [trimmed, ...readyAttachments.map((a) => a.text)].filter(Boolean);
    let classified:
      | Array<{ type: "jd" | "resume" | "project" | "interview" | "unknown"; text: string }>
      | undefined;

    if (pieces.length) {
      try {
        const res = await fetch("/api/classify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pieces }),
        });
        const data = await res.json();
        if (data.results?.length) {
          classified = data.results;
          const labels = data.results.map((r: { type: string }) => r.type).join("、");
          setTrace((current) => [
            ...current,
            { id: uid("trace"), label: `LLM 素材分类完成：${labels}`, status: "done" },
          ]);
        }
      } catch {
        console.warn("LLM 解析失败，使用正则兜底");
      }
    }

    const mergedContext = mergeContextFromInput(context, trimmed, readyAttachments, classified);
    setContext(mergedContext);

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
      setMessages((current) => [
        ...current,
        {
          id: uid("msg"),
          role: "assistant",
          content: message,
          createdAt: new Date().toISOString()
        }
      ]);
      return;
    }

    setArtifact(null);
    setPendingTask(null);
    await runAgent(decision.task, trimmed || effectiveInput, mergedContext, nextMessages);
  }

  function handleReset() {
    try {
      clearWorkspaceDraft();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new Event("interviewflow-workspace-updated"));
      }
    } catch {}
  }

  async function runAgent(
    task: TaskType,
    userInput: string,
    nextContext: WorkspaceContext,
    nextMessages: ChatMessage[]
  ) {
    setIsStreaming(true);
    const assistantId = uid("msg");
    setMessages((current) => [
      ...current,
      {
        id: assistantId,
        role: "assistant",
        content: "",
        createdAt: new Date().toISOString()
      }
    ]);

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
      appendAssistantDelta(assistantId, `\n${message}`);
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
      appendAssistantDelta(assistantId, `\n${eventData.message}`);
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

  // ── render ──
  return (
    <main className={styles.workspace}>
      {/* Mobile view toggles */}
      <div className={styles.mobileTabs}>
        <button
          className={cn(styles.mobileTab, mobileView === "chat" ? styles.mobileTabActive : styles.mobileTabInactive)}
          onClick={() => setMobileView("chat")}
          type="button"
        >
          Chat
        </button>
        <button
          className={cn(styles.mobileTab, mobileView === "artifact" ? styles.mobileTabActive : styles.mobileTabInactive)}
          onClick={() => setMobileView("artifact")}
          type="button"
        >
          Artifact
        </button>
      </div>

      {/* Chat Panel */}
      <section className={cn(styles.chatPanel, mobileView === "artifact" && styles.chatPanelHidden)}>
        <ChatPanelHeader onReset={handleReset} />

        {/* Messages */}
        <div ref={scrollRef} className={styles.messagesArea}>
          <MessageList messages={messages} isStreaming={isStreaming} trace={trace} />
        </div>

        {/* Input Form */}
        <ChatInput
          attachments={attachments}
          isStreaming={isStreaming}
          isReadingFiles={isReadingFiles}
          input={input}
          onInputChange={setInput}
          onSubmit={handleSubmit}
          onFileChange={handleFileChange}
          onRemoveAttachment={handleRemoveAttachment}
        />
      </section>

      {/* Artifact Aside */}
      <aside className={cn(styles.artifactAside, mobileView === "chat" && styles.artifactAsideHidden)}>
        <ArtifactPanel artifact={artifact} />
      </aside>
    </main>
  );
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
