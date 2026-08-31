"use client";

import { useState } from "react";
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

        // Fully caught up with nothing left waiting on the current page — done.
        if (data.caughtUp && !data.remaining) break;
        // A round that added nothing and isn't reporting more to fetch would
        // otherwise spin forever; treat that as done too.
        if (!data.added && !data.remaining && data.caughtUp) break;

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
      <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4 text-[13px] leading-relaxed text-neutral-400">
        <p className="mb-2 text-neutral-200">One-time setup, on Instagram&apos;s side</p>
        <p className="mb-2">
          This needs an access token from Instagram — there is no way around that step for anyone,
          it is how Instagram confirms the account owner actually approved the connection:
        </p>
        <ol className="ml-4 list-decimal space-y-1">
          <li>The Instagram account needs to be a Professional (Business or Creator) account — free to switch to in the Instagram app under Settings → Account type.</li>
          <li>
            Create a free app at{" "}
            <a
              href="https://developers.facebook.com/docs/instagram-platform"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-neutral-200"
            >
              developers.facebook.com
            </a>{" "}
            and add the Instagram product to it.
          </li>
          <li>Follow Meta&apos;s flow there to generate a long-lived access token for the account.</li>
          <li>Paste that token below.</li>
        </ol>
        <p className="mt-2">
          The token lasts about 60 days; this site refreshes it automatically on every sync, so it
          never needs to be redone as long as a sync runs at least once every couple of months.
        </p>
      </div>

      <Text
        label="Access token"
        type="password"
        value={instagram.accessToken}
        onChange={onTokenChange}
        placeholder="Paste the long-lived token here"
      />

      <div className="rounded-md border border-neutral-800 bg-neutral-900 p-4 text-[13px] text-neutral-400">
        <p>Reels on the site now: <span className="text-neutral-200">{totalReels}</span></p>
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
