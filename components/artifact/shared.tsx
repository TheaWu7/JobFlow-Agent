"use client";

import type React from "react";
import { clamp } from "@/lib/utils";
import { Markdown } from "../common/Markdown/Markdown";
import styles from "../ArtifactPanel.module.css";

export function PanelTitle({ icon, title }: { icon: React.ReactNode; title: string }) {
  return (
    <div className={styles.sectionTitle}>
      <span className={styles.sectionTitleIcon}>{icon}</span>
      <h2 className={styles.sectionTitleText}>{title}</h2>
    </div>
  );
}

export function ScoreCard({ label, score }: { label: string; score: number }) {
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

export function TagGroup({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "warn";
}) {
  return (
    <div className={styles.tagGroup}>
      <p className={styles.tagGroupTitle}>{title}</p>
      <div className={styles.tagGroupList}>
        {(Array.isArray(items) ? items : []).map((item) => (
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

export function TwoColumn({
  titleLeft,
  titleRight,
  left,
  right,
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

export function ListPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className={styles.listPanel}>
      <h3 className={styles.listPanelTitle}>{title}</h3>
      <ul className={styles.listPanelItems}>
        {(Array.isArray(items) ? items : []).map((item) => (
          <li key={item} className={styles.listItem}>
            <span className={styles.listItemDot} />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function TextBlock({
  label,
  text,
  strong = false,
}: {
  label: string;
  text: string;
  strong?: boolean;
}) {
  return (
    <div className={styles.textBlock}>
      <p className={styles.textBlockLabel}>{label}</p>
      <div className={`${styles.textBlockContent} ${strong ? styles.textBlockContentStrong : ""}`}>
        <Markdown>{text}</Markdown>
      </div>
    </div>
  );
}
