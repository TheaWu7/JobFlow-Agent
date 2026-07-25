"use client";

import { useEffect, useState } from "react";
import { Clock, FileClock, Trash2 } from "lucide-react";
import { clearHistory, loadHistory } from "@/lib/history";
import type { HistoryRecord } from "@/types/agent";
import styles from "./history.module.css";
import { JsonBlock } from "@/components/common/JsonBlock/JsonBlock";

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const refresh = () => setRecords(loadHistory());
    refresh();
    window.addEventListener("interviewflow-history-updated", refresh);
    return () => window.removeEventListener("interviewflow-history-updated", refresh);
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.pageInner}>
        <div className={styles.header}>
        <div>
          <h1 className={styles.title}>History</h1>
          <p className={styles.subtitle}>最近的 JD 解析、简历优化和面试复盘记录。</p>
        </div>
        <button
          className={styles.clearButton}
          type="button"
          onClick={() => {
            clearHistory();
            setRecords([]);
          }}
        >
          <Trash2 size={16} />
          清空
        </button>
      </div>

      {records.length === 0 ? (
        <section className={styles.emptyState}>
          <FileClock className={styles.emptyIcon} />
          <h2 className={styles.emptyTitle}>暂无历史记录</h2>
          <p className={styles.emptyText}>在 Workspace 完成一次 Agent 任务后，结构化结果会自动保存到这里。</p>
        </section>
      ) : (
        <div className={styles.list}>
          {records.map((record) => (
            <article key={record.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{record.title}</h2>
                  <p className={styles.cardSummary}>{record.summary}</p>
                </div>
                <div className={styles.cardTime}>
                  <Clock size={14} />
                  {new Date(record.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <JsonBlock data={record.artifact} />
            </article>
          ))}
        </div>
      )}
      </div>
    </main>
  );
}
