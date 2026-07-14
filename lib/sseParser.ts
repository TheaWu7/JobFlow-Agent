/**
 * Parse a chunk of SSE (Server-Sent Events) text into an array of parsed events.
 * Returns the remaining unterminated buffer to be prepended to the next chunk.
 */
export function parseSSEBuffer<T = unknown>(
  buffer: string,
  parse: (raw: string) => T | null = defaultParse
): { events: T[]; remainder: string } {
  const segments = buffer.split("\n\n");
  const remainder = segments.pop() ?? "";
  const events: T[] = [];

  for (const segment of segments) {
    const dataLine = segment
      .split("\n")
      .find((line) => line.startsWith("data:"))
      ?.replace(/^data:\s*/, "");
    if (!dataLine || dataLine === "[DONE]") continue;
    const parsed = parse(dataLine);
    if (parsed !== null) {
      events.push(parsed);
    }
  }

  return { events, remainder };
}

function defaultParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
