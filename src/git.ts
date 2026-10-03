import * as vscode from "vscode";

import type { RepoLike } from "./repository";

/**
 * Узкий срез API встроенного расширения `vscode.git` — только то, что использует Jazba.
 * Полные типы живут в microsoft/vscode/extensions/git/src/api/git.d.ts.
 */
export interface GitRepository extends RepoLike {
  rootUri: vscode.Uri;
  inputBox: { value: string };
}

export interface GitAPI {
  readonly repositories: GitRepository[];
}

interface GitExtensionExports {
  getAPI(version: 1): GitAPI;
  readonly enabled: boolean;
}

/**
 * Возвращает API git-расширения VS Code или `undefined`, если оно недоступно
 * (отключено пользователем или ещё не активировалось).
 */
export async function getGitAPI(): Promise<GitAPI | undefined> {
  const extension = vscode.extensions.getExtension<GitExtensionExports>("vscode.git");
  if (!extension) {
    return undefined;
  }
  const exports = extension.isActive ? extension.exports : await extension.activate();
  if (!exports.enabled) {
    return undefined;
  }
  return exports.getAPI(1);
}
