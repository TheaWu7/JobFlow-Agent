"use client";

import { FormEvent } from "react";
import { ArtifactPanel } from "@/components/artifact/ArtifactPanel";
import { ChatHeader } from "@/components/workspace/ChatHeader";
import { MessageList } from "@/components/workspace/MessageList";
import { TraceList } from "@/components/workspace/TraceList";
import { InputArea } from "@/components/workspace/InputArea";
import { MobileTabs } from "@/components/workspace/MobileTabs";
import {
  buildClarifyMessage,
  createTrace,
  decideTask,
  materialLabel,
  mergeContextFromInput,
  taskLabel
} from "@/lib/agent";
import { uid } from "@/lib/utils";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/hooks/useWorkspace";
import { useAgentStream } from "@/hooks/useAgentStream";
import type { ChatMessage, ClarifyArtifact } from "@/types/agent";

export default function WorkspacePage() {
  const ws = useWorkspace();
  const { runAgent } = useAgentStream({
    setMessages: ws.setMessages,
    setArtifact: ws.setArtifact,
    setTrace: ws.setTrace,
    setContext: ws.setContext,
    setIsStreaming: ws.setIsStreaming,
    setMobileView: ws.setMobileView,
  });

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (ws.isStreaming) return;
    const trimmed = ws.input.trim();
    if (!trimmed && ws.readyAttachments.length === 0) return;

    const userMessage: ChatMessage = {
      id: uid("msg"),
      role: "user",
      content: trimmed || "我上传了新的求职材料，请读取并继续当前任务。",
      attachments: ws.attachments,
      createdAt: new Date().toISOString()
    };
    const nextMessages = [...ws.messages, userMessage];
    ws.setMessages(nextMessages);
    ws.setInput("");
    ws.setAttachments([]);

    const mergedContext = mergeContextFromInput(ws.context, trimmed, ws.readyAttachments);
    if (ws.artifact?.type === "interview") {
      mergedContext.interview = ws.artifact;
    }
    ws.setContext(mergedContext);

    const effectiveInput = ws.pendingTask ? `${taskLabel(ws.pendingTask)}\n${trimmed}` : trimmed;
    const decision = decideTask(effectiveInput, mergedContext, ws.activeInterview);
    ws.setTrace(createTrace(decision));

    if (decision.task === "clarify") {
      const message = buildClarifyMessage(decision.missing, decision.intendedTask);
      const clarifyArtifact: ClarifyArtifact = {
        type: "clarify",
        title: "需要补充素材",
        missing: decision.missing.length ? decision.missing.map(materialLabel) : ["任务类型未指明"],
        nextQuestion: message
      };
      ws.setArtifact(clarifyArtifact);
      ws.setPendingTask(decision.intendedTask);
      ws.setMessages((current) => [...current, { id: uid("msg"), role: "assistant", content: message, createdAt: new Date().toISOString() }]);
      return;
    }

    ws.setArtifact(null);
    ws.setPendingTask(null);
    await runAgent(decision.task, trimmed || effectiveInput, mergedContext, nextMessages);
  }

  return (
    <main className="mx-auto grid max-w-7xl gap-4 px-4 py-4 sm:px-6 lg:grid-cols-[minmax(360px,0.92fr)_minmax(520px,1.08fr)]">
      <MobileTabs view={ws.mobileView} onChange={ws.setMobileView} />
      <section className={cn("min-h-[calc(100vh-6rem)] rounded-lg border border-line bg-white shadow-soft lg:flex lg:flex-col", ws.mobileView === "artifact" && "hidden lg:flex")}>
        <ChatHeader />
        <MessageList messages={ws.messages} isStreaming={ws.isStreaming} scrollRef={ws.scrollRef} />
        <TraceList trace={ws.trace} />
        <InputArea
          input={ws.input}
          setInput={ws.setInput}
          attachments={ws.attachments}
          isStreaming={ws.isStreaming}
          isReadingFiles={ws.isReadingFiles}
          handleFileChange={ws.handleFileChange}
          handleSubmit={handleSubmit}
        />
      </section>
      <aside className={cn("min-h-[calc(100vh-6rem)] overflow-y-auto lg:block", ws.mobileView === "chat" && "hidden lg:block")}>
        <ArtifactPanel artifact={ws.artifact} />
      </aside>
    </main>
  );
}
