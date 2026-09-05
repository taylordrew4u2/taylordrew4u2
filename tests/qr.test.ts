import { test } from "node:test";
import assert from "node:assert/strict";
import { decisionsQrSvg } from "../src/lib/qr.ts";

test("the QR code is an SVG that encodes the given URL", async () => {
  const svg = await decisionsQrSvg("https://example.com/bad-decisions");
  assert.match(svg, /^<svg/);
  assert.match(svg, /<\/svg>\s*$/);
});

test("different URLs produce different codes", async () => {
  const a = await decisionsQrSvg("https://example.com/bad-decisions");
  const b = await decisionsQrSvg("https://another-site.test/bad-decisions");
  assert.notEqual(a, b);
});
