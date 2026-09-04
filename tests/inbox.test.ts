import { test } from "node:test";
import assert from "node:assert/strict";
import {
  forwardKey,
  htmlToText,
  looksLikeForwardedText,
  messageFromForward,
} from "../src/lib/inbox.ts";

/**
 * The exact shape of a real Google Voice forward, checked against live mail:
 * a bare link on the first line, the message hard-wrapped at ~75 characters,
 * then a footer whose wording is "to this message" and "This email was sent".
 * Only the words are replaced — every structural detail is as Voice sends it.
 */
const REAL_FORWARD = [
  "<https://voice.google.com>",
  "I told my landlord I would take the apartment and I have not seen",
  "it yet.",
  "Also I have no job.",
  "To respond to this message, launch Google Voice (https://voice.google.com)",
  "on your mobile device or computer.",
  "YOUR ACCOUNT <https://voice.google.com> HELP CENTER",
  "<https://support.google.com/voice#topic=1707989> HELP FORUM",
  "<https://productforums.google.com/forum/#!forum/voice>",
  "This email was sent to you because you indicated that you'd like to receive",
  "email notifications for text messages. If you don't want to receive such",
  "emails in the future, please update your email notification settings",
  "<https://voice.google.com/settings#messaging>.",
  "Google LLC",
  "1600 Amphitheatre Pkwy",
  "Mountain View CA 94043 USA",
].join("\n");

test("a real Google Voice forward yields only what the person typed", () => {
  assert.equal(
    messageFromForward(REAL_FORWARD),
    "I told my landlord I would take the apartment and I have not seen it yet. Also I have no job."
  );
});

test("none of Google's footer survives", () => {
  const out = messageFromForward(REAL_FORWARD);
  for (const leak of [
    "voice.google.com",
    "YOUR ACCOUNT",
    "HELP CENTER",
    "HELP FORUM",
    "Google LLC",
    "Amphitheatre",
    "notification settings",
    "To respond",
  ]) {
    assert.ok(!out.includes(leak), `footer leaked: ${leak}`);
  }
});

test("the decision is taken from above Google Voice's own words", () => {
  const email = [
    "Quit my job",
    "",
    "To respond to this text message, reply to this email.",
    "",
    "YOUR ACCOUNT: https://voice.google.com/settings",
  ].join("\n");
  assert.equal(messageFromForward(email), "Quit my job");
});

test("the real forward's sender is recognised", () => {
  // voice-noreply@google.com contains neither "voice.google.com" nor
  // "txt.voice.google.com", which is what the first version looked for.
  assert.equal(
    looksLikeForwardedText("voice-noreply@google.com", "New text message from 84861"),
    true
  );
  assert.equal(looksLikeForwardedText("voice-noreply@google.com", ""), true);
});

test("a blank line still separates paragraphs, but wrapped lines rejoin", () => {
  const email = [
    "I told my landlord I'd take the apartment.",
    "",
    "I have not seen the apartment.",
    "--",
    "Sent from Google Voice",
  ].join("\n");
  assert.equal(
    messageFromForward(email),
    "I told my landlord I'd take the apartment.\n\nI have not seen the apartment."
  );
});

test("every shape of boilerplate ends the message", () => {
  for (const marker of [
    "To respond to this text message, reply to this email.",
    "This message was sent to you because you have Google Voice.",
    "YOUR ACCOUNT: voice.google.com",
    "https://voice.google.com/u/0/messages",
    "--",
    "----------",
    "________",
    "Sent from Google Voice",
  ]) {
    assert.equal(messageFromForward(`Get the dog\n\n${marker}\nmore junk`), "Get the dog", marker);
  }
});

test("a quoted earlier message is not mistaken for this one", () => {
  const email = ["Texted my ex", "> what did you do", "> last night"].join("\n");
  assert.equal(messageFromForward(email), "Texted my ex");
});

test("an HTML-only forward is read as text", () => {
  const email = "<div>Quit my <b>job</b><br>and moved</div><p>--</p><p>voice.google.com</p>";
  // Wrapped lines rejoin, so this is one sentence rather than two lines.
  assert.equal(messageFromForward(email), "Quit my job and moved");
});

test("htmlToText drops markup and decodes the usual entities", () => {
  // Each closing block becomes one newline, not a blank line: these forwards
  // use <br> for the line breaks inside a message, and paragraphs only ever
  // separate the message from the boilerplate that follows it.
  assert.equal(htmlToText("<p>a &amp; b</p><p>c</p>").trim(), "a & b\nc");
  assert.equal(htmlToText("one<br>two").trim(), "one\ntwo");
  assert.equal(htmlToText("<script>bad()</script>hello"), "hello");
  assert.equal(htmlToText("<style>p{}</style>hello"), "hello");
  assert.equal(htmlToText("me &lt;here&gt; &quot;now&quot; &#39;ok&#39;"), 'me <here> "now" \'ok\'');
});

test("an email with nothing but boilerplate yields nothing to add", () => {
  assert.equal(messageFromForward("To respond to this text message, reply to this email."), "");
  assert.equal(messageFromForward(""), "");
  assert.equal(messageFromForward("   \n\n  "), "");
});

test("only forwarded texts are treated as submissions", () => {
  assert.equal(looksLikeForwardedText("x@txt.voice.google.com", "anything"), true);
  assert.equal(looksLikeForwardedText("noreply@voice.google.com", ""), true);
  assert.equal(looksLikeForwardedText("someone@gmail.com", "New text message from Sam"), true);
  assert.equal(looksLikeForwardedText("someone@gmail.com", "SMS from +19295550143"), true);

  // Ordinary mail in the same box must never reach the stage.
  assert.equal(looksLikeForwardedText("bank@example.com", "Your statement is ready"), false);
  assert.equal(looksLikeForwardedText("", ""), false);
  assert.equal(looksLikeForwardedText("newsletter@comedy.test", "Text us your thoughts!"), false);
});

test("forwardKey prefers the Message-ID and falls back to the uid", () => {
  assert.equal(forwardKey("<abc@mail.google.com>", 12), "abc@mail.google.com");
  assert.equal(forwardKey("", 12), "uid-12");
  assert.equal(forwardKey("   ", "99"), "uid-99");
});
