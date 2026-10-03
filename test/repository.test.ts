import test from "node:test";
import assert from "node:assert/strict";

import { resolveRepository } from "../src/repository";

function repo(uri: string) {
  return { rootUri: { toString: () => uri } };
}

test("returns the only repository when there is exactly one and no hint", () => {
  const only = repo("file:///work/app");
  assert.equal(resolveRepository(undefined, [only]), only);
});

test("returns undefined when there are several repositories and no hint", () => {
  const repos = [repo("file:///work/a"), repo("file:///work/b")];
  assert.equal(resolveRepository(undefined, repos), undefined);
});

test("matches the repository whose rootUri equals the hint's rootUri", () => {
  const a = repo("file:///work/a");
  const b = repo("file:///work/b");
  const hint = { rootUri: { toString: () => "file:///work/b" } };
  assert.equal(resolveRepository(hint, [a, b]), b);
});

test("accepts a hint whose rootUri is a plain string", () => {
  const a = repo("file:///work/a");
  const b = repo("file:///work/b");
  assert.equal(resolveRepository({ rootUri: "file:///work/a" }, [a, b]), a);
});

test("falls back to the single repository when the hint matches nothing", () => {
  const only = repo("file:///work/app");
  assert.equal(resolveRepository({ rootUri: "file:///other" }, [only]), only);
});

test("returns undefined when the list is empty", () => {
  assert.equal(resolveRepository(undefined, []), undefined);
});
