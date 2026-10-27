export interface BranchPromptInput {
  /** Вывод `git diff … --stat` (целиком). */
  stat: string;
  /** Тело диффа, уже обрезанное до лимита. */
  diffBody: string;
  /** Текущая ветка — чтобы модель не предлагала то же имя. */
  currentBranch?: string;
  /** Имена существующих веток репозитория для подражания их формату. */
  examples?: string[];
}

const MAX_BRANCH_LENGTH = 60;

/** Собирает промпт для `claude -p`, который просит одно имя ветки по изменениям. */
export function buildBranchPrompt(input: BranchPromptInput): string {
  const sections: string[] = [
    "Придумай имя git-ветки для приведённых ниже изменений.",
    "Формат: `type/short-description` — type из feat, fix, docs, refactor, chore, test; " +
      "описание — 2–5 английских слов в kebab-case, только строчные латинские буквы, цифры и дефисы.",
    "В ответе верни только имя ветки одной строкой — без пояснений, кавычек и блоков ```.",
  ];

  const examples = (input.examples ?? []).map((e) => e.trim()).filter((e) => e !== "");
  if (examples.length > 0) {
    sections.push(
      "Существующие ветки репозитория — если у них есть устойчивый формат, подражай ему:\n" +
        examples.map((e) => `- ${e}`).join("\n"),
    );
  }

  const current = input.currentBranch?.trim();
  if (current) {
    sections.push(`Текущая ветка: ${current}. Не предлагай это же имя.`);
  }

  sections.push(`Изменённые файлы (git diff --stat):\n${input.stat}`);
  sections.push(`Дифф изменений:\n${input.diffBody}`);

  return sections.join("\n\n");
}

/**
 * Приводит ответ модели к допустимому имени ветки (см. `git check-ref-format`):
 * берёт первую непустую строку, убирает обрамление, пробелы заменяет дефисами,
 * выбрасывает запрещённые символы, чистит каждый сегмент пути.
 * Возвращает `""`, если от ответа ничего не осталось.
 */
export function sanitizeBranchName(raw: string): string {
  const line =
    raw
      .replace(/\r\n/g, "\n")
      .split("\n")
      .map((l) => l.trim())
      .find((l) => l !== "" && !l.startsWith("```")) ?? "";

  const flat = line
    .replace(/^["'`]+|["'`]+$/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9/._-]/g, "")
    .replace(/\.{2,}/g, ".")
    .replace(/-{2,}/g, "-");

  const segments = flat
    .split("/")
    .map((s) => s.replace(/^[.-]+/, "").replace(/(\.lock)+$/, "").replace(/[.-]+$/, ""))
    .filter((s) => s !== "");

  let name = segments.join("/");
  if (name.length > MAX_BRANCH_LENGTH) {
    name = name.slice(0, MAX_BRANCH_LENGTH).replace(/[/.-]+$/, "");
  }
  return name;
}
