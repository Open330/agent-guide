import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";

const HERE = dirname(fileURLToPath(import.meta.url));
const TEMPLATES = resolve(HERE, "..", "templates");

/** owner/repo and default branch, from the git remote. */
export function detectRepo(root) {
  const run = (...args) => {
    try {
      return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  };
  const url = run("remote", "get-url", "origin");
  let slug = null;
  if (url) {
    const m = url.match(/github\.com[:/]+([^/]+\/[^/.]+)(?:\.git)?\/?$/);
    if (m) slug = m[1];
  }
  let branch = run("symbolic-ref", "--short", "HEAD");
  const head = run("symbolic-ref", "refs/remotes/origin/HEAD");
  if (head) branch = head.split("/").pop();
  return { slug, branch: branch || "main" };
}

export function renderPrompt({ root = process.cwd(), lang = "en", blockOnly = true } = {}) {
  const file = join(TEMPLATES, `readme-block.${lang}.md`);
  if (!existsSync(file)) {
    throw new Error(`No template for language "${lang}". Available: en, ko`);
  }
  let text = readFileSync(file, "utf8");

  const { slug, branch } = detectRepo(root);
  if (slug) text = text.replace(/<org>\/<repo>/g, slug);
  if (branch && branch !== "main") {
    text = text.replace(/(AGENT_GUIDE\.md[\s\S]*?)/, (s) => s); // no-op guard
    text = text.replace(/\/main\/AGENT_GUIDE\.md/g, `/${branch}/AGENT_GUIDE.md`);
  }

  if (!blockOnly) return { text, slug, branch };

  // The inner fenced block is what a user actually pastes into an agent.
  const fences = [...text.matchAll(/```\n([\s\S]*?)```/g)];
  const inner = fences.length ? fences[0][1] : text;
  return { text: inner.trimEnd(), slug, branch, full: text };
}
