import test from "node:test";
import assert from "node:assert/strict";

import { buildPrompt } from "../src/prompt";

const baseInput = {
  stat: " src/app.ts | 4 ++--\n 1 file changed, 2 insertions(+), 2 deletions(-)",
  diffBody: "diff --git a/src/app.ts b/src/app.ts\n-const x = 1\n+const x = 2",
};

test("embeds the diff stat verbatim", () => {
  assert.ok(buildPrompt(baseInput).includes(baseInput.stat));
});

test("embeds the diff body verbatim", () => {
  assert.ok(buildPrompt(baseInput).includes(baseInput.diffBody));
});

test("instructs the model to return only the commit message", () => {
  assert.match(buildPrompt(baseInput), /только текст сообщения коммита/i);
});

test("includes the user's draft as a hint when provided", () => {
  const prompt = buildPrompt({ ...baseInput, draft: "про кэш" });
  assert.ok(prompt.includes("про кэш"));
  assert.match(prompt, /черновик|подсказк/i);
});

test("omits the hint section when the draft is empty or whitespace", () => {
  const prompt = buildPrompt({ ...baseInput, draft: "   " });
  assert.doesNotMatch(prompt, /черновик|подсказк/i);
});

test("produces a non-empty prompt", () => {
  assert.ok(buildPrompt(baseInput).trim().length > 0);
});

test("asks for Russian output by default", () => {
  assert.match(buildPrompt(baseInput), /на русском языке/i);
});

test("asks for Russian output when language is 'russian'", () => {
  assert.match(buildPrompt({ ...baseInput, language: "russian" }), /на русском языке/i);
});

test("asks for English output when language is 'english'", () => {
  const prompt = buildPrompt({ ...baseInput, language: "english" });
  assert.match(prompt, /in English/i);
  assert.doesNotMatch(prompt, /на русском языке/i);
});

test("passes an arbitrary language name through to the instruction", () => {
  assert.match(buildPrompt({ ...baseInput, language: "German" }), /German/);
});

test("embeds the commit-style instruction (conventional)", () => {
  assert.match(buildPrompt({ ...baseInput, style: "conventional" }), /Conventional Commits/);
});

test("embeds the length instruction (short)", () => {
  assert.match(buildPrompt({ ...baseInput, length: "short" }), /одн[ойу] строк/i);
});

test("defaults to auto style and medium length", () => {
  const prompt = buildPrompt(baseInput);
  assert.match(prompt, /истори/i);
  assert.match(prompt, /1[–-]3 пункт/i);
});

test("includes history examples verbatim with a mimic-not-copy instruction", () => {
  const prompt = buildPrompt({
    ...baseInput,
    examples: ["feat(api): add pagination", "fix: guard against null user"],
  });
  assert.ok(prompt.includes("feat(api): add pagination"));
  assert.ok(prompt.includes("fix: guard against null user"));
  assert.match(prompt, /подражай.*стил|не копируй/i);
});

test("adds no history section when there are no examples", () => {
  assert.doesNotMatch(buildPrompt({ ...baseInput, examples: [] }), /Примеры недавних сообщений/i);
});
