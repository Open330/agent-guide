import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

import { parseManifest, slugify } from "../src/parse.js";
import { validateText, validateFile } from "../src/validate.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const rulesOf = (r, level) => r.items.filter((i) => !level || i.level === level).map((i) => i.rule);

const MINIMAL = `---
guide: "0.1"
name: demo
base: https://example.test/
---

# demo — Agent Guide

A one sentence overview.

**Not for:** nothing in particular

## Docs — map

| id | path | covers |
| --- | --- | --- |
| quickstart | README.md | install, setup, first run |

## Flow: onboard — Start (default)

> Goal: get going

### FAQ

- How do I install it? → \`quickstart\`
- What is it for? → \`quickstart\`
`;

test("dogfooding: this repo's own manifest has no errors", () => {
  const { report, level } = validateFile(resolve(ROOT, "AGENT_GUIDE.md"));
  assert.deepEqual(report.errors, [], `unexpected errors: ${JSON.stringify(report.errors, null, 2)}`);
  assert.ok(level, "expected a compliance level");
});

for (const name of ["AGENT_GUIDE.minimal.md", "AGENT_GUIDE.md", "AGENT_GUIDE.library.md"]) {
  test(`example ${name} has no errors`, () => {
    // Examples are fictional, so their paths do not resolve on disk.
    const text = readFileSync(resolve(ROOT, "examples", name), "utf8");
    const { report } = validateText(text, { file: name, checkPaths: false });
    assert.deepEqual(report.errors, [], `unexpected errors: ${JSON.stringify(report.errors, null, 2)}`);
  });
}

test("compliance level reflects what the manifest actually uses", () => {
  const min = validateText(MINIMAL, { checkPaths: false });
  assert.equal(min.level, "Core");

  const full = readFileSync(resolve(ROOT, "examples", "AGENT_GUIDE.md"), "utf8");
  assert.equal(validateText(full, { checkPaths: false }).level, "Interactive");
});

test("slugify matches GitHub — runs of whitespace are not collapsed", () => {
  // "&" is stripped and leaves two spaces behind, so the anchor has two dashes.
  assert.equal(slugify("Concurrency & Multi-User Safety"), "concurrency--multi-user-safety");
  assert.equal(slugify("Head-to-head with [RTK](https://x.test)"), "head-to-head-with-rtk");
  assert.equal(slugify("PreToolUse hook contract"), "pretooluse-hook-contract");
});

test("FAQ grammar: sources, task link and follow-up", () => {
  const m = parseManifest(MINIMAL.replace(
    "- What is it for? → `quickstart`",
    "- What is it for? → `quickstart`, `concepts` → task `install` ↪ And then?"
  ));
  const entry = m.flows[0].faq[1];
  assert.deepEqual(entry.docIds, ["quickstart", "concepts"]);
  assert.equal(entry.taskId, "install");
  assert.equal(entry.followup, "And then?");
  assert.equal(entry.question, "What is it for?");
});

test("exactly one flow may be default", () => {
  const two = MINIMAL + `
## Flow: other — Second (default)

> Goal: x

### FAQ

- A? → \`quickstart\`
- B? → \`quickstart\`
`;
  const { report } = validateText(two, { checkPaths: false });
  assert.ok(rulesOf(report, "error").includes("flow"));

  const none = MINIMAL.replace(" (default)", "");
  assert.ok(rulesOf(validateText(none, { checkPaths: false }).report, "error").includes("flow"));
});

test("references to unknown ids are errors", () => {
  const bad = MINIMAL.replace("- What is it for? → `quickstart`", "- What is it for? → `nope`");
  const { report } = validateText(bad, { checkPaths: false });
  const err = report.errors.find((e) => e.rule === "ref");
  assert.ok(err, "expected a ref error");
  assert.match(err.message, /nope/);
});

test("a missing Not for line is an error, not a warning", () => {
  const bad = MINIMAL.replace("**Not for:** nothing in particular\n", "");
  assert.ok(rulesOf(validateText(bad, { checkPaths: false }).report, "error").includes("not-for"));
});

test("covers is required — it is the whole routing mechanism", () => {
  const bad = MINIMAL.replace("| quickstart | README.md | install, setup, first run |", "| quickstart | README.md |  |");
  assert.ok(rulesOf(validateText(bad, { checkPaths: false }).report, "error").includes("covers"));
});

