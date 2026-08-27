import Image from "next/image";
import Link from "next/link";
import type { Hero, NavItem } from "@/lib/types";

export default function HeroPanel({
  hero,
  nav,
  active,
}: {
  hero: Hero;
  nav: NavItem[];
  active?: string;
}) {
  return (
    <section
      aria-label="Pins & Needles Comedy"
      className="relative flex w-full flex-col items-center justify-center overflow-hidden"
      style={{
        minHeight: `${hero.heightVh}vh`,
        background: hero.background,
        color: hero.foreground,
      }}
    >
      {hero.backgroundVideoUrl ? (
        <video
          className="absolute inset-0 h-full w-full object-cover opacity-30"
          src={hero.backgroundVideoUrl}
          autoPlay
          muted
          loop
          playsInline
          aria-hidden="true"
        />
      ) : null}

      <div className="relative flex flex-1 flex-col items-center justify-center gap-4 px-5 py-10">
        {hero.logoUrl ? (
          <Link href="/" aria-label="Pins & Needles Comedy — home">
            <Image
              src={hero.logoUrl}
              alt={hero.logoAlt}
              width={1024}
              height={1024}
              priority
              sizes="(max-width: 640px) 70vw, 40vw"
              style={{
                width: `min(${hero.logoScale}vh, 78vw)`,
                height: "auto",
              }}
            />
          </Link>
        ) : null}

        {hero.showWordmark ? (
          <h1
            className="text-center leading-[1.05]"
            style={{
              fontFamily: hero.wordmarkFont,
              fontSize: `clamp(18px, ${hero.wordmarkSize / 10}vw, ${hero.wordmarkSize}px)`,
              letterSpacing: `${hero.wordmarkLetterSpacing / 100}em`,
            }}
          >
            {hero.wordmark}
          </h1>
        ) : (
          <h1 className="sr-only">{hero.wordmark}</h1>
        )}

        {hero.showTagline && hero.tagline ? (
          <p
            className="text-center uppercase opacity-70"
            style={{ fontSize: 12, letterSpacing: "0.25em" }}
          >
            {hero.tagline}
          </p>
        ) : null}
      </div>

      <nav
        aria-label="Primary"
        className="relative flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 pb-6 pt-2 uppercase"
        style={{
          fontSize: hero.navSize,
          letterSpacing: `${hero.navLetterSpacing / 100}em`,
        }}
      >
        {nav.map((item, index) => (
          <span key={item.id} className="flex items-center gap-2">
            {index > 0 ? (
              <span aria-hidden="true" className="opacity-40">
                {hero.navSeparator}
              </span>
            ) : null}
            <Link
              href={item.href}
              aria-current={active === item.href ? "page" : undefined}
              className={
                active === item.href
                  ? "opacity-100 underline underline-offset-[6px]"
                  : "opacity-70 transition-opacity hover:opacity-100"
              }
            >
              {item.label}
            </Link>
          </span>
        ))}
      </nav>
    </section>
  );
}
