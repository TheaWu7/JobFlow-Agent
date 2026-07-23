import type { Artifact, ReviewArtifact, TaskType } from "@/types/agent";
import { uid } from "@/lib/utils";
import type { ChatRequest } from "./types";

export function demoMessage(task: TaskType) {
  return DEMO_MESSAGES[task];
}

export function demoArtifact(body: ChatRequest): Artifact {
  if (body.task === "interview") {
    return {
      type: "interview",
      title: "前端 AI Agent 岗位面试准备",
      jdAnalysis: DEMO_JD_ANALYSIS,
      questions: DEMO_INTERVIEW_QUESTIONS.map((q) => ({ ...q, id: uid("q") })),
    };
  }
  if (body.task === "review") return createDemoReview();
  return DEMO_RESUME_ARTIFACT;
}

// ── Demo Messages ──

const DEMO_MESSAGES: Record<TaskType, string> = {
  resume: "我已完成 JD 与简历的匹配分析，并把可直接替换到简历里的优化句式整理在右侧。",
  interview: "我已分析该 JD 的考察方向，整理了针对性的面试题目和推荐答案，请查看右侧面板。",
  review: "我已读取最近一轮面试记录，正在输出维度评分、短板标签和练习建议。",
  clarify: "我还需要补齐关键材料，才能继续生成可靠结果。",
  unknown: "我先理解一下你的需求，然后自动选择最合适的任务来生成结果。",
};

// ── Demo Interview Questions ──

const DEMO_INTERVIEW_QUESTIONS = [
  {
    question: "你为什么选择单入口 Agent，而不是传统多功能页面？",
    focus: "产品判断与架构取舍",
    answer: "传统多功能页面把每个能力做成独立入口（简历优化点一个按钮、模拟面试点另一个），用户需要先理解系统有哪些功能才能操作。单入口 Agent 把自然语言作为唯一交互界面，用户只需说出需求，系统自动判断任务类型、校验素材、编排 workflow。这种设计的核心价值是降低认知负担——用户不需要学习工具，工具来适应用户。在面试场景下，这个设计尤其重要，因为它本身就是一个产品判断的展示：你如何定义用户问题和解决方案的边界。",
  },
  {
    question: "SSE 在这个项目里解决了什么体验问题？",
    focus: "实时交互与工程实现",
    answer: "SSE 解决了三个体验问题。第一，流式输出让用户看到文字逐字出现，感知到系统在工作，而不是等待一个空白请求。第二，我在 SSE 事件流上拆分了三通道——delta 驱动聊天文本、trace 驱动执行步骤条、artifact 驱动右侧结构化面板——三个通道同时推进互不阻塞。第三，服务端代理模式保护了 API Key 安全，前端完全不接触密钥。相比于 WebSocket，SSE 更简单：单向推送、HTTP 协议原生支持、自动重连，对于这个场景足够用。",
  },
  {
    question: "如何让模型输出稳定渲染到右侧 Artifact 面板？",
    focus: "结构化输出与容错",
    answer: "核心挑战是模型不总是返回合法 JSON，可能被截断、包裹在 markdown 代码块中、或者字段缺失。我做了三层兜底：第一层 `JSON.parse` 直接解析；第二层用正则提取 markdown fenced code block 中的 JSON；第三层花括号匹配截取。在 prompt 层面，system prompt 明确写死了每种 Artifact 的 JSON schema，并强调'不要编造不存在的经历'。即使解析失败，前端也会展示错误卡片而不是白屏，组件层也有 Array.isArray 守卫防止 .map() 崩溃。",
  },
  {
    question: "文件上传后如何进入 Agent 上下文？",
    focus: "素材管线",
    answer: "整个管线分四步：1) 客户端用 pdfjs-dist / mammoth.js 在浏览器侧解析 PDF、Word、文本文件，不需要上传到服务端；2) 解析后的文本进入分类管线——先尝试 `/api/classify` 用小模型分类为 JD/简历/项目，失败则降级为正则启发式匹配；3) 分类后的内容写入 WorkspaceContext（jd / resume / project 字段），同时进入 prompt 上下文；4) Agent 根据任务类型检查素材完整性——缺 JD 或简历就先追问，齐全才发送 API 请求。这样避免了无效的模型调用。",
  },
  {
    question: "Demo 模式和真实模型模式如何共存？",
    focus: "可演示性与配置设计",
    answer: "两种模式共享同一套 SSE 事件格式——delta、trace、artifact、done——前端完全不感知是 demo 还是真实模型。区别在 API route 层：demo 模式直接返回预制的样例行数据，真实模式走 DeepSeek SSE。切换通过 Settings 面板控制，状态持久化到 localStorage。这样面试演示时不需要配 API Key 和网络，打开就能跑完整流程。Demo 数据也尽量真实，包含 JD 摘要、匹配度分数、Before/After 对比，能充分展示产品能力。",
  },
  {
    question: "如果要扩展到多模型供应商，你会怎么改？",
    focus: "接口抽象与演进",
    answer: "我会在 API route 层引入 provider adapter 模式。定义统一的 `ModelProvider` 接口：`{ stream(req: ChatRequest): AsyncIterable<StreamEvent> }`，然后 DeepSeek、OpenAI、Claude 各自实现这个接口。选择逻辑通过环境变量 + 前端 Settings 控制。前端 SSE 事件格式保持不变，所有适配器的输出统一为 delta / trace / artifact / done / error。还有一个关键点是 prompt 兼容——不同模型对 system prompt 和 JSON 输出的服从度不同，需要在 adapter 层做 prompt 模板化和输出后处理。",
  },
];

