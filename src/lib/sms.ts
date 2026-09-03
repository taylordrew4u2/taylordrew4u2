import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Texting a decision in.
 *
 * Not everyone in the room will scan a QR code — some people just want to
 * text. This is the plumbing for that: tidying the number for display, and
 * proving that an inbound webhook really came from Twilio.
 *
 * Nothing here imports from Next, so the signature check can be tested
 * directly rather than through a running server. That matters more than usual:
 * the check is the only thing standing between the submission pile and anyone
 * who guesses the webhook URL.
 */

/** Digits only, with a leading + kept. "+1 (929) 555-0143" -> "+19295550143". */
export function normalizePhone(raw: string): string {
  const trimmed = (raw || "").trim();
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (trimmed.startsWith("+")) return `+${digits}`;
  // A bare 10-digit number is North American; 11 starting with 1 already has
  // its country code.
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

/** "+19295550143" -> "(929) 555-0143". Anything else is returned as given. */
export function formatPhone(raw: string): string {
  const e164 = normalizePhone(raw);
  const us = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(e164);
  if (us) return `(${us[1]}) ${us[2]}-${us[3]}`;
  return (raw || "").trim();
}

/** An `sms:` link, so tapping the number on a phone opens a composed message. */
export function smsHref(raw: string): string {
  const e164 = normalizePhone(raw);
  return e164 ? `sms:${e164}` : "";
}

/**
 * Twilio's request signature: HMAC-SHA1 over the full request URL with every
 * POST parameter appended in sorted key order, base64 encoded.
 *
 * https://www.twilio.com/docs/usage/security#validating-signatures
 */
export function twilioSignature(
  authToken: string,
  url: string,
  params: Record<string, string>
): string {
  const payload = Object.keys(params)
    .sort()
    .reduce((acc, key) => acc + key + params[key], url);
  return createHmac("sha1", authToken).update(Buffer.from(payload, "utf8")).digest("base64");
}

/**
 * Whether `signature` is Twilio's, for any of the candidate URLs.
 *
 * More than one candidate because Twilio signs the URL it dialled, and behind
 * a proxy that is not always what the server sees: the forwarded protocol and
 * host have to be reassembled, and a deployment may be reached by more than
 * one hostname.
 */
export function verifyTwilioSignature(
  authToken: string,
  signature: string | null,
  urls: string[],
  params: Record<string, string>
): boolean {
  if (!authToken || !signature) return false;
  const provided = Buffer.from(signature);
  return urls.some((url) => {
    const expected = Buffer.from(twilioSignature(authToken, url, params));
    return provided.length === expected.length && timingSafeEqual(provided, expected);
  });
}

/**
 * What a texted message should become.
 *
 * Carriers split a long text into segments and phones append signatures, so
 * this trims the obvious noise before the shared sanitiser sees it. The number
 * it came from is deliberately not returned: the web form is anonymous by
 * default and a text should not be a quieter way of being identified.
 */
export function messageToDecision(body: string): string {
  return (body || "")
    // A trailing "Sent from my iPhone" and friends.
    .replace(/\n+\s*(sent|shared) from my [^\n]*$/i, "")
    .trim();
}
