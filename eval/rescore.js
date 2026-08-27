#!/usr/bin/env node
// Re-score a recorded run without spending another session on it.
import { readFileSync, writeFileSync } from "node:fs";
import { score } from "./score.js";

for (const file of process.argv.slice(2)) {
  const run = JSON.parse(readFileSync(file, "utf8"));
  const rescored = score({ ...run, turns: run.turns.map(({ checks, opened, tools, ...t }) => t) });
  writeFileSync(file, JSON.stringify(rescored, null, 2));
  const fails = rescored.turns.flatMap((t) => t.checks.filter((c) => !c.pass).map((c) => `${t.id} · ${c.dimension}: ${c.detail}`));
  console.log(`${file}\n  hard ${rescored.summary.hard.pass}/${rescored.summary.hard.total} · soft ${rescored.summary.soft.pass}/${rescored.summary.soft.total}`);
  for (const f of fails) console.log(`  FAIL ${f}`);
}
