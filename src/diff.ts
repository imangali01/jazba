export const TRUNCATION_MARKER = "\n\n… [дифф обрезан] …";

/**
 * Обрезает тело диффа до `maxChars` символов. Если обрезка нужна, старается
 * резать по границе строки и добавляет маркер {@link TRUNCATION_MARKER}.
 * `git diff --staged --stat` в промпт идёт отдельно и не обрезается.
 */
export function truncateDiff(body: string, maxChars: number): string {
  if (body.length <= maxChars) {
    return body;
  }

  const hardCut = body.slice(0, maxChars);
  const lastNewline = hardCut.lastIndexOf("\n");
  const kept = lastNewline > 0 ? hardCut.slice(0, lastNewline + 1) : hardCut;

  return kept.trimEnd() + TRUNCATION_MARKER;
}
