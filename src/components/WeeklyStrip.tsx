import Link from "next/link";
import type { WeeklyPage } from "@/lib/types";
import { weeklyScheduleLine } from "@/lib/decisions";

/**
 * One line about the weekly, for the home page and the top of /shows.
 * Short on purpose: the page does the explaining, this just points at it.
 */
export default function WeeklyStrip({ weekly, text }: { weekly: WeeklyPage; text: string }) {
  return (
    <section className="border-y border-white/10 bg-[var(--pnc-accent)] text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[14px] leading-snug">
          <span className="mr-2 text-[10px] uppercase tracking-[0.28em] opacity-80">
            {weeklyScheduleLine(weekly).split(" · ")[0]}
          </span>
          {text}
        </p>
        <Link
          href="/bad-decisions"
          className="shrink-0 border border-white px-4 py-2 text-center text-[12px] uppercase tracking-[0.22em] transition-colors hover:bg-white hover:text-[var(--pnc-accent)]"
        >
          {weekly.homeStripCta || "Send yours in"}
        </Link>
      </div>
    </section>
  );
}
