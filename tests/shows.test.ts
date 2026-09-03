import { test } from "node:test";
import assert from "node:assert/strict";
import {
  eventStatusUrl,
  formatTime,
  groupByRole,
  isoDateTime,
  nyToday,
  showSummary,
  splitShows,
  timeLine,
  venueLine,
} from "../src/lib/shows.ts";
import { emptySeo } from "../src/lib/seo.ts";
import type { Show, ShowPerformer } from "../src/lib/types.ts";

const show = (partial: Partial<Show>): Show => ({
  id: partial.slug ?? "show",
  slug: "show",
  title: "Pins & Needles Comedy",
  tagline: "",
  date: "2026-09-10",
  doorsTime: "",
  startTime: "",
  endTime: "",
  venueName: "",
  venueUrl: "",
  address: "",
  city: "",
  region: "NY",
  postalCode: "",
  country: "US",
  mapUrl: "",
  roomNote: "",
  ticketUrl: "",
  ticketLabel: "",
  price: "",
  currency: "USD",
  ageRestriction: "",
  status: "scheduled",
  posterUrl: "",
  posterAlt: "",
  description: "",
  lineup: [],
  photos: [],
  recapSlug: "",
  instagramUrl: "",
  series: "",
  published: true,
  featured: false,
  seo: emptySeo(),
  ...partial,
});

const act = (name: string, role: string): ShowPerformer => ({
  id: name,
  name,
  role,
  note: "",
  imageUrl: "",
  imageAlt: "",
  url: "",
});

test("upcoming shows are soonest first, past shows most recent first", () => {
  const shows = [
    show({ slug: "c", date: "2026-09-20" }),
    show({ slug: "a", date: "2026-08-01" }),
    show({ slug: "b", date: "2026-09-12" }),
    show({ slug: "old", date: "2026-07-04" }),
  ];
  const { upcoming, past } = splitShows(shows, "2026-09-01");
  assert.deepEqual(upcoming.map((s) => s.slug), ["b", "c"]);
  assert.deepEqual(past.map((s) => s.slug), ["a", "old"]);
});

test("a show stays upcoming on the day it happens", () => {
  const { upcoming, past } = splitShows([show({ date: "2026-09-10" })], "2026-09-10");
  assert.equal(upcoming.length, 1);
  assert.equal(past.length, 0);
});

test("unpublished shows and shows with no date are left out entirely", () => {
  const shows = [
    show({ slug: "draft", published: false }),
    show({ slug: "undated", date: "" }),
    show({ slug: "live" }),
  ];
  const { upcoming, past } = splitShows(shows, "2026-09-01");
  assert.deepEqual([...upcoming, ...past].map((s) => s.slug), ["live"]);
});

test("today is the New York date, not the UTC one", () => {
  // 01:30 UTC on Sep 11 is still 21:30 on Sep 10 in New York — a show that
  // night must not flip to "past" while the audience is still in the room.
  assert.equal(nyToday(new Date("2026-09-11T01:30:00Z")), "2026-09-10");
});

test("formatTime turns 24h into 12h", () => {
  assert.equal(formatTime("21:00"), "9:00 PM");
  assert.equal(formatTime("09:30"), "9:30 AM");
  assert.equal(formatTime("00:15"), "12:15 AM");
  assert.equal(formatTime("12:00"), "12:00 PM");
});

test("formatTime leaves anything it cannot parse alone", () => {
  assert.equal(formatTime(""), "");
  assert.equal(formatTime("doors at nine"), "doors at nine");
  assert.equal(formatTime("29:99"), "29:99");
});

test("timeLine skips whichever times are missing", () => {
  assert.equal(timeLine(show({ doorsTime: "20:00", startTime: "21:00" })), "Doors 8:00 PM · Show 9:00 PM");
  assert.equal(timeLine(show({ startTime: "21:00", endTime: "23:00" })), "Show 9:00 PM–11:00 PM");
  assert.equal(timeLine(show({})), "");
});

test("venueLine handles a venue with no address and an address with no venue", () => {
  assert.equal(
    venueLine(show({ venueName: "Secret Pour", address: "78 Manhattan Ave", city: "Brooklyn" })),
    "Secret Pour — 78 Manhattan Ave, Brooklyn"
  );
  assert.equal(venueLine(show({ venueName: "Secret Pour" })), "Secret Pour");
  assert.equal(venueLine(show({ city: "Brooklyn" })), "Brooklyn");
  assert.equal(venueLine(show({})), "");
});

test("isoDateTime pairs a date with a time, or falls back to the date", () => {
  assert.equal(isoDateTime("2026-09-10", "21:00"), "2026-09-10T21:00:00");
  assert.equal(isoDateTime("2026-09-10", "9:00"), "2026-09-10T09:00:00");
  assert.equal(isoDateTime("2026-09-10", ""), "2026-09-10");
  assert.equal(isoDateTime("", "21:00"), "");
});

test("event status maps to the schema.org URLs Google reads", () => {
  assert.equal(eventStatusUrl("cancelled"), "https://schema.org/EventCancelled");
  assert.equal(eventStatusUrl("postponed"), "https://schema.org/EventPostponed");
  // Sold out is still a scheduled event — availability is carried on the offer.
  assert.equal(eventStatusUrl("sold-out"), "https://schema.org/EventScheduled");
  assert.equal(eventStatusUrl("nonsense"), "https://schema.org/EventScheduled");
});

test("groupByRole keeps the admin's order and merges repeated roles", () => {
  const groups = groupByRole([
    act("Taylor Drew", "Host"),
    act("Comic One", "Comedian"),
    act("Rob White", "Tattoo artist"),
    act("Comic Two", "Comedian"),
  ]);
  assert.deepEqual(groups.map((g) => g.role), ["Host", "Comedian", "Tattoo artist"]);
  assert.deepEqual(groups[1].people.map((p) => p.name), ["Comic One", "Comic Two"]);
});

test("groupByRole treats roles case-insensitively and drops blank names", () => {
  const groups = groupByRole([act("A", "Comedian"), act("B", "comedian"), act("", "Comedian")]);
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].people.map((p) => p.name), ["A", "B"]);
});

test("showSummary reads as a sentence with only the fields that are filled in", () => {
  const summary = showSummary(
    show({
      tagline: "Tattoos and stand-up.",
      date: "2026-09-10",
      startTime: "21:00",
      venueName: "Secret Pour",
      city: "Brooklyn",
      lineup: [act("Taylor Drew", "Host")],
    })
  );
  assert.equal(
    summary,
    "Tattoos and stand-up. 2026-09-10 at 9:00 PM · Secret Pour — Brooklyn Featuring Taylor Drew."
  );
  assert.equal(showSummary(show({})), "2026-09-10");
});
