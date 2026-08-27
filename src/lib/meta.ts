import type { Metadata } from "next";
import type { Seo, SiteSettings } from "./types";
import { absoluteUrl } from "./seo";
import { onCanonicalHost } from "./host";

/** Turn one of our editable Seo blocks into Next.js Metadata. */
export async function toMetadata(
  site: SiteSettings,
  seo: Seo,
  path: string
): Promise<Metadata> {
  const base = site.url;
  const url = seo.canonical || absoluteUrl(base, path);
  const image = absoluteUrl(base, seo.ogImage || site.seo.ogImage || site.logoUrl);
  const title = seo.title || site.seo.title || site.name;
  const description = seo.description || site.seo.description;

  // A page is indexable only when it is served on the site's real domain.
  const indexable = (await onCanonicalHost(base)) && !seo.noindex;

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
    robots: indexable
      ? { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 }
      : { index: false, follow: false },
  };
}
