"use client";

import { FormEvent } from "react";
import { Loader2, Paperclip, Send, UploadCloud } from "lucide-react";
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
}: {
  attachments: UploadedAttachment[];
  isStreaming: boolean;
  isReadingFiles: boolean;
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
  onFileChange: (files: FileList | null) => void;
}) {
  return (
    <form onSubmit={onSubmit} className={styles.inputForm}>
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
            onChange={(event) => onFileChange(event.target.files)}
          />
        </label>
        <textarea
          className={styles.textarea}
          placeholder="例如：帮我针对这个前端 JD 优化简历，然后粘贴 JD 和简历内容..."
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
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
  );
}
