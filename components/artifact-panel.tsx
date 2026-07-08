"use client";

import type React from "react";
import { AlertCircle, CheckCircle2, ClipboardList, FileText, MessageSquareText, Star } from "lucide-react";
import type { Artifact, InterviewArtifact, ProjectArtifact, ResumeArtifact, ReviewArtifact } from "@/types/agent";
import { clamp } from "@/lib/utils";

export function ArtifactPanel({ artifact }: { artifact: Artifact | null }) {
  if (!artifact) {
    return (
      <section className="flex h-full min-h-[520px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
        <ClipboardList className="mb-4 h-10 w-10 text-brand" />
        <h2 className="text-lg font-semibold text-ink">Artifact 结果面板</h2>
        <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
          在左侧直接描述需求或粘贴 JD、简历、项目材料。Agent 会自动识别任务并在这里切换结构化结果。
        </p>
      </section>
    );
  }

  if (artifact.type === "resume") return <ResumeArtifactView artifact={artifact} />;
  if (artifact.type === "interview") return <InterviewArtifactView artifact={artifact} />;
  if (artifact.type === "review") return <ReviewArtifactView artifact={artifact} />;
  if (artifact.type === "project") return <ProjectArtifactView artifact={artifact} />;

  return (
    <section className="rounded-lg border border-line bg-white p-5 shadow-soft">
      <div className="flex items-center gap-2">
        <AlertCircle className="h-5 w-5 text-accent" />
        <h2 className="font-semibold">{artifact.title}</h2>
      </div>
      <p className="mt-3 text-sm text-muted">{artifact.nextQuestion}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {artifact.missing.map((item) => (
          <span key={item} className="rounded-md border border-line bg-panel px-2 py-1 text-xs text-muted">
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ResumeArtifactView({ artifact }: { artifact: ResumeArtifact }) {
  return (
    <section className="space-y-4">
      <PanelTitle icon={<FileText className="h-5 w-5" />} title={artifact.title} />
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <ScoreCard label="匹配度" score={artifact.matchScore} />
        <div className="rounded-lg border border-line bg-white p-4">
          <p className="text-sm font-semibold text-ink">{artifact.jdSummary.role}</p>
          <p className="mt-1 text-xs text-muted">{artifact.jdSummary.seniority}</p>
          <TagGroup title="硬性要求" items={artifact.jdSummary.mustHave} />
          <TagGroup title="加分项" items={artifact.jdSummary.niceToHave} />
        </div>
      </div>
      <TwoColumn titleLeft="匹配优势" left={artifact.strengths} titleRight="待补短板" right={artifact.gaps} />
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">简历优化对比</h3>
        <div className="mt-3 space-y-3">
          {artifact.optimizations.map((item) => (
            <div key={item.section} className="rounded-md border border-line bg-panel p-3">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-sm font-medium">{item.section}</span>
                <span className="text-xs text-muted">{item.reason}</span>
              </div>
              <div className="grid gap-2 lg:grid-cols-2">
                <TextBlock label="Before" text={item.before} />
                <TextBlock label="After" text={item.after} strong />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function InterviewArtifactView({ artifact }: { artifact: InterviewArtifact }) {
  const current = artifact.questions[artifact.currentIndex];
  return (
    <section className="space-y-4">
      <PanelTitle icon={<MessageSquareText className="h-5 w-5" />} title={artifact.title} />
      <div className="rounded-lg border border-line bg-white p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-semibold">当前进度</span>
          <span className="text-xs text-muted">
            {artifact.currentIndex + 1} / {artifact.questions.length}
          </span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-panel">
          <div
            className="h-2 rounded-full bg-brand"
            style={{ width: `${((artifact.currentIndex + 1) / artifact.questions.length) * 100}%` }}
          />
        </div>
      </div>
      {current && (
        <div className="rounded-lg border border-brand/30 bg-white p-5 shadow-soft">
          <p className="text-xs font-medium uppercase text-brand">Question</p>
          <h3 className="mt-2 text-lg font-semibold leading-7">{current.question}</h3>
          <p className="mt-2 text-sm text-muted">考察点：{current.focus}</p>
        </div>
      )}
      <div className="space-y-3">
        {artifact.questions.map((question, index) => (
          <div key={question.id} className="rounded-lg border border-line bg-white p-4">
            <div className="flex gap-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-panel text-xs font-semibold">
                {index + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{question.question}</p>
                <p className="mt-1 text-xs text-muted">{question.focus}</p>
                {question.answer && <TextBlock label="你的回答" text={question.answer} />}
                {question.feedback && <TextBlock label="实时点评" text={question.feedback} strong />}
                {question.followUp && <TextBlock label="追问" text={question.followUp} />}
              </div>
            </div>
          </div>
        ))}
      </div>
      {artifact.finalReview && <ReviewArtifactView artifact={artifact.finalReview} compact />}
    </section>
  );
}

function ReviewArtifactView({ artifact, compact = false }: { artifact: ReviewArtifact; compact?: boolean }) {
  return (
    <section className="space-y-4">
      {!compact && <PanelTitle icon={<CheckCircle2 className="h-5 w-5" />} title={artifact.title} />}
      <div className="grid gap-3 sm:grid-cols-[160px_1fr]">
        <ScoreCard label="综合评分" score={artifact.overallScore} />
        <div className="rounded-lg border border-line bg-white p-4">
          <h3 className="text-sm font-semibold">短板标签</h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {artifact.weaknessTags.map((item) => (
              <span key={item} className="rounded-md bg-accent/10 px-2 py-1 text-xs text-accent">
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">维度评分</h3>
        <div className="mt-3 space-y-3">
          {artifact.dimensionScores.map((item) => (
            <div key={item.name}>
              <div className="flex justify-between text-sm">
                <span>{item.name}</span>
                <span>{item.score}</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-panel">
                <div className="h-2 rounded-full bg-note" style={{ width: `${clamp(item.score, 0, 100)}%` }} />
              </div>
              <p className="mt-1 text-xs text-muted">{item.evidence}</p>
            </div>
          ))}
        </div>
      </div>
      <TwoColumn titleLeft="改进建议" left={artifact.improvements} titleRight="练习计划" right={artifact.practicePlan} />
    </section>
  );
}

function ProjectArtifactView({ artifact }: { artifact: ProjectArtifact }) {
  return (
    <section className="space-y-4">
      <PanelTitle icon={<Star className="h-5 w-5" />} title={artifact.title} />
      <div className="grid gap-3 sm:grid-cols-2">
        {Object.entries(artifact.star).map(([key, value]) => (
          <div key={key} className="rounded-lg border border-line bg-white p-4">
            <p className="text-xs font-semibold uppercase text-brand">{key}</p>
            <p className="mt-2 text-sm leading-6 text-ink">{value}</p>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">口述脚本</h3>
        <p className="mt-2 text-sm leading-6 text-muted">{artifact.pitchScript}</p>
      </div>
      <div className="rounded-lg border border-line bg-white p-4">
        <h3 className="text-sm font-semibold">高频追问</h3>
        <div className="mt-3 space-y-3">
          {artifact.followUps.map((item) => (
            <div key={item.question} className="rounded-md bg-panel p-3">
              <p className="text-sm font-medium">{item.question}</p>
              <p className="mt-1 text-sm leading-6 text-muted">{item.answerFrame}</p>
            </div>
          ))}
        </div>
      </div>
      <TagGroup title="风险点" items={artifact.riskPoints} tone="warn" />
    </section>
  );
}

function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-line bg-white p-4 shadow-soft">
      <span className="text-brand">{icon}</span>
      <h2 className="text-lg font-semibold">{title}</h2>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-2 text-4xl font-semibold text-brand">{score}</p>
      <div className="mt-3 h-2 rounded-full bg-panel">
        <div className="h-2 rounded-full bg-brand" style={{ width: `${clamp(score, 0, 100)}%` }} />
      </div>
    </div>
  );
}

function TagGroup({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "warn" }) {
  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-muted">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className={`rounded-md px-2 py-1 text-xs ${
              tone === "warn" ? "bg-accent/10 text-accent" : "bg-brand/10 text-brand"
            }`}
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function TwoColumn({
  titleLeft,
  titleRight,
  left,
  right
}: {
  titleLeft: string;
  titleRight: string;
  left: string[];
  right: string[];
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      <ListPanel title={titleLeft} items={left} />
      <ListPanel title={titleRight} items={right} />
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-lg border border-line bg-white p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-muted">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextBlock({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) {
  return (
    <div className="mt-3 rounded-md bg-white/70 p-3">
      <p className="text-xs font-medium text-muted">{label}</p>
      <p className={`mt-1 text-sm leading-6 ${strong ? "text-ink" : "text-muted"}`}>{text}</p>
    </div>
  );
}
