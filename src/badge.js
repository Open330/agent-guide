import { relative } from "node:path";
import { detectRepo } from "./prompt.js";

/**
 * A badge is a claim about a repository, so it is generated from the manifest
 * rather than typed by hand. A manifest that does not reach Core gets no badge.
 */

const COLOR = {
  Core: "informational",
  Guided: "blue",
  Interactive: "brightgreen",
};

const SHIELDS = "https://img.shields.io/badge";

/** shields.io path segments escape `-`, `_` and spaces. */
function seg(s) {
  return encodeURIComponent(String(s).replace(/-/g, "--").replace(/_/g, "__")).replace(/%20/g, "_");
}

/**
 * @param {object} o
 * @param {"Core"|"Guided"|"Interactive"} o.level  from validate()
 * @param {string} [o.root]          repo root, for the git remote
 * @param {string} [o.manifestPath]  absolute path to the manifest, for the link target
 * @param {"markdown"|"html"|"url"} [o.format]
 * @param {string} [o.style]         shields style: flat | flat-square | for-the-badge
 */
export function renderBadge({
  level,
  root = process.cwd(),
  manifestPath = null,
  format = "markdown",
  style = "flat",
} = {}) {
  if (!level) {
    throw new Error(
      "This manifest does not reach Core, so there is no level to claim. Run `agent-guide validate` and fix the errors first."
    );
  }
  const color = COLOR[level];
  if (!color) throw new Error(`Unknown compliance level "${level}".`);

  const params = style && style !== "flat" ? `?style=${encodeURIComponent(style)}` : "";
  const image = `${SHIELDS}/${seg("Agent Guide")}-${seg(level)}-${color}${params}`;

  // A badge that links nowhere is decoration. Point it at the manifest itself:
  // the reader's next question is "what does that mean here", and the manifest answers it.
  const rel = manifestPath ? relative(root, manifestPath).split("\\").join("/") : "AGENT_GUIDE.md";
  const { slug, branch } = detectRepo(root);
  const target = slug ? `https://github.com/${slug}/blob/${branch}/${rel}` : rel;

  const alt = `Agent Guide: ${level}`;
  let text;
  if (format === "url") text = image;
  else if (format === "html")
    text = `<a href="${target}"><img src="${image}" alt="${alt}"></a>`;
  else text = `[![${alt}](${image})](${target})`;

  return { text, image, target, level, color, slug, branch, rel };
}

export const BADGE_LEVELS = Object.keys(COLOR);
