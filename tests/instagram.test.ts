import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildAuthorizeUrl,
  buildReelFromMedia,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  isReel,
  mergeReels,
  pickNewItems,
  runInstagramSync,
  type InstagramMediaItem,
  type MediaPage,
} from "../src/lib/instagram.ts";
import type { Reel } from "../src/lib/types.ts";

const video = (id: string, overrides: Partial<InstagramMediaItem> = {}): InstagramMediaItem => ({
  id,
  media_type: "VIDEO",
  media_product_type: "REELS",
  media_url: `https://cdn.example/${id}.mp4`,
  thumbnail_url: `https://cdn.example/${id}.jpg`,
  permalink: `https://www.instagram.com/reel/${id}/`,
  caption: `Caption for ${id}`,
  timestamp: "2026-01-01T00:00:00+0000",
  ...overrides,
});

const photo = (id: string): InstagramMediaItem => ({
  id,
  media_type: "IMAGE",
  permalink: `https://www.instagram.com/p/${id}/`,
  timestamp: "2026-01-01T00:00:00+0000",
});

const reel = (igMediaId: string, order = 0): Reel => ({
  id: `ig-${igMediaId}`,
  instagramUrl: `https://www.instagram.com/reel/${igMediaId}/`,
  videoUrl: `https://blob/${igMediaId}.mp4`,
  posterUrl: "",
  caption: "",
  alt: "",
  order,
  published: true,
  igTimestamp: "2026-01-01T00:00:00+0000",
  igMediaId,
});

test("isReel accepts VIDEO with media_product_type REELS", () => {
  assert.equal(isReel(video("a")), true);
});

test("isReel accepts a plain VIDEO post when media_product_type is absent", () => {
  const { media_product_type, ...rest } = video("a");
  assert.equal(isReel(rest as InstagramMediaItem), true);
});

test("isReel rejects photos", () => {
  assert.equal(isReel(photo("a")), false);
});

test("isReel rejects a video explicitly tagged as something other than REELS", () => {
  assert.equal(isReel(video("a", { media_product_type: "STORY" })), false);
});

test("pickNewItems skips items already known and stops there", () => {
  const items = [video("c"), video("b"), video("a")];
  const { picked, hitKnown } = pickNewItems(items, new Set(["b"]), 10);
  assert.deepEqual(picked.map((i) => i.id), ["c"]);
  assert.equal(hitKnown, true);
});

test("pickNewItems skips photos mixed in with reels", () => {
  const items = [video("b"), photo("photo1"), video("a")];
  const { picked } = pickNewItems(items, new Set(), 10);
  assert.deepEqual(picked.map((i) => i.id), ["b", "a"]);
});

test("pickNewItems respects the cap", () => {
  const items = [video("c"), video("b"), video("a")];
  const { picked, hitKnown } = pickNewItems(items, new Set(), 2);
  assert.deepEqual(picked.map((i) => i.id), ["c", "b"]);
  assert.equal(hitKnown, false);
});

test("pickNewItems returns nothing new when the whole page is already known", () => {
  const items = [video("b"), video("a")];
  const { picked, hitKnown } = pickNewItems(items, new Set(["b"]), 10);
  assert.deepEqual(picked, []);
  assert.equal(hitKnown, true);
});

test("buildReelFromMedia maps the Instagram fields onto our Reel shape", () => {
  const built = buildReelFromMedia(video("xyz", { caption: "Line one\nLine two" }), "hosted.mp4", "hosted.jpg");
  assert.equal(built.igMediaId, "xyz");
  assert.equal(built.instagramUrl, "https://www.instagram.com/reel/xyz/");
  assert.equal(built.videoUrl, "hosted.mp4");
  assert.equal(built.posterUrl, "hosted.jpg");
  assert.equal(built.caption, "Line one"); // only the first line
  assert.equal(built.published, true);
});

