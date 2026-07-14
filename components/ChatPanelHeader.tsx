"use client";

import { Sparkles } from "lucide-react";
import styles from "../app/page.module.css";

export function ChatPanelHeader({ onReset }: { onReset: () => void }) {
  return (
    <div className={styles.chatPanelHeader}>
      <div className={styles.chatPanelHeaderRow}>
        <div className={styles.chatPanelTitleGroup}>
          <Sparkles className={styles.chatPanelIcon} />
          <h1 className={styles.chatPanelTitle}>Agent Workspace</h1>
        </div>
        <button
          className={styles.resetButton}
          type="button"
          title="清空对话，重新开始"
          onClick={onReset}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/></svg>
        </button>
      </div>
      <p className={styles.chatPanelSubtitle}>
        自然语言是唯一业务入口；Agent 自动识别任务、补齐素材并生成右侧结果。
      </p>
    </div>
  );
}
