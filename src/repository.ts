/**
 * Минимальная структурная форма репозитория из API встроенного расширения `vscode.git`.
 * Здесь важен только `rootUri`, поэтому не тянем весь тип Git API.
 */
export interface RepoLike {
  rootUri: { toString(): string };
}

/** Подсказка, которую VS Code передаёт команде из меню `scm/inputBox`. */
export interface RepoHint {
  rootUri?: { toString(): string } | string;
}

function rootUriString(value: { toString(): string } | string | undefined): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  return typeof value === "string" ? value : value.toString();
}

/**
 * Выбирает репозиторий, к которому применяется команда.
 *
 * - если подсказка указывает на конкретный `rootUri` — берём совпавший репозиторий;
 * - иначе, если репозиторий ровно один — берём его;
 * - иначе неоднозначно — возвращаем `undefined` (вызывающий код покажет выбор/ошибку).
 */
export function resolveRepository<T extends RepoLike>(
  hint: RepoHint | undefined,
  repositories: readonly T[],
): T | undefined {
  const wanted = rootUriString(hint?.rootUri);
  if (wanted !== undefined) {
    const match = repositories.find((repo) => repo.rootUri.toString() === wanted);
    if (match) {
      return match;
    }
  }

  if (repositories.length === 1) {
    return repositories[0];
  }

  return undefined;
}
