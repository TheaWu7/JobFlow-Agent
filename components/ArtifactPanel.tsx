"use client";

import type React from "react";
import { AlertCircle, CheckCircle2, ClipboardList, FileText, MessageSquareText, Star } from "lucide-react";
import type { Artifact, InterviewArtifact, ProjectArtifact, ResumeArtifact, ReviewArtifact } from "@/types/agent";
import { clamp } from "@/lib/utils";
import styles from "./ArtifactPanel.module.css";

export function ArtifactPanel({ artifact }: { artifact: Artifact | null }) {
  if (!artifact) {
    return (
      <section className={styles.emptyState}>
        <ClipboardList className={styles.emptyIcon} />
        <h2 className={styles.emptyTitle}>Artifact 结果面板</h2>
        <p className={styles.emptyText}>
          在左侧直接描述需求或粘贴 JD、简历、项目材料。Agent 会自动识别任务并在这里切换结构化结果。
        </p>
      </section>
    );
  }

  if (artifact.type === "resume") return <ResumeArtifactView artifact={artifact} />;
  if (artifact.type === "interview") return <InterviewArtifactView artifact={artifact} />;
  if (artifact.type === "review") return <ReviewArtifactView artifact={artifact} />;
  if (artifact.type === "project") return <ProjectArtifactView artifact={artifact} />;

  if (artifact.type === "clarify") {
    const isError = artifact.title === "请求失败";
    return (
      <section className={styles.panel}>
        <div className={styles.panelHeader}>
          <AlertCircle className={isError ? styles.panelIconError : styles.panelIconWarn} />
          <h2 className={styles.panelTitle}>{artifact.title}</h2>
        </div>
        <p className={styles.panelMessage}>{artifact.nextQuestion}</p>
        {!isError && (
          <div className={styles.tagRow}>
            {(artifact.missing ?? []).map((item) => (
              <span key={item} className={styles.tag}>
                {item}
              </span>
            ))}
            {(!artifact.missing || artifact.missing.length === 0) && (
              <span className={styles.tag}>
                请描述你的需求，例如：帮我优化简历、开始模拟面试、复盘面试、深挖项目
              </span>
            )}
          </div>
        )}
      </section>
    );
  }

  // fallback
  const fallback = artifact as unknown as { title?: string };
  return (
    <section className={styles.panel}>
      <div className={styles.panelHeader}>
        <AlertCircle className={styles.panelIconError} />
        <h2 className={styles.panelTitle}>{fallback.title ?? "未知 Artifact"}</h2>
      </div>
      <p className={styles.panelMessage}>未知的 Artifact 类型，请刷新页面重试。</p>
    </section>
  );
}

