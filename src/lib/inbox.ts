/**
 * Reading texts out of forwarded email.
 *
 * Google Voice gives a free number and will forward every text it receives to
 * an email address, but it cannot call a webhook — so the only way to get a
 * texted decision into the pile without paying a carrier is to read the
 * mailbox. This is the part that turns one of those emails back into the
 * sentence somebody typed.
 *
 * No Next or IMAP imports, so the parsing can be tested directly against
 * sample messages rather than against a live mailbox.
 */

/**
 * Lines that mean Google Voice has stopped quoting the person and started
 * talking. Everything from the first of these onwards is dropped.
 */
const BOILERPLATE = [
  // Verified against real Google Voice forwards: the wording is "to this
  // message", not "to this text message", and the account line carries no
  // colon. Getting these wrong attaches Google's whole footer to a decision.
  /^to respond to this( text)? message/i,
  /^reply to this email to respond/i,
  /^this email was sent to you/i,
  /^this message was sent to you/i,
  /^you have received this message because/i,
  /^your account\b/i,
  /^help center\b/i,
  /^help forum\b/i,
  /^google llc\b/i,
  /^<?https?:\/\/(www\.)?voice\.google\.com/i,
  /^<?https?:\/\/(support|productforums)\.google\.com/i,
  /^--\s*$/,
  /^-{3,}\s*$/,
  /^_{3,}\s*$/,
  /^sent from google voice/i,
];

/**
 * The link Voice puts on its own line above the message, which is not part of
 * what anybody typed.
 */
const LEADING_LINK = /^<?https?:\/\/(www\.)?voice\.google\.com>?\s*$/i;

/**
 * The readable text of an email, out of its raw MIME source.
 *
 * Voice sends `multipart/alternative`: a plain-text part and an HTML one, each
 * behind its own headers and its own transfer encoding. Handing that whole
 * blob to a line parser puts the boundary marker and a `Content-Type:` header
 * at the front of whatever the person typed, so this picks one part and decodes
 * it first. Plain text always wins; HTML is the fallback for senders that omit
 * a plain part.
 *
 * Input that is not MIME at all is returned unchanged, so a body that has
 * already been decoded still parses.
 */
export function textFromMime(raw: string): string {
  return partText(raw || "", 0);
}

/** How deep a nested multipart may go before this stops looking. */
const MAX_MIME_DEPTH = 8;

function partText(section: string, depth: number): string {
  const { headers, body } = splitHeaders(section);
  const contentType = headerValue(headers, "content-type");
  const boundary = /boundary="?([^";\s]+)"?/i.exec(contentType)?.[1];

  if (/^multipart\//i.test(contentType) && boundary) {
    if (depth >= MAX_MIME_DEPTH) return "";
    let fallback = "";
    for (const part of splitParts(body, boundary)) {
      const type = headerValue(splitHeaders(part).headers, "content-type");
      const text = partText(part, depth + 1);
      if (!text.trim()) continue;
      if (/^text\/plain/i.test(type)) return text;
      if (!fallback) fallback = text;
    }
    return fallback;
  }

  return decodeBody(body, headerValue(headers, "content-transfer-encoding"));
}

/** Anything before the first blank line, but only when it really is a header. */
const HEADER_LINE = /^[A-Za-z][A-Za-z0-9-]*:/;

function splitHeaders(section: string): { headers: string; body: string } {
  const normalized = section.replace(/\r\n?/g, "\n");
  const at = normalized.indexOf("\n\n");
  if (at === -1 || !HEADER_LINE.test(normalized)) return { headers: "", body: normalized };
  return { headers: normalized.slice(0, at), body: normalized.slice(at + 2) };
}

function headerValue(headers: string, name: string): string {
  // A long header may be folded across lines, continued by leading whitespace.
  for (const line of headers.replace(/\n[ \t]+/g, " ").split("\n")) {
    const at = line.indexOf(":");
    if (at !== -1 && line.slice(0, at).trim().toLowerCase() === name) {
      return line.slice(at + 1).trim();
    }
  }
  return "";
}

