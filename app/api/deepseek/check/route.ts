export const runtime = "nodejs";

export async function POST(request: Request) {
  void request;
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";

  if (!apiKey) {
    return Response.json({ ok: false, message: "服务端未配置 DeepSeek API Key，请检查 `.env.local` 或 Vercel Environment Variables。" });
  }

  try {
    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      headers: {
        Authorization: `Bearer ${apiKey}`
      }
    });
    if (!response.ok) {
      return Response.json({ ok: false, message: `DeepSeek 返回 ${response.status}，请检查服务端环境变量是否正确。` });
    }
    return Response.json({ ok: true, message: "DeepSeek 连接成功。" });
  } catch {
    return Response.json({ ok: false, message: "无法连接 DeepSeek 服务。" });
  }
}
