"use client";

import { useCallback, useEffect, useState } from "react";
import type { Content, Submission, WeeklyPage } from "@/lib/types";
import { aspectValue } from "@/lib/render";
import { Area, Button, Card, Row, Section, Select, Text, Toggle } from "../ui";
import MediaField from "../MediaField";
import SeoEditor from "../SeoEditor";
import { suggestFor } from "../suggest";
import type { Update } from "../types";

const WEEKDAYS = (
  ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
).map((day) => ({ value: day, label: `Every ${day}` }));

export default function WeeklyTab({ content, update }: { content: Content; update: Update }) {
  const weekly = content.weekly;
  const posterAspect = aspectValue(content.showsPage.posterAspect);
  const set = <K extends keyof WeeklyPage>(key: K) => (value: WeeklyPage[K]) =>
    update((d) => void (d.weekly[key] = value));

  return (
    <>
      <StagePanel enabled={weekly.enabled} />

      <Section
        title="Bad Decisions page"
        hint="Lives at /bad-decisions — that address is what the QR code and the flyer point at. Everything here is the standing detail; each week's bill is a show in the Shows tab marked as part of this weekly."
      >
        <Toggle
          label="Page is live"
          hint="off = /bad-decisions is a 404 and the form stops taking submissions"
          value={weekly.enabled}
          onChange={set("enabled")}
        />
        <Text label="Title" value={weekly.title} onChange={set("title")} />
        <Area label="Tagline" rows={2} value={weekly.tagline} onChange={set("tagline")} />
        <Row>
          <Select label="Night" value={weekly.weekday} options={WEEKDAYS} onChange={set("weekday")} />
          <Text label="Doors" type="time" value={weekly.doorsTime} onChange={set("doorsTime")} />
          <Text label="Show starts" type="time" value={weekly.startTime} onChange={set("startTime")} />
        </Row>
        <Row>
          <Text label="Venue name" value={weekly.venueName} onChange={set("venueName")} />
          <Text label="Venue website" value={weekly.venueUrl} placeholder="https://" onChange={set("venueUrl")} />
        </Row>
        <Text label="Street address" value={weekly.address} onChange={set("address")} />
        <Row>
          <Text label="City" value={weekly.city} onChange={set("city")} />
          <Text label="State" value={weekly.region} onChange={set("region")} />
          <Text label="ZIP" value={weekly.postalCode} onChange={set("postalCode")} />
        </Row>
        <Row>
          <Text label="Map link" value={weekly.mapUrl} placeholder="https://maps.google.com/..." onChange={set("mapUrl")} />
          <Text label="Price" hint="e.g. Free" value={weekly.price} onChange={set("price")} />
          <Text label="Age" hint="e.g. 21+" value={weekly.ageRestriction} onChange={set("ageRestriction")} />
        </Row>
        <Text
          label="Room note"
          hint="under the form — e.g. the room is small, come early"
          value={weekly.roomNote}
          onChange={set("roomNote")}
        />
        <MediaField
          label="Poster"
          hint={`cropped to ${content.showsPage.posterAspect}, same as show posters`}
          value={weekly.posterUrl}
          onChange={set("posterUrl")}
          aspect={posterAspect}
          previewHeight={180}
        />
        <Text label="Poster alt text" value={weekly.posterAlt} onChange={set("posterAlt")} />
      </Section>

      <Section title="The form" hint="What people see on their phone. Keep every line short.">
        <Text label="The question" value={weekly.question} onChange={set("question")} />
        <Text label="Placeholder inside the box" value={weekly.placeholder} onChange={set("placeholder")} />
        <Text label="Name toggle label" value={weekly.namePrompt} onChange={set("namePrompt")} />
        <Area label="Small print under the form" rows={2} value={weekly.formNote} onChange={set("formNote")} />
        <Row>
          <Text label="Button text" value={weekly.submitLabel} onChange={set("submitLabel")} />
        </Row>
        <Area label="After they send" rows={2} value={weekly.thanksText} onChange={set("thanksText")} />
        <Toggle
          label="Show how many decisions are in"
          hint="the count climbs on the page during the bar hour"
          value={weekly.showCount}
          onChange={set("showCount")}
        />
      </Section>

      <Section title="The rest of the page">
        <Area
          label="How it works"
          hint="blank line = new paragraph · ## heading · **bold**"
          rows={8}
          value={weekly.howItWorks}
          onChange={set("howItWorks")}
        />
        <Row>
          <Text label="This week heading" value={weekly.thisWeekHeading} onChange={set("thisWeekHeading")} />
        </Row>
        <Area
          label="When no night is entered yet"
          rows={2}
          value={weekly.noLineupText}
          onChange={set("noLineupText")}
        />
        <Area label="Last line on the page" rows={2} value={weekly.closingLine} onChange={set("closingLine")} />
      </Section>

      <Section title="Where else it shows up">
        <Toggle
          label="Strip on the home page"
          hint="one line under the logo, in the accent colour"
          value={weekly.showOnHome}
          onChange={set("showOnHome")}
        />
        <Area label="Home strip text" rows={2} value={weekly.homeStripText} onChange={set("homeStripText")} />
        <Text label="Home strip button" value={weekly.homeStripCta} onChange={set("homeStripCta")} />
        <Toggle
          label="Block at the top of /shows"
          hint={`under the heading "${content.showsPage.weeklyHeading}" — edit that in the Shows tab`}
          value={weekly.showOnShowsPage}
          onChange={set("showOnShowsPage")}
        />
        <p className="text-[12px] text-neutral-500">
          The nav link is under Site &amp; SEO → Navigation, like every other page.
        </p>
      </Section>

      <SeoEditor
        title="Bad Decisions SEO & AI SEO"
        seo={weekly.seo}
        suggestion={suggestFor(content, "weekly")}
        onChange={set("seo")}
      />
    </>
  );
}

