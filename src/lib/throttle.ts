/**
 * Counting attempts per caller, in memory.
 *
 * Per instance and lost on a cold start, which is the honest limit of this:
 * it raises the cost of guessing, it does not make guessing impossible. The
 * alternative is a shared store, and this site deliberately has no database.
 *
 * No Next or store import, so the counting rules are tested directly rather
 * than by hammering a running server.
 */

export class Throttle {
  private readonly hits = new Map<string, number[]>();
  /** How many attempts a key gets inside the window. */
  readonly limit: number;
  /** How long the window is, in milliseconds. */
  readonly windowMs: number;
  /** How many keys to track before forgetting them. */
  readonly maxKeys: number;

  // Written out rather than as constructor parameter properties: the test
  // runner strips types without transforming, and that syntax needs a compile.
  constructor(limit: number, windowMs: number, maxKeys = 5000) {
    this.limit = limit;
    this.windowMs = windowMs;
    this.maxKeys = maxKeys;
  }

  /**
   * Seconds until this key is allowed again, or 0 when it is allowed now.
   * Checking does not spend anything — `record` does — so a caller can refuse
   * before doing the work and only count what it wants to count.
   */
  retryAfter(key: string, now: number = Date.now()): number {
    const recent = this.live(key, now);
    if (recent.length < this.limit) return 0;
    return Math.max(1, Math.ceil((this.windowMs - (now - recent[0])) / 1000));
  }

  /** Count one attempt against this key. */
  record(key: string, now: number = Date.now()): void {
    const recent = this.live(key, now);
    recent.push(now);
    this.hits.set(key, recent);
    this.sweep(now);
  }

  /** Forget a key's attempts — what a successful login does to its own. */
  clear(key: string): void {
    this.hits.delete(key);
  }

  private live(key: string, now: number): number[] {
    return (this.hits.get(key) ?? []).filter((at) => now - at < this.windowMs);
  }

  /**
   * Keep the map from growing without bound. Expired entries go first; if the
   * map is still oversized after that, something is deliberately filling it
   * with keys, and forgetting everything is the safe direction — it loosens
   * the limit briefly rather than exhausting memory.
   */
  private sweep(now: number): void {
    if (this.hits.size <= this.maxKeys) return;
    for (const [key, times] of this.hits) {
      const live = times.filter((at) => now - at < this.windowMs);
      if (live.length) this.hits.set(key, live);
      else this.hits.delete(key);
    }
    if (this.hits.size > this.maxKeys) this.hits.clear();
  }
}

/**
 * Who is asking, as well as a proxy can tell us. The left-most forwarded
 * address is the client; everything after it is the chain of proxies.
 */
export function clientAddress(request: {
  headers: { get(name: string): string | null };
}): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
