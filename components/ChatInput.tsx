"use client";

import { FormEvent } from "react";
import { Loader2, Paperclip, Send, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { UploadedAttachment } from "@/types/agent";
import styles from "../app/page.module.css";

export function ChatInput({
  attachments,
  isStreaming,
  isReadingFiles,
  input,
  onInputChange,
  onSubmit,
  onFileChange,
  onRemoveAttachment
}: {
  attachments: UploadedAttachment[];
  isStreaming: boolean;
  isReadingFiles: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFileChange: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
}) {
  return (
    <form onSubmit={onSubmit} className={styles.inputForm}>
      {attachments.length > 0 && (
        <div className={styles.attachmentPreview}>
          {attachments.map((file) => (
            <span key={file.id} className={cn(styles.attachmentChip, file.status === "ready" ? styles.attachmentChipReady : styles.attachmentChipError)}>
              {file.name}
              <button
                type="button"
                className={styles.attachmentRemove}
                onClick={() => onRemoveAttachment(file.id)}
                title="移除附件"
              >
                <X size={14} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className={styles.inputRow}>
        <textarea
          className={styles.textarea}
          placeholder="发送消息"
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              event.currentTarget.form?.requestSubmit();
            }
          }}
        />
        <div className={styles.inputActions}>
          <label className={styles.fileUploadButton} title="上传素材">
            {isReadingFiles ? <Loader2 size={18} className="animate-spin" /> : <Paperclip size={18} />}
            <input
              className={styles.fileInput}
              type="file"
              multiple
              accept=".txt,.md,.pdf,.docx"
              onChange={(event) => {
                onFileChange(event.target.files);
                event.target.value = "";
              }}
            />
          </label>
          <button
            className={styles.sendButton}
            type="submit"
            disabled={isStreaming || isReadingFiles || (!input.trim() && attachments.length === 0)}
            title="发送"
          >
            {isStreaming ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
      </div>
    </form>
  );
}
