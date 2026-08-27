import { test } from "node:test";
import assert from "node:assert/strict";
import { creditLine, taylorFaq, taylorKeyword, taylorName } from "../src/lib/brand.ts";
import type { Producer } from "../src/lib/types.ts";

const producer = (name: string): Producer => ({
  id: name.toLowerCase(),
  name,
  role: "Host & Producer",
  headshotUrl: "",
  headshotAlt: "",
  bio: "",
  links: [],
});

test("taylorName finds him regardless of position", () => {
  assert.equal(taylorName([producer("Justin Hartmann"), producer("Taylor Drew")]), "Taylor Drew");
});

test("taylorName is case-insensitive", () => {
  assert.equal(taylorName([producer("taylor drew")]), "taylor drew");
});

test("taylorName falls back to the literal name if he's not in the list", () => {
  assert.equal(taylorName([producer("Justin Hartmann")]), "Taylor Drew");
});

test("creditLine tags only Taylor Drew as a stand-up comedian", () => {
  assert.equal(
    creditLine([producer("Taylor Drew"), producer("Justin Hartmann")]),
    "stand-up comedian Taylor Drew and Justin Hartmann"
  );
});

test("creditLine handles Taylor Drew alone", () => {
  assert.equal(creditLine([producer("Taylor Drew")]), "stand-up comedian Taylor Drew");
});

test("creditLine oxford-commas three or more producers", () => {
  assert.equal(
    creditLine([producer("Taylor Drew"), producer("Justin Hartmann"), producer("Alex Doe")]),
    "stand-up comedian Taylor Drew, Justin Hartmann, and Alex Doe"
  );
});

test("creditLine survives an empty producer list", () => {
  assert.equal(creditLine([]), "stand-up comedian Taylor Drew");
});

test("creditLine still credits him if the admin renames or reorders", () => {
  // A guard against a future edit silently dropping the attribution.
  assert.match(creditLine([producer("Justin Hartmann"), producer("Taylor Drew Jr.")]), /stand-up comedian Taylor Drew Jr\./);
});

test("taylorKeyword is a natural two-word phrase", () => {
  assert.equal(taylorKeyword([producer("Taylor Drew")]), "taylor drew comedian");
});

test("taylorFaq names the other producers without re-crediting them", () => {
  const faq = taylorFaq([producer("Taylor Drew"), producer("Justin Hartmann")], "Pins & Needles Comedy");
  assert.equal(faq.q, "Who created Pins & Needles Comedy?");
  assert.match(faq.a, /created by stand-up comedian Taylor Drew/);
  assert.match(faq.a, /alongside Justin Hartmann/);
});

test("taylorFaq reads cleanly when he is the only producer", () => {
  const faq = taylorFaq([producer("Taylor Drew")], "Pins & Needles Comedy");
  assert.doesNotMatch(faq.a, /alongside/);
});
