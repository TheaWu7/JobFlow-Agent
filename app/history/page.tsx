"use client";

import { useEffect, useState } from "react";
import { Clock, FileClock, Trash2 } from "lucide-react";
import { clearHistory, loadHistory } from "@/lib/history";
import type { HistoryRecord } from "@/types/agent";

export default function HistoryPage() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const refresh = () => setRecords(loadHistory());
    refresh();
    window.addEventListener("interviewflow-history-updated", refresh);
    return () => window.removeEventListener("interviewflow-history-updated", refresh);
  }, []);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">History</h1>
          <p className="mt-1 text-sm text-muted">最近的 JD 解析、简历优化、面试记录和项目脚本。这里只读查看，不发起业务任务。</p>
        </div>
        <button
          className="flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm text-muted hover:text-accent"
          type="button"
          onClick={() => {
            clearHistory();
            setRecords([]);
          }}
        >
          <Trash2 className="h-4 w-4" />
          清空
        </button>
      </div>

      {records.length === 0 ? (
        <section className="flex min-h-[420px] flex-col items-center justify-center rounded-lg border border-dashed border-line bg-white p-8 text-center">
          <FileClock className="mb-4 h-10 w-10 text-brand" />
          <h2 className="text-lg font-semibold">暂无历史记录</h2>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">在 Workspace 完成一次 Agent 任务后，结构化结果会自动保存到这里。</p>
        </section>
      ) : (
        <div className="grid gap-3">
          {records.map((record) => (
            <article key={record.id} className="rounded-lg border border-line bg-white p-4 shadow-soft">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <span className="rounded-md bg-brand/10 px-2 py-1 text-xs text-brand">{record.type}</span>
                  <h2 className="mt-2 text-base font-semibold">{record.title}</h2>
                  <p className="mt-1 text-sm text-muted">{record.summary}</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(record.createdAt).toLocaleString("zh-CN")}
                </div>
              </div>
              <pre className="mt-4 max-h-72 overflow-auto rounded-md bg-panel p-3 text-xs leading-5 text-muted">
                {JSON.stringify(record.artifact, null, 2)}
              </pre>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