test("mergeReels prepend puts new reels above the existing list", () => {
  const merged = mergeReels([reel("old")], [reel("new")], "prepend");
  assert.deepEqual(merged.map((r) => r.igMediaId), ["new", "old"]);
  assert.deepEqual(merged.map((r) => r.order), [0, 1]);
});

test("mergeReels append puts new reels below the existing list", () => {
  const merged = mergeReels([reel("old")], [reel("new")], "append");
  assert.deepEqual(merged.map((r) => r.igMediaId), ["old", "new"]);
});

test("mergeReels never touches fields on an existing reel", () => {
  const existing = { ...reel("old"), caption: "hand-edited by the admin", published: false };
  const merged = mergeReels([existing], [reel("new")], "prepend");
  const kept = merged.find((r) => r.igMediaId === "old");
  assert.equal(kept?.caption, "hand-edited by the admin");
  assert.equal(kept?.published, false);
});

// --- runInstagramSync: fake deps, no network ---

function fakeDeps(pages: Record<string, MediaPage>) {
  const saved: string[] = [];
  return {
    fetchMediaPage: async (_token: string, after?: string) => pages[after ?? "start"],
    downloadAsset: async (url: string) => ({ bytes: Buffer.from(url), contentType: "video/mp4" }),
    saveUpload: async (filename: string) => {
      saved.push(filename);
      return `https://blob/${filename}`;
    },
    saved,
  };
}

test("runInstagramSync: first-ever sync pulls everything on one page and stops, caught up", async () => {
  const deps = fakeDeps({
    start: { data: [video("b"), video("a")] }, // no paging.next: this is the whole history
  });

  const result = await runInstagramSync({ reels: [], cursor: "", caughtUp: true }, "token", deps);

  assert.equal(result.addedCount, 2);
  assert.equal(result.caughtUp, true);
  assert.equal(result.remaining, 0);
  assert.deepEqual(result.reels.map((r) => r.igMediaId), ["b", "a"]);
});

test("runInstagramSync: a later sync only pulls what's new and prepends it", async () => {
  const deps = fakeDeps({
    start: { data: [video("d"), video("c"), video("b")] },
  });
  const existing = [reel("b", 0), reel("a", 1)];

  const result = await runInstagramSync({ reels: existing, cursor: "", caughtUp: true }, "token", deps);

  assert.equal(result.addedCount, 2); // d and c are new; b was already known and stopped the scan
  assert.deepEqual(result.reels.map((r) => r.igMediaId), ["d", "c", "b", "a"]);
  assert.equal(result.caughtUp, true);
});

test("runInstagramSync: nothing new since last time downloads nothing", async () => {
  const deps = fakeDeps({ start: { data: [video("a")] } });
  const existing = [reel("a", 0)];

  const result = await runInstagramSync({ reels: existing, cursor: "", caughtUp: true }, "token", deps);

  assert.equal(result.addedCount, 0);
  assert.deepEqual(result.reels.map((r) => r.igMediaId), ["a"]);
  assert.equal(deps.saved.length, 0);
});

test("runInstagramSync: walks into a second page during backfill and appends it below", async () => {
  const deps = fakeDeps({
    start: { data: [video("b")], paging: { cursors: { after: "cursor2" }, next: "x" } },
    cursor2: { data: [video("a")] }, // last page: no `next`
  });

  const first = await runInstagramSync({ reels: [], cursor: "", caughtUp: true }, "token", deps);
  assert.equal(first.caughtUp, false);
  assert.equal(first.cursor, "cursor2");
  assert.deepEqual(first.reels.map((r) => r.igMediaId), ["b"]);

  const second = await runInstagramSync(
    { reels: first.reels, cursor: first.cursor, caughtUp: first.caughtUp },
    "token",
    deps
  );
  assert.equal(second.caughtUp, true);
  // "b" (newer, found first) stays above "a" (older, found on the second page).
  assert.deepEqual(second.reels.map((r) => r.igMediaId), ["b", "a"]);
});

