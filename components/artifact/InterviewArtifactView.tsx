"use client";

import { useState } from "react";
import { MessageSquareText, ChevronDown } from "lucide-react";
import type { InterviewArtifact } from "@/types/agent";
import { PanelTitle } from "./shared";
import { Markdown } from "../Markdown";
import styles from "../ArtifactPanel.module.css";

export function InterviewArtifactView({ artifact }: { artifact: InterviewArtifact }) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  function toggleAnswer(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <section className={styles.section}>
      <PanelTitle icon={<MessageSquareText size={20} />} title={artifact.title} />

      {/* JD Analysis Card */}
      <div className={styles.jdAnalysisCard}>
        <h3 className={styles.jdAnalysisTitle}>JD 考察方向分析</h3>
        <p className={styles.jdAnalysisSummary}>{artifact?.jdAnalysis?.summary}</p>
        <div className={styles.examPointTags}>
          {artifact?.jdAnalysis?.examPoints?.map((point) => (
            <span key={point} className={styles.examPointTag}>
              {point}
            </span>
          ))}
        </div>
      </div>

      {/* Question Cards */}
      <div className={styles.questionList}>
        {artifact.questions.map((q, index) => {
          const isExpanded = expandedIds.has(q.id);
          return (
            <div key={q.id} className={styles.questionCard}>
              <div className={styles.questionRow}>
                <span className={styles.questionNumber}>{index + 1}</span>
                <div className={styles.questionContent}>
                  <p className={styles.questionText}>{q.question}</p>
                  <div className={styles.questionMetaWrap}>
                    <span className={styles.questionFocus}>考察点：{q.focus}</span>
                    {/* Expandable Answer */}
                    <button
                      type="button"
                      className={styles.expandToggle}
                      onClick={() => toggleAnswer(q.id)}
                    >
                      <span>推荐答案</span>
                      <ChevronDown
                        size={16}
                        className={isExpanded ? styles.expandIconOpen : styles.expandIconClosed}
                      />
                    </button>
                  </div>
                  {isExpanded && (
                    <div className={styles.answerContent}>
                      <Markdown>{q.answer}</Markdown>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
