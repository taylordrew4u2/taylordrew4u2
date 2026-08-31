import { NextResponse } from "next/server";
import { isAuthed } from "@/lib/auth";
import { getContentStrict, patchContent, saveUpload } from "@/lib/store";
import { downloadAsset, fetchMediaPage, refreshTokenIfNeeded, runInstagramSync } from "@/lib/instagram";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST() {
  if (!(await isAuthed())) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let content;
  try {
    content = await getContentStrict();
  } catch {
    return NextResponse.json({ ok: false, error: "Storage is not reachable right now — try again shortly" }, { status: 503 });
  }

  const ig = content.instagram;
  if (!ig.accessToken) {
    return NextResponse.json({ ok: false, error: "Paste an Instagram access token in first" }, { status: 400 });
  }

  try {
    const refreshed = await refreshTokenIfNeeded(ig.accessToken, ig.tokenExpiresAt);
    const accessToken = refreshed?.accessToken || ig.accessToken;

    const result = await runInstagramSync(
      { reels: content.reels, cursor: ig.cursor, caughtUp: ig.caughtUp },
      accessToken,
      { fetchMediaPage, downloadAsset, saveUpload }
    );

    await patchContent({
      reels: result.reels,
      instagram: {
        ...ig,
        ...(refreshed || {}),
        cursor: result.cursor,
        caughtUp: result.caughtUp,
        lastSyncedAt: new Date().toISOString(),
        lastSyncCount: result.addedCount,
        remaining: result.remaining,
        lastError: "",
      },
    });

    return NextResponse.json({
      ok: true,
      added: result.addedCount,
      remaining: result.remaining,
      caughtUp: result.caughtUp,
      totalReels: result.reels.length,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Sync failed";
    console.error("[instagram sync]", error);
    await patchContent({ instagram: { lastError: message } }).catch(() => {});
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}
