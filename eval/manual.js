#!/usr/bin/env node
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname, resolve, join, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseYaml } from "yaml";

import { renderPrompt } from "../src/prompt.js";
import { score } from "./score.js";

const HERE = dirname(fileURLToPath(import.meta.url));

/**
 * For agents with no usable CLI — ChatGPT in a browser, Cursor, anything
 * behind an interactive login.
 *
 * It cannot see tool calls, so it does not pretend to. Hard checks come back
 * marked `unavailable` and are excluded from the totals rather than counted as
 * passes. A manual scorecard is a partial measurement and says so; the
 * alternative — silently scoring 0 reads for an agent whose reads are
 * invisible — would make the least disciplined agent look like the best one.
 *
 *   node eval/manual.js eval/cases/context-compress.yaml --agent chatgpt
 *     → writes a transcript template with the turns to send
 *   node eval/manual.js eval/cases/context-compress.yaml --agent chatgpt
 *     → once the template has replies in it, scores them
 */

const SEP = "=".repeat(72);
const REPLY_MARK = "--- reply ---";

function template(def, paste) {
  const L = [
    `# manual transcript — ${def.repo ?? "."}`,
    "",
    "Send each SEND block to the agent, in order, in ONE conversation.",
    `Paste its reply under the matching "${REPLY_MARK}" line. Leave the markers alone.`,
    "",
    "Hard checks (read budget, routing, execution) cannot be scored from a",
    "transcript — they need tool calls. They will be reported as unavailable.",
    "",
  ];
  for (const t of def.turns) {
    L.push(SEP, `## TURN ${t.id}`, "", "SEND:", "", (t.send === "@paste" ? paste : t.send), "", REPLY_MARK, "", "");
  }
  return L.join("\n");
}

function parseTranscript(text, def) {
  const out = new Map();
  const blocks = text.split(/^## TURN /m).slice(1);
  for (const block of blocks) {
    const id = block.split("\n")[0].trim();
    const idx = block.indexOf(REPLY_MARK);
    if (idx === -1) continue;
    const reply = block.slice(idx + REPLY_MARK.length).split(SEP)[0].trim();
    out.set(id, reply);
  }
  return def.turns.map((t) => ({ ...t, text: out.get(t.id) ?? "", tools: [], toolCalls: [] }));
}

function main() {
  const args = process.argv.slice(2);
  const caseFile = args.find((a) => /\.ya?ml$/.test(a));
  if (!caseFile) {
    console.error("usage: node eval/manual.js <case.yaml> [--agent chatgpt] [--transcript <file>]");
    return 2;
  }
  const agent = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : "manual";
  const def = parseYaml(readFileSync(resolve(caseFile), "utf8"));
  const cwd = resolve(dirname(resolve(caseFile)), def.repo ?? ".");
  const stem = basename(caseFile).replace(/\.ya?ml$/, "");
  const transcript = args.includes("--transcript")
    ? resolve(args[args.indexOf("--transcript") + 1])
    : join(HERE, "transcripts", `${stem}.${agent}.md`);

  if (!existsSync(transcript)) {
    const { text: paste } = renderPrompt({ root: cwd, lang: def.lang ?? "en" });
    mkdirSync(dirname(transcript), { recursive: true });
    writeFileSync(transcript, template(def, paste));
    console.error(`wrote ${transcript}`);
    console.error(`\nSend each SEND block to ${agent} in one conversation, paste the replies back,`);
    console.error("then run this command again to score it.");
    return 0;
  }

  const turns = parseTranscript(readFileSync(transcript, "utf8"), def);
  const empty = turns.filter((t) => !t.text);
  if (empty.length) {
    console.error(`${empty.length} turn(s) have no reply yet: ${empty.map((t) => t.id).join(", ")}`);
    if (empty.length === turns.length) return 1;
  }

  const scored = score({
    case: basename(caseFile),
    agent,
    repo: def.repo ?? ".",
    manifest: def.manifest ?? "AGENT_GUIDE.md",
    capabilities: { toolCalls: false },
    turns,
  });

  const outDir = join(HERE, "results", "manual");
  mkdirSync(outDir, { recursive: true });
  writeFileSync(join(outDir, `${stem}.${agent}.json`), JSON.stringify(scored, null, 2));

  const all = scored.turns.flatMap((t) => t.checks);
  const unavailable = all.filter((c) => c.unavailable);
  console.log(`${agent} — soft ${scored.summary.soft.pass}/${scored.summary.soft.total}`);
  console.log(`hard checks not measurable from a transcript: ${unavailable.length}`);
  const failed = all.filter((c) => !c.unavailable && !c.pass);
  if (failed.length) {
    console.log("\nfailures");
    for (const t of scored.turns) {
      for (const c of t.checks) if (!c.unavailable && !c.pass) console.log(`  ${t.id} · ${c.dimension}: ${c.detail}`);
    }
  }
  console.log(`\nwritten to ${join("eval/results/manual", `${stem}.${agent}.json`)}`);
  return failed.length ? 1 : 0;
}

process.exit(main());
