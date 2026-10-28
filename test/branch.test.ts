import test from "node:test";
import assert from "node:assert/strict";

import { branchNameError, buildBranchPrompt, sanitizeBranchName } from "../src/branch";

test("sanitizeBranchName leaves a clean name untouched", () => {
  assert.equal(sanitizeBranchName("feat/branch-suggestion"), "feat/branch-suggestion");
});

test("sanitizeBranchName takes the first line and strips fences and quotes", () => {
  assert.equal(sanitizeBranchName("```\nfeat/add-retry\n```"), "feat/add-retry");
  assert.equal(sanitizeBranchName("`fix/typo`\nexplanation"), "fix/typo");
  assert.equal(sanitizeBranchName('"docs/readme"'), "docs/readme");
});

test("sanitizeBranchName lowercases and turns spaces into dashes", () => {
  assert.equal(sanitizeBranchName("Feat/Add Retry  Loop"), "feat/add-retry-loop");
});

test("sanitizeBranchName drops characters git forbids", () => {
  assert.equal(sanitizeBranchName("fix/a..b~c^d:e?f*g[h]@{i}"), "fix/a.bcdefghi");
  assert.equal(sanitizeBranchName("-feat//x.lock/"), "feat/x");
  assert.equal(sanitizeBranchName("feat/.hidden."), "feat/hidden");
});

test("sanitizeBranchName returns empty string when nothing is left", () => {
  assert.equal(sanitizeBranchName("  \n  "), "");
  assert.equal(sanitizeBranchName("Ветка"), "");
});

test("sanitizeBranchName caps the length without a trailing separator", () => {
  const name = sanitizeBranchName(`feat/${"a".repeat(54)}-bbbbbbb`);
  assert.ok(name.length <= 60);
  assert.ok(!/[/.-]$/.test(name));
});

test("buildBranchPrompt includes stat, diff, current branch and examples", () => {
  const prompt = buildBranchPrompt({
    stat: "src/a.ts | 2 +-",
    diffBody: "+x",
    currentBranch: "main",
    examples: ["feat/login", " "],
  });
  assert.match(prompt, /src\/a\.ts \| 2 \+-/);
  assert.match(prompt, /\+x/);
  assert.match(prompt, /Текущая ветка: main/);
  assert.match(prompt, /- feat\/login/);
});

test("buildBranchPrompt omits optional sections when absent", () => {
  const prompt = buildBranchPrompt({ stat: "s", diffBody: "d" });
  assert.doesNotMatch(prompt, /Текущая ветка/);
  assert.doesNotMatch(prompt, /Существующие ветки/);
});

test("branchNameError accepts typical names, including uppercase", () => {
  for (const name of ["feat/login", "JIRA-123-fix", "release/1.2.0", "user/me/try_it"]) {
    assert.equal(branchNameError(name), undefined, name);
  }
});

test("branchNameError rejects names git refuses", () => {
  for (const name of ["", "feat login", "a..b", "a@{b", "@", "-x", "x/", "x.", "a//b", "a/.b", "x.lock", "a:b", "a~b"]) {
    assert.notEqual(branchNameError(name), undefined, JSON.stringify(name));
  }
});
