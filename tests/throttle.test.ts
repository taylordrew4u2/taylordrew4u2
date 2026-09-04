import { test } from "node:test";
import assert from "node:assert/strict";
import { Throttle, clientAddress } from "../src/lib/throttle.ts";

test("a key is allowed up to the limit and refused after it", () => {
  const throttle = new Throttle(3, 60_000);
  const t0 = 1_000_000;

  for (let i = 0; i < 3; i += 1) {
    assert.equal(throttle.retryAfter("ip", t0), 0, `attempt ${i + 1} should be allowed`);
    throttle.record("ip", t0);
  }
  assert.ok(throttle.retryAfter("ip", t0) > 0, "the fourth attempt should be refused");
});

test("checking does not spend an attempt", () => {
  // The login checks before verifying and only records a failure, so a person
  // typing the right password first time must not be charged for it.
  const throttle = new Throttle(1, 60_000);
  const t0 = 1_000_000;
  for (let i = 0; i < 10; i += 1) assert.equal(throttle.retryAfter("ip", t0), 0);
  throttle.record("ip", t0);
  assert.ok(throttle.retryAfter("ip", t0) > 0);
});

test("the window rolls forward rather than resetting in steps", () => {
  const throttle = new Throttle(2, 60_000);
  throttle.record("ip", 0);
  throttle.record("ip", 30_000);
  assert.ok(throttle.retryAfter("ip", 30_000) > 0);

  // The first attempt expires at 60s, which frees exactly one slot.
  assert.equal(throttle.retryAfter("ip", 60_001), 0);
  throttle.record("ip", 60_001);
  assert.ok(throttle.retryAfter("ip", 60_001) > 0, "the 30s attempt is still counted");
  assert.equal(throttle.retryAfter("ip", 90_001), 0);
});

test("retryAfter says how long is left, in whole seconds", () => {
  const throttle = new Throttle(1, 60_000);
  throttle.record("ip", 0);
  assert.equal(throttle.retryAfter("ip", 0), 60);
  assert.equal(throttle.retryAfter("ip", 30_000), 30);
  // Never reports zero while still blocked — a Retry-After of 0 invites an
  // immediate retry that would just be refused again.
  assert.equal(throttle.retryAfter("ip", 59_999), 1);
  assert.equal(throttle.retryAfter("ip", 60_000), 0);
});

test("keys are counted apart", () => {
  const throttle = new Throttle(1, 60_000);
  throttle.record("a", 0);
  assert.ok(throttle.retryAfter("a", 0) > 0);
  assert.equal(throttle.retryAfter("b", 0), 0);
});

test("clearing a key frees it immediately", () => {
  // A correct password should not leave the earlier typos counting against it.
  const throttle = new Throttle(1, 60_000);
  throttle.record("ip", 0);
  assert.ok(throttle.retryAfter("ip", 0) > 0);
  throttle.clear("ip");
  assert.equal(throttle.retryAfter("ip", 0), 0);
});

test("a flood of one-off keys cannot grow memory without bound", () => {
  const throttle = new Throttle(5, 60_000, 100);
  for (let i = 0; i < 5_000; i += 1) throttle.record(`ip-${i}`, i);
  // Whatever it dropped, it must not still be holding thousands of keys.
  let held = 0;
  for (let i = 0; i < 5_000; i += 1) if (throttle.retryAfter(`ip-${i}`, 5_000) > 0) held += 1;
  assert.ok(held <= 100, `still tracking ${held} keys`);
});

test("an attempt that expired is not held against a key", () => {
  const throttle = new Throttle(1, 1_000);
  throttle.record("ip", 0);
  assert.equal(throttle.retryAfter("ip", 1_001), 0);
});

test("clientAddress takes the caller, not the proxies behind it", () => {
  const from = (headers: Record<string, string>) => ({
    headers: { get: (name: string) => headers[name] ?? null },
  });
  assert.equal(clientAddress(from({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" })), "1.2.3.4");
  assert.equal(clientAddress(from({ "x-forwarded-for": "  1.2.3.4  " })), "1.2.3.4");
  assert.equal(clientAddress(from({ "x-real-ip": "9.9.9.9" })), "9.9.9.9");
  assert.equal(clientAddress(from({})), "unknown");
  // An empty header must not become an empty key shared by every caller.
  assert.equal(clientAddress(from({ "x-forwarded-for": "" })), "unknown");
  assert.equal(clientAddress(from({ "x-forwarded-for": " , 5.6.7.8" })), "unknown");
});
