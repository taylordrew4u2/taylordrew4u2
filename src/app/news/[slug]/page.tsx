import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import JsonLd from "@/components/JsonLd";
import { getContent } from "@/lib/store";
import { toMetadata } from "@/lib/meta";
import { aspectValue, formatDate, renderBody } from "@/lib/render";
import { breadcrumbSchema, faqSchema, postSchema } from "@/lib/schema";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params;
  const { site, posts } = await getContent();
  const post = posts.find((entry) => entry.slug === slug);
  if (!post) return { title: "Not found" };

  const meta = toMetadata(site, post.seo, `/news/${post.slug}`);
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      type: "article",
      publishedTime: post.date,
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params;
  const content = await getContent();
  const post = content.posts.find((entry) => entry.slug === slug && entry.published);
  if (!post) notFound();

  const { site, blogSettings } = content;
  const ratio = aspectValue(blogSettings.coverAspect);
  const faq = faqSchema(post.seo);

  const others = content.posts
    .filter((entry) => entry.published && entry.slug !== post.slug)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 3);

  return (
    <main>
      <JsonLd data={postSchema(content, post)} />
      <JsonLd
        data={breadcrumbSchema(site.url, [
          { name: "Home", path: "/" },
          { name: content.news.heading, path: "/news" },
          { name: post.title, path: `/news/${post.slug}` },
        ])}
      />
      {faq ? <JsonLd data={faq} /> : null}

      <PageHeader hero={content.home.hero} nav={site.nav} active="/news" />

      <article className="mx-auto max-w-3xl px-5 pb-20 pt-8">
        <p className="text-[11px] uppercase tracking-[0.28em] text-[var(--pnc-muted)]">
          <Link href="/news" className="hover:text-[var(--pnc-fg)]">
            News
          </Link>
          <span className="px-2 opacity-40">/</span>
          {formatDate(post.date)}
        </p>

        <h1 className="mt-4 text-3xl leading-[1.1] sm:text-4xl">{post.title}</h1>

        {post.excerpt ? (
          <p className="mt-4 text-[17px] leading-relaxed text-[var(--pnc-muted)]">{post.excerpt}</p>
        ) : null}

        {post.coverUrl ? (
          <div
            className="mt-8 w-full overflow-hidden bg-neutral-950"
            style={{ aspectRatio: `${ratio}`, borderRadius: blogSettings.cornerRadius || undefined }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={post.coverUrl}
              alt={post.coverAlt || post.title}
              className="h-full w-full"
              style={{ objectFit: blogSettings.imageFit }}
            />
          </div>
        ) : null}

        <div
          className="pnc-prose mt-8 text-[16px]"
          dangerouslySetInnerHTML={{ __html: renderBody(post.body) }}
        />

        {post.tags.length ? (
          <ul className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li
                key={tag}
                className="border border-white/15 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-[var(--pnc-muted)]"
              >
                {tag}
              </li>
            ))}
          </ul>
        ) : null}
      </article>

      {others.length ? (
        <section className="mx-auto max-w-6xl px-5 pb-20">
          <h2 className="mb-4 text-[11px] uppercase tracking-[0.32em] text-[var(--pnc-muted)]">
            More news
          </h2>
          <ul className="grid gap-6 sm:grid-cols-3">
            {others.map((entry) => (
              <li key={entry.id}>
                <Link href={`/news/${entry.slug}`} className="group block">
                  <span className="block text-[10px] uppercase tracking-[0.22em] text-[var(--pnc-muted)]">
                    {formatDate(entry.date)}
                  </span>
                  <span className="mt-2 block text-[15px] leading-snug group-hover:underline">
                    {entry.title}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </main>
  );
}
