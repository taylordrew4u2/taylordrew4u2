import { test } from "node:test";
import assert from "node:assert/strict";
import { looseText, readInbound, senderAllowed } from "../src/lib/inbound.ts";

test("the plainest possible relay can just post the message", () => {
  // A shortcut on a phone, or a curl in a script, has nothing else to send.
  assert.deepEqual(readInbound("Quit my job"), { body: "Quit my job", from: "", subject: "" });
});

test("the shapes relays actually use are all understood", () => {
  const cases: [unknown, string][] = [
    [{ text: "a" }, "a"],
    [{ plain: "b" }, "b"],
    [{ "body-plain": "c" }, "c"],
    [{ bodyPlain: "d" }, "d"],
    [{ body: "e" }, "e"],
    [{ html: "<p>f</p>" }, "<p>f</p>"],
    [{ decision: "g" }, "g"],
    [{ content: "h" }, "h"],
    [{ message: "i" }, "i"],
    [{ raw: "j" }, "j"],
  ];
  for (const [payload, expected] of cases) {
    assert.equal(readInbound(payload).body, expected, JSON.stringify(payload));
  }
});

test("the raw message wins over a relay's own rendering of it", () => {
  // raw is the full MIME, which the parser can take apart properly; a relay's
  // "text" is whatever it decided the body was, and it is often wrong.
  assert.equal(readInbound({ raw: "RAW", text: "guessed", html: "<p>guessed</p>" }).body, "RAW");
  assert.equal(readInbound({ text: "plain", html: "<p>markup</p>" }).body, "plain");
});

test("the sender is found whether it is a string or an object", () => {
  assert.equal(readInbound({ from: "a@b.test", text: "x" }).from, "a@b.test");
  assert.equal(readInbound({ sender: "c@d.test", text: "x" }).from, "c@d.test");
  assert.equal(readInbound({ from: { address: "e@f.test" }, text: "x" }).from, "e@f.test");
  assert.equal(readInbound({ from: { email: "g@h.test" }, text: "x" }).from, "g@h.test");
  assert.equal(readInbound({ envelope: { from: "i@j.test" }, text: "x" }).from, "i@j.test");
});

test("the subject is found, and missing fields are empty rather than undefined", () => {
  assert.equal(readInbound({ subject: "New text message from 84861" }).subject, "New text message from 84861");
  assert.deepEqual(readInbound({}), { body: "", from: "", subject: "" });
  assert.deepEqual(readInbound(null), { body: "", from: "", subject: "" });
  assert.deepEqual(readInbound(42), { body: "", from: "", subject: "" });
  assert.deepEqual(readInbound([]), { body: "", from: "", subject: "" });
});

test("a field that is present but blank is treated as missing", () => {
  assert.equal(readInbound({ text: "   ", body: "real" }).body, "real");
  assert.equal(readInbound({ from: "  ", sender: "a@b.test", text: "x" }).from, "a@b.test");
});

test("with no allowlist, anything that authenticated is accepted", () => {
  // The shared secret is already the gate; a relay pointed at one mailbox
  // needs no second one.
  assert.equal(senderAllowed("anyone@anywhere.test", ""), true);
  assert.equal(senderAllowed("", ""), true);
  assert.equal(senderAllowed("", "   "), true);
});

test("an allowlist keeps a forwarded inbox's spam off the stage", () => {
  const allow = "voice-noreply@google.com";
  assert.equal(senderAllowed("voice-noreply@google.com", allow), true);
  assert.equal(senderAllowed("Google Voice <voice-noreply@google.com>", allow), true);
  assert.equal(senderAllowed("VOICE-NOREPLY@GOOGLE.COM", allow), true);
  assert.equal(senderAllowed("deals@vistaprint.test", allow), false);
  assert.equal(senderAllowed("", allow), false);
});

test("an allowlist can name more than one sender", () => {
  const allow = "voice-noreply@google.com, forwarder@pinsandneedlescomedy.com";
  assert.equal(senderAllowed("voice-noreply@google.com", allow), true);
  assert.equal(senderAllowed("forwarder@pinsandneedlescomedy.com", allow), true);
  assert.equal(senderAllowed("someone@else.test", allow), false);
  // Newlines and stray spaces are a normal way to paste a list into a form.
  assert.equal(senderAllowed("someone@else.test", "  a@b.test \n c@d.test  "), false);
  assert.equal(senderAllowed("c@d.test", "  a@b.test \n c@d.test  "), true);
});

test("a bare text body still reaches the pile when it is labelled as a form", () => {
  // curl and most simple relays send plain text as x-www-form-urlencoded, so
  // it parses as one key with no value. Dropping it would mean losing the
  // message over a header the sender never chose.
  assert.equal(looseText({ "Quit my job": "" }), "Quit my job");
  assert.equal(looseText("Quit my job"), "Quit my job");
});

test("a form with real fields in it is left alone", () => {
  // Guessing at these would put a field name on stage.
  assert.equal(looseText({ text: "Quit my job" }), "");
  assert.equal(looseText({ a: "", b: "" }), "");
  assert.equal(looseText({ a: "value" }), "");
  assert.equal(looseText({}), "");
  assert.equal(looseText(null), "");
  assert.equal(looseText(["Quit my job"]), "");
});

test("an empty known field is an empty message, not the field's name", () => {
  // Found while writing the relay's setup check: it posts {"text": ""} to see
  // whether the site answers, and this used to make the word "text" a
  // decision — one that would then be read out on stage.
  assert.equal(looseText({ text: "" }), "");
  assert.equal(looseText({ body: "" }), "");
  assert.equal(looseText({ raw: "" }), "");
  assert.equal(looseText({ from: "" }), "");
  assert.equal(looseText({ subject: "" }), "");
  assert.equal(looseText({ "body-plain": "" }), "");
  assert.equal(looseText({ Subject: "" }), "");
  // Something that is plainly a sentence still gets through.
  assert.equal(looseText({ "Quit my job": "" }), "Quit my job");
});
