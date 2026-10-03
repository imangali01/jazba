import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { collectDiff } from "../src/repo-diff";

function initRepo(): string {
  const dir = mkdtempSync(join(tmpdir(), "commiter-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir });
  git("init", "-q");
  git("config", "user.email", "t@example.com");
  git("config", "user.name", "T");
  writeFileSync(join(dir, "app.js"), "const x = 1\n");
  git("add", "-A");
  git("commit", "-qm", "init");
  return dir;
}

test("returns stat and body for staged changes", async () => {
  const dir = initRepo();
  writeFileSync(join(dir, "app.js"), "const x = 2\n");
  execFileSync("git", ["add", "-A"], { cwd: dir });

  const { stat, body } = await collectDiff(dir, "staged");

  assert.match(stat, /app\.js/);
  assert.match(body, /^\+const x = 2$/m);
  assert.match(body, /^-const x = 1$/m);
});

test("returns an empty stat when nothing is staged", async () => {
  const dir = initRepo();
  const { stat } = await collectDiff(dir, "staged");
  assert.equal(stat.trim(), "");
});

test("mode 'all' includes unstaged tracked changes", async () => {
  const dir = initRepo();
  writeFileSync(join(dir, "app.js"), "const x = 3\n");

  const { body } = await collectDiff(dir, "all");

  assert.match(body, /^\+const x = 3$/m);
});
