import type {
  Artifact,
  InterviewArtifact,
  ReviewArtifact,
  TaskType,
  WorkspaceContext
} from "@/types/agent";
import { safeJsonParse, uid } from "@/lib/utils";

export const runtime = "nodejs";

interface ChatRequest {
  task: TaskType;
  input: string;
  context: WorkspaceContext;
  transcript: string;
  demoMode: boolean;
}

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
  const model = process.env.DEEPSEEK_MODEL || "deepseek-chat";

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
        {
          role: "system",
          content: buildSystemPrompt(body.task)
        },
        {
          role: "user",
          content: buildUserPrompt(body)
        }
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
        const visible = accumulated.split(/```json/i)[0];
        if (visible.length > visibleLength) {
          send({ type: "delta", text: visible.slice(visibleLength) });
          visibleLength = visible.length;
        }
      }
    }
  }

  const { artifact: parsedArtifact, detectedTask } = parseModelArtifact(accumulated);
  if (parsedArtifact) {
    send({ type: "trace", label: "结构化 Artifact 解析完成" });
    send({ type: "artifact", artifact: parsedArtifact, detectedTask: detectedTask ?? null });
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

function buildSystemPrompt(task: TaskType) {
  if (task === "unknown") {
    return `你是 InterviewFlow-AI，一个垂直求职场景 Agent。
必须用中文输出。
先做两件事：
1. 判断用户属于哪一类任务：resume_optimize、mock_interview 还是 interview_answer、interview_review、project_deep_dive。
2. 输出 formatJson: {"detectedTask": "任务类型", "artifact": {结构化 Artifact}}
可以按实际上下文选择最合适的任务，但不能编造材料。`;
  }
  return `你是 InterviewFlow-AI，一个垂直求职场景 Agent。
必须用中文输出。你正在执行任务：${task}。
先给用户一段自然、简洁、可流式阅读的说明，然后在最后输出一个 fenced JSON：
\`\`\`json
{"artifact": ...}
\`\`\`
JSON 必须符合任务结构，不能省略 artifact.type 和 artifact.title。
不要编造不存在的经历；如果材料不足，明确指出缺口。`;
}

function buildUserPrompt(body: ChatRequest) {
  return `用户最新输入：
${body.input}

已识别上下文：
JD:
${body.context.jd || "无"}

简历:
${body.context.resume || "无"}

项目:
${body.context.project || "无"}

当前面试:
${body.context.interview ? JSON.stringify(body.context.interview, null, 2) : "无"}

聊天记录:
${body.transcript}

请按任务 ${body.task} 生成结构化 Artifact：
- resume: {type,title,jdSummary:{role,seniority,mustHave,niceToHave},matchScore,strengths,gaps,optimizations:[{section,before,after,reason}]}
- interview: {type,title,currentIndex,status,questions:[{id,question,focus,answer,feedback,followUp}],finalReview?}
- review: {type,title,overallScore,dimensionScores:[{name,score,evidence}],weaknessTags,improvements,practicePlan}
- project: {type,title,star:{situation,task,action,result},pitchScript,followUps:[{question,answerFrame}],riskPoints}`;
}

function parseModelArtifact(raw: string): { artifact: Artifact | null; detectedTask?: string } {
  const parsed = safeJsonParse<{ artifact?: Artifact; detectedTask?: string }>(raw);
  if (parsed?.artifact?.type) {
    return { artifact: parsed.artifact, detectedTask: parsed.detectedTask };
  }
  const direct = safeJsonParse<Artifact>(raw);
  if (direct?.type) {
    return { artifact: direct };
  }
  const nested = safeJsonParse<{ detectedTask?: string; artifact?: Artifact }>(raw);
  if (nested?.artifact?.type) {
    return { artifact: nested.artifact, detectedTask: nested.detectedTask };
  }
  return { artifact: null };
}

function demoMessage(task: TaskType) {
  const messages: Record<TaskType, string> = {
    resume_optimize: "我已完成 JD 与简历的匹配分析，并把可直接替换到简历里的优化句式整理在右侧。",
    mock_interview: "我会基于当前 JD 和简历开始一轮 6 题模拟面试。右侧会同步显示题目、考察点和进度。",
    interview_answer: "收到你的回答。我先给出即时点评，并根据当前题目决定是否进行一次追问。",
    interview_review: "我已读取最近一轮面试记录，正在输出维度评分、短板标签和练习建议。",
    project_deep_dive: "我已把项目材料整理成 STAR 口述脚本，并补充了高频追问和参考作答框架。",
    clarify: "我还需要补齐关键材料，才能继续生成可靠结果。",
    unknown: "我先理解一下你的需求，然后自动选择最合适的任务来生成结果。"
  };
  return messages[task];
}

