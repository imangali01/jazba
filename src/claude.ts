import { spawn } from "node:child_process";

export interface ClaudeConfig {
  claudePath?: string;
  extraArgs?: string[];
}

export interface ClaudeInvocation {
  command: string;
  args: string[];
}

/** Строит команду и аргументы запуска CLI. Промпт передаётся через stdin, не аргументом. */
export function buildClaudeInvocation(config: ClaudeConfig): ClaudeInvocation {
  const path = config.claudePath?.trim();
  const extra = Array.isArray(config.extraArgs) ? config.extraArgs : [];
  return {
    command: path && path.length > 0 ? path : "claude",
    args: ["-p", ...extra],
  };
}

export class ClaudeError extends Error {}

export interface RunOptions {
  input: string;
  timeoutMs: number;
  cwd?: string;
  signal?: AbortSignal;
  onDebug?: (line: string) => void;
}

/**
 * Запускает CLI, пишет `input` в stdin, ждёт завершения и возвращает stdout.
 * Отмена через `signal` или таймаут убивают процесс и отклоняют промис
 * ошибкой {@link ClaudeError}.
 */
export function runClaude(invocation: ClaudeInvocation, options: RunOptions): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    if (options.signal?.aborted) {
      reject(new ClaudeError("Генерация отменена."));
      return;
    }

    const child = spawn(invocation.command, invocation.args, {
      cwd: options.cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let settled = false;

    const settle = (action: () => void): void => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timer);
      options.signal?.removeEventListener("abort", onAbort);
      action();
    };

    const timer = setTimeout(() => {
      child.kill();
      const seconds = Math.round(options.timeoutMs / 1000);
      settle(() => reject(new ClaudeError(`Превышен таймаут ${seconds} с.`)));
    }, options.timeoutMs);

    const onAbort = (): void => {
      child.kill();
      settle(() => reject(new ClaudeError("Генерация отменена.")));
    };
    options.signal?.addEventListener("abort", onAbort);

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (err) => {
      settle(() =>
        reject(new ClaudeError(`Не удалось запустить «${invocation.command}»: ${err.message}`)),
      );
    });

    child.on("close", (code) => {
      options.onDebug?.(`exit code: ${code ?? "null"}`);
      if (stderr.trim()) {
        options.onDebug?.(`stderr: ${stderr.trim()}`);
      }
      settle(() => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new ClaudeError(`CLI завершился с кодом ${code}. ${stderr.trim()}`.trim()));
        }
      });
    });

    child.stdin.on("error", () => {
      /* процесс мог завершиться раньше, чем мы закрыли stdin — не роняем промис */
    });
    child.stdin.end(options.input);
  });
}
