import type { Show, ShowPerformer } from "./types";

/**
 * Show dates are calendar days in New York, where every show happens.
 *
 * Comparing against a UTC "today" would move a show into the past at 8pm ET
 * on the night it runs, which is exactly when someone is most likely to be
 * looking it up on their phone. Everything here works on yyyy-mm-dd strings,
 * which sort correctly as plain text.
 */
export function nyToday(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function isUpcoming(show: Show, today: string): boolean {
  return show.date >= today;
}

/**
 * Minutes east of UTC in New York at a given instant — -240 on EDT, -300 on
 * EST. Read from the runtime's own timezone data, so the DST changeover needs
 * no maintenance here.
 */
function nyOffsetMinutes(at: Date): number {
  const formatted = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    timeZoneName: "longOffset",
  }).format(at);
  const match = /GMT([+-])(\d{2}):(\d{2})/.exec(formatted);
  if (!match) return 0;
  return (match[1] === "-" ? -1 : 1) * (Number(match[2]) * 60 + Number(match[3]));
}

/**
 * A wall-clock date and time in New York ("2026-09-03", "21:00") as a real
 * instant. Returns null when either half is missing or malformed.
 *
 * The offset depends on the instant we are trying to find, so this guesses
 * once from the naive value and then checks its work — which is what makes
 * 1:30 AM on a changeover night land on the right side of the jump.
 */
export function nyInstant(date: string, time: string): Date | null {
  const day = /^(\d{4})-(\d{2})-(\d{2})$/.exec((date || "").trim());
  const clock = /^(\d{1,2}):(\d{2})$/.exec((time || "").trim());
  if (!day || !clock) return null;

  const hours = Number(clock[1]);
  const minutes = Number(clock[2]);
  if (hours > 23 || minutes > 59) return null;

  const naive = Date.UTC(Number(day[1]), Number(day[2]) - 1, Number(day[3]), hours, minutes);
  const first = nyOffsetMinutes(new Date(naive));
  const corrected = new Date(naive - first * 60_000);
  const second = nyOffsetMinutes(corrected);
  return second === first ? corrected : new Date(naive - second * 60_000);
}

/**
 * Published shows split into the two lists the page renders: what is coming
 * (soonest first — the next show is what a visitor is here for) and what has
 * already happened (most recent first, as an archive).
 */
export function splitShows(
  shows: Show[],
  today: string
): { upcoming: Show[]; past: Show[] } {
  const live = shows.filter((show) => show.published && show.date);
  return {
    upcoming: live
      .filter((show) => isUpcoming(show, today))
      .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0)),
    past: live
      .filter((show) => !isUpcoming(show, today))
      .sort((a, b) => (a.date > b.date ? -1 : a.date < b.date ? 1 : 0)),
  };
}

/** "21:00" -> "9:00 PM". Anything unparseable comes back untouched. */
export function formatTime(value: string): string {
  const match = /^(\d{1,2}):(\d{2})$/.exec((value || "").trim());
  if (!match) return value || "";
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return value;
  const suffix = hours < 12 ? "AM" : "PM";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${match[2]} ${suffix}`;
}

/** "Doors 8:00 PM · Show 9:00 PM", skipping whichever times are not set. */
export function timeLine(show: Show): string {
  const parts: string[] = [];
  if (show.doorsTime) parts.push(`Doors ${formatTime(show.doorsTime)}`);
  if (show.startTime) {
    parts.push(
      show.endTime
        ? `Show ${formatTime(show.startTime)}–${formatTime(show.endTime)}`
        : `Show ${formatTime(show.startTime)}`
    );
  }
  return parts.join(" · ");
}

/** One-line address for a card: "Secret Pour — 78 Manhattan Ave, Brooklyn". */
export function venueLine(show: Show): string {
  const where = [show.address, show.city].filter(Boolean).join(", ");
  if (show.venueName && where) return `${show.venueName} — ${where}`;
  return show.venueName || where;
}

/** Full ISO datetime for structured data. Falls back to the bare date. */
export function isoDateTime(date: string, time: string): string {
  if (!date) return "";
  const clean = (time || "").trim();
  return /^\d{1,2}:\d{2}$/.test(clean)
    ? `${date}T${clean.padStart(5, "0")}:00`
    : date;
}

const STATUS_URL: Record<string, string> = {
  scheduled: "https://schema.org/EventScheduled",
  "sold-out": "https://schema.org/EventScheduled",
  postponed: "https://schema.org/EventPostponed",
  cancelled: "https://schema.org/EventCancelled",
};

export function eventStatusUrl(status: string): string {
  return STATUS_URL[status] ?? STATUS_URL.scheduled;
}

/**
 * Group a bill by role, keeping the order the admin arranged it in: the first
 * role to appear is the first group, and names stay in their typed order
 * inside it. Entries with no role fall into one unlabelled group.
 */
export function groupByRole(
  lineup: ShowPerformer[]
): { role: string; people: ShowPerformer[] }[] {
  const groups: { role: string; people: ShowPerformer[] }[] = [];
  for (const person of lineup) {
    if (!person.name.trim()) continue;
    const role = person.role.trim();
    const existing = groups.find((group) => group.role.toLowerCase() === role.toLowerCase());
    if (existing) existing.people.push(person);
    else groups.push({ role, people: [person] });
  }
  return groups;
}

/** Plain-text summary of a show, for AI summaries and meta descriptions. */
export function showSummary(show: Show): string {
  const when = show.date ? `${show.date}${show.startTime ? ` at ${formatTime(show.startTime)}` : ""}` : "";
  const where = venueLine(show);
  const names = show.lineup.map((person) => person.name).filter(Boolean);
  return [
    show.tagline,
    [when, where].filter(Boolean).join(" · "),
    names.length ? `Featuring ${names.join(", ")}.` : "",
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}
