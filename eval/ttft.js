#!/usr/bin/env node
import { spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Time to first token for the ORIENT turn.
 *
 * The whole product is a block someone pastes and then waits at. What they wait
 * for is not the full reply — it is the first character. `--include-partial-messages`
 * gives a timestamp for each text delta, so this measures the real thing rather
 * than total turn duration.
 *
 *   node eval/ttft.js <repo> <prompt-file> [label]
 */

const [repo, promptFile, label = "block"] = process.argv.slice(2);
if (!repo || !promptFile) {
  console.error("usage: node eval/ttft.js <repo> <prompt-file> [label]");
  process.exit(2);
}

const text = readFileSync(resolve(promptFile), "utf8");
const t0 = Date.now();
let firstToken = null;
let firstTool = null;
let toolCount = 0;

const child = spawn("claude", [
  "-p", text,
  "--output-format", "stream-json",
  "--include-partial-messages",
  "--verbose",
  "--disallowedTools", "Write", "Edit", "NotebookEdit", "Bash",
  "--setting-sources", "project",
  "--strict-mcp-config",
  "--max-turns", "8",
], { cwd: resolve(repo), stdio: ["ignore", "pipe", "pipe"] });

let buf = "";
child.stdout.on("data", (d) => {
  buf += d;
  const lines = buf.split("\n");
  buf = lines.pop() ?? "";
  for (const line of lines) {
    if (!line.trim()) continue;
    let ev;
    try { ev = JSON.parse(line); } catch { continue; }

    const delta = ev?.event?.delta ?? ev?.delta;
    if (firstToken === null && delta?.type === "text_delta" && delta.text?.trim()) {
      firstToken = Date.now() - t0;
    }
    for (const c of ev?.message?.content ?? []) {
      if (c.type === "tool_use") {
        toolCount += 1;
        if (firstTool === null) firstTool = Date.now() - t0;
      }
    }
  }
});

child.on("close", () => {
  const total = Date.now() - t0;
  console.log(JSON.stringify({
    label,
    ttft_ms: firstToken,
    first_tool_ms: firstTool,
    tools: toolCount,
    total_ms: total,
  }));
});