function splitParts(body: string, boundary: string): string[] {
  const marker = `--${boundary}`;
  const parts: string[] = [];
  let current: string[] | null = null;

  for (const line of body.split("\n")) {
    const trimmed = line.trimEnd();
    if (trimmed === marker || trimmed === `${marker}--`) {
      if (current) parts.push(current.join("\n"));
      current = trimmed === marker ? [] : null;
      continue;
    }
    if (current) current.push(line);
  }
  if (current) parts.push(current.join("\n"));

  return parts;
}

function decodeBody(body: string, encoding: string): string {
  const how = encoding.toLowerCase();
  if (how === "base64") {
    return Buffer.from(body.replace(/\s+/g, ""), "base64").toString("utf8");
  }
  if (how === "quoted-printable") return decodeQuotedPrintable(body);
  return body;
}

/**
 * Quoted-printable, which is how the HTML part arrives: `=` starts either a
 * hex byte or a soft line break that is not really a break at all.
 */
function decodeQuotedPrintable(input: string): string {
  const joined = input.replace(/=\n/g, "");
  const bytes: number[] = [];

  for (let i = 0; i < joined.length; i += 1) {
    const pair = joined.slice(i + 1, i + 3);
    if (joined[i] === "=" && /^[0-9a-f]{2}$/i.test(pair)) {
      bytes.push(parseInt(pair, 16));
      i += 2;
      continue;
    }
    for (const byte of Buffer.from(joined[i], "utf8")) bytes.push(byte);
  }

  return Buffer.from(bytes).toString("utf8");
}

/** A very small HTML-to-text, for forwards that carry no plain part. */
export function htmlToText(html: string): string {
  return (html || "")
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|tr|li|h[1-6])>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

/**
 * The message a person actually sent, from the body of a forwarded email.
 *
 * Returns "" when nothing usable is left, which the caller treats as a message
 * to skip rather than an error: a mailbox will always contain some mail that
 * is not a text.
 */
export function messageFromForward(body: string): string {
  const text = /<[a-z][\s\S]*>/i.test(body) && !body.trim().startsWith(">")
    ? htmlToText(body)
    : body;

  const lines = (text || "").replace(/\r\n?/g, "\n").split("\n");
  const kept: string[] = [];
  let started = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (BOILERPLATE.some((pattern) => pattern.test(trimmed))) break;
    // Voice opens with a bare link to itself, above the message.
    if (!started && (!trimmed || LEADING_LINK.test(trimmed))) continue;
    // A quoted line is the previous message in a thread, not this one.
    if (trimmed.startsWith(">")) continue;
    started = true;
    kept.push(trimmed);
  }

  return unwrap(kept);
}

/**
 * Put the sender's sentences back together.
 *
 * Voice hard-wraps the forwarded body at about seventy-five characters, so a
 * decision of any length arrives broken mid-sentence. Read off a phone on
 * stage those breaks are noise, so consecutive lines rejoin into a paragraph
 * and only a blank line still starts a new one.
 */
function unwrap(lines: string[]): string {
  const paragraphs: string[] = [];
  let current: string[] = [];

  for (const line of lines) {
    if (!line) {
      if (current.length) paragraphs.push(current.join(" "));
      current = [];
      continue;
    }
    current.push(line);
  }
  if (current.length) paragraphs.push(current.join(" "));

  return paragraphs.join("\n\n").replace(/[ \t]{2,}/g, " ").trim();
}

/**
 * Whether an email looks like a forwarded text rather than ordinary mail.
 *
 * Deliberately generous about the sender — a person may forward through their
 * own filters or another address — but it must look like it came from the
 * Voice relay or say so in the subject, or the mailbox's normal traffic would
 * end up on stage.
 */
export function looksLikeForwardedText(from: string, subject: string): boolean {
  const sender = (from || "").toLowerCase();
  const title = (subject || "").toLowerCase();
  return (
    // The real forwards come from voice-noreply@google.com — not from any
    // address containing "voice.google.com", which is what this checked first.
    sender.includes("voice-noreply@google.com") ||
    sender.includes("voice.google.com") ||
    /\b(new )?(text|sms) message from\b/.test(title) ||
    /^sms from\b/.test(title)
  );
}

/** A stable id for one email, so the same text is never added twice. */
export function forwardKey(messageId: string, uid: number | string): string {
  const id = (messageId || "").trim();
  return id ? id.replace(/[<>]/g, "") : `uid-${uid}`;
}
