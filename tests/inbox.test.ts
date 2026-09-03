import { test } from "node:test";
import assert from "node:assert/strict";
import {
  forwardKey,
  htmlToText,
  looksLikeForwardedText,
  messageFromForward,
} from "../src/lib/inbox.ts";

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

test("a decision that runs to several lines keeps all of them", () => {
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
  assert.equal(messageFromForward(email), "Quit my job\nand moved");
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
