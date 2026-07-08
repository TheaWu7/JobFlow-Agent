import type { SettingsState } from "@/types/agent";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const settings = (await request.json()) as SettingsState;
  const apiKey = settings.apiKey || process.env.DEEPSEEK_API_KEY;
  const baseUrl = settings.baseUrl || process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

  if (!apiKey) {
    return Response.json({ ok: false, message: "API Key 为空。" });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!response.ok) {
      return Response.json({ ok: false, message: `DeepSeek 返回 ${response.status}，请检查 Key 或 Base URL。` });
    }
    return Response.json({ ok: true, message: "DeepSeek 连接成功。" });
  } catch {
    return Response.json({ ok: false, message: "无法连接 DeepSeek 服务。" });
  }
}
