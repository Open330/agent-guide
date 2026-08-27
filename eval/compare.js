#!/usr/bin/env node
import { readFileSync, readdirSync, existsSync } from "node:fs";
import { join, basename } from "node:path";

/**
 * Before/after over two result directories.
 *
 * The point is not the totals — it is which specific checks moved. A spec
 * change that lifts the aggregate while quietly breaking a check that used to
 * pass is a regression wearing a win's clothing, and only a per-check diff
 * shows it.
 *
 *   node eval/compare.js eval/results/before eval/results/after
 */

const load = (dir) => {
  if (!existsSync(dir)) throw new Error(`no such directory: ${dir}`);
  const runs = readdirSync(dir).filter((f) => f.endsWith(".json")).map((f) => JSON.parse(readFileSync(join(dir, f), "utf8")));
  const byAgent = new Map();
  for (const r of runs) {
    const list = byAgent.get(r.agent) ?? [];
    list.push(r);
    byAgent.set(r.agent, list);
  }
  return byAgent;
};

/** check key → { pass, n } across every run for one agent */
const tally = (runs) => {
  const m = new Map();
  for (const r of runs) {
    for (const t of r.turns) {
      for (const c of t.checks) {
        if (c.unavailable) continue;   // not measurable here; not a failure either
        const key = `${t.id} · ${c.dimension}`;
        const e = m.get(key) ?? { pass: 0, n: 0, kind: c.kind, detail: null };
        e.n += 1;
        if (c.pass) e.pass += 1;
        else if (!e.detail) e.detail = c.detail;
        m.set(key, e);
      }
    }
  }
  return m;
};

const rate = (e) => (e ? `${e.pass}/${e.n}` : "—");
const verdict = (b, a) => {
  if (!b && a) return a.pass === a.n ? "new ✓" : "new ✗";
  if (b && !a) return "dropped";
  const bp = b.pass / b.n;
  const ap = a.pass / a.n;
  if (ap > bp) return "**fixed**";
  if (ap < bp) return "**REGRESSED**";
  return ap === 1 ? "held" : "still failing";
};

const [beforeDir, afterDir] = process.argv.slice(2);
if (!beforeDir || !afterDir) {
  console.error("usage: node eval/compare.js <before-dir> <after-dir>");
  process.exit(2);
}

const before = load(beforeDir);
const after = load(afterDir);
const agents = [...new Set([...before.keys(), ...after.keys()])].sort();

console.log(`# ${basename(beforeDir)} → ${basename(afterDir)}\n`);

let regressions = 0;
for (const agent of agents) {
  const b = tally(before.get(agent) ?? []);
  const a = tally(after.get(agent) ?? []);
  const keys = [...new Set([...b.keys(), ...a.keys()])].sort();
  const moved = keys.filter((k) => verdict(b.get(k), a.get(k)) !== "held");
  const noBaseline = b.size === 0;

  const sum = (m) => [...m.values()].reduce((acc, e) => ({ pass: acc.pass + e.pass, n: acc.n + e.n }), { pass: 0, n: 0 });
  const sb = sum(b);
  const sa = sum(a);
  console.log(`## ${agent}\n`);
  const pct = (x) => (x.n ? `${Math.round((x.pass / x.n) * 100)}%` : "—");
  const runsB = (before.get(agent) ?? []).length;
  const runsA = (after.get(agent) ?? []).length;
  // Directories can hold different numbers of runs, so the raw totals are not
  // comparable. The rate is.
  console.log(`overall  ${sb.pass}/${sb.n} (${pct(sb)}, ${runsB} run${runsB === 1 ? "" : "s"}) → **${sa.pass}/${sa.n} (${pct(sa)}, ${runsA} run${runsA === 1 ? "" : "s"})**\n`);

  if (noBaseline) {
    // Listing every check as "new" is noise, not a comparison.
    console.log(`No baseline in ${basename(beforeDir)} for this agent — nothing to compare against.\n`);
    continue;
  }
  if (moved.length === 0) {
    console.log("Nothing moved. Every check held its previous result.\n");
    continue;
  }
  console.log("| check | kind | before | after | |");
  console.log("| :--- | :--- | :---: | :---: | :--- |");
  for (const k of moved) {
    const v = verdict(b.get(k), a.get(k));
    if (v === "**REGRESSED**") regressions += 1;
    const kind = (a.get(k) ?? b.get(k)).kind;
    console.log(`| ${k} | ${kind} | ${rate(b.get(k))} | ${rate(a.get(k))} | ${v} |`);
  }
  const stillBad = keys.filter((k) => a.get(k) && a.get(k).pass < a.get(k).n);
  if (stillBad.length) {
    console.log("\nstill failing after the change");
    for (const k of stillBad) console.log(`  ${k} — ${a.get(k).detail}`);
  }
  console.log("");
}

if (regressions) {
  console.log(`\n${regressions} regression(s). A spec change that fixes one check and breaks another has not been validated.`);
  process.exit(1);
}
