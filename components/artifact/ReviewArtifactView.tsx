"use client";

import { CheckCircle2 } from "lucide-react";
import type { ReviewArtifact } from "@/types/agent";
import { clamp } from "@/lib/utils";
import { PanelTitle, ScoreCard, TwoColumn } from "./shared";
import { Markdown } from "../common/Markdown/Markdown";
import styles from "../ArtifactPanel.module.css";

function normalizeScore(score: number) {
  return score <= 10 ? score * 10 : score;
}

export function ReviewArtifactView({
  artifact,
  compact = false,
}: {
  artifact: ReviewArtifact;
  compact?: boolean;
}) {
  return (
    <section className={styles.section}>
      {!compact && <PanelTitle icon={<CheckCircle2 size={20} />} title={artifact.title} />}
      <div className={styles.scoreGrid}>
        <ScoreCard label="综合评分" score={normalizeScore(artifact.overallScore)} />
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>短板标签</h3>
          <div className={styles.tagRow}>
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
        <div className={styles.dimensionList}>
          {artifact.dimensionScores.map((item) => (
            <div key={item.name}>
              <div className={styles.dimensionLabels}>
                <span>{item.name}</span>
                <span>{normalizeScore(item.score)}</span>
              </div>
              <div className={styles.dimensionBar}>
                <div className={styles.dimensionBarFill} style={{ width: `${clamp(normalizeScore(item.score), 0, 100)}%` }} />
              </div>
              <p className={styles.dimensionEvidence}>{item.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 题目复盘 */}
      {artifact.questions?.length > 0 && (
        <div className={styles.card}>
          <h3 className={styles.cardTitle}>题目复盘分析</h3>
          <div className={styles.reviewQuestionList}>
            {artifact.questions.map((q, i) => (
              <div key={i} className={styles.reviewQuestionCard}>
                <div className={styles.reviewQuestionHeader}>
                  <span className={styles.reviewQuestionNum}>Q{i + 1}</span>
                  <p className={styles.reviewQuestionText}>{q.question}</p>
                </div>
                <div className={styles.reviewQuestionBody}>
                  <div className={styles.reviewSection}>
                    <h4 className={styles.reviewSectionLabel}>题目深意</h4>
                    <Markdown>{q.deeperMeaning}</Markdown>
                  </div>
                  <div className={styles.reviewSection}>
                    <h4 className={styles.reviewSectionLabel}>理想回复</h4>
                    <Markdown>{q.idealAnswer}</Markdown>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <TwoColumn titleLeft="改进建议" left={artifact.improvements} titleRight="练习计划" right={artifact.practicePlan} />
    </section>
  );
}
