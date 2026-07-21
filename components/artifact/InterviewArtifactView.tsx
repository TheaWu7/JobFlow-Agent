"use client";

import { MessageSquareText } from "lucide-react";
import type { InterviewArtifact } from "@/types/agent";
import { PanelTitle, TextBlock } from "./shared";
import { ReviewArtifactView } from "./ReviewArtifactView";
import styles from "../ArtifactPanel.module.css";

export function InterviewArtifactView({ artifact }: { artifact: InterviewArtifact }) {
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
      <div className={styles.questionList}>
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
