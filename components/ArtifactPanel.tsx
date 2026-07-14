"use client";

import { AlertCircle, ClipboardList } from "lucide-react";
import type { Artifact } from "@/types/agent";
import { ResumeArtifactView } from "./artifact/ResumeArtifactView";
import { InterviewArtifactView } from "./artifact/InterviewArtifactView";
import { ReviewArtifactView } from "./artifact/ReviewArtifactView";
import { ProjectArtifactView } from "./artifact/ProjectArtifactView";
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
