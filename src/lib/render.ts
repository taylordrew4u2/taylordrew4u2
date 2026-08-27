/** Markdown-lite -> HTML. Deliberately tiny: headings, lists, quotes, links, bold. */

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

function inline(text: string): string {
  return escapeHtml(text)
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" rel="noopener">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
}

export function renderBody(body: string): string {
  const blocks = body.replace(/\r\n/g, "\n").split(/\n{2,}/);
  const html: string[] = [];

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    const lines = trimmed.split("\n");

    if (lines.every((line) => /^\s*[-*]\s+/.test(line))) {
      const items = lines.map((line) => `<li>${inline(line.replace(/^\s*[-*]\s+/, ""))}</li>`);
      html.push(`<ul>${items.join("")}</ul>`);
      continue;
    }
    if (lines.every((line) => /^\s*>\s?/.test(line))) {
      html.push(`<blockquote>${inline(lines.map((l) => l.replace(/^\s*>\s?/, "")).join(" "))}</blockquote>`);
      continue;
    }

    const heading = /^(#{2,4})\s+(.*)$/.exec(trimmed);
    if (heading) {
      const level = Math.min(heading[1].length, 4);
      html.push(`<h${level}>${inline(heading[2])}</h${level}>`);
      continue;
    }

    html.push(`<p>${inline(trimmed).replace(/\n/g, "<br />")}</p>`);
  }

  return html.join("\n");
}

export const ASPECT_RATIOS: Record<string, number> = {
  "9:16": 9 / 16,
  "4:5": 4 / 5,
  "1:1": 1,
  "3:2": 3 / 2,
  "16:9": 16 / 9,
};

export function aspectValue(key: string): number {
  return ASPECT_RATIOS[key] ?? ASPECT_RATIOS["4:5"];
}

export function formatDate(iso: string): string {
  const date = new Date(`${iso}T12:00:00Z`);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Pull the shortcode out of an Instagram reel/post URL. */
export function instagramCode(url: string): string | null {
  const match = /instagram\.com\/(?:reel|reels|p|tv)\/([A-Za-z0-9_-]+)/i.exec(url || "");
  return match ? match[1] : null;
}
