export const COMMIT_STYLES = ["auto", "conventional", "plain", "gitmoji", "detailed"] as const;
export type CommitStyle = (typeof COMMIT_STYLES)[number];

export const LENGTHS = ["short", "medium", "long"] as const;
export type Length = (typeof LENGTHS)[number];

export function normalizeStyle(value: string): CommitStyle {
  const key = value.trim().toLowerCase();
  return (COMMIT_STYLES as readonly string[]).includes(key) ? (key as CommitStyle) : "auto";
}

export function normalizeLength(value: string): Length {
  const key = value.trim().toLowerCase();
  return (LENGTHS as readonly string[]).includes(key) ? (key as Length) : "medium";
}

const STYLE_LABELS: Record<CommitStyle, string> = {
  auto: "по истории репозитория",
  conventional: "Conventional Commits",
  plain: "простой императив",
  gitmoji: "gitmoji (эмодзи)",
  detailed: "подробный",
};

const LENGTH_LABELS: Record<Length, string> = {
  short: "коротко",
  medium: "средне",
  long: "подробно",
};

export function styleLabel(value: string): string {
  return STYLE_LABELS[normalizeStyle(value)];
}

export function lengthLabel(value: string): string {
  return LENGTH_LABELS[normalizeLength(value)];
}

const STYLE_INSTRUCTIONS: Record<CommitStyle, string> = {
  auto: "Формат сообщения подбери по стилю недавней истории репозитория (префиксы, регистр, время глагола).",
  conventional:
    "Используй формат Conventional Commits: `type(scope): краткое описание` (type — feat, fix, docs, refactor, chore, test и т.п.).",
  plain: "Пиши обычным предложением в повелительном наклонении, без префиксов и без двоеточия в начале.",
  gitmoji: "Начинай заголовок с подходящего эмодзи (✨ фича, 🐛 багфикс, ♻️ рефакторинг, 📝 доки, ✅ тесты), затем краткое описание.",
  detailed:
    "Всегда добавляй тело: пункты о том, что изменено и зачем, отделив их пустой строкой от заголовка.",
};

const LENGTH_INSTRUCTIONS: Record<Length, string> = {
  short: "Верни только заголовок в одну строку, без тела, до ~60 символов.",
  medium: "Заголовок плюс короткое тело: 1–3 пункта о сути изменений.",
  long: "Заголовок плюс развёрнутое, подробное тело с объяснением причин и контекста.",
};

export function styleInstruction(style: CommitStyle): string {
  return STYLE_INSTRUCTIONS[style];
}

export function lengthInstruction(length: Length): string {
  return LENGTH_INSTRUCTIONS[length];
}
