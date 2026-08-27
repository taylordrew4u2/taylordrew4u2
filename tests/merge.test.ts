import { test } from "node:test";
import assert from "node:assert/strict";
import { merge } from "../src/lib/merge.ts";

test("merges nested objects key by key", () => {
  const base = { site: { name: "Pins", colors: { bg: "#000", fg: "#fff" } } };
  const result = merge(base, { site: { colors: { fg: "#eee" } } });
  assert.deepEqual(result, { site: { name: "Pins", colors: { bg: "#000", fg: "#eee" } } });
});

test("replaces arrays wholesale so deletions actually delete", () => {
  const base = { posts: [{ id: "a" }, { id: "b" }, { id: "c" }] };
  const result = merge(base, { posts: [{ id: "a" }, { id: "c" }] });
  assert.deepEqual(result.posts, [{ id: "a" }, { id: "c" }]);
});

test("an empty array clears the list rather than leaving it untouched", () => {
  assert.deepEqual(merge({ reels: [{ id: "a" }] }, { reels: [] }), { reels: [] });
});

test("undefined in the patch keeps the base value", () => {
  assert.deepEqual(merge({ title: "Kept" }, { title: undefined }), { title: "Kept" });
});

test("null overwrites, because null is a real value", () => {
  assert.deepEqual(merge({ cover: "x.png" }, { cover: null }), { cover: null });
});

test("keys absent from the base are carried through", () => {
  assert.deepEqual(merge({ a: 1 }, { b: 2 }), { a: 1, b: 2 });
});

test("a new field in the defaults survives a patch that predates it", () => {
  // This is the no-migration guarantee: stored content is always the patch.
  const defaults = { hero: { logo: "logo.png", heightVh: 50, newField: "default" } };
  const stored = { hero: { logo: "custom.png", heightVh: 70 } };
  assert.deepEqual(merge(defaults, stored), {
    hero: { logo: "custom.png", heightVh: 70, newField: "default" },
  });
});

test("does not mutate the base", () => {
  const base = { site: { name: "Pins" } };
  merge(base, { site: { name: "Changed" } });
  assert.equal(base.site.name, "Pins");
});

test("a scalar patch over an object replaces it", () => {
  assert.equal(merge({ a: 1 }, "gone"), "gone");
});
