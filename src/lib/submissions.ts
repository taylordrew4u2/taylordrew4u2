import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { driver, requireGithub } from "./store";
import {
  deleteFile as githubDelete,
  listDir as githubList,
  readFile as githubRead,
  writeFile as githubWrite,
} from "./github-store";
import { sortSubmissions, submissionId } from "./decisions";
import type { Submission, SubmissionStatus } from "./types";

/**
 * Audience submissions for the weekly show.
 *
 * Each submission is its own file, never a line inside content.json. Forty
 * people scanning the same QR code during the bar hour means writes land
 * within milliseconds of each other, and a single shared file — even with a
 * retry on conflict — would lose some of them. A fresh file per submission
 * has nothing to conflict with, on every driver:
 *
 *  - "fs"     ./data/submissions/<id>.json
 *  - "github" submissions/<id>.json in the content repo (one commit each)
 *  - "blob"   submissions/<id>.json in the Blob store
 *
 * Ids start with the timestamp, so listings come back in order and the
 * admin can cap how many it reads.
 */

const DIR = "submissions";
const LOCAL_DIR = path.join(process.cwd(), "data", DIR);

/** How many the admin reads at most. Archive after each show keeps this small. */
const LIST_LIMIT = 500;

function fileFor(id: string): string {
  if (!/^[A-Za-z0-9-]+$/.test(id)) throw new Error("Bad submission id");
  return `${DIR}/${id}.json`;
}

async function write(submission: Submission, knownSha: string | null): Promise<void> {
  const json = JSON.stringify(submission, null, 2);
  const key = fileFor(submission.id);

  if (driver === "github") {
    await githubWrite(
      requireGithub(),
      key,
      Buffer.from(json, "utf8"),
      knownSha ? `Update submission ${submission.id}` : `New submission ${submission.id}`,
      knownSha
    );
    return;
  }
  if (driver === "blob") {
    // Private: unlike content.json, these carry people's names and decisions.
    const { put } = await import("@vercel/blob");
    await put(key, json, {
      access: "private",
      contentType: "application/json",
      addRandomSuffix: false,
      allowOverwrite: true,
      cacheControlMaxAge: 0,
    });
    return;
  }
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const target = path.join(LOCAL_DIR, `${submission.id}.json`);
  const tmp = `${target}.${process.pid}.tmp`;
  await fs.writeFile(tmp, json, "utf8");
  await fs.rename(tmp, target);
}

function parse(bytes: string | Buffer): Submission | null {
  try {
    const value = JSON.parse(bytes.toString()) as Partial<Submission>;
    if (!value || typeof value.id !== "string" || typeof value.decision !== "string") return null;
    return {
      id: value.id,
      decision: value.decision,
      name: typeof value.name === "string" ? value.name : "",
      createdAt: typeof value.createdAt === "string" ? value.createdAt : "",
      status: value.status === "drawn" || value.status === "archived" ? value.status : "open",
      drawnAt: typeof value.drawnAt === "string" ? value.drawnAt : "",
    };
  } catch {
    return null;
  }
}

async function readOne(id: string): Promise<{ submission: Submission | null; sha: string | null }> {
  const key = fileFor(id);
  if (driver === "github") {
    const { bytes, sha } = await githubRead(requireGithub(), key);
    return { submission: bytes ? parse(bytes) : null, sha };
  }
  if (driver === "blob") {
    const { get } = await import("@vercel/blob");
    const result = await get(key, { access: "private", useCache: false });
    if (!result || result.statusCode !== 200) return { submission: null, sha: null };
    return { submission: parse(await new Response(result.stream).text()), sha: null };
  }
  try {
    return { submission: parse(await fs.readFile(path.join(LOCAL_DIR, `${id}.json`), "utf8")), sha: null };
  } catch {
    return { submission: null, sha: null };
  }
}

export async function addSubmission(decision: string, name: string): Promise<Submission> {
  const now = new Date();
  const submission: Submission = {
    id: submissionId(now),
    decision,
    name,
    createdAt: now.toISOString(),
    status: "open",
    drawnAt: "",
  };
  await write(submission, null);
  return submission;
}

/** Every stored submission, newest first, capped at LIST_LIMIT. */
export async function listSubmissions(): Promise<Submission[]> {
  let ids: string[] = [];

  if (driver === "github") {
    const entries = await githubList(requireGithub(), DIR);
    ids = entries.filter((entry) => entry.name.endsWith(".json")).map((entry) => entry.name.slice(0, -5));
  } else if (driver === "blob") {
    const { list } = await import("@vercel/blob");
    const { blobs } = await list({ prefix: `${DIR}/`, limit: 1000 });
    ids = blobs
      .map((blob) => blob.pathname)
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(DIR.length + 1, -5));
  } else {
    try {
      ids = (await fs.readdir(LOCAL_DIR))
        .filter((name) => name.endsWith(".json"))
        .map((name) => name.slice(0, -5));
    } catch {
      ids = [];
    }
  }

  // Newest ids sort last; keep the most recent LIST_LIMIT.
  const recent = ids.sort().slice(-LIST_LIMIT);
  const loaded = await Promise.all(recent.map((id) => readOne(id)));
  return sortSubmissions(loaded.map((entry) => entry.submission).filter((s): s is Submission => s !== null));
}

/** How many are waiting to be drawn. Public, so the page can show the count climbing. */
export async function countOpen(): Promise<number> {
  const all = await listSubmissions();
  return all.filter((submission) => submission.status === "open").length;
}

export async function setStatus(id: string, status: SubmissionStatus): Promise<Submission | null> {
  const { submission, sha } = await readOne(id);
  if (!submission) return null;
  const next: Submission = {
    ...submission,
    status,
    drawnAt: status === "drawn" ? new Date().toISOString() : submission.drawnAt,
  };
  await write(next, sha);
  return next;
}

export async function deleteSubmission(id: string): Promise<void> {
  const key = fileFor(id);
  if (driver === "github") {
    await githubDelete(requireGithub(), key, `Delete submission ${id}`);
    return;
  }
  if (driver === "blob") {
    const { del } = await import("@vercel/blob");
    await del(key);
    return;
  }
  await fs.rm(path.join(LOCAL_DIR, `${id}.json`), { force: true });
}

/** After a show: everything open or drawn becomes archived, so next week starts from zero. */
export async function archiveAll(): Promise<number> {
  const all = await listSubmissions();
  const live = all.filter((submission) => submission.status !== "archived");
  for (const submission of live) await setStatus(submission.id, "archived");
  return live.length;
}
