import test from "node:test";
import assert from "node:assert/strict";

import {
  parseCommitLog,
  selectExamples,
  formatExamples,
  hasEnoughHistory,
  type Commit,
} from "../src/history";

const US = "\x1f";
const RS = "\x1e";
const rawLog = (...recs: [string, string, string][]) =>
  recs.map(([h, e, m]) => `${h}${US}${e}${US}${m}`).join(RS) + RS;

const commit = (email: string, message = "msg"): Commit => ({ hash: "h", email, message });

test("parseCommitLog splits records and fields, trimming the message tail", () => {
  const parsed = parseCommitLog(rawLog(["h1", "a@x", "feat: one\n\nbody\n"], ["h2", "b@y", "fix: two"]));
  assert.equal(parsed.length, 2);
  assert.deepEqual(parsed[0], { hash: "h1", email: "a@x", message: "feat: one\n\nbody" });
  assert.equal(parsed[1].message, "fix: two");
});

test("parseCommitLog returns [] for blank input", () => {
  assert.deepEqual(parseCommitLog("   \n"), []);
});

test("selectExamples returns the newest N when the owner email is unknown", () => {
  const commits = Array.from({ length: 25 }, (_, i) => commit(i % 2 ? "a@x" : "b@y", `c${i}`));
  const picked = selectExamples(commits, undefined, { limit: 20, perBucket: 10 });
  assert.deepEqual(picked, commits.slice(0, 20));
});

test("selectExamples takes up to perBucket from the owner and from others", () => {
  const commits: Commit[] = [];
  for (let i = 0; i < 15; i++) {
    commits.push(commit("owner@x", `o${i}`), commit("other@y", `x${i}`));
  }
  const picked = selectExamples(commits, "owner@x", { limit: 20, perBucket: 10 });
  assert.equal(picked.filter((c) => c.email === "owner@x").length, 10);
  assert.equal(picked.filter((c) => c.email !== "owner@x").length, 10);
});

test("selectExamples backfills from the other bucket when one side is short", () => {
  const commits = [
    ...Array.from({ length: 3 }, (_, i) => commit("owner@x", `o${i}`)),
    ...Array.from({ length: 30 }, (_, i) => commit("other@y", `x${i}`)),
  ];
  const picked = selectExamples(commits, "owner@x", { limit: 20, perBucket: 10 });
  assert.equal(picked.length, 20);
  assert.equal(picked.filter((c) => c.email === "owner@x").length, 3);
});

test("selectExamples never returns more than the limit", () => {
  const commits = Array.from({ length: 25 }, (_, i) => commit("owner@x", `o${i}`));
  assert.equal(selectExamples(commits, "owner@x", { limit: 20, perBucket: 10 }).length, 20);
});

test("formatExamples strips trailer lines and drops empty messages", () => {
  const out = formatExamples([
    { hash: "h", email: "a@x", message: "feat: x\n\nCo-Authored-By: c <c@c>" },
    { hash: "h", email: "a@x", message: "   \n  " },
  ]);
  assert.deepEqual(out, ["feat: x"]);
});

test("hasEnoughHistory needs at least three examples", () => {
  assert.equal(hasEnoughHistory(["a", "b"]), false);
  assert.equal(hasEnoughHistory(["a", "b", "c"]), true);
});
