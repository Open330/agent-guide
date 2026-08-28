import { test } from "node:test";
import assert from "node:assert/strict";
import { renderBadge, BADGE_LEVELS } from "../src/badge.js";

// A repo with no git remote, so the link target falls back to the relative path.
const NO_REMOTE = "/nonexistent-repo-root-for-tests";

test("each level gets its own colour", () => {
  const colours = BADGE_LEVELS.map((level) => renderBadge({ level, root: NO_REMOTE }).color);
  assert.equal(new Set(colours).size, colours.length, "levels must be visually distinguishable");
});

test("a manifest below Core gets no badge", () => {
  assert.throws(() => renderBadge({ level: null, root: NO_REMOTE }), /does not reach Core/);
});

test("an unknown level is refused rather than guessed", () => {
  assert.throws(() => renderBadge({ level: "Platinum", root: NO_REMOTE }), /Unknown compliance level/);
});

test("shields path segments escape dashes and spaces", () => {
  const { image } = renderBadge({ level: "Core", root: NO_REMOTE });
  // "Agent Guide" -> Agent_Guide, and the label/message/colour separator stays a single dash
  assert.match(image, /badge\/Agent_Guide-Core-informational$/);
});

test("without a remote the badge links to the relative manifest path", () => {
  const b = renderBadge({ level: "Guided", root: NO_REMOTE, manifestPath: `${NO_REMOTE}/docs/AGENT_GUIDE.md` });
  assert.equal(b.target, "docs/AGENT_GUIDE.md");
  assert.equal(b.slug, null);
});

test("markdown, html and url formats carry the same image", () => {
  const opts = { level: "Interactive", root: NO_REMOTE };
  const md = renderBadge({ ...opts, format: "markdown" });
  const html = renderBadge({ ...opts, format: "html" });
  const url = renderBadge({ ...opts, format: "url" });
  assert.equal(url.text, md.image);
  assert.ok(md.text.startsWith("[![Agent Guide: Interactive]("));
  assert.ok(html.text.includes(`<img src="${md.image}"`));
  assert.ok(html.text.includes('alt="Agent Guide: Interactive"'));
});

test("a style is passed through, and flat stays the default with no query", () => {
  assert.ok(!renderBadge({ level: "Core", root: NO_REMOTE }).image.includes("?"));
  assert.match(
    renderBadge({ level: "Core", root: NO_REMOTE, style: "for-the-badge" }).image,
    /\?style=for-the-badge$/
  );
});
