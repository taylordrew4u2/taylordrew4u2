"use client";

import { useEffect, useState } from "react";
import type { InstagramSync as InstagramSyncState } from "@/lib/types";
import { Button, Section, Text } from "./ui";

/** Safety valve only — forward progress each call means this almost never gets close. */
const MAX_ROUNDS = 60;
const DELAY_MS = 350;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function formatWhen(iso: string): string {
  if (!iso) return "Never";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}

/** Read ?instagram=connected|error once, then scrub it so a refresh doesn't re-show the banner. */
function useOAuthResult() {
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  useEffect(() => {
    const url = new URL(window.location.href);
    const status = url.searchParams.get("instagram");
    if (!status) return;
    setResult({ status, message: url.searchParams.get("message") || "" });
    url.searchParams.delete("instagram");
    url.searchParams.delete("message");
    window.history.replaceState({}, "", url.toString());
  }, []);

  return result;
}

export default function InstagramSync({
  instagram,
  totalReels,
  onTokenChange,
  onSynced,
}: {
  instagram: InstagramSyncState;
  totalReels: number;
  onTokenChange: (token: string) => void;
  onSynced: () => Promise<void>;
}) {
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [roundError, setRoundError] = useState("");
  const [showManual, setShowManual] = useState(false);
  const oauthResult = useOAuthResult();

  // Instagram just redirected back — the token is already saved server-side,
  // so this is the same "reload, don't autosave a stale snapshot" rule the
  // sync button follows below.
  useEffect(() => {
    if (oauthResult?.status === "connected") void onSynced();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [oauthResult]);

  const runFullSync = async () => {
    setRunning(true);
    setRoundError("");
    setProgress(0);
    try {
      let added = 0;
      for (let round = 0; round < MAX_ROUNDS; round++) {
        const response = await fetch("/api/admin/instagram/sync", { method: "POST" });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.ok) throw new Error(data.error || "Sync failed");

        added += data.added ?? 0;
        setProgress(added);

        if (data.caughtUp && !data.remaining) break;
        await sleep(DELAY_MS);
      }
    } catch (error) {
      setRoundError(error instanceof Error ? error.message : "Sync failed");
    } finally {
      await onSynced();
      setRunning(false);
    }
  };

  return (
    <Section
      title="Instagram sync"
      hint="Pull every reel from @pinsandneedlescomedy automatically instead of adding them one at a time."
    >
      {oauthResult?.status === "connected" ? (
        <p className="rounded-md border border-emerald-800/60 bg-emerald-950/40 px-4 py-3 text-[13px] text-emerald-300">
          Instagram connected. Click <strong>Sync all reels</strong> below to pull them in.
        </p>
      ) : null}
      {oauthResult?.status === "error" ? (
        <p className="rounded-md border border-red-800/60 bg-red-950/40 px-4 py-3 text-[13px] text-red-300">
          {oauthResult.message || "Connecting to Instagram failed."}
        </p>
      ) : null}

      <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4 text-[13px] leading-relaxed text-neutral-400">
        <p className="mb-2 text-neutral-200">One-time setup, on Instagram&apos;s side</p>
        <p className="mb-2">
          Meta requires this — there is no way around it for anyone, it is how Instagram confirms
          the account owner actually approved the connection:
        </p>
        <ol className="ml-4 list-decimal space-y-1">
          <li>Switch the Instagram account to Professional (Business or Creator) — free, in the Instagram app under Settings → Account type.</li>
          <li>
            Create a free app at{" "}
            <a
              href="https://developers.facebook.com/docs/instagram-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-200"
            >
              developers.facebook.com
            </a>
            , add the Instagram product to it, and add an OAuth redirect URI of{" "}
            <code className="text-neutral-200">{"<your site>"}/api/admin/instagram/callback</code>.
          </li>
          <li>Add the Instagram account as a tester on that app — the app can stay in Development mode, no review needed for one account.</li>
          <li>
            Copy the app&apos;s <strong>App ID</strong> and <strong>App Secret</strong> into this
            deployment&apos;s environment variables as <code className="text-neutral-200">INSTAGRAM_APP_ID</code> and{" "}
            <code className="text-neutral-200">INSTAGRAM_APP_SECRET</code>, then redeploy.
          </li>
        </ol>
        <p className="mt-2">
          After that, connecting is one click below — a real Instagram login and approval screen,
          not a token to copy anywhere. It refreshes itself automatically before its ~60-day expiry.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button tone="primary" onClick={() => { window.location.href = "/api/admin/instagram/authorize"; }}>
          {instagram.accessToken ? "Reconnect Instagram" : "Log in with Instagram"}
        </Button>
        <button
          type="button"
          onClick={() => setShowManual((v) => !v)}
          className="text-[12px] text-neutral-500 underline underline-offset-2 hover:text-neutral-300"
        >
          {showManual ? "Hide" : "I already have an access token"}
        </button>
      </div>

      {showManual ? (
        <Text
          label="Access token"
          type="password"
          value={instagram.accessToken}
          onChange={onTokenChange}
          hint="only if you generated one directly in Meta's console instead of using the button above"
        />
      ) : null}

      <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4 text-[13px] text-neutral-400">
        <p>Reels on the site now: <span className="text-neutral-200">{totalReels}</span></p>
        <p>Connected: <span className="text-neutral-200">{instagram.accessToken ? "Yes" : "Not yet"}</span></p>
        <p>Last synced: <span className="text-neutral-200">{formatWhen(instagram.lastSyncedAt)}</span></p>
        {instagram.lastError ? (
          <p className="mt-2 text-red-400">Last error: {instagram.lastError}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button tone="primary" onClick={() => void runFullSync()} disabled={running || !instagram.accessToken}>
          {running ? `Syncing… ${progress ? `(${progress} so far)` : ""}` : "Sync all reels from Instagram"}
        </Button>
        {roundError ? <span className="text-[12px] text-red-400">{roundError}</span> : null}
      </div>

      <p className="text-[12px] text-neutral-500">
        Safe to click any time — it only ever adds reels it hasn&apos;t seen yet, so it never
        touches an order you&apos;ve rearranged or a reel you&apos;ve hidden.
      </p>
    </Section>
  );
}
