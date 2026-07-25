"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AgentTraceStep } from "@/types/agent";
import styles from "../app/page.module.css";

export function TraceList({ trace }: { trace: AgentTraceStep[] }) {
  const [collapsed, setCollapsed] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  const latestTrace = trace[trace.length - 1];
  const isRunning = latestTrace.status === "running";

  useEffect(() => {
    if (!collapsed) {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    }
  }, [trace, collapsed]);

  if (!trace.length) return null;
  return (
    <div className={cn(styles.trace, collapsed && styles.traceCollapsed)}>
      <div className={styles.traceHeader}>
        <p className={cn(styles.traceTitle, isRunning && styles.traceLabelRunning)}>{latestTrace.label}</p>
        <button
          className={cn(styles.traceToggle, collapsed && styles.traceToggleCollapsed)}
          type="button"
          title={collapsed ? "展开" : "收起"}
          onClick={() => setCollapsed((v) => !v)}
        >
          <ChevronDown size={18} />
        </button>
      </div>
      {!collapsed && (
        <div className={styles.traceListWrapper}>
          <div ref={listRef} className={styles.traceList}>
            {trace.slice(0, -1).map((item) => (
              <div key={item.id} className={styles.traceItem}>
                <span
                  className={cn(
                    styles.traceDot,
                    item.status === "done" && styles.traceDotDone,
                    item.status === "running" && styles.traceDotRunning,
                    item.status === "pending" && styles.traceDotPending,
                    item.status === "error" && styles.traceDotError
                  )}
                />
                <span className={item.status === "running" ? styles.traceLabelRunning : undefined}>
                  {item.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
