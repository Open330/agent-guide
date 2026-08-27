import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { slugify } from "./parse.js";
import { detectRepo } from "./prompt.js";

/**
 * `init` produces a DRAFT, not a finished manifest. It fills in what a static
 * scan can know — paths, anchors, package metadata — and leaves everything that
 * needs judgement marked for a human or for the authoring prompt.
 *
 * It deliberately does not invent `covers`, FAQ entries, or Tasks. A plausible
 * but wrong routing table is worse than an obviously empty one.
 */

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "build", "vendor", "target", ".next", "coverage"]);
const PLAN_DOC = /(-plan|-todo|-spec|\.todo|draft|wip)\.md$/i;

function readPackageMeta(root) {
  const pkgPath = join(root, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
      return {
        name: pkg.name ?? null,
        tagline: pkg.description ?? null,
        engines: pkg.engines?.node ? `node ${pkg.engines.node}` : null,
      };
    } catch { /* fall through */ }
  }
  for (const f of ["pyproject.toml", "Cargo.toml", "go.mod"]) {
    if (existsSync(join(root, f))) {
      const text = readFileSync(join(root, f), "utf8");
      const name = text.match(/^\s*(?:name|module)\s*[=: ]\s*"?([^"\n]+)"?/m);
      return { name: name?.[1]?.trim() ?? null, tagline: null, engines: null };
    }
  }
  return { name: null, tagline: null, engines: null };
}

function firstHeading(file) {
  try {
    for (const line of readFileSync(file, "utf8").split("\n").slice(0, 30)) {
      const m = line.match(/^#{1,2} (.+)$/);
      if (m) return m[1].trim();
    }
  } catch { /* unreadable */ }
  return null;
}

function collectDocs(root) {
  const out = [];
  const readme = join(root, "README.md");
  if (existsSync(readme)) {
    const headings = readFileSync(readme, "utf8")
      .split("\n")
      .filter((l) => /^## /.test(l))
      .map((l) => l.replace(/^## /, "").trim());
    for (const h of headings.slice(0, 8)) {
      out.push({ id: slugify(h).slice(0, 24) || "readme", path: `README.md#${slugify(h)}`, title: h, source: "README" });
    }
  }
  const docsDir = join(root, "docs");
  if (existsSync(docsDir)) {
    const walk = (dir, depth = 0) => {
      if (depth > 2) return;
      for (const entry of readdirSync(dir)) {
        if (SKIP_DIRS.has(entry)) continue;
        const p = join(dir, entry);
        if (statSync(p).isDirectory()) { walk(p, depth + 1); continue; }
        if (!entry.endsWith(".md")) continue;
        if (PLAN_DOC.test(entry)) continue; // in-flight work is not an entry point
        out.push({
          id: slugify(entry.replace(/\.md$/, "")).slice(0, 24),
          path: relative(root, p),
          title: firstHeading(p) ?? entry,
          source: "docs",
        });
      }
    };
    walk(docsDir);
  }
  for (const f of ["CONTRIBUTING.md", "CHANGELOG.md", "SECURITY.md", "AGENTS.md"]) {
    if (existsSync(join(root, f))) {
      out.push({ id: slugify(f.replace(/\.md$/, "")), path: f, title: f, source: "root" });
    }
  }
  return out;
}

function collectCodeMap(root) {
  const out = [];
  for (const base of ["src", "lib", "app", "packages", "internal", "cmd"]) {
    const dir = join(root, base);
    if (!existsSync(dir) || !statSync(dir).isDirectory()) continue;
    const children = readdirSync(dir).filter((e) => !SKIP_DIRS.has(e) && !e.startsWith("."));
    const dirs = children.filter((e) => statSync(join(dir, e)).isDirectory());
    if (dirs.length === 0) { out.push(`${base}/`); continue; }
    for (const d of dirs.slice(0, 10)) out.push(`${base}/${d}/`);
  }
  return out;
}

export function renderDraft(root) {
  const meta = readPackageMeta(root);
  const { slug, branch } = detectRepo(root);
  const docs = collectDocs(root);
  const codeMap = collectCodeMap(root);
  const base = slug
    ? `https://raw.githubusercontent.com/${slug}/${branch}/`
    : "https://raw.githubusercontent.com/<org>/<repo>/main/";

  const L = [];
  L.push("---");
  L.push('guide: "0.1"');
  L.push(`name: ${meta.name ?? "TODO"}`);
  if (meta.tagline) L.push(`tagline: ${meta.tagline}`);
  L.push("status: TODO   # alpha | beta | stable | maintenance");
  L.push(`base: ${base}`);
  if (slug) {
    L.push("links:");
    L.push(`  repo: https://github.com/${slug}`);
    L.push(`  issues: https://github.com/${slug}/issues`);
    L.push(`escalate_to: https://github.com/${slug}/issues/new`);
  }
  L.push("---", "");
  L.push(`# ${meta.name ?? "TODO"} — Agent Guide`, "");
  L.push("<!-- TODO(maintainer): three things below cannot be derived from this repo.");
  L.push("     1. The overview — three sentences, used verbatim by the agent.");
  L.push("     2. The `Not for:` line — what this project deliberately does not do.");
  L.push("     3. `status:` in the frontmatter.");
  L.push("     A README never says what a project refuses to do, so this one is on you. -->", "");
  L.push(meta.tagline ?? "TODO: three sentences describing what this is and what it does.", "");
  L.push("**Not for:** TODO · TODO", "");

  L.push("## Docs — where to look", "");
  L.push("| id | path | ask about this when | size |");
  L.push("| --- | --- | --- | --- |");
  if (docs.length === 0) {
    L.push("| TODO | README.md | TODO: the words a confused user would type | S |");
  } else {
    for (const d of docs.slice(0, 12)) {
      L.push(`| ${d.id} | ${d.path} | TODO: search terms, not "${d.title}" | M |`);
    }
    if (docs.length > 12) L.push("| more | docs/ | anything not listed above — search here first |  |");
  }
  L.push("");
  L.push("<!-- The third column is the entire routing mechanism. Write the words someone");
  L.push("     types when stuck — error strings are the strongest entries. Never reuse the");
  L.push("     document's own title. -->", "");

  if (codeMap.length) {
    L.push("## Code map — where things live", "");
    L.push("| path | what |");
    L.push("| --- | --- |");
    for (const p of codeMap.slice(0, 10)) L.push(`| ${p} | TODO: one line, what this directory is responsible for |`);
    L.push("");
  }

  L.push("## Flow: onboard — New here (default)", "");
  L.push("> Goal: TODO: the state a reader should be in when this flow ends", "");
  L.push("### FAQ", "");
  L.push("<!-- Mine these, do not invent them: issues labelled question, README");
  L.push("     Troubleshooting and collapsed <details> blocks, CHANGELOG bug descriptions.");
  L.push("     Write them in the user's voice, not as document titles turned into questions. -->");
  L.push("- TODO: how do I install it? → `TODO`");
  L.push("- TODO: how is this different from X? → `TODO`");
  L.push("");

  L.push("## Policy", "");
  L.push("```yaml");
  L.push('answer_style: "Concise. Lists over paragraphs."');
  L.push("citations: required");
  L.push("max_reads_per_answer: 2");
  L.push("```");
  return { text: L.join("\n") + "\n", docs, codeMap, slug, meta };
}
