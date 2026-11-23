"use client";

import { useEffect, useRef } from "react";
import { ArtifactPanel } from "@/components/ArtifactPanel";
import { ChatInput } from "@/components/ChatInput";
import { ChatPanelHeader } from "@/components/ChatPanelHeader";
import { MessageList } from "@/components/MessageList";
import { useWorkspace } from "@/components/WorkspaceProvider";
import { cn } from "@/lib/utils";
import styles from "./page.module.css";

export default function WorkspacePage() {
  const {
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
  } = useWorkspace();

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isStreaming]);

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
