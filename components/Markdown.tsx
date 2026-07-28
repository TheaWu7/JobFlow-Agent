"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styles from "./Markdown.module.css";

function unescapeNewlines(text: string): string {
  return text?.replace(/\\n/g, "\n");
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className={styles.root}>
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {unescapeNewlines(children)}
      </ReactMarkdown>
    </div>
  );
}
