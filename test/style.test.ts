import test from "node:test";
import assert from "node:assert/strict";

import {
  COMMIT_STYLES,
  LENGTHS,
  normalizeStyle,
  normalizeLength,
  styleLabel,
  lengthLabel,
  styleInstruction,
  lengthInstruction,
} from "../src/style";

test("there are exactly five commit styles", () => {
  assert.equal(COMMIT_STYLES.length, 5);
  assert.deepEqual([...COMMIT_STYLES], ["auto", "conventional", "plain", "gitmoji", "detailed"]);
});

test("there are three lengths", () => {
  assert.deepEqual([...LENGTHS], ["short", "medium", "long"]);
});

test("normalizeStyle keeps known values and is case-insensitive", () => {
  assert.equal(normalizeStyle("conventional"), "conventional");
  assert.equal(normalizeStyle("GITMOJI"), "gitmoji");
});

test("normalizeStyle falls back to 'auto' for anything unknown", () => {
  assert.equal(normalizeStyle("nonsense"), "auto");
  assert.equal(normalizeStyle(""), "auto");
});

test("normalizeLength falls back to 'medium'", () => {
  assert.equal(normalizeLength("long"), "long");
  assert.equal(normalizeLength("huge"), "medium");
});

test("every style and length has a non-empty Russian label", () => {
  for (const s of COMMIT_STYLES) {
    assert.ok(styleLabel(s).trim().length > 0);
  }
  for (const l of LENGTHS) {
    assert.ok(lengthLabel(l).trim().length > 0);
  }
});

test("style instructions are distinct and on-topic", () => {
  assert.match(styleInstruction("auto"), /истори/i);
  assert.match(styleInstruction("conventional"), /Conventional Commits/);
  assert.match(styleInstruction("plain"), /без префикс/i);
  assert.match(styleInstruction("gitmoji"), /эмодзи/i);
  assert.match(styleInstruction("detailed"), /тело/i);
});

test("length instructions reflect the requested size", () => {
  assert.match(lengthInstruction("short"), /одн[ойу] строк/i);
  assert.match(lengthInstruction("medium"), /короткое тело|до трёх|1[–-]3/i);
  assert.match(lengthInstruction("long"), /развёрнут|подробн/i);
});
