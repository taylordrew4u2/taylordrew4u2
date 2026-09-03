import { test } from "node:test";
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import {
  formatPhone,
  messageToDecision,
  normalizePhone,
  smsHref,
  twilioSignature,
  verifyTwilioSignature,
} from "../src/lib/sms.ts";

test("normalizePhone reduces the ways people write a number to one", () => {
  const expected = "+19295550143";
  for (const written of [
    "(929) 555-0143",
    "929-555-0143",
    "929.555.0143",
    "9295550143",
    "1 929 555 0143",
    "+1 (929) 555-0143",
    "  +1-929-555-0143  ",
  ]) {
    assert.equal(normalizePhone(written), expected, written);
  }
  assert.equal(normalizePhone(""), "");
  assert.equal(normalizePhone("not a number"), "");
});

test("formatPhone is readable for US numbers and leaves anything else alone", () => {
  assert.equal(formatPhone("9295550143"), "(929) 555-0143");
  assert.equal(formatPhone("+1 929 555 0143"), "(929) 555-0143");
  // Not North American: shown as typed rather than mangled into a US shape.
  assert.equal(formatPhone("+44 20 7946 0958"), "+44 20 7946 0958");
  assert.equal(formatPhone(""), "");
});

test("smsHref opens a composed message, and is empty when there is no number", () => {
  assert.equal(smsHref("(929) 555-0143"), "sms:+19295550143");
  assert.equal(smsHref(""), "");
});

test("twilioSignature is HMAC-SHA1 over the URL plus params in sorted key order", () => {
  // Recomputed here straight from Twilio's documented rule, so this checks the
  // implementation rather than a constant copied from somewhere.
  // https://www.twilio.com/docs/usage/security#validating-signatures
  const token = "12345";
  const url = "https://mycompany.com/myapp.php?foo=1&bar=2";
  const params = {
    Digits: "1234",
    To: "+18005551212",
    From: "+14158675310",
    Caller: "+14158675310",
  };

  const payload =
    url + Object.keys(params).sort().map((k) => k + params[k as keyof typeof params]).join("");
  const expected = createHmac("sha1", token).update(Buffer.from(payload, "utf8")).digest("base64");

  assert.equal(twilioSignature(token, url, params), expected);
  // And spell out the concatenation the rule produces, so a change to the
  // ordering or separators fails loudly rather than silently agreeing.
  assert.equal(
    payload,
    "https://mycompany.com/myapp.php?foo=1&bar=2" +
      "Caller+14158675310" +
      "Digits1234" +
      "From+14158675310" +
      "To+18005551212"
  );
});

test("verifyTwilioSignature accepts only a signature over a URL it was given", () => {
  const token = "an-auth-token";
  const url = "https://pinsandneedlescomedy.com/api/decisions/sms";
  const params = { Body: "Quit my job", From: "+19295550143" };
  const good = twilioSignature(token, url, params);

  assert.equal(verifyTwilioSignature(token, good, [url], params), true);
  // Behind a proxy the server may see a different URL; any candidate may match.
  assert.equal(verifyTwilioSignature(token, good, ["http://internal:3000/x", url], params), true);

  // Every way of being wrong.
  assert.equal(verifyTwilioSignature(token, good, ["https://elsewhere.test/api"], params), false);
  assert.equal(verifyTwilioSignature(token, good, [url], { ...params, Body: "tampered" }), false);
  assert.equal(verifyTwilioSignature("wrong-token", good, [url], params), false);
  assert.equal(verifyTwilioSignature(token, null, [url], params), false);
  assert.equal(verifyTwilioSignature(token, "", [url], params), false);
  assert.equal(verifyTwilioSignature("", good, [url], params), false, "no token must not pass");
  assert.equal(verifyTwilioSignature(token, "short", [url], params), false);
});

test("a body param that was added or removed changes the signature", () => {
  const token = "t";
  const url = "https://example.test/hook";
  const base = twilioSignature(token, url, { A: "1" });
  assert.notEqual(base, twilioSignature(token, url, { A: "1", B: "2" }));
  assert.notEqual(base, twilioSignature(token, url, {}));
  // Parameter order must not matter; the signature sorts by key.
  assert.equal(
    twilioSignature(token, url, { B: "2", A: "1" }),
    twilioSignature(token, url, { A: "1", B: "2" })
  );
});

test("messageToDecision strips the signature a phone appends", () => {
  assert.equal(messageToDecision("Quit my job\n\nSent from my iPhone"), "Quit my job");
  assert.equal(messageToDecision("Texted my ex\nSent from my Samsung Galaxy"), "Texted my ex");
  assert.equal(messageToDecision("  Get the dog  "), "Get the dog");
  // A message that merely mentions a phone keeps its words.
  assert.equal(messageToDecision("I sent from my old phone"), "I sent from my old phone");
  assert.equal(messageToDecision(""), "");
});
