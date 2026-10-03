import { execFile } from "node:child_process";
import { promisify } from "node:util";

import {
  GIT_LOG_FORMAT,
  formatExamples,
  parseCommitLog,
  selectExamples,
} from "./history";

const run = promisify(execFile);

async function gitOutput(cwd: string, args: string[]): Promise<string | undefined> {
  try {
    const { stdout } = await run("git", args, { cwd, maxBuffer: 16 * 1024 * 1024 });
    return stdout;
  } catch {
    return undefined;
  }
}

/**
 * Собирает примеры недавних сообщений коммитов репозитория для подражания стилю.
 * Балансирует коммиты владельца (`git config user.email`) и остальных авторов.
 * Возвращает `[]`, если истории нет.
 */
export async function collectExamples(cwd: string, count: number): Promise<string[]> {
  const fetch = Math.max(count * 3, 60);
  const raw = await gitOutput(cwd, [
    "log",
    "--no-merges",
    `-n${fetch}`,
    `--pretty=format:${GIT_LOG_FORMAT}`,
  ]);
  if (!raw || raw.trim() === "") {
    return [];
  }

  const ownerEmail = (await gitOutput(cwd, ["config", "user.email"]))?.trim() || undefined;

  const selected = selectExamples(parseCommitLog(raw), ownerEmail, {
    limit: count,
    perBucket: Math.ceil(count / 2),
  });
  return formatExamples(selected);
}
