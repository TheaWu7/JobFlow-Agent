"use client";

import { useCallback, useEffect, useState } from "react";
import { clearHistory, loadHistory } from "@/lib/history";
import type { HistoryRecord } from "@/types/agent";

export function useHistoryRecords() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);

  useEffect(() => {
    const refresh = () => setRecords(loadHistory());
    refresh();
    window.addEventListener("interviewflow-history-updated", refresh);
    return () => window.removeEventListener("interviewflow-history-updated", refresh);
  }, []);

  const clear = useCallback(() => {
    clearHistory();
    setRecords([]);
  }, []);

  return { records, clear };
}
