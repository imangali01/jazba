import test from "node:test";
import assert from "node:assert/strict";

import { truncateDiff, TRUNCATION_MARKER } from "../src/diff";

test("returns the body unchanged when it is within the limit", () => {
  const body = "diff --git a/x b/x\n+one line\n";
  assert.equal(truncateDiff(body, 1000), body);
});

test("returns the body unchanged when it is exactly at the limit", () => {
  const body = "abcde";
  assert.equal(truncateDiff(body, 5), body);
});

test("appends the truncation marker when the body is over the limit", () => {
  const result = truncateDiff("a".repeat(50), 10);
  assert.ok(result.endsWith(TRUNCATION_MARKER));
});

test("keeps the kept portion within the limit", () => {
  const result = truncateDiff("a".repeat(50), 10);
  const kept = result.slice(0, result.length - TRUNCATION_MARKER.length);
  assert.ok(kept.length <= 10, `kept ${kept.length} chars`);
});

test("prefers to cut at a line boundary", () => {
  const body = "line one\nline two\nline three\n";
  const result = truncateDiff(body, 15);
  assert.ok(result.startsWith("line one\n"));
  assert.ok(!result.includes("line two"));
});

test("returns an empty string unchanged", () => {
  assert.equal(truncateDiff("", 10), "");
});
