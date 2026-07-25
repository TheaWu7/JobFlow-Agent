"use client";

import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/types/agent";
import { Markdown } from "./Markdown";
import styles from "../app/page.module.css";

export function MessageList({
  messages,
  isStreaming,
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
}) {
  return (
    <>
      {messages.map((message) => (
        <div key={message.id} className={cn(styles.messageRow,message.role === "user" ? styles.messageRowUser : styles.messageRowAssistant)}>
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
      ))}
    </>
  );
}
