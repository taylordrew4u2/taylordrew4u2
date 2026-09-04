import { test } from "node:test";
import assert from "node:assert/strict";
import { mapWithLimit, planReads, pruneTo, type PileEntry } from "../src/lib/pile.ts";

const entry = (id: string, version: string): PileEntry => ({ id, version });

test("a file the store still reports unchanged is not read again", () => {
  const cached = new Map([
    ["a", "sha-a"],
    ["b", "sha-b"],
  ]);
  const plan = planReads(
    [entry("a", "sha-a"), entry("b", "sha-b"), entry("c", "sha-c")],
    (id) => cached.get(id)
  );

  assert.deepEqual(plan.reuse, ["a", "b"]);
  assert.deepEqual(plan.read, ["c"]);
});

test("a file whose content changed is read again", () => {
  // This is what keeps a drawn submission from being drawn twice: the write
  // changes the sha, so the next listing can no longer be answered from memory.
  const cached = new Map([["a", "sha-old"]]);
  const plan = planReads([entry("a", "sha-new")], (id) => cached.get(id));

  assert.deepEqual(plan.reuse, []);
  assert.deepEqual(plan.read, ["a"]);
});

test("a driver that cannot say whether a file changed is always read", () => {
  // An empty version means the listing carries no content token. Reusing on
  // that would be a guess, and the guess would be about live show data.
  const cached = new Map([["a", ""]]);
  const plan = planReads([entry("a", "")], (id) => cached.get(id));

  assert.deepEqual(plan.reuse, []);
  assert.deepEqual(plan.read, ["a"]);
});

test("nothing cached means everything is read", () => {
  const plan = planReads([entry("a", "x"), entry("b", "y")], () => undefined);
  assert.deepEqual(plan.reuse, []);
  assert.deepEqual(plan.read, ["a", "b"]);
});

test("mapWithLimit keeps input order however the work resolves", async () => {
  const out = await mapWithLimit([30, 10, 20, 0], 2, async (ms) => {
    await new Promise((resolve) => setTimeout(resolve, ms));
    return ms;
  });
  assert.deepEqual(out, [30, 10, 20, 0]);
});

test("mapWithLimit never runs more than the limit at once", async () => {
  let running = 0;
  let peak = 0;
  await mapWithLimit(Array.from({ length: 50 }, (_, i) => i), 5, async () => {
    running += 1;
    peak = Math.max(peak, running);
    await new Promise((resolve) => setTimeout(resolve, 1));
    running -= 1;
    return null;
  });
  assert.ok(peak <= 5, `ran ${peak} at once, cap was 5`);
  assert.ok(peak > 1, "did not run anything in parallel");
});

test("mapWithLimit does every item exactly once", async () => {
  const items = Array.from({ length: 37 }, (_, i) => i);
  const seen: number[] = [];
  const out = await mapWithLimit(items, 4, async (n) => {
    seen.push(n);
    return n * 2;
  });
  assert.deepEqual([...seen].sort((a, b) => a - b), items);
  assert.deepEqual(out, items.map((n) => n * 2));
});

test("mapWithLimit handles an empty list without hanging", async () => {
  assert.deepEqual(await mapWithLimit([], 5, async () => 1), []);
});

test("pruneTo forgets what the store no longer lists", () => {
  const cache = new Map<string, unknown>([
    ["kept", 1],
    ["deleted", 2],
  ]);
  pruneTo(cache, [entry("kept", "v")]);
  assert.deepEqual([...cache.keys()], ["kept"]);
});
