import { stripTrailerLines } from "./sanitize";

export interface Commit {
  hash: string;
  email: string;
  message: string;
}

export interface SelectOptions {
  limit?: number;
  perBucket?: number;
}

const RS = "\x1e";
const US = "\x1f";

/** Формат для `git log`: `%H<US>%ae<US>%B<RS>` на каждый коммит. */
export const GIT_LOG_FORMAT = `%H${US}%ae${US}%B${RS}`;

/** Разбирает вывод `git log --pretty=format:GIT_LOG_FORMAT`. */
export function parseCommitLog(raw: string): Commit[] {
  return raw
    .split(RS)
    .map((record) => record.replace(/^\n/, ""))
    .filter((record) => record.trim() !== "")
    .map((record) => {
      const [hash = "", email = "", ...rest] = record.split(US);
      return { hash, email, message: rest.join(US).replace(/\s+$/, "") };
    });
}

/**
 * Выбирает примеры для промпта: до `perBucket` свежих коммитов владельца
 * (`ownerEmail`) и до `perBucket` от других, добор до `limit` из оставшихся.
 * Без `ownerEmail` — просто первые `limit` коммитов.
 */
export function selectExamples(
  commits: Commit[],
  ownerEmail: string | undefined,
  options: SelectOptions = {},
): Commit[] {
  const limit = options.limit ?? 20;
  const perBucket = options.perBucket ?? 10;

  if (!ownerEmail) {
    return commits.slice(0, limit);
  }

  const owner = commits.filter((c) => c.email === ownerEmail);
  const others = commits.filter((c) => c.email !== ownerEmail);

  const picked = [...owner.slice(0, perBucket), ...others.slice(0, perBucket)];

  if (picked.length < limit) {
    const chosen = new Set(picked);
    for (const c of commits) {
      if (picked.length >= limit) {
        break;
      }
      if (!chosen.has(c)) {
        picked.push(c);
        chosen.add(c);
      }
    }
  }

  return picked.slice(0, limit);
}

/** Готовит тексты примеров: срезает трейлеры, выбрасывает пустые. */
export function formatExamples(commits: Commit[]): string[] {
  return commits
    .map((c) => stripTrailerLines(c.message).trim())
    .filter((text) => text.length > 0);
}

/** Достаточно ли истории, чтобы подражать её стилю. */
export function hasEnoughHistory(examples: string[]): boolean {
  return examples.length >= 3;
}
