"use client";

import { FileText } from "lucide-react";
import type { ResumeArtifact } from "@/types/agent";
import { PanelTitle, ScoreCard, TagGroup, TwoColumn, TextBlock } from "./shared";
import styles from "../ArtifactPanel.module.css";

export function ResumeArtifactView({ artifact }: { artifact: ResumeArtifact }) {
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
        <div className={styles.optimizationList}>
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
