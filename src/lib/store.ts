import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultContent } from "./defaults";
import { merge } from "./merge";
import type { Content } from "./types";

/**
 * Content storage.
 *
 * Two drivers, both free:
 *  - "fs"   (default) writes ./data/content.json and ./public/uploads/*.
 *           Works locally, in a Codespace, in Docker, or on any VPS.
 *  - "blob" uses Vercel Blob, which is what you want on Vercel because the
 *           serverless filesystem is read-only and ephemeral. Turns on
 *           automatically when BLOB_READ_WRITE_TOKEN is present.
 */
export type Driver = "fs" | "blob";

export const driver: Driver =
  (process.env.CONTENT_DRIVER as Driver | undefined) ??
  (process.env.BLOB_READ_WRITE_TOKEN ? "blob" : "fs");

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const BLOB_KEY = "content/content.json";

/** Short-lived cache so one page render does not re-read storage per section. */
let cache: { value: Content; at: number } | null = null;
const TTL_MS = driver === "blob" ? 3_000 : 500;

async function readRaw(): Promise<unknown> {
  if (driver === "blob") {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 });
    const entry = blobs.find((b) => b.pathname === BLOB_KEY);
    if (!entry) return null;
    const res = await fetch(entry.url, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  }
  try {
    return JSON.parse(await fs.readFile(CONTENT_FILE, "utf8"));
  } catch {
    return null;
  }
}

/**
 * Load content, reporting whether storage was actually readable.
 *
 * The distinction matters: "nothing stored yet" is a fresh site and the
 * defaults are the right answer, but "the read blew up" means we do not know
 * what is stored — and writing on top of that guess would destroy it.
 */
async function load(): Promise<{ value: Content; readable: boolean }> {
  if (cache && Date.now() - cache.at < TTL_MS) return { value: cache.value, readable: true };

  let stored: unknown = null;
  try {
    stored = await readRaw();
  } catch (error) {
    console.error("[store] read failed, serving defaults for this request:", error);
    // Deliberately not cached: a transient failure must not pin the defaults
    // in front of real content for the whole TTL.
    return { value: defaultContent, readable: false };
  }

  const value = stored ? merge(defaultContent, stored) : defaultContent;
  cache = { value, at: Date.now() };
  return { value, readable: true };
}

export async function getContent(): Promise<Content> {
  return (await load()).value;
}

/**
 * Same as getContent(), but throws instead of silently falling back to the
 * defaults when storage cannot actually be read. Anything that is about to
 * write a full snapshot on top of "current content" — like the Instagram
 * sync route — must start from this, not getContent(): reading the defaults
 * during a transient storage hiccup and saving on top of them would wipe
 * every real field on the site.
 */
export async function getContentStrict(): Promise<Content> {
  const { value, readable } = await load();
  if (!readable) throw new Error("Storage is not readable right now");
  return value;
}

export async function saveContent(next: Content): Promise<Content> {
  const value: Content = { ...next, updatedAt: new Date().toISOString() };
  const json = JSON.stringify(value, null, 2);

  if (driver === "blob") {
    const { put } = await import("@vercel/blob");
    await put(BLOB_KEY, json, {
      access: "public",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
  } else {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const tmp = `${CONTENT_FILE}.${process.pid}.tmp`;
    await fs.writeFile(tmp, json, "utf8");
    await fs.rename(tmp, CONTENT_FILE); // atomic: never leaves a half-written file
  }

  cache = { value, at: Date.now() };
  return value;
}

/** Apply a partial patch on top of what is stored. Used by the auto-saving admin. */
export async function patchContent(patch: unknown): Promise<Content> {
  const { value, readable } = await load();
  if (!readable) {
    // Merging onto the defaults here would write them over whatever is really
    // stored. Fail instead; the admin surfaces it and retries.
    throw new Error("Refusing to save: existing content could not be read");
  }
  return saveContent(merge(value, patch));
}

/** Store an uploaded file and return its public URL. */
export async function saveUpload(
  filename: string,
  bytes: Buffer,
  contentType: string
): Promise<string> {
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, "-").slice(-80) || "upload";
  const key = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}-${safe}`;

  if (driver === "blob") {
    const { put } = await import("@vercel/blob");
    const result = await put(`uploads/${key}`, bytes, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return result.url;
  }

  const dir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, key), bytes);
  return `/uploads/${key}`;
}

/**
 * On Vercel the filesystem is read-only, so the "fs" driver cannot save.
 * Returns a message to surface in the admin when that is the situation.
 */
export function storageWarning(): string | null {
  if (driver !== "fs") return null;
  if (!process.env.VERCEL) return null;
  return "This deployment has no Blob store, so nothing you change here will save. In the Vercel dashboard open Storage → Create → Blob and connect it to this project, then redeploy.";
}