function demoArtifact(body: ChatRequest): Artifact {
  if (body.task === "mock_interview") {
    return createDemoInterview();
  }
  if (body.task === "interview_answer") {
    return updateDemoInterview(body.context.interview, body.input);
  }
  if (body.task === "interview_review") {
    return createDemoReview();
  }
  if (body.task === "project_deep_dive") {
    return {
      type: "project",
      title: "项目深挖 STAR 脚本",
      star: {
        situation: "业务需要提升候选人从 JD 到面试复盘的准备效率，原流程分散在多个工具中。",
        task: "你负责搭建单入口 Agent 工作台，让用户通过自然语言完成简历优化、模拟面试和复盘。",
        action: "设计统一意图识别、素材校验、SSE 流式输出和动态 Artifact 面板，并沉淀可复用 workflow。",
        result: "MVP 能完整演示求职准备闭环，突出前端 Agent 工程化、状态编排和结构化 AI 输出能力。"
      },
      pitchScript:
        "这个项目本质上不是聊天壳，而是一个单入口 Agent 工作台。我重点解决了三件事：第一，用户只需要自然语言输入，系统自动判断任务和缺失素材；第二，不同业务 workflow 都输出结构化 Artifact，避免 AI 结果散在聊天里；第三，通过 SSE 把模型生成、Trace 和结果面板串成一个可演示的实时体验。",
      followUps: [
        {
          question: "为什么不做多个功能按钮？",
          answerFrame: "强调产品目标是验证 Agent 入口，把业务决策收敛到编排层，而不是让用户理解功能菜单。"
        },
        {
          question: "如何保证 AI 输出稳定渲染？",
          answerFrame: "用明确 JSON schema、服务端解析兜底、Artifact 类型分发和 Demo 模式保障展示稳定性。"
        }
      ],
      riskPoints: ["模型返回 JSON 不稳定时需要兜底", "文件解析质量影响素材识别", "无登录版本只能做本地历史"]
    };
  }
  return {
    type: "resume",
    title: "前端岗位简历匹配优化",
    jdSummary: {
      role: "前端工程师 / AI 应用方向",
      seniority: "1-3 年或校招高潜",
      mustHave: ["React / Next.js", "TypeScript", "流式交互", "业务组件抽象"],
      niceToHave: ["AI Agent 产品经验", "Vercel 部署", "结构化 Prompt 设计"]
    },
    matchScore: 82,
    strengths: ["项目目标与 AI 求职场景高度匹配", "前端工程化链路完整", "可展示 SSE 和动态面板能力"],
    gaps: ["缺少量化指标", "模型异常与降级策略表达不够", "文件解析和隐私边界需要补充"],
    optimizations: [
      {
        section: "项目概述",
        before: "做了一个 AI 面试助手，可以优化简历和模拟面试。",
        after:
          "设计并实现单入口 AI Agent 求职工作台，支持 JD 解析、简历匹配优化、SSE 模拟面试、面试复盘与 STAR 项目打磨，沉淀标准化 workflow 与动态 Artifact 渲染体系。",
        reason: "从功能罗列升级为产品形态、技术路径和结果价值。"
      },
      {
        section: "技术亮点",
        before: "使用 Next.js 和 AI 接口。",
        after:
          "基于 Next.js App Router 封装 DeepSeek SSE 代理层，前端通过事件流同步消息增量、Agent Trace 与结构化 Artifact，避免 API Key 暴露在仓库中。",
        reason: "突出可上线架构和实时交互能力。"
      }
    ]
  };
}

function createDemoInterview(): InterviewArtifact {
  return {
    type: "interview",
    title: "前端 AI Agent 岗位模拟面试",
    currentIndex: 0,
    status: "in_progress",
    questions: [
      { id: uid("q"), question: "你为什么选择单入口 Agent，而不是传统多功能页面？", focus: "产品判断与架构取舍" },
      { id: uid("q"), question: "SSE 在这个项目里解决了什么体验问题？", focus: "实时交互与工程实现" },
      { id: uid("q"), question: "如何让模型输出稳定渲染到右侧 Artifact 面板？", focus: "结构化输出与容错" },
      { id: uid("q"), question: "文件上传后如何进入 Agent 上下文？", focus: "素材管线" },
      { id: uid("q"), question: "Demo 模式和真实模型模式如何共存？", focus: "可演示性与配置设计" },
      { id: uid("q"), question: "如果要扩展到多模型供应商，你会怎么改？", focus: "接口抽象与演进" }
    ]
  };
}

function updateDemoInterview(current: InterviewArtifact | undefined, answer: string): InterviewArtifact {
  const interview = current || createDemoInterview();
  const nextQuestions = interview.questions.map((question, index) => {
    if (index !== interview.currentIndex) return question;
    return {
      ...question,
      answer,
      feedback:
        "回答方向是对的，但建议补充具体工程动作，例如状态机如何推进 workflow、Artifact schema 如何约束模型输出，以及异常时如何降级。",
      followUp: "如果 DeepSeek 返回的 JSON 被截断，你会如何保证右侧面板仍然可用？"
    };
  });
  const nextIndex = interview.currentIndex + 1;
  const completed = nextIndex >= nextQuestions.length;
  return {
    ...interview,
    questions: nextQuestions,
    currentIndex: completed ? nextQuestions.length - 1 : nextIndex,
    status: completed ? "completed" : "in_progress",
    finalReview: completed ? createDemoReview() : interview.finalReview
  };
}

function createDemoReview(): ReviewArtifact {
  return {
    type: "review",
    title: "模拟面试复盘报告",
    overallScore: 78,
    dimensionScores: [
      { name: "项目理解", score: 84, evidence: "能说明业务闭环和单入口产品意图。" },
      { name: "工程细节", score: 76, evidence: "提到了 SSE 和 schema，但异常兜底细节还可展开。" },
      { name: "表达结构", score: 73, evidence: "答案有重点，但 STAR 和因果链还不够稳定。" }
    ],
    weaknessTags: ["异常处理表达不足", "指标量化偏少", "技术取舍可再具体"],
    improvements: ["准备 2 个模型输出失败的降级案例", "把项目收益改写成可量化指标", "每题用背景-动作-结果收束"],
    practicePlan: ["每天复述项目 3 分钟版本", "针对 SSE、Artifact、workflow 各准备一道追问", "录音检查是否有空泛表达"]
  };
}
