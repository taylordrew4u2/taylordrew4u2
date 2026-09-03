import type { Show, Submission, WeeklyPage } from "./types";
import { formatTime, isUpcoming } from "./shows.ts";
import { emptySeo, slugify } from "./seo.ts";

/** Hard caps on what the public form accepts. Long enough for a real decision, short enough to read aloud. */
export const DECISION_MAX = 280;
export const NAME_MAX = 60;

const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

/**
 * Clean up one submission from the form. Returns null when there is nothing
 * usable, which the route turns into a 400.
 *
 * Collapses whitespace, strips control characters, and caps lengths. The
 * name is dropped entirely unless the sender asked to be named — the form
 * sends `anonymous: true` by default, and a name typed then un-ticked should
 * not survive.
 */
export function sanitizeSubmission(input: unknown): { decision: string; name: string } | null {
  if (typeof input !== "object" || input === null) return null;
  const raw = input as { decision?: unknown; name?: unknown; anonymous?: unknown };

  const decision = cleanText(raw.decision, DECISION_MAX);
  if (!decision) return null;

  const named = raw.anonymous === false;
  const name = named ? cleanText(raw.name, NAME_MAX) : "";
  return { decision, name };
}

function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** A sortable id: the timestamp first so a directory listing comes back in order. */
export function submissionId(now: Date = new Date()): string {
  return `${now.toISOString().replace(/[-:.TZ]/g, "").slice(0, 17)}-${Math.random().toString(36).slice(2, 8)}`;
}

/** The subset a host needs on stage, most recent first. */
export function sortSubmissions(list: Submission[]): Submission[] {
  return [...list].sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

/** One random open submission, or null when the pile is empty. */
export function pickRandom<T>(list: T[], random: () => number = Math.random): T | null {
  if (!list.length) return null;
  return list[Math.min(list.length - 1, Math.floor(random() * list.length))];
}

/**
 * The next calendar date (yyyy-mm-dd) on or after `today` that falls on the
 * weekly's weekday. `today` is a New York date from nyToday().
 */
export function nextDateForWeekday(weekday: WeeklyPage["weekday"], today: string): string {
  const target = WEEKDAYS.indexOf(weekday);
  const base = new Date(`${today}T12:00:00Z`);
  const current = base.getUTCDay();
  const ahead = (target - current + 7) % 7;
  base.setUTCDate(base.getUTCDate() + ahead);
  return base.toISOString().slice(0, 10);
}

/**
 * The published night of this series that is coming up next, if one has been
 * entered. The page falls back to its own standing details when there isn't.
 */
export function nextWeeklyShow(shows: Show[], weekly: WeeklyPage, today: string): Show | null {
  return (
    shows
      .filter((show) => show.published && show.date && show.series === weekly.slug)
      .filter((show) => isUpcoming(show, today))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))[0] ?? null
  );
}

/**
 * A ready-to-edit Show for the weekly's next night: date, times, venue and
 * price copied from the standing details, so the only thing left to type is
 * the bill. Starts unpublished.
 */
export function newWeeklyShow(weekly: WeeklyPage, today: string, now: Date = new Date()): Show {
  const date = nextDateForWeekday(weekly.weekday, today);
  const stamp = now.getTime().toString(36);
  return {
    id: `show-${stamp}`,
    slug: slugify(`${weekly.slug} ${date}`),
    title: weekly.title,
    tagline: weekly.tagline,
    date,
    doorsTime: weekly.doorsTime,
    startTime: weekly.startTime,
    endTime: "",
    venueName: weekly.venueName,
    venueUrl: weekly.venueUrl,
    address: weekly.address,
    city: weekly.city,
    region: weekly.region,
    postalCode: weekly.postalCode,
    country: "US",
    mapUrl: weekly.mapUrl,
    roomNote: weekly.roomNote,
    ticketUrl: "",
    ticketLabel: "",
    price: weekly.price,
    currency: "USD",
    ageRestriction: weekly.ageRestriction,
    status: "scheduled",
    posterUrl: weekly.posterUrl,
    posterAlt: weekly.posterAlt,
    description: "",
    lineup: [],
    photos: [],
    recapSlug: "",
    instagramUrl: "",
    series: weekly.slug,
    published: false,
    featured: false,
    seo: emptySeo(),
  };
}

/** "Every Thursday · Doors 8:00 PM · Show 9:00 PM" */
export function weeklyScheduleLine(weekly: WeeklyPage): string {
  const parts = [`Every ${weekly.weekday}`];
  if (weekly.doorsTime) parts.push(`Doors ${formatTime(weekly.doorsTime)}`);
  if (weekly.startTime) parts.push(`Show ${formatTime(weekly.startTime)}`);
  return parts.join(" · ");
}

/** "Pixelated Records — 792 Onderdonk Ave, Ridgewood" */
export function weeklyVenueLine(weekly: WeeklyPage): string {
  const where = [weekly.address, weekly.city].filter(Boolean).join(", ");
  if (weekly.venueName && where) return `${weekly.venueName} — ${where}`;
  return weekly.venueName || where;
}

/** Plain-text brief for llms.txt and AI summaries. */
export function weeklySummary(weekly: WeeklyPage): string {
  return [
    `${weekly.title}: ${weekly.tagline}`,
    `${weeklyScheduleLine(weekly)} at ${weeklyVenueLine(weekly)}.`,
    weekly.price ? `${weekly.price}.` : "",
    weekly.ageRestriction ? `${weekly.ageRestriction}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
