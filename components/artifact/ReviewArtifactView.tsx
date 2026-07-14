"use client";

import { CheckCircle2 } from "lucide-react";
import type { ReviewArtifact } from "@/types/agent";
import { clamp } from "@/lib/utils";
import { PanelTitle, ScoreCard, TwoColumn } from "./shared";
import styles from "../ArtifactPanel.module.css";

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
