import type { Content, Post, Seo } from "./types";
import { absoluteUrl, stripMarkdown, clamp } from "./seo";

export function organizationSchema(content: Content) {
  const { site, about } = content;
  const base = site.url;
  return {
    "@context": "https://schema.org",
    "@type": site.organizationType || "Organization",
    "@id": `${base}#organization`,
    name: site.name,
    alternateName: site.shortName,
    url: base,
    logo: absoluteUrl(base, site.logoUrl),
    image: absoluteUrl(base, site.seo.ogImage || site.logoUrl),
    description: site.seo.aiSummary || site.seo.description,
    slogan: site.tagline,
    foundingDate: site.foundingYear,
    areaServed: "New York City",
    sameAs: site.socials.map((social) => social.url).filter(Boolean),
    member: about.producers.map((producer) => ({
      "@type": "Person",
      name: producer.name,
      jobTitle: producer.role,
      description: clamp(producer.bio, 300),
    })),
  };
}

export function websiteSchema(content: Content) {
  const { site } = content;
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}#website`,
    url: site.url,
    name: site.name,
    description: site.seo.description,
    inLanguage: "en-US",
    publisher: { "@id": `${site.url}#organization` },
  };
}

export function faqSchema(seo: Seo) {
  if (!seo.faq?.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: seo.faq.map((entry) => ({
      "@type": "Question",
      name: entry.q,
      acceptedAnswer: { "@type": "Answer", text: entry.a },
    })),
  };
}

export function breadcrumbSchema(base: string, trail: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: trail.map((crumb, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(base, crumb.path),
    })),
  };
}

export function postSchema(content: Content, post: Post) {
  const { site } = content;
  const base = site.url;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${base}/news/${post.slug}#post`,
    headline: clamp(post.title, 110),
    description: post.seo.description || post.excerpt,
    datePublished: post.date,
    dateModified: post.date,
    inLanguage: "en-US",
    keywords: (post.seo.keywords?.length ? post.seo.keywords : post.tags).join(", "),
    articleBody: clamp(stripMarkdown(post.body), 5000),
    image: post.coverUrl ? [absoluteUrl(base, post.coverUrl)] : [absoluteUrl(base, site.logoUrl)],
    mainEntityOfPage: { "@type": "WebPage", "@id": `${base}/news/${post.slug}` },
    author: { "@type": "Organization", name: site.name, url: base },
    publisher: { "@id": `${base}#organization` },
  };
}

export function blogSchema(content: Content) {
  const { site, posts } = content;
  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    "@id": `${site.url}/news#blog`,
    name: `${site.name} News`,
    url: `${site.url}/news`,
    description: content.news.seo.description,
    publisher: { "@id": `${site.url}#organization` },
    blogPost: posts
      .filter((post) => post.published)
      .slice(0, 20)
      .map((post) => ({
        "@type": "BlogPosting",
        headline: clamp(post.title, 110),
        url: `${site.url}/news/${post.slug}`,
        datePublished: post.date,
      })),
  };
}
