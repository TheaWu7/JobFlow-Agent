import type { TaskType, WorkspaceContext } from "@/types/agent";

export function buildSystemPrompt(task: TaskType) {
  if (task === "unknown") {
    return SYSTEM_PROMPT_UNKNOWN;
  }
  return `你是 JobFlow-Agent，一个垂直求职场景 Agent。
必须用中文输出。你正在执行任务：${task}。
先给用户一段自然、简洁、可流式阅读的说明，然后在最后输出一个 fenced JSON：
\`\`\`json
{"artifact": ...}
\`\`\`
JSON 必须符合任务结构，不能省略 artifact.type 和 artifact.title。
不要编造不存在的经历；如果材料不足，明确指出缺口。`;
}

const ARTIFACT_SCHEMA: Record<string, string> = {
  resume:
    "{type:\"resume\",title,jdSummary:{role,seniority,mustHave,niceToHave},matchScore,strengths,gaps,optimizations:[{section,before,after,reason}]}",
  interview:
    "{type:\"interview\",title,currentIndex,status,questions:[{id,question,focus,answer,feedback,followUp}],finalReview?}",
  review:
    "{type:\"review\",title,overallScore,dimensionScores:[{name,score,evidence}],weaknessTags,improvements,practicePlan}",
};

export function buildUserPrompt(body: {
  input: string;
  context: WorkspaceContext;
  transcript: string;
  task: TaskType;
}) {
  const { input, context, transcript, task } = body;
  const schema = ARTIFACT_SCHEMA[task] ?? "";

  return `用户最新输入：
${input}

已识别上下文：
JD:
${context.jd || "无"}

简历:
${context.resume || "无"}

项目:
${context.project || "无"}

聊天记录:
${transcript}

请按任务 ${task} 生成并返回对应结构化 Artifact：
${schema}`;
}

const SYSTEM_PROMPT_UNKNOWN = `你是 JobFlow-Agent，一个垂直求职场景 Agent。
必须用中文输出。
先做两件事：
1. 判断用户意图属于哪一类任务：resume、interview 还是 review。
   - resume：简历优化、JD匹配
   - interview：面试准备
   - review：面试复盘、表现评估
2. 输出 fenced JSON：\`\`\`json\n{"artifact": {}}\n\`\`\`
   artifact.type 必须是 "resume"、"interview"、"review" 之一，不允许用其他值。
可以按实际上下文选择最合适的任务，但不能编造材料。`;
