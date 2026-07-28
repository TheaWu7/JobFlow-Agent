import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function uid(prefix = "id") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    // 1. try markdown fenced code block
    const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1];
    if (fenced) {
      const result = tryParseJSON<T>(fenced.trim());
      if (result !== null) return result;
    }

    // 2. try brace-delimited JSON — scan from the end backwards
    //    because the artifact JSON is always at the tail of the response
    const lastBrace = raw.lastIndexOf("}");
    if (lastBrace < 0) return null;

    // collect candidate start positions: every "{" in the last 40 % of the text
    const tailStart = Math.floor(raw.length * 0.6);
    const candidates: number[] = [];
    let pos = raw.indexOf("{", tailStart);
    while (pos >= 0 && pos < lastBrace) {
      candidates.push(pos);
      pos = raw.indexOf("{", pos + 1);
    }

    // also include the very first "{" as a fallback
    const firstBrace = raw.indexOf("{");
    if (firstBrace >= 0 && !candidates.includes(firstBrace)) {
      candidates.push(firstBrace);
    }

    // try candidates from the end (closest to the artifact position)
    for (let i = candidates.length - 1; i >= 0; i--) {
      const result = tryParseJSON<T>(raw.slice(candidates[i], lastBrace + 1));
      if (result !== null) return result;
    }

    return null;
  }
}

function tryParseJSON<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}
