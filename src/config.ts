import * as vscode from "vscode";

export interface JazbaConfig {
  claudePath: string;
  claudeExtraArgs: string[];
  timeoutMs: number;
  maxDiffChars: number;
  language: string;
  style: string;
  length: string;
  historyCount: number;
}

/** Читает настройки расширения с подстановкой значений по умолчанию. */
export function readConfig(): JazbaConfig {
  const cfg = vscode.workspace.getConfiguration("jazba");
  return {
    claudePath: cfg.get<string>("claudePath", "claude"),
    claudeExtraArgs: cfg.get<string[]>("claudeExtraArgs", []),
    timeoutMs: cfg.get<number>("timeoutSeconds", 90) * 1000,
    maxDiffChars: cfg.get<number>("maxDiffChars", 4000),
    language: cfg.get<string>("language", "russian"),
    style: cfg.get<string>("commitStyle", "auto"),
    length: cfg.get<string>("length", "medium"),
    historyCount: cfg.get<number>("historyCount", 20),
  };
}
