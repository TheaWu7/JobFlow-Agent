"use client";

import { cn } from "@/lib/utils";
import type { AgentTraceStep } from "@/types/agent";
import styles from "../app/page.module.css";

export function TraceList({ trace }: { trace: AgentTraceStep[] }) {
  if (!trace.length) return null;
  return (
    <div className={styles.trace}>
      <p className={styles.traceTitle}>Agent Trace</p>
      <div className={styles.traceListWrapper}>
        <div className={styles.traceList}>
          {trace.map((item) => (
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
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
