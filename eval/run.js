#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, resolve, join, relative, basename } from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { parse as parseYaml } from "yaml";

import { renderPrompt, renderInlinePrompt } from "../src/prompt.js";
import { score } from "./score.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(HERE, "..");

/**
 * Drives a real agent through a scenario and records what it did.
 *
 * The measurements that matter are taken from tool calls, not from prose:
 * how many files were opened before the first reply, which ones, whether a
 * command was run. Those are facts. The text-level checks in score.js are
 * proxies and are labelled as such.
 */

const AGENTS = {
  claude: {
    bin: "claude",
    // Bash is disallowed, so this session cannot execute anything at all.
    capabilities: { exec: false },
    args(text, { sessionId, first, cwd }) {
      const a = [
        "-p", text,
        "--output-format", "stream-json",
        "--verbose",
        "--disallowedTools", "Write", "Edit", "NotebookEdit", "Bash",
        // Measure the protocol, not the operator's machine. Without this the
        // user's own hooks and MCP servers ride along and change the replies.
        "--setting-sources", "project",
        "--strict-mcp-config",
        "--max-turns", "12",
      ];
      a.push(first ? "--session-id" : "--resume", sessionId);
      return a;
    },
    /** NDJSON → { text, tools: [{name, input}] } */
    parse(stdout) {
      const out = { text: "", tools: [], raw: [] };
      for (const line of stdout.split("\n")) {
        if (!line.trim()) continue;
        let ev;
        try { ev = JSON.parse(line); } catch { continue; }
        out.raw.push(ev);
        const content = ev?.message?.content;
        if (ev.type === "assistant" && Array.isArray(content)) {
          for (const c of content) {
            if (c.type === "text") out.text += c.text;
            if (c.type === "tool_use") out.tools.push({ name: c.name, input: c.input ?? {} });
          }
        }
        if (ev.type === "result" && typeof ev.result === "string" && !out.text) out.text = ev.result;
      }
      return out;
    },
  },

  /**
   * Codex has no Read tool — it reads files by running shell commands, so a
   * `sed -n '1,80p' docs/x.md` is a read and `npm install` is not. The adapter
   * classifies each command and reports paths, so score.js can apply the same
   * read-budget and routing rules to both agents without knowing the
   * difference.
   */
  codex: {
    bin: "codex",
    // `-s read-only` sandboxes writes but still lets commands run.
    capabilities: { exec: true },
    args(text, { sessionId, first }) {
      // `exec resume` takes a narrower flag set than `exec` — no -s, no -C.
      // The sandbox has to come through -c there, and the working directory
      // through the spawn call, which both commands honour.
      const shared = ["--json", "--ignore-user-config", "--skip-git-repo-check"];
      return first
        ? ["exec", ...shared, "-s", "read-only", text]
        : ["exec", "resume", sessionId, ...shared, "-c", 'sandbox_mode="read-only"', text];
    },
    parse(stdout) {
      const out = { text: "", tools: [], raw: [], sessionId: null };
      for (const line of stdout.split("\n")) {
        if (!line.trim()) continue;
        let ev;
        try { ev = JSON.parse(line); } catch { continue; }
        out.raw.push(ev);
        if (ev.type === "thread.started" && ev.thread_id) out.sessionId = ev.thread_id;
        if (ev.type !== "item.completed") continue;
        const item = ev.item ?? {};
        if (item.type === "agent_message" && item.text) out.text += item.text;
        if (item.type === "command_execution" && item.command) {
          out.tools.push(classifyCommand(item.command));
        }
        if (item.type === "mcp_tool_call") {
          out.tools.push({ name: `mcp__${item.server ?? "unknown"}__${item.tool ?? "call"}`, input: item.arguments ?? {} });
        }
        if (item.type === "file_change") {
          out.tools.push({ name: "Edit", input: { file_path: item.path ?? "" } });
        }
      }
      return out;
    },
  },
};

