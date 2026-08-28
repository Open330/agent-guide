import { readFileSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { parseManifest, slugify } from "./parse.js";
import { digestOf } from "./prompt.js";

/**
 * Rules are split three ways:
 *   error   — the manifest is invalid or a reference is broken
 *   warn    — legal, but it will produce a worse session
 *   note    — informational; never affects the exit code
 *
 * Every rule here traces to a section of SPEC.md or a finding in experiments/.
 */

const KNOWN_SIZES = new Set(["S", "M", "L", "s", "m", "l"]);

/**
 * Commands whose consequence a reader would not infer from the command itself.
 * A step matching one of these and carrying no `effects` gets a warning — never
 * an error. A false positive that fails CI gets the check deleted; a warning
 * that says "this installs globally, consider naming it" gets read.
 */
const RISKY = [
  [/\b(?:npm|pnpm)\s+(?:i|install|add)\b[^&|;]*\s-g\b|\byarn\s+global\s+add\b|\b(?:gem|cargo)\s+install\b/, "installs globally"],
  [/\bsudo\b/, "runs as root"],
  [/\brm\s+-[a-z]*[rf]/, "deletes files"],
  [/\bgit\s+push\b|\bgh\s+(?:pr\s+create|release)\b/, "writes to a remote"],
  [/\b(?:terraform|tofu)\s+apply\b|\bkubectl\s+apply\b|\bhelm\s+(?:install|upgrade)\b/, "changes infrastructure"],
  [/\|\s*(?:sudo\s+)?(?:ba)?sh\b/, "pipes a remote script into a shell"],
  [/(?:^|\s)(?:>|>>)\s*(?:~|\$HOME|\/etc)\//, "writes outside the working directory"],
  [/--auto\b|--yes\b|(?:^|\s)-y(?:\s|$)/, "skips its own confirmation prompt"],
];

class Report {
  constructor(file) {
    this.file = file;
    this.items = [];
  }
  add(level, rule, message, line, file) {
    this.items.push({ level, rule, message, line: line ?? null, file: file ?? this.file });
  }
  error(rule, message, line, file) { this.add("error", rule, message, line, file); }
  warn(rule, message, line, file) { this.add("warn", rule, message, line, file); }
  note(rule, message, line, file) { this.add("note", rule, message, line, file); }
  get errors() { return this.items.filter((i) => i.level === "error"); }
  get warnings() { return this.items.filter((i) => i.level === "warn"); }
}

function complianceLevel(m) {
  const core =
    m.frontmatter?.guide && m.frontmatter?.name && m.overview && m.notFor &&
    m.docs.length > 0 && m.flows.some((f) => f.faq.length > 0);
  if (!core) return null;
  const guided = m.policy && m.codeMap.length > 0 && m.flows.length >= 2;
  if (!guided) return "Core";
  const switching = m.flows.some((f) => f.signals.length > 0);
  const runnable = m.tasks.some((t) => t.body?.verify && typeof t.body.verify === "object");
  return switching && runnable ? "Interactive" : "Guided";
}

/** Heading anchors present in a local markdown file. */
function anchorsOf(path) {
  try {
    return new Set(
      readFileSync(path, "utf8")
        .split("\n")
        .filter((l) => /^#{1,6} /.test(l))
        .map((l) => slugify(l.replace(/^#{1,6} /, "")))
    );
  } catch {
    return null;
  }
}

export function validateText(text, { file = "AGENT_GUIDE.md", root = null, checkPaths = true } = {}) {
  const m = parseManifest(text);
  const r = new Report(file);

  // ── frontmatter ────────────────────────────────────────────────
  const fm = m.frontmatter;
  if (!fm) r.error("frontmatter", "No YAML frontmatter. `guide`, `name` and `base` are required. (SPEC §4.3)", 1);
  else {
    if (fm.__error) r.error("frontmatter", `Frontmatter is not valid YAML: ${fm.__error}`, 1);
    for (const k of ["guide", "name", "base"]) {
      if (!fm[k]) r.error("frontmatter", `Frontmatter is missing required key \`${k}\`. (SPEC §4.3)`, 1);
    }
    if (fm.guide && String(fm.guide) !== "0.1") {
      r.note("version", `Manifest declares spec version ${fm.guide}; this validator implements 0.1.`, 1);
    }
    if (fm.status && !["alpha", "beta", "stable", "maintenance"].includes(fm.status)) {
      r.warn("frontmatter", `Unknown \`status\` value "${fm.status}". Expected alpha, beta, stable or maintenance.`, 1);
    }
    if (fm.upstream && !(fm.upstream.name && fm.upstream.url)) {
      r.warn("frontmatter", "`upstream` needs both `name` and `url` to be useful. (SPEC §4.3)", 1);
    }
  }

  // ── overview and Not for ───────────────────────────────────────
  if (!m.title) r.error("overview", "No H1 heading.", 1);
  if (!m.overview) {
    r.error("overview", "No overview paragraph after the H1. The agent uses it verbatim. (SPEC §4.4)");
  } else {
    const sentences = m.overview.split(/(?<=[.!?。])\s+/).filter(Boolean).length;
    if (sentences > 3) {
      r.warn("overview", `Overview is ${sentences} sentences. Three or fewer keeps the first reply short. (SPEC §4.4)`);
    }
  }
  if (!m.notFor || m.notFor.length === 0) {
    r.error("not-for", "No `**Not for:**` line. It is required — it sends the wrong reader away and stops an agent inventing features. (SPEC §4.4)");
  }

  // ── Docs ───────────────────────────────────────────────────────
  if (m.docs.length === 0) {
    r.error("docs", "No `## Docs` table. Routing is impossible without one. (SPEC §4.5)");
  }
  const ids = new Set();
  for (const d of m.docs) {
    if (!d.id) { r.error("docs", "A Docs row has no id.", d.line); continue; }
    if (ids.has(d.id)) r.error("docs", `Duplicate Docs id \`${d.id}\`.`, d.line);
    ids.add(d.id);
    if (!d.path) r.error("docs", `Docs row \`${d.id}\` has no path.`, d.line);
    if (d.covers.length === 0) {
      r.error("covers", `Docs row \`${d.id}\` has no covers. That column is the entire routing mechanism. (SPEC §4.5)`, d.line);
    } else if (d.covers.length < 3 && d.id !== "more") {
      r.warn("covers", `Docs row \`${d.id}\` has only ${d.covers.length} covers term(s). Aim for three or more phrasings a confused user would type.`, d.line);
    }
    if (d.size && !KNOWN_SIZES.has(d.size)) {
      r.warn("docs", `Docs row \`${d.id}\` has size "${d.size}"; expected S, M or L.`, d.line);
    }
  }
  if (m.docs.length > 12) {
    r.warn("docs", `${m.docs.length} Docs rows. The guidance is 8–12 entry points; beyond that, rows start competing for the same questions. (authoring A3-1)`);
  }

  // ── flows ──────────────────────────────────────────────────────
  if (m.flows.length === 0) {
    r.error("flow", "No `## Flow:` section. At least one is required. (SPEC §4.6)");
  }
  const defaults = m.flows.filter((f) => f.isDefault);
  if (defaults.length === 0) {
    r.error("flow", "No flow is marked `(default)`. Exactly one must be. (SPEC §4.6)");
  } else if (defaults.length > 1) {
    r.error("flow", `${defaults.length} flows are marked \`(default)\`: ${defaults.map((f) => f.id).join(", ")}. Exactly one must be.`, defaults[1].line);
  }
  const flowIds = new Set(m.flows.map((f) => f.id));
  for (const f of m.flows) {
    if (f.faq.length === 0) {
      r.error("flow", `Flow \`${f.id}\` has no FAQ entries. A flow without questions cannot route anything. (SPEC §4.6)`, f.line);
    } else if (f.faq.length === 1) {
      r.warn("flow", `Flow \`${f.id}\` has one FAQ entry. A one-line flow adds a menu choice without adding an answer — the authoring protocol says not to create it. (authoring A4)`, f.line);
    }
    if (!f.goal) r.warn("flow", `Flow \`${f.id}\` has no \`> Goal:\`. It is what an agent steers by when a question is ambiguous.`, f.line);
  }

  // ── references ─────────────────────────────────────────────────
  const taskIds = new Set(m.tasks.map((t) => t.id));
  const seenDocRefs = new Set();
  for (const f of m.flows) {
    for (const entry of [...f.faq, ...f.audiences]) {
      for (const id of entry.docIds) {
        seenDocRefs.add(id);
        if (!ids.has(id)) r.error("ref", `Unknown Docs id \`${id}\`.`, entry.line);
      }
      if (entry.taskId && !taskIds.has(entry.taskId)) {
        r.error("ref", `Unknown Task id \`${entry.taskId}\`.`, entry.line);
      }
      if (entry.flowId && !flowIds.has(entry.flowId)) {
        r.error("ref", `Unknown Flow id \`${entry.flowId}\`.`, entry.line);
      }
    }
    if (f.next && flowIds.has(f.next)) continue;
  }
  for (const d of m.docs) {
    if (!seenDocRefs.has(d.id) && d.id !== "more") {
      r.warn("ref", `Docs row \`${d.id}\` is never referenced by an FAQ entry or Task. Nothing routes to it.`, d.line);
    }
  }

  // ── tasks ──────────────────────────────────────────────────────
  const seenTaskIds = new Set();
  for (const t of m.tasks) {
    if (seenTaskIds.has(t.id)) r.error("task", `Duplicate Task id \`${t.id}\`.`, t.line);
    seenTaskIds.add(t.id);
    const b = t.body;
    if (!b || b.__error) {
      r.error("task", `Task \`${t.id}\` has no valid YAML block${b?.__error ? `: ${b.__error}` : ""}. (SPEC §4.7)`, t.line);
      continue;
    }
    if (!Array.isArray(b.steps) || b.steps.length === 0) {
      r.error("task", `Task \`${t.id}\` has no \`steps\`.`, t.line);
    }
    if (b.verify === undefined) {
      r.error("task", `Task \`${t.id}\` has no \`verify\`. Use \`verify: none\` or \`verify: unverified\` with a \`why:\` if you cannot check it. (SPEC §4.7)`, t.line);
    } else if (typeof b.verify === "string") {
      if (!["none", "unverified"].includes(b.verify)) {
        r.error("task", `Task \`${t.id}\` has \`verify: ${b.verify}\`. The only string values are \`none\` and \`unverified\`.`, t.line);
      } else if (!b.why) {
        r.error("task", `Task \`${t.id}\` uses \`verify: ${b.verify}\` without \`why:\`. Say what could not be checked. (SPEC §4.7)`, t.line);
      }
    } else if (!b.verify.run) {
      r.error("task", `Task \`${t.id}\` has a \`verify\` block with no \`run\`.`, t.line);
    }
    for (const id of b.on_fail ?? []) {
      if (!ids.has(id)) r.error("ref", `Task \`${t.id}\` has \`on_fail\` pointing at unknown Docs id \`${id}\`.`, t.line);
    }
    for (const p of b.preconditions ?? []) {
      if (!p.hint) r.warn("task", `Task \`${t.id}\` has a precondition with no \`hint\`. The user sees the hint, not the regex.`, t.line);
    }
    for (const step of Array.isArray(b.steps) ? b.steps : []) {
      const cmd = String(step.run ?? "");
      if (step.effects?.length) continue;
      const hit = RISKY.find(([re]) => re.test(cmd));
      if (hit) {
        r.warn("effects", `Task \`${t.id}\`: \`${cmd.slice(0, 48)}\` ${hit[1]}, with no \`effects\` naming it. The consent rule has nothing to point at without one. (SPEC §4.7)`, t.line);
      }
    }
  }
  for (const t of m.tasks) {
    const referenced = m.flows.some((f) => [...f.faq, ...f.audiences].some((e) => e.taskId === t.id));
    if (!referenced) r.warn("ref", `Task \`${t.id}\` is never referenced from a flow.`, t.line);
  }

  // ── unknown sections ───────────────────────────────────────────
  for (const s of m.unknownSections) {
    r.warn("section", `Unrecognised section \`## ${s.key}\`. Section keys are fixed English; localized text goes after " — ". (SPEC §4.2)`, s.line);
  }

  // ── maintainer TODOs ───────────────────────────────────────────
  for (const t of m.todos) {
    r.warn("todo", "A `TODO(maintainer)` marker is still here. The overview, `Not for` and `status` need a human to confirm them. (authoring A7)", t.line);
  }

  // ── filesystem ─────────────────────────────────────────────────
  if (checkPaths && root) {
    for (const d of m.docs) {
      if (!d.path || /^https?:/i.test(d.path)) continue;
      const [rel, anchor] = d.path.split("#");
      const abs = resolve(root, rel);
      if (!existsSync(abs)) {
        r.error("path", `Docs row \`${d.id}\` points at ${rel}, which does not exist.`, d.line);
        continue;
      }
      if (anchor) {
        const anchors = anchorsOf(abs);
        if (anchors && !anchors.has(anchor)) {
          r.error("path", `Docs row \`${d.id}\`: ${rel} has no heading anchor #${anchor}.`, d.line);
        }
      }
    }
    for (const c of m.codeMap) {
      const first = (c.path ?? "").split(",")[0].trim().replace(/`/g, "");
      if (!first) continue;
      if (!existsSync(resolve(root, first))) {
        r.error("path", `Code map row points at ${first}, which does not exist.`, c.line);
      }
    }
  }

  return { report: r, model: m, level: complianceLevel(m) };
}

/** The README paste block must not ship with its placeholders intact. */
export function validateReadme(root, report, manifestText) {
  const readme = join(root, "README.md");
  if (!existsSync(readme)) return;
  const text = readFileSync(readme, "utf8");

  // An inline paste block duplicates manifest content on purpose, to spare the
  // agent a tool call before its first token. The digest is how that copy stays
  // honest — this project has had a hand-maintained copy go stale twice.
  const stamped = text.match(/<!--\s*agent-guide:inline\s+([0-9a-f]{8})\s*-->/);
  if (stamped && manifestText) {
    const { hash } = digestOf(manifestText);
    if (stamped[1] !== hash) {
      const line = text.split("\n").findIndex((l) => l.includes(stamped[0])) + 1;
      report.warn("inline", `The README's inline paste block is stale (${stamped[1]} vs ${hash}). Regenerate it with \`agent-guide prompt --inline\`.`, line, "README.md");
    }
  }
  // Prose that tells a maintainer to replace `<org>/<repo>` is fine. An
  // unsubstituted placeholder inside the URL the agent will fetch is not.
  const PLACEHOLDER_URL = /raw\.githubusercontent\.com\/<org>|githubusercontent\.com\/[^/\s]*\/<repo>/;
  if (PLACEHOLDER_URL.test(text)) {
    const line = text.split("\n").findIndex((l) => PLACEHOLDER_URL.test(l)) + 1;
    report.error("readme", "The README paste block still points at `<org>/<repo>`. Substitute it or the remote lookup fails for every reader. (templates/README.md)", line, "README.md");
  }
  if (!/AGENT_GUIDE\.md/.test(text)) {
    report.warn("readme", "README.md never mentions AGENT_GUIDE.md. Without the paste block, nobody starts a session.", null, "README.md");
  }
}

export function validateFile(path, { checkPaths = true, checkReadme = true } = {}) {
  const text = readFileSync(path, "utf8");
  const root = dirname(resolve(path));
  const result = validateText(text, { file: path, root, checkPaths });
  if (checkReadme && checkPaths) validateReadme(root, result.report, text);
  return result;
}
