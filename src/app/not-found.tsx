import Link from "next/link";
import PageHeader from "@/components/PageHeader";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function NotFound() {
  const content = await getContent();
  return (
    <main>
      <PageHeader hero={content.home.hero} nav={content.site.nav} active="" />
      <section className="mx-auto max-w-3xl px-5 py-28 text-center">
        <h1 className="text-3xl">Nothing here</h1>
        <p className="mt-4 text-[var(--pnc-muted)]">That page does not exist.</p>
        <Link
          href="/"
          className="mt-8 inline-block border border-white/25 px-6 py-3 text-[11px] uppercase tracking-[0.28em] hover:bg-white hover:text-black"
        >
          Back home
        </Link>
      </section>
    </main>
  );
}
