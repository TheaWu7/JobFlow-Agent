"use client";

import type {
  AgentDecision,
  AgentTraceStep,
  ArtifactType,
  ChatMessage,
  TaskType,
  UploadedAttachment,
  WorkspaceContext
} from "@/types/agent";
import { uid } from "@/lib/utils";

const taskPatterns: Array<{ task: TaskType; artifactType: ArtifactType; tests: RegExp[] }> = [
  {
    task: "resume_optimize",
    artifactType: "resume",
    tests: [/简历.*(优化|定制|匹配|修改)/, /JD.*简历/, /resume|cv/i]
  },
  {
    task: "mock_interview",
    artifactType: "interview",
    tests: [/(模拟|开始|来).*面试/, /mock interview/i]
  },
  {
    task: "interview_review",
    artifactType: "review",
    tests: [/(复盘|总结|分析).*面试/, /(短板|评分|改进)/]
  },
  {
    task: "project_deep_dive",
    artifactType: "project",
    tests: [/(项目).*(深挖|打磨|STAR|追问|口述)/i, /STAR/i]
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
  context: WorkspaceContext,
  activeInterview: boolean
): AgentDecision {
  if (activeInterview && input.trim() && !looksLikeNewTask(input)) {
    return {
      task: "interview_answer",
      intendedTask: "interview_answer",
      artifactType: "interview",
      missing: [],
      userPrompt: input
    };
  }

  const matched = taskPatterns.find((item) => item.tests.some((test) => test.test(input)));
  const task = matched?.task ?? inferTaskFromContext(input);
  const artifactType = matched?.artifactType ?? artifactTypeForTask(task);
  const missing = missingMaterials(task, context);

  return {
    task: missing.length ? "clarify" : task,
    intendedTask: task,
    artifactType: missing.length ? "clarify" : artifactType,
    missing,
    userPrompt: input
  };
}

export function mergeContextFromInput(
  previous: WorkspaceContext,
  input: string,
  attachments: UploadedAttachment[]
): WorkspaceContext {
  const combined = [input, ...attachments.map((item) => item.text)].join("\n\n");
  const next = { ...previous };
  if (looksLikeJd(combined)) {
    next.jd = selectLonger(next.jd, combined);
  }
  if (looksLikeResume(combined)) {
    next.resume = selectLonger(next.resume, combined);
  }
  if (looksLikeProject(combined)) {
    next.project = selectLonger(next.project, combined);
  }
  return next;
}

export function buildClarifyMessage(missing: AgentDecision["missing"], task: TaskType) {
  if (!missing.length) {
    return "我可以继续处理，但还不清楚你想做哪一种任务。你可以直接说：帮我优化简历、开始模拟面试、复盘刚才的面试，或者帮我深挖这个项目。";
  }
  const names = missing.map(materialLabel).join("、");
  const taskName = taskLabel(task);
  return `我可以继续处理 ${taskName}，但还缺少 ${names}。请直接把相关内容粘贴到聊天里，或通过附件补充，我会自动接上当前任务。`;
}

export function materialLabel(item: AgentDecision["missing"][number]) {
  const labels = {
    jd: "目标 JD",
    resume: "简历内容",
    project: "项目描述",
    interview: "完整面试记录"
  };
  return labels[item];
}

export function taskLabel(task: TaskType) {
  const labels: Record<TaskType, string> = {
    resume_optimize: "简历定制优化",
    mock_interview: "沉浸式模拟面试",
    interview_answer: "面试作答点评",
    interview_review: "面试智能复盘",
    project_deep_dive: "项目深度打磨",
    clarify: "上下文补全"
  };
  return labels[task];
}

export function messagesToTranscript(messages: ChatMessage[]) {
  return messages
    .map((message) => `${message.role === "user" ? "用户" : "Agent"}：${message.content}`)
    .join("\n");
}

function inferTaskFromContext(input: string): TaskType {
  if (/面试|回答|追问/.test(input)) {
    return "mock_interview";
  }
  if (/项目|STAR/i.test(input)) {
    return "project_deep_dive";
  }
  if (/JD|岗位|职位|简历|resume|cv/i.test(input)) {
    return "resume_optimize";
  }
  return "clarify";
}

function artifactTypeForTask(task: TaskType): ArtifactType {
  if (task === "resume_optimize") return "resume";
  if (task === "mock_interview" || task === "interview_answer") return "interview";
  if (task === "interview_review") return "review";
  if (task === "project_deep_dive") return "project";
  return "clarify";
}

function missingMaterials(task: TaskType, context: WorkspaceContext) {
  if (task === "resume_optimize") {
    return [!context.jd && "jd", !context.resume && "resume"].filter(Boolean) as Array<"jd" | "resume">;
  }
  if (task === "mock_interview") {
    return [!context.jd && "jd", !context.resume && "resume"].filter(Boolean) as Array<"jd" | "resume">;
  }
  if (task === "interview_review") {
    return [!context.interview && "interview"].filter(Boolean) as Array<"interview">;
  }
  if (task === "project_deep_dive") {
    return [!context.project && "project"].filter(Boolean) as Array<"project">;
  }
  return [];
}

function looksLikeNewTask(input: string) {
  return taskPatterns.some((item) => item.tests.some((test) => test.test(input)));
}

function looksLikeJd(text: string) {
  return /(岗位职责|任职要求|职位描述|JD|job description|requirements|responsibilities)/i.test(text);
}

function looksLikeResume(text: string) {
  return /(教育经历|工作经历|项目经历|专业技能|个人简历|resume|curriculum vitae|experience)/i.test(text);
}

function looksLikeProject(text: string) {
  return /(项目背景|技术栈|项目职责|项目成果|STAR|负责.*项目|项目经历)/i.test(text);
}

function selectLonger(current: string | undefined, incoming: string) {
  if (!current || incoming.length > current.length) {
    return incoming.slice(0, 24000);
  }
  return current;
}
