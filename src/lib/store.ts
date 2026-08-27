import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { defaultContent } from "./defaults";
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

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain =>
  typeof v === "object" && v !== null && !Array.isArray(v);

/** Merge stored content over the defaults so new fields appear without a migration. */
function merge<T>(base: T, patch: unknown): T {
  if (!isPlain(patch)) return patch === undefined ? base : (patch as T);
  if (!isPlain(base)) return patch as T;
  const out: Plain = { ...base };
  for (const [key, value] of Object.entries(patch)) {
    out[key] = key in base ? merge((base as Plain)[key], value) : value;
  }
  return out as T;
}

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

export async function getContent(): Promise<Content> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.value;
  let stored: unknown = null;
  try {
    stored = await readRaw();
  } catch (error) {
    console.error("[store] read failed, serving defaults:", error);
  }
  const value = stored ? merge(defaultContent, stored) : defaultContent;
  cache = { value, at: Date.now() };
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
  const current = await getContent();
  return saveContent(merge(current, patch));
}

export function invalidate() {
  cache = null;
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
