/**
 * Parse JSON from AI responses, handling common issues like
 * unescaped newlines/tabs inside string values and markdown fences.
 */
export function parseAIJson<T>(raw: string): T {
  // Strip markdown code fences if present
  let text = raw.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }

  // First try direct parse
  try {
    return JSON.parse(text) as T;
  } catch {
    // Fix unescaped control characters inside JSON string values
    // Replace literal newlines/tabs that appear between quotes
    const fixed = text.replace(
      /"(?:[^"\\]|\\.)*"/g,
      (match) =>
        match
          .replace(/(?<!\\)\n/g, "\\n")
          .replace(/(?<!\\)\r/g, "\\r")
          .replace(/(?<!\\)\t/g, "\\t"),
    );

    try {
      return JSON.parse(fixed) as T;
    } catch (e) {
      console.error("Failed to parse AI JSON. Raw response (first 500 chars):", raw.slice(0, 500));
      throw e;
    }
  }
}
