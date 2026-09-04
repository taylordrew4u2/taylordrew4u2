/**
 * Accepting a decision that something else delivered.
 *
 * Reading a mailbox needs the mailbox's password, and the free plan on the
 * domain's own mail does not open IMAP or POP at all. Both problems go away if
 * the mail comes to the site instead of the site going to the mail: whatever
 * relay is pointed at the endpoint sends what it has, and the site holds one
 * shared secret rather than credentials to somebody's inbox.
 *
 * Relays disagree about what to call the fields, so this takes the shapes they
 * actually use rather than insisting on one. No Next or store import, so the
 * shape-guessing is tested directly.
 */

/** The pieces of a delivered message this cares about. */
export type Inbound = { body: string; from: string; subject: string };

/** Where a relay might put the message itself, best first. */
const BODY_KEYS = [
  "raw",
  "message",
  "mime",
  "text",
  "plain",
  "plainBody",
  "body-plain",
  "bodyPlain",
  "body",
  "html",
  "decision",
  "content",
] as const;

const FROM_KEYS = ["from", "sender", "From", "envelope_from", "envelopeFrom"] as const;
const SUBJECT_KEYS = ["subject", "Subject", "title"] as const;

function pick(source: Record<string, unknown>, keys: readonly string[]): string {
  for (const key of keys) {
    const value = source[key];
    if (typeof value === "string" && value.trim()) return value;
    // Some relays nest the address: { from: { address: "..." } }.
    if (value && typeof value === "object") {
      const nested = (value as Record<string, unknown>).address ?? (value as Record<string, unknown>).email;
      if (typeof nested === "string" && nested.trim()) return nested;
    }
  }
  return "";
}

/**
 * What a relay posted, whatever it called the fields.
 *
 * A bare string is taken as the message, since the simplest possible relay —
 * a shortcut on a phone, a curl in a script — has nothing else to send.
 */
export function readInbound(payload: unknown): Inbound {
  if (typeof payload === "string") return { body: payload, from: "", subject: "" };
  if (!payload || typeof payload !== "object") return { body: "", from: "", subject: "" };

  const source = payload as Record<string, unknown>;
  // A few relays wrap everything one level down.
  const inner =
    source.envelope && typeof source.envelope === "object"
      ? (source.envelope as Record<string, unknown>)
      : {};

  return {
    body: pick(source, BODY_KEYS),
    from: pick(source, FROM_KEYS) || pick(inner, FROM_KEYS),
    subject: pick(source, SUBJECT_KEYS),
  };
}

/**
 * The message from a body that was posted as plain text.
 *
 * A relay with nothing to configure sends the words on their own, and both
 * curl and most simple senders label that as a form. It then parses as a
 * single key with no value, which is the shape to recognise — the alternative
 * is dropping the message because of a header the sender never chose.
 *
 * Deliberately narrow: one key, no value, and not a field name this already
 * knows. A form with real fields in it meant those fields, and an empty one
 * means the field was empty — `{"text": ""}` is a sender with nothing to say,
 * not a sender whose decision is the word "text".
 */
export function looseText(payload: unknown): string {
  if (typeof payload === "string") return payload;
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return "";

  const entries = Object.entries(payload as Record<string, unknown>);
  if (entries.length !== 1) return "";

  const [key, value] = entries[0];
  if (value !== "" || KNOWN_KEYS.has(key.toLowerCase())) return "";
  return key;
}

/** Every field name above, so an empty one is never mistaken for a message. */
const KNOWN_KEYS = new Set(
  [...BODY_KEYS, ...FROM_KEYS, ...SUBJECT_KEYS].map((key) => key.toLowerCase())
);

/**
 * Whether a delivered message is allowed through, given an optional allowlist.
 *
 * Empty allowlist means anything authenticated is accepted — the shared secret
 * is already the gate, and a relay that only forwards one mailbox needs no
 * second one. Setting it matters when the relay forwards a whole inbox, since
 * that inbox gets marketing mail too, and spam during show hours would be read
 * out on stage.
 */
export function senderAllowed(from: string, allowList: string): boolean {
  const allowed = allowList
    .split(/[,\s]+/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  if (!allowed.length) return true;

  const sender = (from || "").toLowerCase();
  return allowed.some((entry) => sender.includes(entry));
}
