"use client";

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import type { Reel, ReelGridSettings } from "@/lib/types";
import { instagramCode } from "@/lib/render";

/** Instagram's public thumbnail endpoint — used when no poster was uploaded. */
function fallbackPoster(reel: Reel): string {
  const code = instagramCode(reel.instagramUrl);
  return code ? `https://www.instagram.com/p/${code}/media/?size=l` : "";
}

function Tile({
  reel,
  settings,
  index,
}: {
  reel: Reel;
  settings: ReelGridSettings;
  index: number;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [posterFailed, setPosterFailed] = useState(false);
  const poster = reel.posterUrl || fallbackPoster(reel);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !settings.autoplay) return;

    // Muted autoplay is allowed everywhere; kick it off as soon as the tile mounts.
    const start = () => {
      video.play().catch(() => {
        /* Browser declined (low power mode, data saver) — the poster still shows. */
      });
    };
    start();

    // Keep only tiles near the viewport decoding. Without this an infinite grid
    // ends up with dozens of live decoders and the page stutters.
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) start();
        else video.pause();
      },
      { rootMargin: "300% 0px" }
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [settings.autoplay]);

  const label = reel.caption || `Instagram reel ${index + 1} from Pins & Needles Comedy`;

  return (
    <a
      href={reel.instagramUrl || "https://www.instagram.com/pinsandneedlescomedy/"}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${label} — open on Instagram`}
      className="group relative block w-full overflow-hidden bg-black"
      style={{ aspectRatio: "9 / 16", borderRadius: settings.cornerRadius || undefined }}
    >
      {reel.videoUrl ? (
        <video
          ref={videoRef}
          className="h-full w-full object-cover"
          src={reel.videoUrl}
          poster={poster && !posterFailed ? poster : undefined}
          muted
          loop={settings.loop}
          playsInline
          preload="metadata"
          disablePictureInPicture
          tabIndex={-1}
          aria-hidden="true"
        />
      ) : poster && !posterFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={reel.alt || label}
          loading={index < 4 ? "eager" : "lazy"}
          className="h-full w-full object-cover"
          onError={() => setPosterFailed(true)}
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center bg-neutral-900 text-[10px] uppercase tracking-[0.3em] text-neutral-500">
          Reel
        </span>
      )}

      <span className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/25" />

      {settings.showCaption && reel.caption ? (
        <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 to-transparent p-3 text-[12px] leading-snug">
          {reel.caption}
        </span>
      ) : null}
    </a>
  );
}

export default function ReelGrid({
  reels,
  settings,
  instagramUrl,
}: {
  reels: Reel[];
  settings: ReelGridSettings;
  instagramUrl: string;
}) {
  const visibleReels = useMemo(() => reels.filter((reel) => reel.published), [reels]);

  const initial = settings.infinite
    ? Math.min(settings.pageSize || 8, visibleReels.length)
    : settings.limit > 0
      ? settings.limit
      : visibleReels.length;

  const [shown, setShown] = useState(initial);
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  // Each grid scopes its own breakpoint columns, so top and bottom grids
  // can be configured independently.
  const scope = `reels-${useId().replace(/[^a-zA-Z0-9]/g, "")}`;

  useEffect(() => setShown(initial), [initial]);

  const loadMore = useCallback(() => {
    setShown((current) => Math.min(current + (settings.pageSize || 8), visibleReels.length));
  }, [settings.pageSize, visibleReels.length]);

  useEffect(() => {
    if (!settings.infinite) return;
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) loadMore();
      },
      { rootMargin: "600px 0px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [settings.infinite, loadMore]);

  if (!settings.enabled) return null;

  if (visibleReels.length === 0) {
    return (
      <a
        href={instagramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block w-full bg-neutral-950 py-10 text-center text-[11px] uppercase tracking-[0.32em] text-neutral-400 transition-colors hover:text-white"
      >
        Watch on Instagram
      </a>
    );
  }

  const tiles = visibleReels.slice(0, shown);
  const exhausted = shown >= visibleReels.length;

  return (
    <section aria-label="Instagram reels" className="w-full" data-scope={scope}>
      <div
        className="grid w-full"
        style={{
          gap: settings.gap,
          gridTemplateColumns: `repeat(var(--reel-cols), minmax(0, 1fr))`,
          ["--reel-cols" as string]: settings.columnsMobile,
        }}
      >
        {tiles.map((reel, index) => (
          <Tile key={reel.id} reel={reel} settings={settings} index={index} />
        ))}
      </div>

      {settings.infinite && !exhausted ? (
        <div ref={sentinelRef} aria-hidden="true" className="h-px w-full" />
      ) : null}

      <style>{`
        @media (min-width: 640px) {
          [data-scope="${scope}"] > div { --reel-cols: ${settings.columnsTablet}; }
        }
        @media (min-width: 1024px) {
          [data-scope="${scope}"] > div { --reel-cols: ${settings.columnsDesktop}; }
        }
      `}</style>
    </section>
  );
}
