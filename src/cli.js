#!/usr/bin/env node
import { writeFileSync, existsSync, statSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { validateFile } from "./validate.js";
import { renderPrompt } from "./prompt.js";
import { renderDraft } from "./init.js";

const USAGE = `agent-guide — tooling for AGENT_GUIDE.md

  agent-guide validate [path]     Check a manifest: structure, references, paths, README block
  agent-guide prompt [--ko]       Print the paste block for this repo, placeholders substituted
  agent-guide init [path]         Scaffold a draft manifest by scanning the repo

Options
  --json                          Machine-readable output (validate)
  --no-paths                      Skip filesystem checks — for fictional examples
  --strict                        Treat warnings as failures
  --ko, --lang <en|ko>            Language for prompt output
  --write                         init: write AGENT_GUIDE.md instead of printing
  -h, --help                      This

Exit codes: 0 ok · 1 errors found · 2 could not run
`;

const C = process.stdout.isTTY
  ? { red: "\x1b[31m", yellow: "\x1b[33m", dim: "\x1b[2m", bold: "\x1b[1m", green: "\x1b[32m", off: "\x1b[0m" }
  : { red: "", yellow: "", dim: "", bold: "", green: "", off: "" };

function findManifest(target) {
  const candidates = target
    ? [target, join(target, "AGENT_GUIDE.md")]
    : ["AGENT_GUIDE.md", ".guide/AGENT_GUIDE.md", "docs/AGENT_GUIDE.md"];
  for (const c of candidates) {
    const p = resolve(c);
    try {
      if (statSync(p).isFile()) return p;
    } catch { /* missing */ }
  }
  return null;
}

function printReport(result, path, { strict }) {
  const { report, level } = result;
  const order = { error: 0, warn: 1, note: 2 };
  const items = [...report.items].sort((a, b) => order[a.level] - order[b.level] || (a.line ?? 0) - (b.line ?? 0));

  const rel = relative(process.cwd(), path) || path;
  for (const it of items) {
    const tag =
      it.level === "error" ? `${C.red}error${C.off}` :
      it.level === "warn" ? `${C.yellow}warn ${C.off}` :
      `${C.dim}note ${C.off}`;
    const f = it.file && it.file !== path ? it.file : rel;
    const where = it.line ? `${f}:${it.line}` : f;
    console.log(`${tag} ${C.dim}${where}${C.off}  ${it.message}  ${C.dim}[${it.rule}]${C.off}`);
  }

  const e = report.errors.length;
  const w = report.warnings.length;
  if (items.length) console.log("");
  if (e === 0 && w === 0) {
    console.log(`${C.green}✓${C.off} ${rel} — no issues`);
  } else {
    console.log(`${e} error${e === 1 ? "" : "s"}, ${w} warning${w === 1 ? "" : "s"}`);
  }
  console.log(`compliance level: ${C.bold}${level ?? "none — Core requirements unmet"}${C.off}`);
  return e > 0 || (strict && w > 0) ? 1 : 0;
}

function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    process.stdout.write(USAGE);
    return 0;
  }
  const cmd = args[0];
  const flag = (name) => args.includes(name);
  const positional = args.slice(1).filter((a) => !a.startsWith("-"));
  const langFlag = args.includes("--lang") ? args[args.indexOf("--lang") + 1] : null;
  const lang = flag("--ko") ? "ko" : (langFlag ?? "en");

  if (cmd === "validate") {
    const path = findManifest(positional[0]);
    if (!path) {
      console.error(`${C.red}error${C.off} No AGENT_GUIDE.md found. Looked in ., .guide/ and docs/.`);
      console.error(`${C.dim}      Run \`agent-guide init\` to scaffold one.${C.off}`);
      return 2;
    }
    const checkPaths = !flag("--no-paths");
    const result = validateFile(path, { checkPaths });
    if (flag("--json")) {
      console.log(JSON.stringify({
        file: path,
        level: result.level,
        errors: result.report.errors.length,
        warnings: result.report.warnings.length,
        items: result.report.items,
      }, null, 2));
      return result.report.errors.length > 0 ? 1 : 0;
    }
    return printReport(result, path, { strict: flag("--strict") });
  }

  if (cmd === "prompt") {
    try {
      const { text, slug, branch } = renderPrompt({ root: process.cwd(), lang });
      if (!slug) {
        console.error(`${C.yellow}warn${C.off}  No GitHub remote found — <org>/<repo> left as-is. Substitute it before committing.`);
      }
      console.log(text);
      if (slug && process.stdout.isTTY) {
        console.error(`\n${C.dim}substituted ${slug} @ ${branch}${C.off}`);
      }
      return 0;
    } catch (err) {
      console.error(`${C.red}error${C.off} ${err.message}`);
      return 2;
    }
  }

  if (cmd === "init") {
    const root = resolve(positional[0] ?? ".");
    const out = join(root, "AGENT_GUIDE.md");
    if (flag("--write") && existsSync(out)) {
      console.error(`${C.red}error${C.off} ${relative(process.cwd(), out)} already exists. Refusing to overwrite.`);
      return 2;
    }
    const draft = renderDraft(root);
    if (flag("--write")) {
      writeFileSync(out, draft.text);
      console.error(`${C.green}✓${C.off} wrote ${relative(process.cwd(), out)} — ${draft.docs.length} candidate document(s) found`);
      console.error("");
      console.error("This is a draft, not a manifest. It has no covers, no real FAQ and no Tasks,");
      console.error("because a static scan cannot know them and a plausible-but-wrong routing table");
      console.error("is worse than an obviously empty one.");
      console.error("");
      console.error(`Next: hand the authoring prompt to your agent — it mines your issues and`);
      console.error(`CHANGELOG for the questions people actually ask.`);
      console.error(`${C.dim}  see .context/architecture/authoring-protocol.md §4${C.off}`);
    } else {
      process.stdout.write(draft.text);
    }
    return 0;
  }

  console.error(`${C.red}error${C.off} Unknown command "${cmd}".\n`);
  process.stdout.write(USAGE);
  return 2;
}

process.exit(main(process.argv));