/** Read-ish shell tools. Anything else counts as execution. */
const READ_CMDS = /^(?:cat|sed|head|tail|less|more|awk|cut|wc|nl|jq|yq)$/;
const SEARCH_CMDS = /^(?:grep|rg|ag|ack|find|fd|ls|tree|glob)$/;
const PATHISH = /(?:^|[\s'"=])((?:\.{0,2}\/)?[\w.@-]+(?:\/[\w.@-]+)*\.[A-Za-z][\w]{0,5})/g;

/**
 * A codex shell command becomes the tool call it stands in for.
 * `sed -n '1,80p' README.md` → a Read of README.md.
 */
export function classifyCommand(command) {
  const stripped = command.replace(/^\/bin\/\w*sh\s+-\w+\s+/, "").replace(/^["']|["']$/g, "");
  // A read is often not the leading verb: `if [ -f x ]; then sed -n '1,9p' x; fi`
  // still reads x. Split on every place a new command can begin, not just pipes.
  const verbs = stripped
    .split(/[|;&]+|\b(?:then|else|elif|do|fi|done)\b/)
    .map((seg) => seg.trim().replace(/^\[.*?\]\s*/, "").split(/\s+/)[0]?.replace(/.*\//, "") ?? "")
    .filter(Boolean);
  const paths = [...stripped.matchAll(PATHISH)].map((m) => m[1]);
  const isRead = verbs.some((v) => READ_CMDS.test(v));
  const isSearch = verbs.some((v) => SEARCH_CMDS.test(v));
  if (isRead) return { name: "Read", input: { file_path: paths[0] ?? "" }, command };
  if (isSearch) return { name: "Grep", input: { path: paths[0] ?? "" }, command };
  return { name: "Bash", input: { command: stripped } };
}

function runTurn(agent, text, { sessionId, first, cwd, timeoutMs = 240000 }) {
  const spec = AGENTS[agent];
  if (!spec) throw new Error(`Unknown agent "${agent}". Known: ${Object.keys(AGENTS).join(", ")}`);
  return new Promise((res, rej) => {
    const child = spawn(spec.bin, spec.args(text, { sessionId, first, cwd }), {
      cwd,
      stdio: ["ignore", "pipe", "pipe"],
    });
    let stdout = "";
    let stderr = "";
    const timer = setTimeout(() => { child.kill("SIGKILL"); rej(new Error(`timeout after ${timeoutMs}ms`)); }, timeoutMs);
    child.stdout.on("data", (d) => { stdout += d; });
    child.stderr.on("data", (d) => { stderr += d; });
    child.on("error", (e) => { clearTimeout(timer); rej(e); });
    child.on("close", (code) => {
      clearTimeout(timer);
      if (code !== 0 && !stdout) return rej(new Error(`${spec.bin} exited ${code}: ${stderr.slice(0, 400)}`));
      res({ ...spec.parse(stdout), exitCode: code, stderr });
    });
  });
}

function resolvePaste(caseDef, cwd) {
  if (caseDef.paste && caseDef.paste !== "default") return caseDef.paste;
  const lang = caseDef.lang ?? "en";
  if (caseDef.paste_mode === "inline") {
    // The inline block carries the first reply, so ORIENT costs no tool call.
    // Whether that trades away compliance is the point of running it.
    return renderInlinePrompt(join(cwd, caseDef.manifest ?? "AGENT_GUIDE.md"), { lang }).text;
  }
  return renderPrompt({ root: cwd, lang }).text;
}

export async function runCase(caseFile, { agent = "claude", outDir, tag = null } = {}) {
  const def = parseYaml(readFileSync(caseFile, "utf8"));
  const cwd = resolve(dirname(caseFile), def.repo ?? ".");
  if (!existsSync(cwd)) throw new Error(`repo not found: ${cwd}`);

  let sessionId = randomUUID();
  const paste = resolvePaste(def, cwd);
  const turns = [];
  let consecutiveErrors = 0;

  for (const [i, turn] of def.turns.entries()) {
    const send = turn.send === "@paste" ? paste : turn.send;
    process.stderr.write(`  ${String(i + 1).padStart(2)}. ${turn.id} … `);
    let result;
    try {
      result = await runTurn(agent, send, { sessionId, first: i === 0, cwd });
    } catch (err) {
      process.stderr.write(`failed (${err.message.split("\n")[0]})\n`);
      turns.push({ ...turn, send, error: err.message, tools: [], text: "" });
      consecutiveErrors += 1;
      if (consecutiveErrors >= 2) {
        process.stderr.write(`  aborting: ${consecutiveErrors} turns in a row failed to run — this is an adapter problem, not a result\n`);
        break;
      }
      continue;
    }
    consecutiveErrors = 0;
    if (result.sessionId) sessionId = result.sessionId;   // codex assigns its own thread id
    const reads = result.tools.filter((t) => t.name === "Read");
    process.stderr.write(`${reads.length} read${reads.length === 1 ? "" : "s"}, ${result.text.length} chars\n`);
    turns.push({ ...turn, send, text: result.text, tools: result.tools });
  }

  const run = {
    case: basename(caseFile),
    agent,
    repo: relative(ROOT, cwd) || ".",
    sessionId,
    manifest: def.manifest ?? "AGENT_GUIDE.md",
    capabilities: AGENTS[agent]?.capabilities ?? {},
    preloaded: def.preloaded ?? [],
    turns,
  };
  const scored = score(run);

  if (outDir) {
    mkdirSync(outDir, { recursive: true });
    const stem = basename(caseFile).replace(/\.ya?ml$/, "");
    const name = tag ? `${stem}.${agent}.${tag}.json` : `${stem}.${agent}.json`;
    writeFileSync(join(outDir, name), JSON.stringify(scored, null, 2));
  }
  return scored;
}

function summarise(results) {
  const rows = [];
  for (const r of results) {
    for (const t of r.turns) {
      for (const c of t.checks) {
        if (c.unavailable) continue;   // reported elsewhere; never a failure
        rows.push({ case: r.case, agent: r.agent, turn: t.id, ...c });
      }
    }
  }
  const byDim = new Map();
  for (const row of rows) {
    const d = byDim.get(row.dimension) ?? { pass: 0, fail: 0 };
    d[row.pass ? "pass" : "fail"] += 1;
    byDim.set(row.dimension, d);
  }
  return { rows, byDim };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.includes("-h") || args.includes("--help")) {
    console.log(`eval/run.js — drive a real agent through the scenarios and score it

  node eval/run.js [case...] [--agent claude|codex] [--repeat N] [--out eval/results]

Scenarios live in eval/cases/*.yaml. With no case arguments, every case runs.
Write, Edit and Bash are disabled for the agent, so "install it" turns test
whether it ASKS, never whether the command works.`);
    return 0;
  }
  const agent = args.includes("--agent") ? args[args.indexOf("--agent") + 1] : "claude";
  const repeat = args.includes("--repeat") ? Math.max(1, Number(args[args.indexOf("--repeat") + 1])) : 1;
  const outDir = args.includes("--out") ? resolve(args[args.indexOf("--out") + 1]) : join(HERE, "results");
  let cases = args.filter((a) => !a.startsWith("-") && /\.ya?ml$/.test(a)).map((a) => resolve(a));
  if (cases.length === 0) {
    const dir = join(HERE, "cases");
    cases = (await import("node:fs")).readdirSync(dir).filter((f) => /\.ya?ml$/.test(f)).map((f) => join(dir, f));
  }

  const results = [];
  for (const c of cases) {
    for (let run = 1; run <= repeat; run++) {
      process.stderr.write(`\n${basename(c)} (${agent})${repeat > 1 ? ` run ${run}/${repeat}` : ""}\n`);
      results.push(await runCase(c, { agent, outDir, tag: repeat > 1 ? `run${run}` : null }));
    }
  }

  const { byDim } = summarise(results);
  console.log("\n| dimension | pass | fail |");
  console.log("| :--- | ---: | ---: |");
  for (const [dim, d] of [...byDim].sort()) {
    console.log(`| ${dim} | ${d.pass} | ${d.fail} |`);
  }

  // With repeats, the interesting number is not the total but the spread. A
  // check that passes four times out of five is a different fact from one that
  // passes every time, and averaging them together hides it.
  if (repeat > 1) {
    const byCheck = new Map();
    for (const r of results) {
      for (const t of r.turns) {
        for (const c of t.checks) {
          if (c.unavailable) continue;
          const key = `${r.case} · ${t.id} · ${c.dimension}`;
          const e = byCheck.get(key) ?? { pass: 0, n: 0, samples: [] };
          e.n += 1;
          if (c.pass) e.pass += 1; else e.samples.push(c.detail);
          byCheck.set(key, e);
        }
      }
    }
    const flaky = [...byCheck].filter(([, e]) => e.pass > 0 && e.pass < e.n);
    const always = [...byCheck].filter(([, e]) => e.pass === 0);
    console.log(`\nstability over ${repeat} runs`);
    console.log(`  always pass: ${[...byCheck].filter(([, e]) => e.pass === e.n).length}`);
    console.log(`  flaky:       ${flaky.length}`);
    console.log(`  always fail: ${always.length}`);
    for (const [k, e] of flaky) console.log(`  FLAKY ${k} — ${e.pass}/${e.n} · e.g. ${e.samples[0]}`);
    for (const [k, e] of always) console.log(`  FAIL  ${k} — 0/${e.n} · ${e.samples[0]}`);
  }

  const failed = results.flatMap((r) => r.turns.flatMap((t) => t.checks.filter((c) => !c.pass && !c.unavailable).map((c) => ({ t, c }))));
  if (failed.length && repeat === 1) {
    console.log("\nfailures");
    for (const { t, c } of failed) console.log(`  ${t.id} · ${c.dimension}: ${c.detail}`);
  }
  console.log(`\nresults written to ${relative(process.cwd(), outDir)}`);
  return failed.length ? 1 : 0;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then((c) => process.exit(c)).catch((e) => { console.error(e); process.exit(2); });
}
