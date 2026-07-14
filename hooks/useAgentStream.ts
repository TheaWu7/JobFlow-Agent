"use client";

import type { ChatMessage, InterviewArtifact, StreamEvent, TaskType, WorkspaceContext } from "@/types/agent";
import type { Dispatch, SetStateAction } from "react";
import { loadSettings } from "@/lib/settings";
import { saveArtifactToHistory } from "@/lib/history";
import { markLastTrace, historySummary, messagesToTranscript } from "@/lib/agent";
import { uid } from "@/lib/utils";

interface UseAgentStreamParams {
  setMessages: Dispatch<SetStateAction<ChatMessage[]>>;
  setArtifact: Dispatch<SetStateAction<import("@/types/agent").Artifact | null>>;
  setTrace: Dispatch<SetStateAction<import("@/types/agent").AgentTraceStep[]>>;
  setContext: Dispatch<SetStateAction<WorkspaceContext>>;
  setIsStreaming: Dispatch<SetStateAction<boolean>>;
  setMobileView: Dispatch<SetStateAction<"chat" | "artifact">>;
}

export function useAgentStream(params: UseAgentStreamParams) {
  const { setMessages, setArtifact, setTrace, setContext, setIsStreaming, setMobileView } = params;

  function appendAssistantDelta(id: string, delta: string) {
    setMessages((current) =>
      current.map((message) => (message.id === id ? { ...message, content: `${message.content}${delta}` } : message))
    );
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
        setContext((current) => ({ ...current, interview: eventData.artifact as InterviewArtifact }));
      }
      if (eventData.detectedTask) {
        setContext((current) => ({ ...current, lastTask: eventData.detectedTask as import("@/types/agent").TaskType }));
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

  async function runAgent(task: TaskType, userInput: string, nextContext: WorkspaceContext, nextMessages: ChatMessage[]) {
    setIsStreaming(true);
    const assistantId = uid("msg");
    setMessages((current) => [...current, { id: assistantId, role: "assistant", content: "", createdAt: new Date().toISOString() }]);

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
          const line = chunk.split("\n").find((item) => item.startsWith("data:"))?.replace(/^data:\s*/, "");
          if (!line) continue;
          handleStreamEvent(JSON.parse(line) as StreamEvent, assistantId);
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

  return { runAgent };
}