test("verify: none and verify: unverified require a why", () => {
  const withTask = (verify) => MINIMAL.replace(
    "- What is it for? → `quickstart`",
    "- What is it for? → `quickstart` → task `preview`"
  ) + `
## Tasks

### Task: preview — Look, do not touch

\`\`\`yaml
steps:
  - run: "demo preview"
    explain: "Prints what would change"
${verify}
\`\`\`
`;
  const missing = validateText(withTask("verify: none"), { checkPaths: false });
  assert.ok(rulesOf(missing.report, "error").includes("task"), "verify: none without why should error");

  const ok = validateText(withTask('verify: none\nwhy: "nothing is written, so there is no post-state"'), { checkPaths: false });
  assert.deepEqual(ok.report.errors, []);

  const bogus = validateText(withTask("verify: probably"), { checkPaths: false });
  assert.ok(rulesOf(bogus.report, "error").includes("task"), "unknown verify string should error");
});

test("a task with no verify at all is an error", () => {
  const bad = MINIMAL + `
## Tasks

### Task: install — Install

\`\`\`yaml
steps:
  - run: "npm i -g demo"
\`\`\`
`;
  assert.ok(rulesOf(validateText(bad, { checkPaths: false }).report, "error").includes("task"));
});

test("unknown H2 sections warn but do not fail", () => {
  const extra = MINIMAL + "\n## Appendix — extra notes\n\nSomething.\n";
  const { report } = validateText(extra, { checkPaths: false });
  assert.deepEqual(report.errors, []);
  assert.ok(rulesOf(report, "warn").includes("section"));
});

test("a broken local path is an error", () => {
  const { report } = validateText(MINIMAL.replace("README.md", "docs/nope.md"), {
    root: ROOT,
    checkPaths: true,
  });
  const err = report.errors.find((e) => e.rule === "path");
  assert.ok(err, "expected a path error");
  assert.match(err.message, /nope\.md/);
});

test("a broken heading anchor is an error", () => {
  const { report } = validateText(MINIMAL.replace("README.md", "README.md#no-such-heading"), {
    root: ROOT,
    checkPaths: true,
  });
  assert.ok(report.errors.some((e) => e.rule === "path" && /anchor/.test(e.message)));
});

test("a risky step with no `effects` warns, and naming it clears the warning", () => {
  const withStep = (extra) => MINIMAL.replace(
    "- What is it for? → `quickstart`",
    "- What is it for? → `quickstart` → task `install`"
  ) + `
## Tasks

### Task: install — Install

\`\`\`yaml
steps:
  - run: "npm i -g demo"
    explain: "Installs the CLI"${extra}
verify:
  run: "demo --version"
  expect: "\\\\d"
\`\`\`
`;
  const bare = validateText(withStep(""), { checkPaths: false }).report;
  assert.ok(rulesOf(bare, "warn").includes("effects"), "a global install with no effects should warn");
  assert.deepEqual(bare.errors, [], "it is a warning, never an error");

  const named = validateText(withStep("\n    effects: [global-install]"), { checkPaths: false }).report;
  assert.ok(!rulesOf(named, "warn").includes("effects"), "naming the effect clears it");
});

test("an ordinary step does not warn", () => {
  const ok = MINIMAL.replace(
    "- What is it for? → `quickstart`",
    "- What is it for? → `quickstart` → task `check`"
  ) + `
## Tasks

### Task: check — Run the tests

\`\`\`yaml
steps:
  - run: "npm test"
    explain: "Runs the suite"
verify:
  run: "npm test -- --listTests"
  expect: "test"
\`\`\`
`;
  assert.ok(!rulesOf(validateText(ok, { checkPaths: false }).report, "warn").includes("effects"));
});

test("`effects` must be a list of tags, not a sentence", () => {
  const withEffects = (line) => MINIMAL.replace(
    "- What is it for? → `quickstart`",
    "- What is it for? → `quickstart` → task `install`"
  ) + `
## Tasks

### Task: install — Install

\`\`\`yaml
steps:
  - run: "npm i -g demo"
    explain: "Installs the CLI"
${line}
verify:
  run: "demo --version"
  expect: "\\\\d"
\`\`\`
`;
  // Prose in `effects` reads fine and machine-reads as nothing.
  const prose = validateText(withEffects('    effects: "Writes a binary into your global npm prefix"'), { checkPaths: false }).report;
  assert.ok(rulesOf(prose, "error").includes("effects"), "a sentence should be an error");

  const tags = validateText(withEffects("    effects: [global-install]"), { checkPaths: false }).report;
  assert.deepEqual(tags.errors, []);
  assert.ok(!rulesOf(tags, "warn").includes("effects"));

  // A list whose entries are still sentences is legal YAML but misses the point.
  const wordy = validateText(withEffects('    effects: ["writes a binary into the global npm prefix"]'), { checkPaths: false }).report;
  assert.deepEqual(wordy.errors, [], "a wordy tag is a warning, not an error");
  assert.ok(rulesOf(wordy, "warn").includes("effects"));
});
