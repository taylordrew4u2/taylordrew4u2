import { ImageResponse } from "next/og";
import { getContent } from "@/lib/store";

export const dynamic = "force-dynamic";

/**
 * The social card, drawn as a PNG at request time.
 *
 * Every image this site ships is an SVG, and no social platform will render
 * an SVG link preview — a shared link would show no image at all. Rather than
 * put a raster file back in the repository, the card is generated here from
 * the site's own title and tagline, in the brand's colours.
 *
 * Text only, deliberately: the brand marks are traced line art with thousands
 * of path segments, and asking the renderer to rasterise one on every crawl
 * would be slow and fragile for no gain at preview size.
 */
export async function GET(request: Request) {
  const { site } = await getContent();
  const { searchParams } = new URL(request.url);

  // A page can ask for its own title; otherwise the card speaks for the site.
  const title = (searchParams.get("title") || site.name || "Pins & Needles Comedy").slice(0, 120);
  const subtitle = (searchParams.get("subtitle") || site.tagline || "").slice(0, 160);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#ffffff",
          padding: "80px",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "120px",
            height: "10px",
            background: "#ff2e4d",
            marginBottom: "48px",
          }}
        />
        <div style={{ display: "flex", fontSize: 86, lineHeight: 1.05, letterSpacing: "-0.02em" }}>
          {title}
        </div>
        {subtitle ? (
          <div style={{ display: "flex", marginTop: "28px", fontSize: 36, color: "#b3b3b3" }}>
            {subtitle}
          </div>
        ) : null}
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
