import { test } from "node:test";
import assert from "node:assert/strict";
import {
  contentTypeFor,
  githubConfig,
  mediaUrl,
  readFile,
  safePath,
  writeFile,
} from "../src/lib/github-store.ts";

const config = { token: "t", owner: "o", repo: "r", branch: "main", api: "https://api.github.com" };

/** A stand-in for GitHub: records calls and replays queued responses. */
function fakeGithub(responses: { status: number; body: unknown; raw?: Buffer }[]) {
  const calls: { url: string; method: string; body?: unknown }[] = [];
  let index = 0;
  const fetchImpl = (async (url: string, init?: RequestInit) => {
    calls.push({
      url: String(url),
      method: init?.method ?? "GET",
      body: init?.body ? JSON.parse(String(init.body)) : undefined,
    });
    const next = responses[Math.min(index++, responses.length - 1)];
    return {
      ok: next.status >= 200 && next.status < 300,
      status: next.status,
      json: async () => next.body,
      text: async () => JSON.stringify(next.body),
      arrayBuffer: async () => (next.raw ?? Buffer.alloc(0)),
    };
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

test("githubConfig needs both a token and a repo", () => {
  assert.equal(githubConfig({}), null);
  assert.equal(githubConfig({ CONTENT_GITHUB_TOKEN: "t" }), null);
  assert.equal(githubConfig({ CONTENT_GITHUB_REPO: "o/r" }), null);
});

test("githubConfig parses owner/repo and defaults the branch", () => {
  assert.deepEqual(githubConfig({ CONTENT_GITHUB_TOKEN: "t", CONTENT_GITHUB_REPO: "o/r" }), {
    token: "t",
    owner: "o",
    repo: "r",
    branch: "main",
    api: "https://api.github.com",
  });
});

test("githubConfig accepts a pasted GitHub URL and a .git suffix", () => {
  assert.deepEqual(
    githubConfig({
      CONTENT_GITHUB_TOKEN: "t",
      CONTENT_GITHUB_REPO: "https://github.com/taylordrew4u2/site-content.git",
      CONTENT_GITHUB_BRANCH: "content",
    }),
    {
      token: "t",
      owner: "taylordrew4u2",
      repo: "site-content",
      branch: "content",
      api: "https://api.github.com",
    }
  );
});

test("safePath strips anything that climbs out of the repo", () => {
  assert.equal(safePath("uploads/photo.png"), "uploads/photo.png");
  assert.equal(safePath("uploads/../../etc/passwd"), "uploads/etc/passwd");
  assert.equal(safePath("./uploads//a.png"), "uploads/a.png");
  assert.throws(() => safePath("../.."), /Empty storage path/);
});

test("a missing file reads as empty rather than as an error", async () => {
  const { fetchImpl } = fakeGithub([{ status: 404, body: { message: "Not Found" } }]);
  assert.deepEqual(await readFile(config, "content/content.json", fetchImpl), {
    bytes: null,
    sha: null,
  });
});

test("a small file comes back from the inline base64", async () => {
  const { fetchImpl } = fakeGithub([
    { status: 200, body: { content: Buffer.from('{"a":1}').toString("base64"), sha: "abc", size: 7 } },
  ]);
  const { bytes, sha } = await readFile(config, "content/content.json", fetchImpl);
  assert.equal(bytes?.toString("utf8"), '{"a":1}');
  assert.equal(sha, "abc");
});

test("a file over 1MB falls through to the blobs API", async () => {
  // GitHub stops inlining content above 1MB and returns metadata only, which
  // is exactly what content.json does once enough posts and shows pile up.
  const big = Buffer.from('{"big":true}');
  const { fetchImpl, calls } = fakeGithub([
    { status: 200, body: { content: "", sha: "deadbeef", size: 2_000_000 } },
    { status: 200, body: {}, raw: big },
  ]);
  const { bytes } = await readFile(config, "content/content.json", fetchImpl);
  assert.equal(bytes?.toString("utf8"), '{"big":true}');
  assert.match(calls[1].url, /\/git\/blobs\/deadbeef$/);
});

test("a read failure that is not a 404 raises", async () => {
  const { fetchImpl } = fakeGithub([{ status: 401, body: { message: "Bad credentials" } }]);
  await assert.rejects(() => readFile(config, "content/content.json", fetchImpl), /401/);
});

test("writing sends the branch, the message and the sha it was given", async () => {
  const { fetchImpl, calls } = fakeGithub([{ status: 200, body: { content: { sha: "new" } } }]);
  const sha = await writeFile(config, "content/content.json", Buffer.from("hi"), "msg", "old", fetchImpl);
  assert.equal(sha, "new");
  assert.equal(calls[0].method, "PUT");
  assert.deepEqual(calls[0].body, {
    message: "msg",
    content: Buffer.from("hi").toString("base64"),
    branch: "main",
    sha: "old",
  });
});

test("a first write sends no sha, so GitHub creates the file", async () => {
  const { fetchImpl, calls } = fakeGithub([{ status: 200, body: { content: { sha: "first" } } }]);
  await writeFile(config, "content/content.json", Buffer.from("hi"), "msg", null, fetchImpl);
  assert.equal("sha" in (calls[0].body as object), false);
});

test("a stale sha is re-read and the write retried once", async () => {
  // Two autosaves landing back to back is the normal case for an admin that
  // saves on its own, so a conflict has to resolve itself rather than surface.
  const { fetchImpl, calls } = fakeGithub([
    { status: 409, body: { message: "is at 111 but expected 222" } },
    { status: 200, body: { content: Buffer.from("{}").toString("base64"), sha: "fresh", size: 2 } },
    { status: 200, body: { content: { sha: "saved" } } },
  ]);
  const sha = await writeFile(config, "content/content.json", Buffer.from("hi"), "msg", "stale", fetchImpl);
  assert.equal(sha, "saved");
  assert.equal(calls.length, 3);
  assert.equal((calls[2].body as { sha: string }).sha, "fresh");
});

test("a write that keeps failing raises rather than reporting success", async () => {
  const { fetchImpl } = fakeGithub([
    { status: 422, body: { message: "conflict" } },
    { status: 200, body: { content: "", sha: "s", size: 0 } },
    { status: 403, body: { message: "Resource not accessible by personal access token" } },
  ]);
  await assert.rejects(
    () => writeFile(config, "content/content.json", Buffer.from("hi"), "msg", "x", fetchImpl),
    /403/
  );
});

test("uploads are served from this site, not from the private repo", () => {
  assert.equal(mediaUrl("abc-123-poster.png"), "/api/media/abc-123-poster.png");
});

test("content types cover what the uploader accepts", () => {
  assert.equal(contentTypeFor("a/b/c.webp"), "image/webp");
  assert.equal(contentTypeFor("clip.MP4"), "video/mp4");
  assert.equal(contentTypeFor("noextension"), "application/octet-stream");
});
