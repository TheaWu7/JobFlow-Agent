import type { Artifact } from "@/types/agent";
import { safeJsonParse } from "@/lib/utils";
import { buildSystemPrompt, buildUserPrompt } from "@/lib/prompts";
import { demoMessage, demoArtifact } from "@/lib/demoData";
import type { ChatRequest } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as ChatRequest;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload: unknown) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        send({ type: "trace", label: "API 已接收任务，开始编排模型请求" });
        if (body.demoMode) {
          await streamDemo(body, send);
        } else {
          await streamDeepSeek(body, send);
        }
        send({ type: "done" });
      } catch (error) {
        send({
          type: "error",
          message: error instanceof Error ? error.message : "模型服务调用失败"
        });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive"
    }
  });
}

async function streamDeepSeek(body: ChatRequest, send: (payload: unknown) => void) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";

  if (!apiKey) {
    throw new Error("服务端未配置 DeepSeek API Key。请在 `.env.local` 或 Vercel Environment Variables 中设置。");
  }

  send({ type: "trace", label: "连接 DeepSeek，使用 SSE 流式生成" });
  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model,
      stream: true,
      temperature: 0.35,
      messages: [
        { role: "system", content: buildSystemPrompt(body.task) },
        { role: "user", content: buildUserPrompt(body) }
      ]
    })
  });

  if (!response.ok || !response.body) {
    const message = await response.text();
    throw new Error(message || `DeepSeek 请求失败：${response.status}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let accumulated = "";
  let visibleLength = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const line = part
        .split("\n")
        .find((item) => item.startsWith("data:"))
        ?.replace(/^data:\s*/, "");
      if (!line || line === "[DONE]") continue;
      const parsed = safeJsonParse<{ choices?: Array<{ delta?: { content?: string } }> }>(line);
      const delta = parsed?.choices?.[0]?.delta?.content;
      if (delta) {
        accumulated += delta;
        const visible = accumulated.split(/\n```/)[0];
        if (visible.length > visibleLength) {
          send({ type: "delta", text: visible.slice(visibleLength) });
          visibleLength = visible.length;
        }
      }
    }
  }

  const parsedArtifact = parseModelArtifact(accumulated);
  if (parsedArtifact) {
    send({ type: "trace", label: "结构化 Artifact 解析完成" });
    send({ type: "artifact", artifact: parsedArtifact });
  } else {
    send({ type: "trace", label: "模型未返回标准 JSON，已保留聊天文本" });
  }
}

async function streamDemo(body: ChatRequest, send: (payload: unknown) => void) {
  send({ type: "trace", label: "Demo 模式启用，使用内置求职样例生成" });
  const text = demoMessage(body.task);
  for (const char of text) {
    send({ type: "delta", text: char });
    await new Promise((resolve) => setTimeout(resolve, 8));
  }
  send({ type: "trace", label: "Demo Artifact 生成完成" });
  send({ type: "artifact", artifact: demoArtifact(body) });
}

function parseModelArtifact(raw: string): Artifact | null {
  const parsed = safeJsonParse<{ artifact?: Artifact }>(raw);
  if (parsed?.artifact?.type) {
    return parsed.artifact;
  }
  const direct = safeJsonParse<Artifact>(raw);
  if (direct?.type) {
    return direct;
  }
  return null;
}
