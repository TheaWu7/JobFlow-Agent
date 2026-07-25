"use client";

import { cn } from "@/lib/utils";
import type { AgentTraceStep, ChatMessage } from "@/types/agent";
import { Markdown } from "./Markdown";
import { TraceList } from "./TraceList";
import styles from "../app/page.module.css";

export function MessageList({
  messages,
  isStreaming,
  trace,
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
  trace: AgentTraceStep[];
}) {
  const lastIndex = messages.length - 1;

  return (
    <>
      {messages.map((message, i) => {
        const isLastAssistant = i === lastIndex && message.role === "assistant" && trace.length > 0;
        const isEmptyStreamingBubble = isLastAssistant && !message.content;
        return (
          <div key={message.id}>
            {isLastAssistant && <TraceList trace={trace} />}
            {!isEmptyStreamingBubble && (
            <div className={cn(styles.messageRow, message.role === "user" ? styles.messageRowUser : styles.messageRowAssistant)}>
              <div
                className={cn(
                  styles.messageBubble,
                  message.role === "user" ? styles.messageBubbleUser : styles.messageBubbleAssistant
                )}
              >
                <div className={styles.messageText}>
                  <Markdown>{message.content || (isStreaming ? " " : "")}</Markdown>
                </div>
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
            )}
          </div>
        );
      })}
    </>
  );
}
