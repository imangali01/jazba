import test from "node:test";
import assert from "node:assert/strict";

import { runClaude, ClaudeError } from "../src/claude";

const node = process.execPath;

test("writes the prompt to stdin and resolves with stdout", async () => {
  const out = await runClaude(
    { command: node, args: ["-e", "process.stdin.pipe(process.stdout)"] },
    { input: "привет мир", timeoutMs: 5000 },
  );
  assert.equal(out, "привет мир");
});

test("rejects with a ClaudeError on a non-zero exit code", async () => {
  await assert.rejects(
    runClaude(
      { command: node, args: ["-e", "process.exit(3)"] },
      { input: "", timeoutMs: 5000 },
    ),
    (err: unknown) => err instanceof ClaudeError && /3/.test((err as Error).message),
  );
});

test("kills the process and rejects when the timeout elapses", async () => {
  await assert.rejects(
    runClaude(
      { command: node, args: ["-e", "setTimeout(() => {}, 10000)"] },
      { input: "", timeoutMs: 150 },
    ),
    (err: unknown) => err instanceof ClaudeError && /таймаут/i.test((err as Error).message),
  );
});

test("rejects immediately when the signal is already aborted", async () => {
  await assert.rejects(
    runClaude(
      { command: node, args: ["-e", "process.stdin.pipe(process.stdout)"] },
      { input: "x", timeoutMs: 5000, signal: AbortSignal.abort() },
    ),
    (err: unknown) => err instanceof ClaudeError && /отмен/i.test((err as Error).message),
  );
});

test("kills the process and rejects when the signal aborts mid-run", async () => {
  const controller = new AbortController();
  const promise = runClaude(
    { command: node, args: ["-e", "setTimeout(() => {}, 10000)"] },
    { input: "", timeoutMs: 5000, signal: controller.signal },
  );
  setTimeout(() => controller.abort(), 50);
  await assert.rejects(promise, (err: unknown) => err instanceof ClaudeError && /отмен/i.test((err as Error).message));
});

test("rejects with a ClaudeError when the binary cannot be spawned", async () => {
  await assert.rejects(
    runClaude(
      { command: "definitely-not-a-real-binary-xyz", args: [] },
      { input: "", timeoutMs: 5000 },
    ),
    (err: unknown) => err instanceof ClaudeError,
  );
});