const DEMO_JD_ANALYSIS = {
  summary:
    "该岗位核心考察三个方向：React 组件化与状态管理的深度理解、前端工程化工具链的实操经验（Vite/pnpm/Monorepo），以及移动端 H5 性能优化与稳定性监控能力。面试中会重点关注候选人是否能用具体项目案例证明自己在这些方向上的思考深度。",
  examPoints: [
    "React 组件化 & Hooks",
    "TypeScript 类型系统",
    "前端工程化工具链",
    "SSE 流式交互",
    "移动端 H5 适配",
    "性能优化 & 监控",
    "结构化 Prompt 设计",
    "接口抽象 & 扩展性",
  ],
};

function createDemoReview(): ReviewArtifact {
  return DEMO_REVIEW_ARTIFACT;
}

// ── Demo Artifacts ──

const DEMO_RESUME_ARTIFACT: Artifact = {
  type: "resume",
  title: "前端岗位简历匹配优化",
  jdSummary: {
    role: "前端工程师 / AI 应用方向",
    seniority: "1-3 年或校招高潜",
    mustHave: ["React / Next.js", "TypeScript", "流式交互", "业务组件抽象"],
    niceToHave: ["AI Agent 产品经验", "Vercel 部署", "结构化 Prompt 设计"],
  },
  matchScore: 82,
  strengths: ["项目目标与 AI 求职场景高度匹配", "前端工程化链路完整", "可展示 SSE 和动态面板能力"],
  gaps: ["缺少量化指标", "模型异常与降级策略表达不够", "文件解析和隐私边界需要补充"],
  optimizations: [
    {
      section: "项目概述",
      before: "做了一个 AI 面试助手，可以优化简历和模拟面试。",
      after: "设计并实现单入口 AI Agent 求职工作台，支持 JD 解析、简历匹配优化、SSE 模拟面试、面试复盘与 STAR 项目打磨，沉淀标准化 workflow 与动态 Artifact 渲染体系。",
      reason: "从功能罗列升级为产品形态、技术路径和结果价值。",
    },
    {
      section: "技术亮点",
      before: "使用 Next.js 和 AI 接口。",
      after: "基于 Next.js App Router 封装 DeepSeek SSE 代理层，前端通过事件流同步消息增量、Agent Trace 与结构化 Artifact，避免 API Key 暴露在仓库中。",
      reason: "突出可上线架构和实时交互能力。",
    },
  ],
};

const DEMO_REVIEW_ARTIFACT: ReviewArtifact = {
  type: "review",
  title: "面试复盘报告",
  overallScore: 78,
  dimensionScores: [
    { name: "项目理解", score: 84, evidence: "能说明业务闭环和单入口产品意图。" },
    { name: "工程细节", score: 76, evidence: "提到了 SSE 和 schema，但异常兜底细节还可展开。" },
    { name: "表达结构", score: 73, evidence: "答案有重点，但 STAR 和因果链还不够稳定。" },
  ],
  weaknessTags: ["异常处理表达不足", "指标量化偏少", "技术取舍可再具体"],
  improvements: ["准备 2 个模型输出失败的降级案例", "把项目收益改写成可量化指标", "每题用背景-动作-结果收束"],
  practicePlan: ["每天复述项目 3 分钟版本", "针对 SSE、Artifact、workflow 各准备一道追问", "录音检查是否有空泛表达"],
};