function ResumeArtifactView({ artifact }: { artifact: ResumeArtifact }) {
  return (
    <section className={styles.section}>
      <PanelTitle icon={<FileText size={20} />} title={artifact.title} />
      <div className={styles.scoreGrid}>
        <ScoreCard label="匹配度" score={artifact.matchScore} />
        <div className={styles.card}>
          <p className={styles.jdRole}>{artifact.jdSummary.role}</p>
          <p className={styles.jdSeniority}>{artifact.jdSummary.seniority}</p>
          <TagGroup title="硬性要求" items={artifact.jdSummary.mustHave} />
          <TagGroup title="加分项" items={artifact.jdSummary.niceToHave} />
        </div>
      </div>
      <TwoColumn titleLeft="匹配优势" left={artifact.strengths} titleRight="待补短板" right={artifact.gaps} />
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>简历优化对比</h3>
        <div className="flex flex-col gap-3 mt-3">
          {artifact.optimizations.map((item) => (
            <div key={item.section} className={styles.optimizationCard}>
              <div className={styles.optimizationHeader}>
                <span className={styles.optimizationSection}>{item.section}</span>
                <span className={styles.optimizationReason}>{item.reason}</span>
              </div>
              <div className={styles.optimizationGrid}>
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
    <section className={styles.section}>
      <PanelTitle icon={<MessageSquareText size={20} />} title={artifact.title} />
      <div className={styles.card}>
        <div className={styles.progressHeader}>
          <span className={styles.progressLabel}>当前进度</span>
          <span className={styles.progressCount}>
            {artifact.currentIndex + 1} / {artifact.questions.length}
          </span>
        </div>
        <div className={styles.progressBar}>
          <div
            className={styles.progressBarFill}
            style={{ width: `${((artifact.currentIndex + 1) / artifact.questions.length) * 100}%` }}
          />
        </div>
      </div>
      {current && (
        <div className={styles.currentQuestion}>
          <p className={styles.currentQuestionLabel}>Question</p>
          <h3 className={styles.currentQuestionText}>{current.question}</h3>
          <p className={styles.currentQuestionFocus}>考察点：{current.focus}</p>
        </div>
      )}
      <div className="flex flex-col gap-3">
        {artifact.questions.map((question, index) => (
          <div key={question.id} className={styles.questionCard}>
            <div className={styles.questionRow}>
              <span className={styles.questionNumber}>
                {index + 1}
              </span>
              <div className={styles.questionContent}>
                <p className={styles.questionText}>{question.question}</p>
                <p className={styles.questionFocus}>{question.focus}</p>
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
    <section className={styles.section}>
      {!compact && <PanelTitle icon={<CheckCircle2 size={20} />} title={artifact.title} />}
      <div className={styles.scoreGrid}>
        <ScoreCard label="综合评分" score={artifact.overallScore} />
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>短板标签</h3>
          <div className="flex flex-wrap gap-2 mt-3">
            {artifact.weaknessTags.map((item) => (
              <span key={item} className={styles.weaknessTag}>
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>维度评分</h3>
        <div className="flex flex-col gap-3 mt-3">
          {artifact.dimensionScores.map((item) => (
            <div key={item.name}>
              <div className={styles.dimensionLabels}>
                <span>{item.name}</span>
                <span>{item.score}</span>
              </div>
              <div className={styles.dimensionBar}>
                <div className={styles.dimensionBarFill} style={{ width: `${clamp(item.score, 0, 100)}%` }} />
              </div>
              <p className={styles.dimensionEvidence}>{item.evidence}</p>
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
    <section className={styles.section}>
      <PanelTitle icon={<Star size={20} />} title={artifact.title} />
      <div className={styles.starGrid}>
        {Object.entries(artifact.star).map(([key, value]) => (
          <div key={key} className={styles.starCard}>
            <p className={styles.starKey}>{key}</p>
            <p className={styles.starValue}>{value}</p>
          </div>
        ))}
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>口述脚本</h3>
        <p className={styles.pitchScriptText}>{artifact.pitchScript}</p>
      </div>
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>高频追问</h3>
        <div className="flex flex-col gap-3 mt-3">
          {artifact.followUps.map((item) => (
            <div key={item.question} className={styles.followUpCard}>
              <p className={styles.followUpQuestion}>{item.question}</p>
              <p className={styles.followUpAnswer}>{item.answerFrame}</p>
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
    <div className={styles.sectionTitle}>
      <span className={styles.sectionTitleIcon}>{icon}</span>
      <h2 className={styles.sectionTitleText}>{title}</h2>
    </div>
  );
}

function ScoreCard({ label, score }: { label: string; score: number }) {
  return (
    <div className={styles.scoreCard}>
      <p className={styles.scoreLabel}>{label}</p>
      <p className={styles.scoreValue}>{score}</p>
      <div className={styles.scoreBar}>
        <div className={styles.scoreBarFill} style={{ width: `${clamp(score, 0, 100)}%` }} />
      </div>
    </div>
  );
}

function TagGroup({ title, items, tone = "default" }: { title: string; items: string[]; tone?: "default" | "warn" }) {
  return (
    <div className={styles.tagGroup}>
      <p className={styles.tagGroupTitle}>{title}</p>
      <div className={styles.tagGroupList}>
        {items.map((item) => (
          <span
            key={item}
            className={tone === "warn" ? styles.tagGroupItemWarn : styles.tagGroupItem}
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
    <div className={styles.twoColumn}>
      <ListPanel title={titleLeft} items={left} />
      <ListPanel title={titleRight} items={right} />
    </div>
  );
}

function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.listPanel}>
      <h3 className={styles.listPanelTitle}>{title}</h3>
      <ul className={styles.listPanelItems}>
        {items.map((item) => (
          <li key={item} className={styles.listItem}>
            <span className={styles.listItemDot} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function TextBlock({ label, text, strong = false }: { label: string; text: string; strong?: boolean }) {
  return (
    <div className={styles.textBlock}>
      <p className={styles.textBlockLabel}>{label}</p>
      <p className={`${styles.textBlockContent} ${strong ? styles.textBlockContentStrong : ""}`}>{text}</p>
    </div>
  );
}
