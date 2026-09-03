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
  /^to respond to this text message/i,
  /^reply to this email to respond/i,
  /^this message was sent to you/i,
  /^you have received this message because/i,
  /^your account:/i,
  /^https?:\/\/(www\.)?voice\.google\.com/i,
  /^--\s*$/,
  /^-{3,}\s*$/,
  /^_{3,}\s*$/,
  /^sent from google voice/i,
];

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

  for (const line of lines) {
    const trimmed = line.trim();
    if (BOILERPLATE.some((pattern) => pattern.test(trimmed))) break;
    // A quoted line is the previous message in a thread, not this one.
    if (trimmed.startsWith(">")) continue;
    kept.push(line);
  }

  return kept.join("\n").replace(/\n{3,}/g, "\n\n").trim();
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
    sender.includes("voice.google.com") ||
    sender.includes("txt.voice.google.com") ||
    /\b(new )?(text|sms) message from\b/.test(title) ||
    /^sms from\b/.test(title)
  );
}

/** A stable id for one email, so the same text is never added twice. */
export function forwardKey(messageId: string, uid: number | string): string {
  const id = (messageId || "").trim();
  return id ? id.replace(/[<>]/g, "") : `uid-${uid}`;
}
