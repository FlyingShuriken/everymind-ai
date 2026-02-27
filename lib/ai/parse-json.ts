/**
 * Parse JSON from AI responses, handling common issues like
 * invalid escape sequences (\alpha, \partial from LaTeX math),
 * unescaped newlines/tabs inside string values, and markdown fences.
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
    // Attempt to fix common AI JSON issues via a character-by-character pass
    const fixed = fixAIJson(text);
    try {
      return JSON.parse(fixed) as T;
    } catch (e) {
      console.error("Failed to parse AI JSON. Raw response (first 500 chars):", raw.slice(0, 500));
      throw e;
    }
  }
}

/**
 * Walk through JSON text character-by-character to fix:
 * 1. Invalid escape sequences (e.g. \alpha → \\alpha, \partial → \\partial)
 * 2. Unescaped control characters inside strings (literal \n, \r, \t)
 */
function fixAIJson(text: string): string {
  const VALID_ESCAPE_CHARS = new Set(['"', "\\", "/", "b", "f", "n", "r", "t", "u"]);
  let result = "";
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (escaped) {
      if (VALID_ESCAPE_CHARS.has(ch)) {
        // Valid JSON escape sequence — keep as-is
        result += ch;
      } else {
        // Invalid escape (e.g. \a from \alpha, \p from \partial)
        // Escape the leading backslash so it becomes a literal backslash
        result += "\\" + ch;
      }
      escaped = false;
      continue;
    }

    if (ch === "\\") {
      result += ch;
      if (inString) {
        escaped = true;
      }
      continue;
    }

    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }

    if (inString) {
      // Escape unescaped control characters inside string values
      if (ch === "\n") {
        result += "\\n";
        continue;
      }
      if (ch === "\r") {
        result += "\\r";
        continue;
      }
      if (ch === "\t") {
        result += "\\t";
        continue;
      }
    }

    result += ch;
  }

  return result;
}
