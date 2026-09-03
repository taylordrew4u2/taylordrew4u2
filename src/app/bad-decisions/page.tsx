import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import JsonLd from "@/components/JsonLd";
import DecisionForm from "@/components/DecisionForm";
import { getContent } from "@/lib/store";
import { countOpen } from "@/lib/submissions";
import { toMetadata } from "@/lib/meta";
import { formatDate, renderBody } from "@/lib/render";
import { breadcrumbSchema, faqSchema, weeklySchema } from "@/lib/schema";
import { groupByRole, nyToday } from "@/lib/shows";
import {
  closedMessage,
  nextWeeklyShow,
  submissionWindow,
  weeklyScheduleLine,
  weeklyVenueLine,
} from "@/lib/decisions";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { site, weekly } = await getContent();
  if (!weekly.enabled) return { title: "Not found" };
  return await toMetadata(site, weekly.seo, "/bad-decisions");
}

/**
 * The weekly show's page, and the address behind the QR code.
 *
 * Order matters here more than anywhere else on the site: someone opens this
 * on a phone, in a bar, with a drink in the other hand. The form is the first
 * thing after the title. The explanation comes after, for people who got here
 * from the flyer instead of the room.
 */
export default async function WeeklyPage() {
  const content = await getContent();
  const { site, weekly } = content;
  if (!weekly.enabled) notFound();

  const today = nyToday();
  const next = nextWeeklyShow(content.shows, weekly, today);
  const faq = faqSchema(weekly.seo);
  const schedule = weeklyScheduleLine(weekly);
  const venue = weeklyVenueLine(weekly);
  const bill = next ? groupByRole(next.lineup) : [];

  const gate = submissionWindow(weekly, content.shows);
  const closed = closedMessage(weekly, gate);

  let initialCount: number | null = null;
  if (weekly.showCount && gate.open) {
    try {
      initialCount = await countOpen();
    } catch (error) {
      console.error("[weekly] count failed:", error);
    }
  }

  const fullAddress = [weekly.address, weekly.city, weekly.region, weekly.postalCode]
    .filter(Boolean)
    .join(", ");

  return (
    <main>
      <JsonLd data={weeklySchema(content, next)} />
      <JsonLd
        data={breadcrumbSchema(site.url, [
          { name: "Home", path: "/" },
          { name: weekly.title, path: "/bad-decisions" },
        ])}
      />
      {faq ? <JsonLd data={faq} /> : null}

      <PageHeader hero={content.home.hero} nav={site.nav} active="/bad-decisions" />

      <section className="mx-auto max-w-3xl px-5 pt-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--pnc-muted)]">{schedule}</p>
        <h1 className="mt-3 text-3xl leading-[1.05] sm:text-5xl">{weekly.title}</h1>
        {weekly.tagline ? (
          <p className="mt-3 text-[18px] leading-relaxed sm:text-[20px]">{weekly.tagline}</p>
        ) : null}
        <p className="mt-3 text-[14px] leading-relaxed text-[var(--pnc-muted)]">
          {venue}
          {weekly.price ? <span> · {weekly.price}</span> : null}
          {weekly.ageRestriction ? <span> · {weekly.ageRestriction}</span> : null}
        </p>
      </section>

      <section className="relative mx-auto max-w-3xl px-5 pt-8">
        <DecisionForm
          question={weekly.question}
          placeholder={weekly.placeholder}
          namePrompt={weekly.namePrompt}
          formNote={weekly.formNote}
          submitLabel={weekly.submitLabel}
          thanksText={weekly.thanksText}
          showCount={weekly.showCount}
          initialCount={initialCount}
          initialOpen={gate.open}
          initialClosedText={closed}
        />
        {weekly.roomNote ? (
          <p className="mt-4 text-[13px] leading-relaxed text-[var(--pnc-muted)]">{weekly.roomNote}</p>
        ) : null}
      </section>

      {weekly.posterUrl ? (
        <section className="mx-auto max-w-3xl px-5 pt-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={weekly.posterUrl}
            alt={weekly.posterAlt || weekly.title}
            className="w-full"
            loading="lazy"
          />
        </section>
      ) : null}

      {weekly.howItWorks ? (
        <section className="mx-auto max-w-3xl px-5 pt-10">
          <div
            className="pnc-prose text-[16px]"
            dangerouslySetInnerHTML={{ __html: renderBody(weekly.howItWorks) }}
          />
        </section>
      ) : null}

      <section className="mx-auto max-w-3xl px-5 pt-10">
        <h2 className="mb-4 text-[11px] uppercase tracking-[0.32em] text-[var(--pnc-muted)]">
          {weekly.thisWeekHeading}
        </h2>
        {next ? (
          <div className="border border-white/15 p-5">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[var(--pnc-muted)]">
              {formatDate(next.date)}
            </p>
            <h3 className="mt-2 text-[20px] leading-snug">
              <Link href={`/shows/${next.slug}`} className="hover:underline">
                {next.title}
              </Link>
            </h3>
            {bill.length ? (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {bill.map((group) => (
                  <div key={group.role || "cast"}>
                    {group.role ? (
                      <p className="mb-1 text-[10px] uppercase tracking-[0.18em] text-[var(--pnc-muted)]">
                        {group.role}
                      </p>
                    ) : null}
                    <ul>
                      {group.people.map((person) => (
                        <li key={person.id} className="text-[15px] leading-relaxed">
                          {person.url ? (
                            <a
                              href={person.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="underline underline-offset-4 hover:text-[var(--pnc-accent)]"
                            >
                              {person.name}
                            </a>
                          ) : (
                            person.name
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : null}
            {next.instagramUrl ? (
              <a
                href={next.instagramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block text-[12px] uppercase tracking-[0.22em] underline underline-offset-4 hover:text-[var(--pnc-accent)]"
              >
                See the lineup on Instagram
              </a>
            ) : null}
          </div>
        ) : (
          <p className="max-w-xl text-[15px] leading-relaxed text-[var(--pnc-muted)]">
            {weekly.noLineupText}
          </p>
        )}
      </section>

      <section className="mx-auto max-w-3xl px-5 pb-20 pt-12">
        <dl className="border-y border-white/10">
          <div className="border-b border-white/10 py-3">
            <dt className="text-[10px] uppercase tracking-[0.24em] text-[var(--pnc-muted)]">When</dt>
            <dd className="mt-1 text-[15px]">{schedule}</dd>
          </div>
          {weekly.venueName ? (
            <div className="border-b border-white/10 py-3">
              <dt className="text-[10px] uppercase tracking-[0.24em] text-[var(--pnc-muted)]">Venue</dt>
              <dd className="mt-1 text-[15px]">
                {weekly.venueUrl ? (
                  <a href={weekly.venueUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {weekly.venueName}
                  </a>
                ) : (
                  weekly.venueName
                )}
              </dd>
            </div>
          ) : null}
          {fullAddress ? (
            <div className="border-b border-white/10 py-3">
              <dt className="text-[10px] uppercase tracking-[0.24em] text-[var(--pnc-muted)]">Address</dt>
              <dd className="mt-1 text-[15px]">
                {weekly.mapUrl ? (
                  <a href={weekly.mapUrl} target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">
                    {fullAddress}
                  </a>
                ) : (
                  fullAddress
                )}
              </dd>
            </div>
          ) : null}
          {weekly.price ? (
            <div className="py-3">
              <dt className="text-[10px] uppercase tracking-[0.24em] text-[var(--pnc-muted)]">Price</dt>
              <dd className="mt-1 text-[15px]">{weekly.price}</dd>
            </div>
          ) : null}
        </dl>

        {weekly.closingLine ? (
          <p className="mt-8 text-[15px] leading-relaxed text-[var(--pnc-muted)]">{weekly.closingLine}</p>
        ) : null}
      </section>
    </main>
  );
}
