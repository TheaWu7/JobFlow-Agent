"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Loader2, Paperclip, Send, Sparkles, UploadCloud } from "lucide-react";
import { ArtifactPanel } from "@/components/ArtifactPanel";
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
  InterviewArtifact,
  StreamEvent,
  TaskType,
  UploadedAttachment,
  WorkspaceContext
} from "@/types/agent";
import styles from "./page.module.css";

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

  const activeInterview = artifact?.type === "interview" && artifact.status === "in_progress";
  const readyAttachments = useMemo(
    () => attachments.filter((item) => item.status === "ready"),
    [attachments]
  );

  useEffect(() => {
    const draft = loadWorkspaceDraft();
    if (draft.messages.length) {
      setMessages(draft.messages);
    } else {
      setMessages([
        {
          id: uid("msg"),
          role: "assistant",
          content:
            "你好，我是 InterviewFlow-AI。直接告诉我你要做什么，或粘贴 JD、简历、项目材料，我会自动判断任务并在右侧生成结果。",
          createdAt: new Date().toISOString(),
        },
      ]);
    }
    setInput(draft.input);
    setAttachments(draft.attachments);
    setContext(draft.context);
    setArtifact(draft.artifact);
    setTrace(draft.trace);
    setPendingTask(draft.pendingTask);

    const sync = () => {
      const draft = loadWorkspaceDraft();
      setMessages(draft.messages.length ? draft.messages : []);
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

  async function handleFileChange(files: FileList | null) {
    if (!files?.length) return;
    setIsReadingFiles(true);
    const parsed = await readFiles(Array.from(files));
    setAttachments((current) => [...current, ...parsed]);
    setIsReadingFiles(false);
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

    const mergedContext = mergeContextFromInput(context, trimmed, readyAttachments);
    if (artifact?.type === "interview") {
      mergedContext.interview = artifact;
    }
    setContext(mergedContext);

    const effectiveInput = pendingTask ? `${taskLabel(pendingTask)}\n${trimmed}` : trimmed;
    const decision = decideTask(effectiveInput, mergedContext, activeInterview);
    setTrace(createTrace(decision));

    console.log("[handleSubmit] decision.task:", decision.task, "intendedTask:", decision.intendedTask, "missing:", decision.missing, "pendingTask:", pendingTask);

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
      if (eventData.artifact.type === "interview") {
        setContext((current) => ({
          ...current,
          interview: eventData.artifact as InterviewArtifact,
        }));
      }
      if (eventData.detectedTask) {
        setContext((current) => ({ ...current, lastTask: eventData.detectedTask as TaskType }));
      }
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
        <div className={styles.chatPanelHeader}>
          <div className={styles.chatPanelHeaderRow}>
            <div className={styles.chatPanelTitleGroup}>
              <Sparkles className={styles.chatPanelIcon} />
              <h1 className={styles.chatPanelTitle}>Agent Workspace</h1>
            </div>
            <button
              className={styles.resetButton}
              type="button"
              title="清空对话，重新开始"
              onClick={() => {
                try {
                  window.localStorage.removeItem("interviewflow.workspace.v1");
                  if (typeof window !== "undefined") {
                    window.dispatchEvent(new Event("interviewflow-workspace-updated"));
                  }
                } catch {}
              }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
            </button>
          </div>
          <p className={styles.chatPanelSubtitle}>
            自然语言是唯一业务入口；Agent 自动识别任务、补齐素材并生成右侧结果。
          </p>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className={styles.messagesArea}>
          {messages.map((message) => (
            <div key={message.id} className={cn(styles.messageRow, message.role === "user" ? styles.messageRowUser : styles.messageRowAssistant)}>
              <div
                className={cn(
                  styles.messageBubble,
                  message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant
                )}
              >
                <p className={styles.messageText}>{message.content || (isStreaming ? " " : "")}</p>
                {message.attachments?.length ? (
                  <div className={styles.attachmentList}>
                    {message.attachments.map((file) => (
                      <div key={file.id} className={styles.attachmentItem}>
                        {file.name} · {file.status === "ready" ? "已读取" : file.error}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        <TraceList trace={trace} />

        {/* Input Form */}
        <form onSubmit={handleSubmit} className={styles.inputForm}>
          {attachments.length > 0 && (
            <div className={styles.attachmentPreview}>
              {attachments.map((file) => (
                <span key={file.id} className={cn(styles.attachmentChip, file.status === "ready" ? styles.attachmentChipReady : styles.attachmentChipError)}>
                  {file.name}
                </span>
              ))}
            </div>
          )}
          <div className={styles.inputRow}>
            <label className={styles.fileUploadButton} title="上传素材">
              {isReadingFiles ? <Loader2 size={16} className="animate-spin" /> : <Paperclip size={16} />}
              <input
                className={styles.fileInput}
                type="file"
                multiple
                accept=".txt,.md,.pdf,.docx"
                onChange={(event) => handleFileChange(event.target.files)}
              />
            </label>
            <textarea
              className={styles.textarea}
              placeholder="例如：帮我针对这个前端 JD 优化简历，然后粘贴 JD 和简历内容..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  event.currentTarget.form?.requestSubmit();
                }
              }}
            />
            <button
              className={styles.sendButton}
              type="submit"
              disabled={isStreaming || isReadingFiles}
              title="发送"
            >
              {isStreaming ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className={styles.inputFooter}>
            <UploadCloud className={styles.footerIcon} />
            支持 txt、md、pdf、docx；业务任务仍由聊天内容触发。
          </div>
        </form>
      </section>

      {/* Artifact Aside */}
      <aside className={cn(styles.artifactAside, mobileView === "chat" && styles.artifactAsideHidden)}>
        <ArtifactPanel artifact={artifact} />
      </aside>
    </main>
  );
}

function TraceList({ trace }: { trace: AgentTraceStep[] }) {
  if (!trace.length) return null;
  return (
    <div className={styles.trace}>
      <p className={styles.traceTitle}>Agent Trace</p>
      <div className={styles.traceList}>
        {trace.map((item) => (
          <div key={item.id} className={styles.traceItem}>
            <span
              className={cn(
                styles.traceDot,
                item.status === "done" && styles.traceDotDone,
                item.status === "running" && styles.traceDotRunning,
                item.status === "pending" && styles.traceDotPending,
                item.status === "error" && styles.traceDotError
              )}
            />
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function markLastTrace(trace: AgentTraceStep[], status: AgentTraceStep["status"]) {
  if (!trace.length) return trace;
  return trace.map((item, index) => (index === trace.length - 1 ? { ...item, status } : item));
}

function historySummary(artifact: Artifact) {
  if (artifact.type === "resume") return `匹配度 ${artifact.matchScore}，${artifact.optimizations.length} 条优化建议`;
  if (artifact.type === "interview") return `${artifact.questions.length} 道题，状态：${artifact.status}`;
  if (artifact.type === "review") return `综合评分 ${artifact.overallScore}，${artifact.weaknessTags.length} 个短板标签`;
  if (artifact.type === "project") return `${artifact.followUps.length} 个高频追问，${artifact.riskPoints.length} 个风险点`;
  return artifact.title;
}
