/**
 * Robustly extracts the first valid JSON object from LLM output.
 * Handles: markdown code fences, leading/trailing text, nested objects.
 */
export function parseJSON<T>(raw: string): T {
  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  let text = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // 2. Try direct parse first
  try {
    return JSON.parse(text) as T;
  } catch {
    // continue to extraction
  }

  // 3. Extract the first {...} block (handles leading/trailing prose)
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    try {
      return JSON.parse(text.slice(start, end + 1)) as T;
    } catch {
      // continue
    }
  }

  // 4. Nothing worked — throw so the caller can use its fallback
  throw new Error(`Could not parse JSON from LLM response: ${text.slice(0, 200)}`);
}
