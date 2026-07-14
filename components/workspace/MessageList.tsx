import type { RefObject } from "react";
import type { ChatMessage } from "@/types/agent";
import { MessageBubble } from "./MessageBubble";

export function MessageList({
  messages,
  isStreaming,
  scrollRef
}: {
  messages: ChatMessage[];
  isStreaming: boolean;
  scrollRef: RefObject<HTMLDivElement>;
}) {
  return (
    <div ref={scrollRef} className="h-[46vh] space-y-3 overflow-y-auto p-4 lg:flex-1">
      {messages.map((message) => (
        <MessageBubble key={message.id} message={message} isStreaming={isStreaming} />
      ))}
    </div>
  );
}
