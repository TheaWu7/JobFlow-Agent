import { FormEvent } from "react";
import { Loader2, Paperclip, Send, UploadCloud } from "lucide-react";
import type { UploadedAttachment } from "@/types/agent";
import { AttachmentPreview } from "./AttachmentPreview";

interface InputAreaProps {
  input: string;
  setInput: (v: string) => void;
  attachments: UploadedAttachment[];
  isStreaming: boolean;
  isReadingFiles: boolean;
  handleFileChange: (files: FileList | null) => void;
  handleSubmit: (e: FormEvent) => void;
}

export function InputArea({ input, setInput, attachments, isStreaming, isReadingFiles, handleFileChange, handleSubmit }: InputAreaProps) {
  return (
    <form onSubmit={handleSubmit} className="border-t border-line p-4">
      <AttachmentPreview attachments={attachments} />
      <div className="flex items-end gap-2">
        <label className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-md border border-line bg-panel text-muted hover:text-ink" title="上传素材">
          {isReadingFiles ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
          <input
            className="hidden"
            type="file"
            multiple
            accept=".txt,.md,.pdf,.docx"
            onChange={(event) => handleFileChange(event.target.files)}
          />
        </label>
        <textarea
          className="max-h-36 min-h-11 flex-1 resize-none rounded-md border border-line bg-white px-3 py-2 text-sm outline-none focus:border-brand"
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
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-brand text-white hover:bg-brand/90 disabled:cursor-not-allowed disabled:bg-muted"
          type="submit"
          disabled={isStreaming || isReadingFiles}
          title="发送"
        >
          {isStreaming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        </button>
      </div>
      <div className="mt-2 flex items-center gap-2 text-xs text-muted">
        <UploadCloud className="h-3.5 w-3.5" />
        支持 txt、md、pdf、docx；业务任务仍由聊天内容触发。
      </div>
    </form>
  );
}
