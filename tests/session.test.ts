import { test } from "node:test";
import assert from "node:assert/strict";

/**
 * The admin gate is the one place where failing open would let anyone rewrite
 * the whole site, so these tests pin the direction it fails in.
 *
 * session.ts reads its configuration once at import time, so each case loads a
 * fresh copy of the module with the environment it is describing.
 */
async function loadAuth(env: Record<string, string | undefined>) {
  const saved = { ...process.env };
  Object.assign(process.env, env);
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
  }
  try {
    // A distinct query string per load defeats the module cache.
    return await import(`../src/lib/session.ts?case=${Math.random()}`);
  } finally {
    for (const key of Object.keys(process.env)) delete process.env[key];
    Object.assign(process.env, saved);
  }
}

test("production with no secrets set refuses every login", async () => {
  const auth = await loadAuth({
    NODE_ENV: "production",
    ADMIN_PASSWORD: undefined,
    ADMIN_SECRET: undefined,
  });
  assert.equal(auth.adminConfigured(), false);
  assert.equal(auth.checkPassword(""), false, "an empty password must not match an empty config");
  assert.equal(auth.checkPassword("weed"), false, "the old baked-in password must not work");
  assert.equal(auth.verifyToken(auth.issueToken()), false, "a minted cookie must not verify");
});

test("production with both secrets set works normally", async () => {
  const auth = await loadAuth({
    NODE_ENV: "production",
    ADMIN_PASSWORD: "a-real-password",
    ADMIN_SECRET: "a".repeat(64),
  });
  assert.equal(auth.adminConfigured(), true);
  assert.equal(auth.checkPassword("a-real-password"), true);
  assert.equal(auth.checkPassword("wrong"), false);
  assert.equal(auth.verifyToken(auth.issueToken()), true);
});

test("a token signed with a different secret never verifies", async () => {
  const mint = await loadAuth({
    NODE_ENV: "production",
    ADMIN_PASSWORD: "same-password",
    ADMIN_SECRET: "b".repeat(64),
  });
  const check = await loadAuth({
    NODE_ENV: "production",
    ADMIN_PASSWORD: "same-password",
    ADMIN_SECRET: "c".repeat(64),
  });
  // Knowing the password must not be enough to forge a session.
  assert.equal(check.verifyToken(mint.issueToken()), false);
});

test("development still runs with no configuration at all", async () => {
  const auth = await loadAuth({
    NODE_ENV: "development",
    ADMIN_PASSWORD: undefined,
    ADMIN_SECRET: undefined,
  });
  assert.equal(auth.adminConfigured(), true);
  assert.equal(auth.verifyToken(auth.issueToken()), true);
  assert.equal(auth.checkPassword("nope"), false);
});

test("a garbled or expired cookie is rejected", async () => {
  const auth = await loadAuth({
    NODE_ENV: "production",
    ADMIN_PASSWORD: "pw",
    ADMIN_SECRET: "d".repeat(64),
  });
  assert.equal(auth.verifyToken(undefined), false);
  assert.equal(auth.verifyToken(""), false);
  assert.equal(auth.verifyToken("no-dots"), false);
  assert.equal(auth.verifyToken(`${Date.now() - 1000}.abc.badsignature`), false);
});
