import { safeJsonParse } from "@/lib/utils";

export const runtime = "nodejs";

interface ClassifyRequest {
  pieces: string[];
}

interface ClassifyResult {
  type: "jd" | "resume" | "project" | "interview" | "unknown";
  text: string;
}

const CLASSIFY_PROMPT = `你是一个文本分类与拆分器。对每段文本做两件事：分类 + 拆分。

类型有五种：
- jd：职位描述、岗位要求
- resume：个人简历、工作经历
- project：项目介绍
- interview：面试对话记录、面试问答
- unknown：都不是

关键规则：
1. 如果一段文本同时包含 JD 和简历（用户粘贴在一起了），必须拆成两条返回，每条带上各自对应的原文内容
2. 拆分时原封不动保留原文，不要改写或总结
3. 标题/关键词权重最高（如"职位描述"→jd，"简历"→resume）
4. 只返回 JSON 数组，不要任何解释

返回格式：
[{"type": "jd", "text": "职位描述\n..."}, {"type": "resume", "text": "# 简历\n..."}]`;

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ClassifyRequest;
    const { pieces } = body;

    if (!pieces?.length) {
      return Response.json({ results: [] });
    }

    const results = await classifyWithLLM(pieces);
    return Response.json({ results });
  } catch (error) {
    return Response.json({ results: [] });
  }
}

async function classifyWithLLM(pieces: string[]): Promise<ClassifyResult[]> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  const baseUrl = process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com";
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-pro";

  if (!apiKey) {
    console.warn("classify: no API key, fallback to regex");
    return [];
  }

  const piecesJson = pieces.map((text) => ({ text }));

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0,
      max_tokens: 4096,
      messages: [
        { role: "system", content: CLASSIFY_PROMPT },
        {
          role: "user",
          content: `请分类并拆分以下 ${pieces.length} 段文本：\n${JSON.stringify(piecesJson, null, 2)}`,
        },
      ],
    }),
  });

  if (!response.ok) {
    console.error("classify: DeepSeek error", response.status);
    return [];
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) return [];

  const arr = safeJsonParse<ClassifyResult[]>(content);

  if (!Array.isArray(arr)) return [];

  return arr.filter((item) => item.type && item.text);
}
