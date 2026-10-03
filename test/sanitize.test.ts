import test from "node:test";
import assert from "node:assert/strict";

import { sanitizeMessage } from "../src/sanitize";

test("leaves a clean message untouched", () => {
  const msg = "feat: add retry to uploader\n\n- wrap the call in a 3x loop";
  assert.equal(sanitizeMessage(msg), msg);
});

test("trims surrounding whitespace and blank lines", () => {
  assert.equal(sanitizeMessage("\n\n  fix: correct typo  \n\n"), "fix: correct typo");
});

test("removes a fenced code block that wraps the whole message", () => {
  const input = "```\nfix: correct off-by-one\n```";
  assert.equal(sanitizeMessage(input), "fix: correct off-by-one");
});

test("removes a language-tagged fence that wraps the whole message", () => {
  const input = "```text\nchore: bump deps\n\n- bump eslint\n```";
  assert.equal(sanitizeMessage(input), "chore: bump deps\n\n- bump eslint");
});

test("strips symmetric wrapping double quotes", () => {
  assert.equal(sanitizeMessage('"docs: update readme"'), "docs: update readme");
});

test("keeps internal backticks and quotes intact", () => {
  const msg = 'fix: escape `--flag` in "help" output';
  assert.equal(sanitizeMessage(msg), msg);
});

test("collapses three or more consecutive newlines to a blank line", () => {
  assert.equal(
    sanitizeMessage("feat: x\n\n\n\n- detail"),
    "feat: x\n\n- detail",
  );
});

test("normalises CRLF to LF", () => {
  assert.equal(sanitizeMessage("feat: x\r\n\r\n- detail"), "feat: x\n\n- detail");
});

test("strips a trailing Co-Authored-By line", () => {
  const input = "fix: correct parser\n\nCo-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>";
  assert.equal(sanitizeMessage(input), "fix: correct parser");
});

test("strips several trailing co-author and generated-with lines", () => {
  const input =
    "feat: add panel\n\n- rows\n\nCo-authored-by: A <a@x>\nCo-Authored-By: B <b@y>\n🤖 Generated with [Claude Code](https://claude.com/claude-code)";
  assert.equal(sanitizeMessage(input), "feat: add panel\n\n- rows");
});

test("keeps a body line that merely mentions co-authoring in prose", () => {
  const msg = "docs: explain how co-authored-by trailers work";
  assert.equal(sanitizeMessage(msg), msg);
});
