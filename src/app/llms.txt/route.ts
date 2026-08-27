import { getContent } from "@/lib/store";
import { clamp, stripMarkdown } from "@/lib/seo";

export const dynamic = "force-dynamic";

/**
 * llms.txt — a plain-text brief written for answer engines and AI crawlers.
 * Everything in here comes from the AI Summary fields in /admin.
 */
export async function GET() {
  const content = await getContent();
  const { site, about, shop, contact } = content;
  const base = site.url.replace(/\/+$/, "");

  const posts = content.posts
    .filter((post) => post.published)
    .sort((a, b) => (a.date < b.date ? 1 : -1))
    .slice(0, 30);

  const faq = [...site.seo.faq, ...about.seo.faq]
    .map((entry) => `- **${entry.q}** ${entry.a}`)
    .join("\n");

  const body = `# ${site.name}

> ${site.seo.aiSummary || site.seo.description}

Tagline: ${site.tagline}
Location: ${contact.city}
Producers: ${about.producers.map((producer) => `${producer.name} (${producer.role})`).join(", ")}
Website: ${base}
${site.socials.map((social) => `${social.label}: ${social.url}`).join("\n")}

## Pages

- [Home](${base}/): ${content.home.seo.aiSummary || content.home.seo.description}
- [News](${base}/news): ${content.news.seo.aiSummary || content.news.seo.description}
- [About Us](${base}/about): ${about.seo.aiSummary || about.seo.description}
- [Shop](${base}/shop): ${shop.seo.aiSummary || shop.seo.description}
- [Contact](${base}/contact): ${contact.seo.aiSummary || contact.seo.description}

## What the show is

${clamp(stripMarkdown(about.story), 1800)}

## FAQ

${faq}

## News archive

${posts
  .map((post) => `- [${post.title}](${base}/news/${post.slug}) — ${post.date} — ${post.excerpt}`)
  .join("\n")}

## Feeds

- Sitemap: ${base}/sitemap.xml
- RSS: ${base}/rss.xml
`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=600",
    },
  });
}
