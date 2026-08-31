import type { Reel } from "./types";

export type InstagramMediaItem = {
  id: string;
  media_type: string;
  /** Not returned by every API version — used to prefer true Reels when present. */
  media_product_type?: string;
  media_url?: string;
  thumbnail_url?: string;
  permalink: string;
  caption?: string;
  timestamp: string;
};

export type MediaPage = {
  data: InstagramMediaItem[];
  paging?: { cursors?: { after?: string }; next?: string };
};

const GRAPH_BASE = "https://graph.instagram.com";
const FIELDS = "id,caption,media_type,media_product_type,media_url,thumbnail_url,permalink,timestamp";
const PAGE_SIZE = 25;

/** How many clips to download in one call. Kept well under a serverless
 *  function's time limit — video download + re-upload is the slow part. */
export const MAX_DOWNLOADS_PER_RUN = 10;

export async function fetchMediaPage(accessToken: string, after?: string): Promise<MediaPage> {
  const url = new URL(`${GRAPH_BASE}/me/media`);
  url.searchParams.set("fields", FIELDS);
  url.searchParams.set("limit", String(PAGE_SIZE));
  url.searchParams.set("access_token", accessToken);
  if (after) url.searchParams.set("after", after);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Instagram API ${res.status}: ${body.slice(0, 300) || res.statusText}`);
  }
  return (await res.json()) as MediaPage;
}

export async function downloadAsset(url: string): Promise<{ bytes: Buffer; contentType: string }> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Failed to download ${url}: ${res.status}`);
  return { bytes: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") || "" };
}

/**
 * Instagram long-lived tokens last ~60 days. Refreshing needs the token to
 * already be at least 24 hours old, so this is only worth attempting once
 * it is getting close to expiry rather than on every sync.
 */
