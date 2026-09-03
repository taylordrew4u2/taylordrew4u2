import { NextResponse } from "next/server";
import { sanitizeSubmission } from "@/lib/decisions";
import { getContent } from "@/lib/store";
import { addSubmission, countOpen } from "@/lib/submissions";

export const dynamic = "force-dynamic";

/**
 * A small in-memory limiter: one address gets a handful of sends a minute.
 * Enough to stop a script from filling the pile, loose enough that a table
 * of six on the same bar wifi all get through. Resets on every cold start,
 * which is fine — it only needs to hold for the length of one bar hour.
 */
const WINDOW_MS = 60_000;
const PER_WINDOW = 8;
const hits = new Map<string, number[]>();

function limited(key: string): boolean {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((at) => now - at < WINDOW_MS);
  if (recent.length >= PER_WINDOW) return true;
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear(); // never let it grow without bound
  return false;
}

function addressOf(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

/** How many decisions are in. Only answers when the page is set to show it. */
export async function GET() {
  const { weekly } = await getContent();
  if (!weekly.enabled || !weekly.showCount) {
    return NextResponse.json({ ok: true, count: null });
  }
  try {
    return NextResponse.json({ ok: true, count: await countOpen() });
  } catch (error) {
    console.error("[decisions] count failed:", error);
    return NextResponse.json({ ok: true, count: null });
  }
}

export async function POST(request: Request) {
  const { weekly } = await getContent();
  if (!weekly.enabled) {
    return NextResponse.json({ ok: false, error: "Submissions are closed." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  // Honeypot: the form has a hidden field a person never sees. A bot fills it.
  if (typeof body === "object" && body !== null && (body as { website?: unknown }).website) {
    return NextResponse.json({ ok: true });
  }

  if (limited(addressOf(request))) {
    return NextResponse.json(
      { ok: false, error: "That's plenty for now. Try again in a minute." },
      { status: 429 }
    );
  }

  const clean = sanitizeSubmission(body);
  if (!clean) {
    return NextResponse.json({ ok: false, error: "Write the decision first." }, { status: 400 });
  }

  try {
    await addSubmission(clean.decision, clean.name);
  } catch (error) {
    console.error("[decisions] save failed:", error);
    return NextResponse.json(
      { ok: false, error: "Couldn't save that. Try once more, or text it in." },
      { status: 500 }
    );
  }

  let count: number | null = null;
  if (weekly.showCount) {
    try {
      count = await countOpen();
    } catch {
      count = null;
    }
  }
  return NextResponse.json({ ok: true, count });
}
