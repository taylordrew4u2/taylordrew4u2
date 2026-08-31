import { NextResponse } from "next/server";
import { contentTypeFor, githubConfig, readFile } from "@/lib/github-store";

export const dynamic = "force-dynamic";

/**
 * Serves an upload out of the GitHub content store.
 *
 * The content repo is private — content.json carries the Instagram token —
 * so its files cannot be linked directly. Upload keys already carry a
 * timestamp and a random suffix and are never rewritten, so the bytes behind
 * one are immutable and the CDN can keep them forever after the first hit.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const config = githubConfig(process.env);
  if (!config) return new NextResponse("Not found", { status: 404 });

  const { path } = await params;
  const key = path.map(decodeURIComponent).join("/");

  try {
    const { bytes } = await readFile(config, `uploads/${key}`);
    if (!bytes) return new NextResponse("Not found", { status: 404 });

    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": contentTypeFor(key),
        "Content-Length": String(bytes.length),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("[media] read failed:", error);
    return new NextResponse("Not found", { status: 404 });
  }
}