export async function refreshTokenIfNeeded(
  accessToken: string,
  tokenExpiresAt: string
): Promise<{ accessToken: string; tokenExpiresAt: string } | null> {
  const expiry = tokenExpiresAt ? Date.parse(tokenExpiresAt) : NaN;
  const fiveDays = 5 * 24 * 60 * 60 * 1000;
  if (Number.isFinite(expiry) && expiry - Date.now() > fiveDays) return null;

  const url = new URL(`${GRAPH_BASE}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) return null; // surfaced as a sync error by the caller if the token has actually expired

  const data = (await res.json()) as { access_token: string; expires_in: number };
  return {
    accessToken: data.access_token,
    tokenExpiresAt: new Date(Date.now() + data.expires_in * 1000).toISOString(),
  };
}

/** A video-type post — what this site treats as a "reel" tile. */
export function isReel(item: InstagramMediaItem): boolean {
  if (item.media_type !== "VIDEO") return false;
  return item.media_product_type ? item.media_product_type === "REELS" : true;
}

/**
 * Scans one page of media — already in the API's own newest-first order —
 * for reels this site doesn't have yet, up to `cap`. The scan always stops
 * the instant it reaches an id already known: on a stable reverse-
 * chronological feed, everything past that point has necessarily been seen
 * on a previous walk already, so there is nothing left to find on this page
 * or any older one.
 */
export function pickNewItems(
  items: InstagramMediaItem[],
  knownIds: ReadonlySet<string>,
  cap: number
): { picked: InstagramMediaItem[]; hitKnown: boolean } {
  const picked: InstagramMediaItem[] = [];
  for (const item of items) {
    if (knownIds.has(item.id)) return { picked, hitKnown: true };
    if (isReel(item) && picked.length < cap) picked.push(item);
  }
  return { picked, hitKnown: false };
}

export function buildReelFromMedia(item: InstagramMediaItem, videoUrl: string, posterUrl: string): Reel {
  return {
    id: `ig-${item.id}`,
    instagramUrl: item.permalink,
    videoUrl,
    posterUrl,
    caption: (item.caption || "").split("\n")[0].slice(0, 200),
    alt: "Pins & Needles Comedy Instagram reel",
    order: 0,
    published: true,
    igTimestamp: item.timestamp || "",
    igMediaId: item.id,
  };
}

/**
 * Merges freshly synced reels into the stored list without disturbing any
 * reel already there, so a manual reorder, an edited caption, or a reel
 * hidden by unpublishing it survives every future sync.
 *
 * "prepend" is for the first page of a walk — that page is always the
 * newest content relative to whatever is already stored. "append" is for
 * a later page reached while still walking backfill — necessarily older
 * than everything already in the list.
 *
 * Known limitation: if a single page (25 posts) contains more new reels
 * than MAX_DOWNLOADS_PER_RUN, draining it takes more than one sync call,
 * and each of those calls also "prepends" — so their relative order can
 * end up interleaved rather than perfectly newest-to-oldest within that
 * one page's worth of overflow. It never mixes with the wrong era of
 * content beyond that page. Judged not worth the extra state needed to
 * fix precisely, since a discovery grid doesn't need timeline-perfect
 * ordering the way a chronological feed would.
 */
export function mergeReels(existing: Reel[], additions: Reel[], mode: "prepend" | "append"): Reel[] {
  const merged = mode === "prepend" ? [...additions, ...existing] : [...existing, ...additions];
  return merged.map((reel, index) => ({ ...reel, order: index }));
}

export type SyncState = { reels: Reel[]; cursor: string; caughtUp: boolean };

export type SyncDeps = {
  fetchMediaPage: typeof fetchMediaPage;
  downloadAsset: typeof downloadAsset;
  saveUpload: (filename: string, bytes: Buffer, contentType: string) => Promise<string>;
};

export type SyncResult = {
  reels: Reel[];
  cursor: string;
  caughtUp: boolean;
  addedCount: number;
  /** New reels still waiting on the page just fetched — call sync again to keep draining it. */
  remaining: number;
};

/**
 * One step of an ongoing "walk" over the account's media, newest post
 * first. A single call handles the common case in one shot (catching up on
 * whatever is new since the last sync); a brand-new site with a long
 * history needs several calls, driven by the admin's "Sync now" loop, each
 * one resuming exactly where the last left off via the persisted cursor.
 */
export async function runInstagramSync(
  current: SyncState,
  accessToken: string,
  deps: SyncDeps
): Promise<SyncResult> {
  const knownIds = new Set(current.reels.map((reel) => reel.igMediaId).filter(Boolean));
  const walkingFreshly = current.caughtUp;
  const after = walkingFreshly ? undefined : current.cursor || undefined;

  const page = await deps.fetchMediaPage(accessToken, after);
  const { picked, hitKnown } = pickNewItems(page.data, knownIds, MAX_DOWNLOADS_PER_RUN);

  const built: Reel[] = [];
  for (const item of picked) {
    if (!item.media_url) continue; // no playable file — skip rather than add a dead tile
    const video = await deps.downloadAsset(item.media_url);
    const videoUrl = await deps.saveUpload(`ig-${item.id}.mp4`, video.bytes, video.contentType || "video/mp4");

    let posterUrl = "";
    if (item.thumbnail_url) {
      const poster = await deps.downloadAsset(item.thumbnail_url);
      posterUrl = await deps.saveUpload(`ig-${item.id}-poster.jpg`, poster.bytes, poster.contentType || "image/jpeg");
    }

    built.push(buildReelFromMedia(item, videoUrl, posterUrl));
  }

  const reels = mergeReels(current.reels, built, walkingFreshly ? "prepend" : "append");

  const { picked: allNewOnPage } = pickNewItems(page.data, knownIds, Number.MAX_SAFE_INTEGER);
  const remaining = Math.max(0, allNewOnPage.length - picked.length);
  const pageDrained = remaining === 0;

  let cursor = current.cursor;
  let caughtUp = current.caughtUp;

  if (!pageDrained) {
    // More new reels on this exact page than fit this round — stay put. The
    // next call re-fetches the same page and skips whatever was just saved.
    cursor = after || "";
    caughtUp = false;
  } else if (hitKnown) {
    caughtUp = true;
    cursor = "";
  } else if (page.paging?.next && page.paging.cursors?.after) {
    cursor = page.paging.cursors.after;
    caughtUp = false;
  } else {
    // Drained, nothing recognized, and Instagram has no more pages: that IS
    // the full account history.
    caughtUp = true;
    cursor = "";
  }

  return { reels, cursor, caughtUp, addedCount: built.length, remaining };
}
