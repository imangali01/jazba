import * as vscode from "vscode";

import { readConfig } from "./config";
import { describeControlRows, type ControlRow } from "./controls";
import { COMMIT_STYLES, LENGTHS, styleLabel, lengthLabel } from "./style";

/** Провайдер дерева для панели Jazba в Activity Bar. */
export class ControlsProvider implements vscode.TreeDataProvider<ControlRow> {
  private readonly changed = new vscode.EventEmitter<void>();
  readonly onDidChangeTreeData = this.changed.event;

  refresh(): void {
    this.changed.fire();
  }

  getTreeItem(row: ControlRow): vscode.TreeItem {
    const item = new vscode.TreeItem(row.label, vscode.TreeItemCollapsibleState.None);
    item.command = { command: row.command, title: row.label };
    item.iconPath = new vscode.ThemeIcon(row.icon);
    return item;
  }

  getChildren(): ControlRow[] {
    const cfg = readConfig();
    return describeControlRows({ language: cfg.language, style: cfg.style, length: cfg.length });
  }
}

async function updateGlobal(key: string, value: string, onChange: () => void): Promise<void> {
  await vscode.workspace
    .getConfiguration("jazba")
    .update(key, value, vscode.ConfigurationTarget.Global);
  onChange();
}

/** QuickPick выбора языка сообщения. */
export async function pickLanguage(onChange: () => void): Promise<void> {
  const choice = await vscode.window.showQuickPick(
    [
      { label: "Русский", value: "russian" },
      { label: "English", value: "english" },
    ],
    { placeHolder: "Язык генерируемого сообщения коммита" },
  );
  if (choice) {
    await updateGlobal("language", choice.value, onChange);
  }
}

/** QuickPick выбора стиля сообщения (5 вариантов). */
export async function pickStyle(onChange: () => void): Promise<void> {
  const current = readConfig().style;
  const choice = await vscode.window.showQuickPick(
    COMMIT_STYLES.map((value) => ({
      label: styleLabel(value),
      description: value === current ? "текущий" : value,
      value,
    })),
    { placeHolder: "Стиль сообщения коммита" },
  );
  if (choice) {
    await updateGlobal("commitStyle", choice.value, onChange);
  }
}

/** QuickPick выбора длины сообщения. */
export async function pickLength(onChange: () => void): Promise<void> {
  const current = readConfig().length;
  const choice = await vscode.window.showQuickPick(
    LENGTHS.map((value) => ({
      label: lengthLabel(value),
      description: value === current ? "текущая" : value,
      value,
    })),
    { placeHolder: "Длина сообщения коммита" },
  );
  if (choice) {
    await updateGlobal("length", choice.value, onChange);
  }
}
