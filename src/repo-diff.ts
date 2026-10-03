import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

export type DiffMode = "staged" | "all";

export interface CollectedDiff {
  /** Вывод `git diff … --stat` (в промпт идёт целиком). */
  stat: string;
  /** Полное тело диффа (обрезкой занимается вызывающий код). */
  body: string;
}

/**
 * Считывает дифф репозитория через `git`.
 * - `staged` — только проиндексированные изменения (`--staged`);
 * - `all` — все изменения отслеживаемых файлов относительно `HEAD`.
 */
export async function collectDiff(cwd: string, mode: DiffMode): Promise<CollectedDiff> {
  const selector = mode === "staged" ? ["--staged"] : ["HEAD"];
  const options = { cwd, maxBuffer: 32 * 1024 * 1024 };

  const [stat, body] = await Promise.all([
    run("git", ["diff", ...selector, "--stat"], options),
    run("git", ["diff", ...selector], options),
  ]);

  return { stat: stat.stdout, body: body.stdout };
}
