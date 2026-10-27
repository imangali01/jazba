import * as vscode from "vscode";

import { buildBranchPrompt, sanitizeBranchName } from "./branch";
import { buildClaudeInvocation, ClaudeError, runClaude } from "./claude";
import { readConfig } from "./config";
import { ControlsProvider, pickLanguage, pickLength, pickStyle } from "./controls-view";
import { truncateDiff } from "./diff";
import { getGitAPI, type GitRepository } from "./git";
import { buildPrompt } from "./prompt";
import { branchExists, checkoutBranch, currentBranch, hasUpstream, listBranches, pull } from "./repo-branch";
import { collectDiff, type DiffMode } from "./repo-diff";
import { collectExamples } from "./repo-history";
import { resolveRepository, type RepoHint } from "./repository";
import { sanitizeMessage } from "./sanitize";

let channel: vscode.OutputChannel;

export function activate(context: vscode.ExtensionContext): void {
  channel = vscode.window.createOutputChannel("Jazba");

  const controls = new ControlsProvider();

  context.subscriptions.push(
    channel,
    vscode.window.registerTreeDataProvider("jazba.controls", controls),
    vscode.commands.registerCommand("jazba.generate", (hint?: RepoHint) => generate(hint)),
    vscode.commands.registerCommand("jazba.suggestBranch", (hint?: RepoHint) => suggestBranch(hint)),
    vscode.commands.registerCommand("jazba.pickLanguage", () => pickLanguage(() => controls.refresh())),
    vscode.commands.registerCommand("jazba.pickStyle", () => pickStyle(() => controls.refresh())),
    vscode.commands.registerCommand("jazba.pickLength", () => pickLength(() => controls.refresh())),
    vscode.commands.registerCommand("jazba.openLog", () => channel.show(true)),
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("jazba")) {
        controls.refresh();
      }
    }),
  );
}

export function deactivate(): void {
  // Нет ресурсов, требующих явного освобождения помимо subscriptions.
}

async function generate(hint: RepoHint | undefined): Promise<void> {
  await withRepository(hint, run);
}

async function suggestBranch(hint: RepoHint | undefined): Promise<void> {
  await withRepository(hint, runSuggestBranch);
}

/** Находит репозиторий для команды и показывает ошибки `action` пользователю. */
async function withRepository(
  hint: RepoHint | undefined,
  action: (repository: GitRepository) => Promise<void>,
): Promise<void> {
  const git = await getGitAPI();
  if (!git) {
    void vscode.window.showErrorMessage("Jazba: встроенное расширение Git недоступно.");
    return;
  }

  const repository = resolveRepository(hint, git.repositories);
  if (!repository) {
    void vscode.window.showWarningMessage(
      git.repositories.length === 0
        ? "Jazba: в текущем окне нет git-репозитория."
        : "Jazba: несколько репозиториев — откройте нужный в панели «Система управления версиями».",
    );
    return;
  }

  try {
    await action(repository);
  } catch (err) {
    const message = errorMessage(err);
    channel.appendLine(`ERROR: ${message}`);
    void vscode.window.showErrorMessage(`Jazba: ${message}`);
  }
}

/** Текст ошибки; для упавшего `git` предпочитает его stderr. */
function errorMessage(err: unknown): string {
  const stderr = (err as { stderr?: unknown } | undefined)?.stderr;
  if (typeof stderr === "string" && stderr.trim()) {
    return stderr.trim();
  }
  return err instanceof ClaudeError || err instanceof Error ? err.message : String(err);
}

