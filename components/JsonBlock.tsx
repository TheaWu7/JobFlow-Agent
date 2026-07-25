import { useState } from "react";
import { Check, Copy } from "lucide-react";
import styles from "./JsonBlock.module.css";

export function JsonBlock({ data }: { data: unknown }) {
  const [copied, setCopied] = useState(false);
  const json = JSON.stringify(data, null, 2);

  function handleCopy() {
    navigator.clipboard.writeText(json).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className={styles.jsonBlockWrapper}>
      <button type="button" className={styles.jsonBlockCopy} onClick={handleCopy} title="复制">
        {copied ? <Check size={14} /> : <Copy size={14} />}
      </button>
      <pre className={styles.jsonBlock}>{json}</pre>
    </div>
  );
}
