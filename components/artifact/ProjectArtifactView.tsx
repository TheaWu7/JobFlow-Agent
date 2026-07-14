"use client";

import { Star } from "lucide-react";
import type { ProjectArtifact } from "@/types/agent";
import { PanelTitle, TagGroup } from "./shared";
import styles from "../ArtifactPanel.module.css";

export function ProjectArtifactView({ artifact }: { artifact: ProjectArtifact }) {
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