/**
 * The stage panel: what the host holds during the draw.
 *
 * Big text, few buttons. "Draw one" asks the server for a random open
 * submission and marks it drawn, so the same one can never come up twice
 * even with two phones open. "Archive everything" is the last tap of the
 * night; it clears the pile so next week starts at zero.
 */
function StagePanel({ enabled }: { enabled: boolean }) {
  const [list, setList] = useState<Submission[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [drawn, setDrawn] = useState<Submission[]>([]);
  const [showPile, setShowPile] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/admin/decisions", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "Could not load submissions");
      setList(data.submissions as Submission[]);
      setError("");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load submissions");
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const act = async (body: Record<string, unknown>) => {
    setBusy(true);
    try {
      const response = await fetch("/api/admin/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data.ok) throw new Error(data.error || "That didn't work");
      setError("");
      return data;
    } catch (actError) {
      setError(actError instanceof Error ? actError.message : "That didn't work");
      return null;
    } finally {
      setBusy(false);
      void load();
    }
  };

  const draw = async () => {
    const data = await act({ action: "draw" });
    if (data?.drawn) setDrawn((previous) => [data.drawn as Submission, ...previous]);
  };

  const archive = async () => {
    if (!window.confirm("Archive every submission from tonight? The page count goes back to zero.")) return;
    await act({ action: "archive-all" });
    setDrawn([]);
  };

  const open = (list ?? []).filter((entry) => entry.status === "open");
  const drawnStored = (list ?? []).filter((entry) => entry.status === "drawn");
  const onStage = drawn.length ? drawn : drawnStored;

  return (
    <Section
      title="Tonight"
      hint={
        enabled
          ? "Open this on your phone during the show. Draw one pulls at random and reads it back big enough to read out loud."
          : "The page is switched off, so nothing new comes in — but anything already sent is still here."
      }
    >
      {error ? (
        <p className="rounded-md border border-red-900/60 bg-red-950/40 px-3 py-2 text-[12px] text-red-300">{error}</p>
      ) : null}

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">Decisions in</p>
          <p className="text-5xl font-semibold text-white">{list ? open.length : "…"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button tone="primary" onClick={draw} disabled={busy || !open.length}>
            Draw one
          </Button>
          <Button onClick={() => void load()} disabled={busy}>
            Refresh
          </Button>
          <Button tone="danger" onClick={archive} disabled={busy || !(list ?? []).some((e) => e.status !== "archived")}>
            Archive everything
          </Button>
        </div>
      </div>

      {onStage.length ? (
        <div className="grid gap-3">
          {onStage.map((entry, index) => (
            <div
              key={entry.id}
              className={`rounded-lg border p-4 ${
                index === 0 ? "border-white bg-white text-black" : "border-neutral-800 bg-neutral-900/40"
              }`}
            >
              <p className={`text-[11px] uppercase tracking-[0.18em] ${index === 0 ? "text-neutral-600" : "text-neutral-500"}`}>
                {entry.name ? `Called out: ${entry.name}` : "Anonymous"}
              </p>
              <p className={`mt-2 leading-snug ${index === 0 ? "text-2xl sm:text-3xl" : "text-[16px]"}`}>{entry.decision}</p>
              <div className="mt-3 flex gap-2">
                <Button tone={index === 0 ? "default" : "ghost"} onClick={() => act({ action: "reopen", id: entry.id })} disabled={busy}>
                  Put it back
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[13px] text-neutral-500">Nothing drawn yet.</p>
      )}

      <Card title={`The pile (${open.length} open)`} subtitle="everything waiting to be drawn, newest first">
        {open.length ? (
          <ul className="grid gap-2">
            {open.map((entry) => (
              <li key={entry.id} className="flex items-start justify-between gap-3 rounded-md border border-neutral-800 px-3 py-2">
                <span className="min-w-0">
                  <span className="block text-[14px] leading-snug text-neutral-100">{entry.decision}</span>
                  <span className="block text-[11px] text-neutral-500">
                    {entry.name ? entry.name : "anonymous"}
                    {entry.createdAt ? ` · ${new Date(entry.createdAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}` : ""}
                  </span>
                </span>
                <Button tone="ghost" onClick={() => act({ action: "delete", id: entry.id })} disabled={busy}>
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[13px] text-neutral-500">Empty.</p>
        )}
      </Card>

      {(list ?? []).some((entry) => entry.status === "archived") ? (
        <div>
          <Button tone="ghost" onClick={() => setShowPile((value) => !value)}>
            {showPile ? "Hide" : "Show"} archived ({(list ?? []).filter((e) => e.status === "archived").length})
          </Button>
          {showPile ? (
            <ul className="mt-2 grid gap-1">
              {(list ?? [])
                .filter((entry) => entry.status === "archived")
                .map((entry) => (
                  <li key={entry.id} className="flex items-start justify-between gap-3 text-[13px] text-neutral-400">
                    <span>
                      {entry.decision}
                      {entry.name ? <span className="text-neutral-600"> — {entry.name}</span> : null}
                    </span>
                    <Button tone="ghost" onClick={() => act({ action: "delete", id: entry.id })} disabled={busy}>
                      Delete
                    </Button>
                  </li>
                ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </Section>
  );
}
