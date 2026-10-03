import {
  lengthInstruction,
  normalizeLength,
  normalizeStyle,
  styleInstruction,
} from "./style";

export interface PromptInput {
  /** Вывод `git diff --staged --stat` (целиком). */
  stat: string;
  /** Тело диффа, уже обрезанное до лимита. */
  diffBody: string;
  /** Текущий текст в поле ввода сообщения — используется как подсказка. */
  draft?: string;
  /** Язык сообщения: `russian` (по умолчанию), `english` или произвольное название. */
  language?: string;
  /** Стиль сообщения: auto | conventional | plain | gitmoji | detailed. */
  style?: string;
  /** Длина сообщения: short | medium | long. */
  length?: string;
  /** Примеры недавних сообщений коммитов репозитория для подражания стилю. */
  examples?: string[];
}

/**
 * Собирает промпт для `claude -p`: язык, стиль, длина, статистика и тело диффа
 * (+ необязательный черновик пользователя). Примеры из истории добавляются
 * на следующей итерации.
 */
export function buildPrompt(input: PromptInput): string {
  const sections: string[] = [
    "Ты пишешь сообщение git-коммита для приведённых ниже staged-изменений.",
    languageInstruction(input.language),
    styleInstruction(normalizeStyle(input.style ?? "")),
    lengthInstruction(normalizeLength(input.length ?? "")),
    "В ответе верни только текст сообщения коммита — без пояснений, без обрамляющих кавычек и без блоков ```.",
  ];

  const examples = (input.examples ?? []).filter((e) => e.trim() !== "");
  if (examples.length > 0) {
    const block = examples.map((e) => `---\n${e.trim()}`).join("\n");
    sections.push(
      "Примеры недавних сообщений коммитов этого репозитория — подражай их стилю " +
        "(формат, длина, регистр, префиксы, язык), но не копируй содержание:\n" +
        `${block}\n---`,
    );
  }

  const draft = input.draft?.trim();
  if (draft) {
    sections.push(`Черновик/подсказка от пользователя (учти по смыслу):\n${draft}`);
  }

  sections.push(`Изменённые файлы (git diff --staged --stat):\n${input.stat}`);
  sections.push(`Дифф изменений:\n${input.diffBody}`);

  return sections.join("\n\n");
}

function languageInstruction(language: string | undefined): string {
  const key = language?.trim().toLowerCase();

  if (!key || key === "russian" || key === "ru" || key === "русский") {
    return "Сообщение коммита пиши на русском языке.";
  }
  if (key === "english" || key === "en" || key === "английский") {
    return "Write the commit message in English.";
  }
  return `Write the commit message in ${language!.trim()}.`;
}