async function run(repository: GitRepository): Promise<void> {
  const cwd = repository.rootUri.fsPath;
  const config = readConfig();

  const diff = await resolveDiff(cwd);
  if (!diff) {
    return;
  }

  const examples = config.historyCount > 0 ? await collectExamples(cwd, config.historyCount) : [];
  channel.appendLine(`примеров из истории: ${examples.length}`);

  const prompt = buildPrompt({
    stat: diff.stat.trim(),
    diffBody: truncateDiff(diff.body, config.maxDiffChars),
    draft: repository.inputBox.value,
    language: config.language,
    style: config.style,
    length: config.length,
    examples,
  });

  const message = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: "Jazba: генерация сообщения коммита…",
    },
    async (_progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());
      channel.appendLine("--- prompt ---");
      channel.appendLine(prompt);
      const raw = await runClaude(buildClaudeInvocation(config), {
        input: prompt,
        timeoutMs: config.timeoutMs,
        cwd,
        signal: controller.signal,
        onDebug: (line) => channel.appendLine(line),
      });
      return sanitizeMessage(raw);
    },
  );

  if (message) {
    repository.inputBox.value = message;
  } else {
    void vscode.window.showWarningMessage("Jazba: модель вернула пустой ответ.");
  }
}

/**
 * Предлагает имя ветки по staged-изменениям (как {@link run}) и ничего не меняет
 * без подтверждения: «✓» — `git pull` (если есть upstream) и `git checkout -b`,
 * «✗» — отказ.
 */
async function runSuggestBranch(repository: GitRepository): Promise<void> {
  const cwd = repository.rootUri.fsPath;
  const config = readConfig();

  const diff = await resolveDiff(cwd);
  if (!diff) {
    return;
  }

  const current = await currentBranch(cwd);
  const prompt = buildBranchPrompt({
    stat: diff.stat.trim(),
    diffBody: truncateDiff(diff.body, config.maxDiffChars),
    currentBranch: current,
    examples: await listBranches(cwd, 15),
  });

  const name = await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      cancellable: true,
      title: "Jazba: подбираю имя ветки…",
    },
    async (_progress, token) => {
      const controller = new AbortController();
      token.onCancellationRequested(() => controller.abort());
      channel.appendLine("--- branch prompt ---");
      channel.appendLine(prompt);
      const raw = await runClaude(buildClaudeInvocation(config), {
        input: prompt,
        timeoutMs: config.timeoutMs,
        cwd,
        signal: controller.signal,
        onDebug: (line) => channel.appendLine(line),
      });
      return sanitizeBranchName(raw);
    },
  );

  if (!name) {
    void vscode.window.showWarningMessage("Jazba: модель не вернула пригодного имени ветки.");
    return;
  }
  if (name === current) {
    void vscode.window.showInformationMessage(`Jazba: вы уже на ветке «${name}».`);
    return;
  }

  const exists = await branchExists(cwd, name);
  const upstream = await hasUpstream(cwd);
  const action = exists ? "Переключиться на существующую ветку" : "Создать ветку";
  const pullNote = upstream ? " Перед этим выполнится git pull." : "";
  const answer = await vscode.window.showInformationMessage(
    `Jazba: ${action} «${name}»?${pullNote}`,
    "✓",
    "✗",
  );
  if (answer !== "✓") {
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: `Jazba: переход на ветку «${name}»…` },
    async () => {
      if (upstream) {
        channel.appendLine("$ git pull");
        channel.appendLine(await pull(cwd));
      } else {
        channel.appendLine("у текущей ветки нет upstream — git pull пропущен");
      }
      const args = exists ? `checkout ${name}` : `checkout -b ${name}`;
      channel.appendLine(`$ git ${args}`);
      channel.appendLine(await checkoutBranch(cwd, name, !exists));
    },
  );
  void vscode.window.showInformationMessage(`Jazba: вы на ветке «${name}».`);
}

/**
 * Берёт staged-дифф; если пусто — предлагает использовать все изменения.
 * Возвращает `undefined`, если генерировать нечего или пользователь отказался.
 */
async function resolveDiff(cwd: string): Promise<{ stat: string; body: string } | undefined> {
  const collect = (mode: DiffMode) => collectDiff(cwd, mode);

  let diff = await collect("staged");
  if (diff.stat.trim()) {
    return diff;
  }

  const answer = await vscode.window.showQuickPick(["Использовать все изменения", "Отмена"], {
    placeHolder: "В индексе нет изменений (git add). Что делать?",
  });
  if (answer !== "Использовать все изменения") {
    return undefined;
  }

  diff = await collect("all");
  if (!diff.stat.trim()) {
    void vscode.window.showWarningMessage("Jazba: изменений не найдено.");
    return undefined;
  }
  return diff;
}
