"use client";

import type {
  AgentDecision,
  AgentTraceStep,
  ChatMessage,
  TaskType,
  UploadedAttachment,
  WorkspaceContext
} from "@/types/agent";
import { uid } from "@/lib/utils";

const taskPatterns: Array<{ task: TaskType; tests: RegExp[] }> = [
  {
    task: "resume",
    tests: [/简历.*(优化|定制|匹配|修改)/, /JD.*简历/, /resume|cv/i]
  },
  {
    task: "interview",
    tests: [/(模拟|开始|来).*面试/, /面试准备/, /mock interview/i]
  },
  {
    task: "review",
    tests: [/(复盘|总结|分析).*面试/, /面试.*(复盘|总结|分析)/, /(短板|评分|改进)/, /面试.*(记录|对话|过程)/]
  }
];

export function createTrace(decision: AgentDecision): AgentTraceStep[] {
  return [
    { id: uid("trace"), label: "识别用户意图", status: "done" },
    {
      id: uid("trace"),
      label: `进入 ${taskLabel(decision.task)} workflow`,
      status: decision.task === "clarify" ? "pending" : "done"
    },
    {
      id: uid("trace"),
      label: decision.missing.length ? "发现缺失素材，准备追问" : "素材校验通过",
      status: decision.missing.length ? "running" : "done"
    },
    {
      id: uid("trace"),
      label: decision.missing.length ? "等待用户补充上下文" : "生成结构化 Artifact",
      status: decision.missing.length ? "pending" : "running"
    }
  ];
}

export function decideTask(
  input: string,
  context: WorkspaceContext
): AgentDecision {
  const matched = taskPatterns.find((item) => item.tests.some((test) => test.test(input)));
  const task = matched?.task ?? inferTaskFromContext(input);
  const missing = missingMaterials(task, context);

  return {
    task: missing.length ? "clarify" : task,
    intendedTask: task,
    missing,
    userPrompt: input
  };
}

export function mergeContextFromInput(
  previous: WorkspaceContext,
  input: string,
  attachments: UploadedAttachment[],
  classified?: Array<{ type: "jd" | "resume" | "project" | "interview" | "unknown"; text: string }>
): WorkspaceContext {
  const next = { ...previous };

  if (classified?.length) {
    for (const item of classified) {
      if (!item.text || !isSubstantialContent(item.text)) continue;
      if (item.type === "jd") {
        next.jd = item.text;
      } else if (item.type === "resume") {
        next.resume = item.text;
      } else if (item.type === "project") {
        next.project = item.text;
      } else if (item.type === "interview") {
        next.interview = item.text;
      }
      // unknown: skip
    }
    return next;
  }

  // fallback: regex heuristics
  const pieces = [input, ...attachments.map((item) => item.text)].filter(Boolean);
  const combined = pieces.join("\n\n");
  if (looksLikeJd(combined)) {
    next.jd = combined;
  }
  if (looksLikeResume(combined)) {
    next.resume = combined;
  }
  if (looksLikeProject(combined)) {
    next.project = combined;
  }
  return next;
}

export function buildClarifyMessage(missing: AgentDecision["missing"], task: TaskType) {
  if (!missing.length) {
    return "我可以继续处理，但还不清楚你想做哪一种任务。你可以直接说：帮我优化简历、开始面试准备、复盘刚才的面试。";
  }
  const names = missing.map(materialLabel).join("、");
  const taskName = taskLabel(task);
  return `我可以继续处理 ${taskName}，但还缺少 ${names}。请直接把相关内容粘贴到聊天里，或通过附件补充，我会自动接上当前任务。`;
}

export function materialLabel(item: AgentDecision["missing"][number]) {
  const labels = {
    jd: "目标 JD",
    resume: "简历内容",
    interview: "完整面试记录"
  };
  return labels[item];
}

export function taskLabel(task: TaskType) {
  const labels: Record<TaskType, string> = {
    resume: "简历定制优化",
    interview: "面试准备",
    review: "面试智能复盘",
    clarify: "上下文补全",
    unknown: "自动识别任务类型"
  };
  return labels[task];
}

