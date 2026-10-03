/** Строки-трейлеры, которые не должны попадать ни в сгенерированное сообщение,
 *  ни в примеры из истории. */
const TRAILER_RE = /^\s*(?:co-authored-by:|signed-off-by:|🤖\s*generated with|generated with \[claude)/i;

/**
 * Убирает хвостовые строки-трейлеры (`Co-Authored-By:`, `Signed-off-by:`,
 * `🤖 Generated with …`) вместе с предшествующими пустыми строками.
 */
export function stripTrailerLines(text: string): string {
  const lines = text.split("\n");
  while (lines.length > 0) {
    const last = lines[lines.length - 1];
    if (last.trim() === "" || TRAILER_RE.test(last)) {
      lines.pop();
    } else {
      break;
    }
  }
  return lines.join("\n");
}

/**
 * Приводит «сырой» ответ модели к чистому тексту сообщения коммита:
 * убирает обрамляющий ```-блок и кавычки, нормализует переводы строк,
 * схлопывает лишние пустые строки, срезает хвостовые трейлеры.
 */
export function sanitizeMessage(raw: string): string {
  let text = raw.replace(/\r\n/g, "\n").trim();

  text = stripWrappingFence(text);
  text = stripWrappingQuotes(text.trim());
  text = stripTrailerLines(text);
  text = text.replace(/\n{3,}/g, "\n\n");

  return text.trim();
}

function stripWrappingFence(text: string): string {
  const match = /^```[^\n]*\n([\s\S]*?)\n```$/.exec(text);
  return match ? match[1] : text;
}

function stripWrappingQuotes(text: string): string {
  const match = /^(["'])([\s\S]*)\1$/.exec(text);
  return match ? match[2] : text;
}
