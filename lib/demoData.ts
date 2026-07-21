import type {
  Artifact,
  InterviewArtifact,
  ReviewArtifact,
  TaskType,
} from "@/types/agent";
import { uid } from "@/lib/utils";
import type { ChatRequest } from "./types";

export function demoMessage(task: TaskType) {
  return DEMO_MESSAGES[task];
}

export function demoArtifact(body: ChatRequest): Artifact {
  if (body.task === "mock_interview") return createDemoInterview();
  if (body.task === "interview_answer") return updateDemoInterview(body.context.interview, body.input);
  if (body.task === "interview_review") return createDemoReview();
  if (body.task === "project_deep_dive") return DEMO_PROJECT_ARTIFACT;
  return DEMO_RESUME_ARTIFACT;
}

function createDemoInterview(): InterviewArtifact {
  return {
    type: "interview",
    title: "前端 AI Agent 岗位模拟面试",
    currentIndex: 0,
    status: "in_progress",
    questions: DEMO_INTERVIEW_QUESTIONS.map((q) => ({ ...q, id: uid("q") })),
  };
}

function updateDemoInterview(
  current: InterviewArtifact | undefined,
  answer: string
): InterviewArtifact {
  const interview = current || createDemoInterview();
  const nextQuestions = interview.questions.map((question, index) => {
    if (index !== interview.currentIndex) return question;
    return {
      ...question,
      answer,
      feedback: DEMO_ANSWER_FEEDBACK,
      followUp: DEMO_ANSWER_FOLLOW_UP,
    };
  });
  const nextIndex = interview.currentIndex + 1;
  const completed = nextIndex >= nextQuestions.length;
  return {
    ...interview,
    questions: nextQuestions,
    currentIndex: completed ? nextQuestions.length - 1 : nextIndex,
    status: completed ? "completed" : "in_progress",
    finalReview: completed ? createDemoReview() : interview.finalReview,
  };
}

function createDemoReview(): ReviewArtifact {
  return DEMO_REVIEW_ARTIFACT;
}

// ── Demo Messages ──

const DEMO_MESSAGES: Record<TaskType, string> = {
  resume_optimize: "我已完成 JD 与简历的匹配分析，并把可直接替换到简历里的优化句式整理在右侧。",
  mock_interview: "我会基于当前 JD 和简历开始一轮 6 题模拟面试。右侧会同步显示题目、考察点和进度。",
  interview_answer: "收到你的回答。我先给出即时点评，并根据当前题目决定是否进行一次追问。",
  interview_review: "我已读取最近一轮面试记录，正在输出维度评分、短板标签和练习建议。",
  project_deep_dive: "我已把项目材料整理成 STAR 口述脚本，并补充了高频追问和参考作答框架。",
  clarify: "我还需要补齐关键材料，才能继续生成可靠结果。",
  unknown: "我先理解一下你的需求，然后自动选择最合适的任务来生成结果。",
};

// ── Demo Interview Questions ──

const DEMO_INTERVIEW_QUESTIONS = [
  { question: "你为什么选择单入口 Agent，而不是传统多功能页面？", focus: "产品判断与架构取舍" },
  { question: "SSE 在这个项目里解决了什么体验问题？", focus: "实时交互与工程实现" },
  { question: "如何让模型输出稳定渲染到右侧 Artifact 面板？", focus: "结构化输出与容错" },
  { question: "文件上传后如何进入 Agent 上下文？", focus: "素材管线" },
  { question: "Demo 模式和真实模型模式如何共存？", focus: "可演示性与配置设计" },
  { question: "如果要扩展到多模型供应商，你会怎么改？", focus: "接口抽象与演进" },
];

const DEMO_ANSWER_FEEDBACK =
  "回答方向是对的，但建议补充具体工程动作，例如状态机如何推进 workflow、Artifact schema 如何约束模型输出，以及异常时如何降级。";

const DEMO_ANSWER_FOLLOW_UP =
  "如果 DeepSeek 返回的 JSON 被截断，你会如何保证右侧面板仍然可用？";

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
  title: "模拟面试复盘报告",
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

const DEMO_PROJECT_ARTIFACT: Artifact = {
  type: "project",
  title: "项目深挖 STAR 脚本",
  star: {
    situation: "业务需要提升候选人从 JD 到面试复盘的准备效率，原流程分散在多个工具中。",
    task: "你负责搭建单入口 Agent 工作台，让用户通过自然语言完成简历优化、模拟面试和复盘。",
    action: "设计统一意图识别、素材校验、SSE 流式输出和动态 Artifact 面板，并沉淀可复用 workflow。",
    result: "MVP 能完整演示求职准备闭环，突出前端 Agent 工程化、状态编排和结构化 AI 输出能力。",
  },
  pitchScript:
    "这个项目本质上不是聊天壳，而是一个单入口 Agent 工作台。我重点解决了三件事：第一，用户只需要自然语言输入，系统自动判断任务和缺失素材；第二，不同业务 workflow 都输出结构化 Artifact，避免 AI 结果散在聊天里；第三，通过 SSE 把模型生成、Trace 和结果面板串成一个可演示的实时体验。",
  followUps: [
    {
      question: "为什么不做多个功能按钮？",
      answerFrame: "强调产品目标是验证 Agent 入口，把业务决策收敛到编排层，而不是让用户理解功能菜单。",
    },
    {
      question: "如何保证 AI 输出稳定渲染？",
      answerFrame: "用明确 JSON schema、服务端解析兜底、Artifact 类型分发和 Demo 模式保障展示稳定性。",
    },
  ],
  riskPoints: ["模型返回 JSON 不稳定时需要兜底", "文件解析质量影响素材识别", "无登录版本只能做本地历史"],
};
