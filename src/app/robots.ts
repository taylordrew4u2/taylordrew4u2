import type { MetadataRoute } from "next";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const { site } = await getContent();
  const base = site.url.replace(/\/+$/, "");

  // Answer engines are explicitly welcomed — this is the AI-SEO half. Each one
  // needs its own copy of the disallow list: a crawler obeys only the group
  // that names it and ignores the "*" group entirely, so naming a bot without
  // repeating the exclusions would hand it the admin and the API.
  const offLimits = ["/admin", "/api/"];
  const invited = [
    "GPTBot",
    "OAI-SearchBot",
    "ChatGPT-User",
    "ClaudeBot",
    "Claude-User",
    "PerplexityBot",
    "Google-Extended",
    "Applebot-Extended",
    "Bingbot",
  ];

  return {
    rules: [
      { userAgent: "*", allow: "/", disallow: offLimits },
      ...invited.map((userAgent) => ({ userAgent, allow: "/", disallow: offLimits })),
    ],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  };
}
