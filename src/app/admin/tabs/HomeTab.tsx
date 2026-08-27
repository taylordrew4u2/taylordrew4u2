"use client";

import type { Content, ReelGridSettings } from "@/lib/types";
import { Num, Row, Section, Select, Text, Toggle } from "../ui";
import MediaField from "../MediaField";
import SeoEditor from "../SeoEditor";
import { suggestFor } from "../suggest";
import type { Update } from "../types";

export function GridSettings({
  title,
  hint,
  settings,
  onChange,
}: {
  title: string;
  hint: string;
  settings: ReelGridSettings;
  onChange: (patch: Partial<ReelGridSettings>) => void;
}) {
  return (
    <Section title={title} hint={hint}>
      <Toggle label="Show this grid" value={settings.enabled} onChange={(v) => onChange({ enabled: v })} />
      <Row>
        <Num
          label="Columns — desktop"
          value={settings.columnsDesktop}
          min={1}
          max={10}
          onChange={(v) => onChange({ columnsDesktop: v })}
        />
        <Num
          label="Columns — tablet"
          value={settings.columnsTablet}
          min={1}
          max={8}
          onChange={(v) => onChange({ columnsTablet: v })}
        />
        <Num
          label="Columns — mobile"
          value={settings.columnsMobile}
          min={1}
          max={4}
          onChange={(v) => onChange({ columnsMobile: v })}
        />
      </Row>
      <Row>
        <Num
          label="Gap between tiles"
          value={settings.gap}
          min={0}
          max={40}
          suffix="px"
          onChange={(v) => onChange({ gap: v })}
        />
        <Num
          label="Corner radius"
          value={settings.cornerRadius}
          min={0}
          max={32}
          suffix="px"
          onChange={(v) => onChange({ cornerRadius: v })}
        />
      </Row>
      <Toggle
        label="Infinite scroll"
        hint="Keeps loading more reels as you scroll until they run out."
        value={settings.infinite}
        onChange={(v) => onChange({ infinite: v })}
      />
      {settings.infinite ? (
        <Num
          label="Reels loaded per scroll"
          value={settings.pageSize}
          min={2}
          max={40}
          onChange={(v) => onChange({ pageSize: v })}
        />
      ) : (
        <Num
          label="How many reels to show"
          value={settings.limit}
          min={1}
          max={60}
          onChange={(v) => onChange({ limit: v })}
        />
      )}
      <Row>
        <Toggle
          label="Autoplay (always muted)"
          value={settings.autoplay}
          onChange={(v) => onChange({ autoplay: v })}
        />
        <Toggle label="Loop" value={settings.loop} onChange={(v) => onChange({ loop: v })} />
        <Toggle
          label="Show captions"
          value={settings.showCaption}
          onChange={(v) => onChange({ showCaption: v })}
        />
      </Row>
    </Section>
  );
}

export default function HomeTab({ content, update }: { content: Content; update: Update }) {
  const { hero } = content.home;

  return (
    <>
      <Section title="Hero panel" hint="The logo panel at the top of the home page.">
        <MediaField
          label="Logo"
          value={hero.logoUrl}
          onChange={(v) => update((d) => void (d.home.hero.logoUrl = v))}
          aspect={1}
          previewHeight={140}
        />
        <Text
          label="Logo alt text"
          hint="describe the logo for screen readers and image search"
          value={hero.logoAlt}
          onChange={(v) => update((d) => void (d.home.hero.logoAlt = v))}
        />
        <Row>
          <Num
            label="Panel height"
            value={hero.heightVh}
            min={30}
            max={100}
            suffix="vh"
            onChange={(v) => update((d) => void (d.home.hero.heightVh = v))}
          />
          <Num
            label="Logo size"
            value={hero.logoScale}
            min={10}
            max={90}
            suffix="% of screen height"
            onChange={(v) => update((d) => void (d.home.hero.logoScale = v))}
          />
        </Row>
        <Toggle
          label="Show the name under the logo"
          value={hero.showWordmark}
          onChange={(v) => update((d) => void (d.home.hero.showWordmark = v))}
        />
        <Text
          label="Site name text"
          value={hero.wordmark}
          onChange={(v) => update((d) => void (d.home.hero.wordmark = v))}
        />
        <Row>
          <Num
            label="Name size"
            value={hero.wordmarkSize}
            min={12}
            max={90}
            suffix="px"
            onChange={(v) => update((d) => void (d.home.hero.wordmarkSize = v))}
          />
          <Num
            label="Name letter spacing"
            value={hero.wordmarkLetterSpacing}
            min={-5}
            max={40}
            onChange={(v) => update((d) => void (d.home.hero.wordmarkLetterSpacing = v))}
          />
        </Row>
        <Text
          label="Name font"
          value={hero.wordmarkFont}
          onChange={(v) => update((d) => void (d.home.hero.wordmarkFont = v))}
        />
        <Toggle
          label="Show tagline"
          value={hero.showTagline}
          onChange={(v) => update((d) => void (d.home.hero.showTagline = v))}
        />
        <Text
          label="Tagline"
          value={hero.tagline}
          onChange={(v) => update((d) => void (d.home.hero.tagline = v))}
        />
        <MediaField
          label="Background video (optional)"
          hint="mp4 or webm — plays muted behind the logo"
          accept="video/*"
          value={hero.backgroundVideoUrl}
          onChange={(v) => update((d) => void (d.home.hero.backgroundVideoUrl = v))}
        />
      </Section>

      <Section title="Nav words" hint="The row of links at the bottom of the hero panel. Edit the links themselves under Site → Navigation.">
        <Row>
          <Num
            label="Text size"
            value={hero.navSize}
            min={9}
            max={28}
            suffix="px"
            onChange={(v) => update((d) => void (d.home.hero.navSize = v))}
          />
          <Num
            label="Letter spacing"
            value={hero.navLetterSpacing}
            min={0}
            max={40}
            onChange={(v) => update((d) => void (d.home.hero.navLetterSpacing = v))}
          />
          <Select
            label="Separator"
            value={hero.navSeparator}
            options={[
              { value: "—", label: "— em dash" },
              { value: "-", label: "- hyphen" },
              { value: "·", label: "· dot" },
              { value: "/", label: "/ slash" },
              { value: "", label: "none" },
            ]}
            onChange={(v) => update((d) => void (d.home.hero.navSeparator = v))}
          />
        </Row>
      </Section>

      <GridSettings
        title="Reels grid — above the news"
        hint="9:16 tiles that autoplay muted. Clicking one opens Instagram."
        settings={content.home.reelsTop}
        onChange={(patch) => update((d) => void Object.assign(d.home.reelsTop, patch))}
      />

      <Section title="News strip" hint="The horizontal scroller of blog covers. Styling lives under News → Display.">
        <Toggle
          label="Show a heading above the strip"
          value={content.home.showMarqueeHeading}
          onChange={(v) => update((d) => void (d.home.showMarqueeHeading = v))}
        />
        <Text
          label="Heading"
          value={content.home.marqueeHeading}
          onChange={(v) => update((d) => void (d.home.marqueeHeading = v))}
        />
      </Section>

      <GridSettings
        title="Reels grid — below the news"
        hint="Same tiles, set to infinite scroll so it keeps loading until you run out of reels."
        settings={content.home.reelsBottom}
        onChange={(patch) => update((d) => void Object.assign(d.home.reelsBottom, patch))}
      />

      <SeoEditor
        title="Home page SEO & AI SEO"
        seo={content.home.seo}
        suggestion={suggestFor(content, "home")}
        onChange={(seo) => update((d) => void (d.home.seo = seo))}
      />
    </>
  );
}
