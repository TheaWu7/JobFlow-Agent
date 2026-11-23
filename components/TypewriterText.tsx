"use client";

import { useEffect, useState } from "react";
import styles from "./TypewriterText.module.css";

// 打字速度（毫秒/字）
const NORMAL_DELAY = 120; // 普通字速
const AI_EDGE_DELAY = 450; // "AI" 开始前 & 结束后 的停顿
const AI_GAP_DELAY = 160; // "A" 到 "I" 之间的间隔（较短）
// "AI" 这两个字符：揭示后显示为品牌色
const AI_CHARS = new Set(["A", "I"]);

function delayFor(prev: string | undefined, char: string): number {
  if (char === "A") return AI_EDGE_DELAY; // AI 开始前
  if (char === "I") return AI_GAP_DELAY; // A → I 之间
  if (prev === "I") return AI_EDGE_DELAY; // AI 结束后
  return NORMAL_DELAY;
}

export function TypewriterText({
  text,
  startDelay = 400,
}: {
  text: string;
  startDelay?: number;
}) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (count >= text.length) return;
    const delay = count === 0 ? startDelay : delayFor(text[count - 1], text[count]);
    const timer = setTimeout(() => setCount((c) => c + 1), delay);
    return () => clearTimeout(timer);
  }, [count, text, startDelay]);

  return (
    <>
      {Array.from(text).map((ch, i) => {
        const isRevealed = i < count;
        const colorClass = !isRevealed
          ? styles.pending
          : AI_CHARS.has(ch)
            ? styles.revealedBrand
            : styles.revealed;
        return (
          <span key={i}>
            {i === count && <span className={styles.cursor} aria-hidden="true" />}
            <span className={`${styles.char} ${colorClass}`}>{ch}</span>
          </span>
        );
      })}
      {count >= text.length && <span className={styles.cursor} aria-hidden="true" />}
    </>
  );
}
