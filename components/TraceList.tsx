"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { AgentTraceStep } from "@/types/agent";
import styles from "../app/page.module.css";

export function TraceList({ trace }: { trace: AgentTraceStep[] }) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
  }, [trace]);

  if (!trace.length) return null;
  return (
    <div className={styles.trace}>
      <p className={styles.traceTitle}>Agent Trace</p>
      <div className={styles.traceListWrapper}>
        <div ref={listRef} className={styles.traceList}>
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
              <span className={item.status === "running" ? styles.traceLabelRunning : undefined}>{item.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