export function messagesToTranscript(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "用户" : "Agent"}：${message.content}`)
    .join("\n");
}

function inferTaskFromContext(input: string): TaskType {
  if (/(开始|模拟|准备|来).*面试|面试准备|mock interview/i.test(input)) {
    return "interview";
  }
  if (/复盘/.test(input)) {
    return "review";
  }
  if (/JD|岗位|职位|简历|resume|cv/i.test(input)) {
    return "resume";
  }
  return "clarify";
}

function missingMaterials(task: TaskType, context: WorkspaceContext) {
  if (task === "resume") {
    return [
      !isSubstantialContent(context.jd) && "jd",
      !isSubstantialContent(context.resume) && "resume"
    ].filter(Boolean) as Array<"jd" | "resume">;
  }
  if (task === "interview") {
    return [
      !isSubstantialContent(context.jd) && "jd",
      !isSubstantialContent(context.resume) && "resume"
    ].filter(Boolean) as Array<"jd" | "resume">;
  }
  return [];
}

function isSubstantialContent(text: string | undefined, minLength = 20): boolean {
  if (!text) return false;
  const trimmed = text.trim();
  if (trimmed.length < minLength) return false;
  // 排除纯标题：仅由标题关键词 + 可选标点组成
  const titleOnlyRE =
    /^(目标\s*JD|JD|职位描述|岗位要求|任职要求|个人?简历|简历内容|项目介绍|项目背景|面试记录)[，,。.\s]*$/i;
  if (titleOnlyRE.test(trimmed)) return false;
  return true;
}

/**
 * 判断输入文本是否"可能包含求职素材"（JD/简历/项目/面试记录）。
 * 规则：有附件或输入 ≥ 50 字才触发 classify，闲聊短消息直接跳过。
 */
export function mightContainMaterial(input: string, hasAttachments: boolean): boolean {
  if (hasAttachments) return true;
  return input.trim().length >= 50;
}

/**
 * 本地正则分类 — 当能高置信度判断时返回结果，否则返回 null 交由 LLM 处理。
 * 用于避免对简单输入（如纯 JD 文本）发起不必要的 LLM API 调用。
 */
export function classifyByRegex(
  text: string
): { type: "jd" | "resume" | "project" | "interview" | "unknown"; text: string } | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const isJd = looksLikeJd(trimmed);
  const isResume = looksLikeResume(trimmed);
  const isProject = looksLikeProject(trimmed);
  const isInterview =
    /(面试官|候选人|Q\d*[：:]|A\d*[：:]|问答环节|面试.*问题|面试.*(记录|对话|过程))/i.test(trimmed);

  // 仅命中一种类型 → 高置信度，直接返回
  const matches = [isJd, isResume, isProject, isInterview].filter(Boolean);
  if (matches.length === 1) {
    if (isJd) return { type: "jd", text: trimmed };
    if (isResume) return { type: "resume", text: trimmed };
    if (isProject) return { type: "project", text: trimmed };
    if (isInterview) return { type: "interview", text: trimmed };
  }

  // 零或多命中 → 内容模糊或混合，交由 LLM 分类+拆分
  return null;
}

function looksLikeNewTask(input: string) {
  return taskPatterns.some((item) => item.tests.some((test) => test.test(input)));
}

function looksLikeJd(text: string) {
  if (/(岗位职责|任职要求|职位描述|JD|job description|requirements|responsibilities)/i.test(text)) return true;
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 3 || lines.length > 60) return false;
  const colonLines = lines.filter((l) => /[:：]/.test(l)).length;
  const hasNumericRequirements = /[0-9]+(年|年以上|months|day)/i.test(text);
  const hasSkills = /(熟练|精通|熟悉|掌握|react|vue|node|python|java|html|css)/i.test(text);
  return (colonLines > 2 && hasSkills) || (hasNumericRequirements && colonLines > 1);
}

function looksLikeResume(text: string) {
  if (/(教育经历|工作经历|项目经历|专业技能|个人简历|resume|curriculum vitae|experience)/i.test(text)) return true;
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 5) return false;
  const hasTime = /(20[0-9]{2}[\s.-]*年|[0-9]{4}\s*[-~]\s*[0-9]{4}|至今|present|现在)/i.test(text);
  const hasJobTitle = /(工程师|经理|主管|负责|协调|参与|实习|助理|intern|developer|engineer)/i.test(text);
  return hasTime && hasJobTitle;
}

function looksLikeProject(text: string) {
  if (/(项目背景|技术栈|项目职责|项目成果|STAR|负责.*项目|项目经历)/i.test(text)) return true;
  const lines = text.split('\n').filter(Boolean);
  if (lines.length < 3) return false;
  const hasTech = /(react|vue|next|node|python|java|数据库|架构|前端|后端|全栈)/i.test(text);
  const hasAction = /(负责|搭建|设计|开发|优化|实现|重构|主导|参与|独立)/i.test(text);
  return hasTech && hasAction;
}
