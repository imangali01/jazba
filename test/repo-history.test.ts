import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { collectExamples } from "../src/repo-history";

function repoWithHistory(): string {
  const dir = mkdtempSync(join(tmpdir(), "commiter-hist-"));
  const git = (...args: string[]) => execFileSync("git", args, { cwd: dir });
  git("init", "-q");
  git("config", "user.email", "owner@example.com");
  git("config", "user.name", "Owner");

  const commitAs = (email: string, name: string, subject: string) => {
    writeFileSync(join(dir, "f.txt"), subject);
    git("add", "-A");
    git("-c", `user.email=${email}`, "-c", `user.name=${name}`, "commit", "-qm", subject);
  };

  for (let i = 0; i < 5; i++) {
    commitAs("owner@example.com", "Owner", `feat: owner change ${i}`);
  }
  for (let i = 0; i < 3; i++) {
    commitAs("other@example.com", "Other", `fix: other change ${i}`);
  }
  return dir;
}

test("collectExamples returns recent commit messages from both authors", async () => {
  const dir = repoWithHistory();
  const examples = await collectExamples(dir, 20);

  assert.ok(examples.length >= 6 && examples.length <= 8);
  assert.ok(examples.some((m) => m.startsWith("feat: owner change")));
  assert.ok(examples.some((m) => m.startsWith("fix: other change")));
});

test("collectExamples respects the requested count", async () => {
  const dir = repoWithHistory();
  const examples = await collectExamples(dir, 4);
  assert.ok(examples.length <= 4);
});

test("collectExamples returns [] for a repository with no commits", async () => {
  const dir = mkdtempSync(join(tmpdir(), "commiter-empty-"));
  execFileSync("git", ["init", "-q"], { cwd: dir });
  assert.deepEqual(await collectExamples(dir, 20), []);
});
