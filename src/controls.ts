import { lengthLabel, styleLabel } from "./style";

export interface ControlsState {
  language: string;
  style: string;
  length: string;
}

export interface ControlRow {
  label: string;
  command: string;
  /** Имя codicon без обёртки `$(...)`. */
  icon: string;
}

/** Человекочитаемая подпись языка для строки панели. */
export function languageLabel(language: string): string {
  const key = language.trim().toLowerCase();
  if (key === "russian" || key === "ru" || key === "русский") {
    return "Русский";
  }
  if (key === "english" || key === "en" || key === "английский") {
    return "English";
  }
  return language;
}

/** Описывает строки панели Jazba в Activity Bar (сверху вниз). */
export function describeControlRows(state: ControlsState): ControlRow[] {
  return [
    { label: "Сгенерировать сообщение коммита", command: "jazba.generate", icon: "sparkle" },
    { label: `Язык: ${languageLabel(state.language)}`, command: "jazba.pickLanguage", icon: "globe" },
    { label: `Стиль: ${styleLabel(state.style)}`, command: "jazba.pickStyle", icon: "symbol-color" },
    { label: `Длина: ${lengthLabel(state.length)}`, command: "jazba.pickLength", icon: "list-selection" },
    { label: "Открыть журнал", command: "jazba.openLog", icon: "output" },
  ];
}
