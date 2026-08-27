import type { Metadata } from "next";
import type { Seo, SiteSettings } from "./types";
import { absoluteUrl } from "./seo";

/** Turn one of our editable Seo blocks into Next.js Metadata. */
export function toMetadata(site: SiteSettings, seo: Seo, path: string): Metadata {
  const base = site.url;
  const url = seo.canonical || absoluteUrl(base, path);
  const image = absoluteUrl(base, seo.ogImage || site.seo.ogImage || site.logoUrl);
  const title = seo.title || site.seo.title || site.name;
  const description = seo.description || site.seo.description;

  return {
    title: { absolute: title },
    description,
    keywords: seo.keywords?.length ? seo.keywords : site.seo.keywords,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      siteName: site.name,
      title,
      description,
      url,
      images: [image],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: seo.noindex
      ? { index: false, follow: false }
      : { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  };
}
