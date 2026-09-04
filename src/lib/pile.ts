/**
 * Reading a pile of per-submission files without reading all of them.
 *
 * The admin's Tonight panel polls every fifteen seconds for the whole night.
 * Loading each submission on every poll is one store request per file per
 * poll, which on the GitHub driver is a few hundred API calls a minute —
 * past GitHub's hourly limit well before last call, and the panel starts
 * failing at exactly the moment the host is using it.
 *
 * A store listing already says which files changed: GitHub gives each entry
 * its content sha, Blob its upload time and size. So a listing plus a read of
 * only what moved is enough, and because the token comes from the content
 * itself the answer is exact rather than a guess with a timeout on it.
 *
 * Kept free of any store or server import so the reasoning can be tested
 * directly rather than against a live repository.
 */

/** One entry from a store listing: an id, and a token that changes when the file does. */
export type PileEntry = { id: string; version: string };

/**
 * Split a listing into what memory can already answer and what has to be read.
 *
 * An entry with no version token is always read: a driver that cannot say
 * whether a file changed must not be assumed to have kept it still.
 */
export function planReads(
  entries: PileEntry[],
  cachedVersion: (id: string) => string | undefined
): { reuse: string[]; read: string[] } {
  const reuse: string[] = [];
  const read: string[] = [];

  for (const entry of entries) {
    const known = entry.version ? cachedVersion(entry.id) : undefined;
    if (known !== undefined && known === entry.version) reuse.push(entry.id);
    else read.push(entry.id);
  }

  return { reuse, read };
}

/**
 * Run `work` over every item, no more than `limit` of them at once, with the
 * results in the order the items came in.
 *
 * The cap is the point. Firing five hundred reads at once is what trips a
 * host's burst protection — GitHub answers those with a 403 rather than a
 * rate-limit header, so it reads as a permissions failure.
 */
export async function mapWithLimit<T, R>(
  items: T[],
  limit: number,
  work: (item: T) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    for (;;) {
      const index = next;
      next += 1;
      if (index >= items.length) return;
      results[index] = await work(items[index]);
    }
  });

  await Promise.all(runners);
  return results;
}

/**
 * Forget anything the store no longer lists, so a night's worth of deleted and
 * archived submissions cannot pin memory for the life of the instance.
 */
export function pruneTo(cache: Map<string, unknown>, entries: PileEntry[]): void {
  const live = new Set(entries.map((entry) => entry.id));
  for (const id of cache.keys()) if (!live.has(id)) cache.delete(id);
}
