import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBody, aspectValue, formatDate, instagramCode } from "../src/lib/render.ts";

test("paragraphs split on blank lines", () => {
  assert.equal(renderBody("One.\n\nTwo."), "<p>One.</p>\n<p>Two.</p>");
});

test("headings, lists and quotes render", () => {
  assert.equal(renderBody("## Format"), "<h2>Format</h2>");
  assert.equal(renderBody("- a\n- b"), "<ul><li>a</li><li>b</li></ul>");
  assert.equal(renderBody("> quoted"), "<blockquote>quoted</blockquote>");
});

test("links and bold render", () => {
  assert.equal(
    renderBody("See [the show](https://x.com) **tonight**"),
    '<p>See <a href="https://x.com" rel="noopener">the show</a> <strong>tonight</strong></p>'
  );
});

test("HTML in post bodies is escaped, not executed", () => {
  const html = renderBody('<img src=x onerror="alert(1)">');
  assert.ok(!html.includes("<img"), html);
  assert.ok(html.includes("&lt;img"), html);
});

test("a link label cannot smuggle markup", () => {
  const html = renderBody("[<b>x</b>](https://x.com)");
  assert.ok(!html.includes("<b>"), html);
});

test("single newlines inside a paragraph become breaks", () => {
  assert.equal(renderBody("One\nTwo"), "<p>One<br />Two</p>");
});

test("aspectValue maps every orientation the admin offers", () => {
  assert.equal(aspectValue("9:16"), 9 / 16);
  assert.equal(aspectValue("16:9"), 16 / 9);
  assert.equal(aspectValue("1:1"), 1);
  // Unknown values fall back rather than producing NaN and a collapsed layout.
  assert.equal(aspectValue("nonsense"), 4 / 5);
});

test("formatDate renders in UTC so a date never slips a day", () => {
  assert.equal(formatDate("2026-08-24"), "Aug 24, 2026");
  assert.equal(formatDate("2026-01-01"), "Jan 1, 2026");
});

test("formatDate passes through anything unparseable", () => {
  assert.equal(formatDate("not a date"), "not a date");
});

test("instagramCode reads reel, p and tv permalinks", () => {
  assert.equal(instagramCode("https://www.instagram.com/reel/ABC-123_x/"), "ABC-123_x");
  assert.equal(instagramCode("https://instagram.com/p/XYZ789"), "XYZ789");
  assert.equal(instagramCode("https://example.com/reel/ABC"), null);
  assert.equal(instagramCode(""), null);
});
