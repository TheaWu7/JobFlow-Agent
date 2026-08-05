import { useCallback, useEffect, useRef } from "react";
import type { ChatMessage } from "@/types/agent";

/**
 * 打字机效果 hook — 逐字追加文本到指定消息，模拟流式输出。
 * 非 LLM 回复（追问、错误提示）使用此 hook 避免瞬间出现整段文字。
 */
export function useTypewriter(
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>
) {
  const ref = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTypewriter = useCallback(() => {
    if (ref.current !== null) {
      clearTimeout(ref.current);
      ref.current = null;
    }
  }, []);

  const runTypewriter = useCallback(
    (id: string, text: string) => {
      clearTypewriter();
      let index = 0;
      const tick = () => {
        if (index >= text.length) {
          ref.current = null;
          return;
        }
        const char = text[index];
        setMessages((current) =>
          current.map((msg) =>
            msg.id === id ? { ...msg, content: msg.content + char } : msg
          )
        );
        index++;
        ref.current = setTimeout(tick, 18);
      };
      tick();
    },
    [setMessages, clearTypewriter]
  );

  useEffect(() => {
    return () => clearTypewriter();
  }, [clearTypewriter]);

  return { runTypewriter, clearTypewriter } as const;
}
