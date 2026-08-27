"use client";

import type { Content } from "@/lib/types";
import { Area, Button, Card, Num, Row, Section, Text } from "../ui";
import MediaField from "../MediaField";
import SeoEditor from "../SeoEditor";
import { suggestFor } from "../suggest";
import type { Update } from "../types";

export default function AboutTab({ content, update }: { content: Content; update: Update }) {
  const { about } = content;

  return (
    <>
      <Section title="About page">
        <Text
          label="Heading"
          value={about.heading}
          onChange={(v) => update((d) => void (d.about.heading = v))}
        />
        <Text
          label="Intro line"
          value={about.intro}
          onChange={(v) => update((d) => void (d.about.intro = v))}
        />
        <Area
          label="Our story"
          hint="blank line = new paragraph · ## heading · - bullet · **bold**"
          rows={16}
          value={about.story}
          onChange={(v) => update((d) => void (d.about.story = v))}
        />
      </Section>

      <Section title="Logo gallery" hint="Every version of the mark. Upload as many as you like.">
        <Row>
          <Num
            label="Image size inside each tile"
            value={about.logoSize}
            min={20}
            max={100}
            suffix="%"
            onChange={(v) => update((d) => void (d.about.logoSize = v))}
          />
          <Num
            label="Gap between tiles"
            value={about.logoGap}
            min={0}
            max={40}
            suffix="px"
            onChange={(v) => update((d) => void (d.about.logoGap = v))}
          />
          <Num
            label="Columns (minimum)"
            value={about.logoColumns}
            min={1}
            max={8}
            onChange={(v) => update((d) => void (d.about.logoColumns = v))}
          />
        </Row>

        {about.logos.map((logo, index) => (
          <Card key={logo.id} title={logo.caption || `Logo ${index + 1}`} subtitle={logo.alt}>
            <MediaField
              label="Image"
              value={logo.url}
              onChange={(v) => update((d) => void (d.about.logos[index].url = v))}
              aspect={1}
              previewHeight={120}
            />
            <Row>
              <Text
                label="Caption"
                value={logo.caption}
                onChange={(v) => update((d) => void (d.about.logos[index].caption = v))}
              />
              <Text
                label="Alt text"
                value={logo.alt}
                onChange={(v) => update((d) => void (d.about.logos[index].alt = v))}
              />
            </Row>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  update((d) => {
                    if (index === 0) return;
                    [d.about.logos[index - 1], d.about.logos[index]] = [
                      d.about.logos[index],
                      d.about.logos[index - 1],
                    ];
                  })
                }
              >
                Move up
              </Button>
              <Button
                onClick={() =>
                  update((d) => {
                    if (index >= d.about.logos.length - 1) return;
                    [d.about.logos[index + 1], d.about.logos[index]] = [
                      d.about.logos[index],
                      d.about.logos[index + 1],
                    ];
                  })
                }
              >
                Move down
              </Button>
              <Button tone="danger" onClick={() => update((d) => void d.about.logos.splice(index, 1))}>
                Remove
              </Button>
            </div>
          </Card>
        ))}

        <Button
          tone="primary"
          onClick={() =>
            update((d) =>
              void d.about.logos.push({
                id: `logo-${Date.now().toString(36)}`,
                url: "",
                alt: "Pins & Needles Comedy logo",
                caption: "",
              })
            )
          }
        >
          Add a logo
        </Button>
      </Section>

      <Section title="Producers" hint="Headshot on the left, bio on the right.">
        <Num
          label="Headshot zoom"
          value={about.producerImageSize}
          min={100}
          max={200}
          suffix="%"
          onChange={(v) => update((d) => void (d.about.producerImageSize = v))}
        />
        <Text
          label="Section heading"
          value={about.producersHeading}
          onChange={(v) => update((d) => void (d.about.producersHeading = v))}
        />

        {about.producers.map((producer, index) => (
          <Card
            key={producer.id}
            title={producer.name || `Producer ${index + 1}`}
            subtitle={producer.role}
            defaultOpen={index < 2}
          >
            <MediaField
              label="Headshot"
              hint="cropped square"
              value={producer.headshotUrl}
              onChange={(v) => update((d) => void (d.about.producers[index].headshotUrl = v))}
              aspect={1}
              previewHeight={140}
            />
            <Row>
              <Text
                label="Name"
                value={producer.name}
                onChange={(v) => update((d) => void (d.about.producers[index].name = v))}
              />
              <Text
                label="Role"
                value={producer.role}
                onChange={(v) => update((d) => void (d.about.producers[index].role = v))}
              />
            </Row>
            <Text
              label="Headshot alt text"
              value={producer.headshotAlt}
              onChange={(v) => update((d) => void (d.about.producers[index].headshotAlt = v))}
            />
            <Area
              label="Bio"
              rows={6}
              value={producer.bio}
              onChange={(v) => update((d) => void (d.about.producers[index].bio = v))}
            />

            {producer.links.map((link, linkIndex) => (
              <Row key={link.id}>
                <Text
                  label="Link label"
                  value={link.label}
                  onChange={(v) =>
                    update((d) => void (d.about.producers[index].links[linkIndex].label = v))
                  }
                />
                <Text
                  label="Link URL"
                  value={link.url}
                  onChange={(v) =>
                    update((d) => void (d.about.producers[index].links[linkIndex].url = v))
                  }
                />
                <div className="flex items-end">
                  <Button
                    tone="danger"
                    onClick={() => update((d) => void d.about.producers[index].links.splice(linkIndex, 1))}
                  >
                    Remove link
                  </Button>
                </div>
              </Row>
            ))}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  update((d) =>
                    void d.about.producers[index].links.push({
                      id: `link-${Date.now().toString(36)}`,
                      label: "Instagram",
                      url: "",
                    })
                  )
                }
              >
                Add a link
              </Button>
              <Button
                onClick={() =>
                  update((d) => {
                    if (index === 0) return;
                    [d.about.producers[index - 1], d.about.producers[index]] = [
                      d.about.producers[index],
                      d.about.producers[index - 1],
                    ];
                  })
                }
              >
                Move up
              </Button>
              <Button
                tone="danger"
                onClick={() => update((d) => void d.about.producers.splice(index, 1))}
              >
                Remove producer
              </Button>
            </div>
          </Card>
        ))}

        <Button
          tone="primary"
          onClick={() =>
            update((d) =>
              void d.about.producers.push({
                id: `producer-${Date.now().toString(36)}`,
                name: "",
                role: "Producer",
                headshotUrl: "",
                headshotAlt: "",
                bio: "",
                links: [],
              })
            )
          }
        >
          Add a producer
        </Button>
      </Section>

      <SeoEditor
        title="About SEO & AI SEO"
        seo={about.seo}
        suggestion={suggestFor(content, "about")}
        onChange={(seo) => update((d) => void (d.about.seo = seo))}
      />
    </>
  );
}
