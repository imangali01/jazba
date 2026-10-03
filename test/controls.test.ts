import test from "node:test";
import assert from "node:assert/strict";

import { languageLabel, describeControlRows } from "../src/controls";

test("languageLabel maps 'russian' to Русский", () => {
  assert.equal(languageLabel("russian"), "Русский");
});

test("languageLabel maps 'english' to English", () => {
  assert.equal(languageLabel("english"), "English");
});

test("languageLabel is case-insensitive and accepts short codes", () => {
  assert.equal(languageLabel("RU"), "Русский");
  assert.equal(languageLabel("En"), "English");
});

test("languageLabel passes an unknown language through unchanged", () => {
  assert.equal(languageLabel("german"), "german");
});

const fullState = { language: "russian", style: "auto", length: "medium" };

test("describeControlRows returns generate / language / style / length / log rows", () => {
  assert.deepEqual(
    describeControlRows(fullState).map((r) => r.command),
    [
      "jazba.generate",
      "jazba.pickLanguage",
      "jazba.pickStyle",
      "jazba.pickLength",
      "jazba.openLog",
    ],
  );
});

test("the language row label reflects the current language", () => {
  assert.equal(describeControlRows({ ...fullState, language: "russian" })[1].label, "Язык: Русский");
  assert.equal(describeControlRows({ ...fullState, language: "english" })[1].label, "Язык: English");
});

test("the style row label reflects the current style", () => {
  assert.equal(
    describeControlRows({ ...fullState, style: "conventional" })[2].label,
    "Стиль: Conventional Commits",
  );
});

test("the length row label reflects the current length", () => {
  assert.equal(describeControlRows({ ...fullState, length: "long" })[3].label, "Длина: подробно");
});