test("runInstagramSync: a page over the per-call cap is drained across repeat calls without duplicating", async () => {
  const many = Array.from({ length: 3 }, (_, i) => video(`v${i}`));
  const deps = fakeDeps({ start: { data: many } });

  let state = { reels: [] as Reel[], cursor: "", caughtUp: true };
  let rounds = 0;
  while (rounds < 10) {
    const result = await runInstagramSync(state, "token", { ...deps, saveUpload: deps.saveUpload });
    state = { reels: result.reels, cursor: result.cursor, caughtUp: result.caughtUp };
    rounds++;
    if (result.caughtUp && result.remaining === 0) break;
  }

  assert.equal(state.reels.length, 3);
  assert.deepEqual(new Set(state.reels.map((r) => r.igMediaId)), new Set(["v0", "v1", "v2"]));
});

test("runInstagramSync: skips a media item with no downloadable video", async () => {
  const deps = fakeDeps({
    start: { data: [{ ...video("a"), media_url: undefined }] },
  });

  const result = await runInstagramSync({ reels: [], cursor: "", caughtUp: true }, "token", deps);
  assert.equal(result.addedCount, 0);
  assert.equal(result.reels.length, 0);
});

// --- OAuth: real "Log in with Instagram" flow ---

test("buildAuthorizeUrl points at Instagram with the right params", () => {
  const url = new URL(buildAuthorizeUrl("app123", "https://example.com/cb", "state-abc"));
  assert.equal(url.origin + url.pathname, "https://www.instagram.com/oauth/authorize");
  assert.equal(url.searchParams.get("client_id"), "app123");
  assert.equal(url.searchParams.get("redirect_uri"), "https://example.com/cb");
  assert.equal(url.searchParams.get("response_type"), "code");
  assert.equal(url.searchParams.get("state"), "state-abc");
  assert.ok(url.searchParams.get("scope"));
});

test("exchangeCodeForToken reads the token from the modern wrapped response shape", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(JSON.stringify({ data: [{ access_token: "short-lived-token" }] }), { status: 200 })) as typeof fetch;
  try {
    const result = await exchangeCodeForToken({
      code: "abc",
      redirectUri: "https://example.com/cb",
      appId: "app123",
      appSecret: "secret",
    });
    assert.equal(result.accessToken, "short-lived-token");
  } finally {
    global.fetch = originalFetch;
  }
});

test("exchangeCodeForToken also accepts the flat legacy response shape", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(JSON.stringify({ access_token: "short-lived-token" }), { status: 200 })) as typeof fetch;
  try {
    const result = await exchangeCodeForToken({
      code: "abc",
      redirectUri: "https://example.com/cb",
      appId: "app123",
      appSecret: "secret",
    });
    assert.equal(result.accessToken, "short-lived-token");
  } finally {
    global.fetch = originalFetch;
  }
});

test("exchangeCodeForToken raises a clear error on an Instagram-side failure", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response("invalid_grant", { status: 400 })) as typeof fetch;
  try {
    await assert.rejects(
      () => exchangeCodeForToken({ code: "bad", redirectUri: "https://example.com/cb", appId: "a", appSecret: "s" }),
      /declined/
    );
  } finally {
    global.fetch = originalFetch;
  }
});

test("exchangeForLongLivedToken converts expires_in seconds into an ISO timestamp", async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () =>
    new Response(JSON.stringify({ access_token: "long-lived-token", expires_in: 5184000 }), { status: 200 })) as typeof fetch;
  try {
    const before = Date.now();
    const result = await exchangeForLongLivedToken("short-lived-token", "secret");
    assert.equal(result.accessToken, "long-lived-token");
    const expiry = Date.parse(result.tokenExpiresAt);
    assert.ok(expiry > before, "expiry should be in the future");
    assert.ok(expiry <= before + 5184000 * 1000 + 5000, "expiry should match expires_in");
  } finally {
    global.fetch = originalFetch;
  }
});
