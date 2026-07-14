"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { AgentTraceStep, Artifact, ChatMessage, TaskType, UploadedAttachment, WorkspaceContext } from "@/types/agent";
import { loadWorkspaceDraft, saveWorkspaceDraft } from "@/lib/workspaceState";
import { readFiles } from "@/lib/fileReader";
import { uid } from "@/lib/utils";

export function useWorkspace() {
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

  // 初始化加载草稿 + 跨标签页同步
  useEffect(() => {
    const draft = loadWorkspaceDraft();
    if (draft.messages.length) {
      setMessages(draft.messages);
    } else {
      setMessages([
        {
          id: uid("msg"),
          role: "assistant",
          content: "你好，我是 InterviewFlow-AI。直接告诉我你要做什么，或粘贴 JD、简历、项目材料，我会自动判断任务并在右侧生成结果。",
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
      const d = loadWorkspaceDraft();
      setMessages(d.messages.length ? d.messages : []);
      setInput(d.input);
      setAttachments(d.attachments);
      setContext(d.context);
      setArtifact(d.artifact);
      setTrace(d.trace);
      setPendingTask(d.pendingTask);
    };
    window.addEventListener("interviewflow-workspace-updated", sync);
    return () => window.removeEventListener("interviewflow-workspace-updated", sync);
  }, []);

  // 自动保存
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!messages.length) return;
    saveWorkspaceDraft({ messages, input, attachments, context, artifact, trace, pendingTask });
  }, [messages, input, attachments, context, artifact, trace, pendingTask]);

  // 自动滚动
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

  const handleFileChange = useCallback(async (files: FileList | null) => {
    if (!files?.length) return;
    setIsReadingFiles(true);
    const parsed = await readFiles(Array.from(files));
    setAttachments((current) => [...current, ...parsed]);
    setIsReadingFiles(false);
  }, []);

  return {
    messages, setMessages,
    input, setInput,
    attachments, setAttachments,
    context, setContext,
    artifact, setArtifact,
    trace, setTrace,
    isStreaming, setIsStreaming,
    isReadingFiles,
    pendingTask, setPendingTask,
    mobileView, setMobileView,
    activeInterview,
    readyAttachments,
    scrollRef,
    handleFileChange,
  };
}
