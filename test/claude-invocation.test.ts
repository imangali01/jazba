import test from "node:test";
import assert from "node:assert/strict";

import { buildClaudeInvocation } from "../src/claude";

test("defaults to `claude -p`", () => {
  assert.deepEqual(buildClaudeInvocation({}), { command: "claude", args: ["-p"] });
});

test("respects a custom binary path", () => {
  const result = buildClaudeInvocation({ claudePath: "/opt/claude/bin/claude" });
  assert.equal(result.command, "/opt/claude/bin/claude");
});

test("appends extra args after -p", () => {
  const result = buildClaudeInvocation({
    claudePath: "claude",
    extraArgs: ["--model", "claude-sonnet-5"],
  });
  assert.deepEqual(result.args, ["-p", "--model", "claude-sonnet-5"]);
});

test("falls back to `claude` when the path is blank", () => {
  assert.equal(buildClaudeInvocation({ claudePath: "   " }).command, "claude");
});

test("tolerates a missing extraArgs array", () => {
  assert.deepEqual(buildClaudeInvocation({ claudePath: "claude" }).args, ["-p"]);
});
