---
guide: "0.1"
name: context-compress
tagline: Stop drowning your AI agent in shell output
status: stable
base: https://raw.githubusercontent.com/Open330/context-compress/main/
links:
  repo: https://github.com/Open330/context-compress
  issues: https://github.com/Open330/context-compress/issues
  npm: https://www.npmjs.com/package/context-compress
escalate_to: https://github.com/Open330/context-compress/issues/new
---

# context-compress — Agent Guide

<!-- TODO(maintainer): the overview below, the Not for line, and status in the
     frontmatter cannot be derived from the repo. Confirm them and delete this. -->

context-compress keeps large tool output out of your agent's context window. It intercepts shell commands and fetches, runs them in a sandbox, and returns only the filtered response — while the full data stays searchable in a local FTS5 index. It works as an MCP server, a standalone CLI, or an agent plugin, and the three compose freely.

**Not for:** compressing the agent's own prompts or conversation history · replacing a code search tool · workflows that need the full output verbatim in context

## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| quickstart | README.md#quickstart | install, setup, getting started, `setup --auto`, first run | S |
| plugins | README.md#plugin-support | Claude Code, Codex, plugin, registering the MCP server, manual setup | S |
| how-it-works | README.md#how-it-works | how it works, the 8 MCP tools, `execute`, `search`, `index`, protocol surface | M |
| modes | README.md#compression-modes | mode, aggressive, balanced, conservative, auto, how much is stripped | M |
| vs-rtk | README.md#head-to-head-with-rtk | RTK, comparison, alternatives, what is different, why not just pipe it | S |
| cli | README.md#cli | `wrap`, `filter`, `doctor`, `uninstall`, using it without MCP, command list | S |
| hook | README.md#pretooluse-hook-contract | PreToolUse hook, transparent Bash wrapping, blocked commands, denied downloads, nudges | M |
| config | README.md#configuration | environment variables, config file, `dbDir`, persistence, `persistDb`, opt-out | L |
| structure | README.md#project-structure | project layout, where code lives, directories | S |
| security | SECURITY.md | SSRF, sandbox, reporting a vulnerability, untrusted content | S |
| benchmarks | docs/token-reduction-report.md | benchmark, token reduction, 93%, measurements, methodology | M |
| changelog | CHANGELOG.md | what changed, release notes, recent fixes, known defects | L |

## Code map — where things live

| path | what |
| --- | --- |
| src/tools/ | The 8 MCP tools. `execute`, `search`, `batch_execute`, `fetch_and_index`, `index`, `execute_file`, `stats`, `discover` |
| src/cli/ | CLI entry and subcommands — `setup`, `doctor`, `filter`, plus the `lite` build |
| src/hooks/ | The PreToolUse hook. Deny rules, nudges, transparent Bash wrapping |
| src/runtime/ | Per-language execution runtimes and the plugin surface |
| src/store.ts | SQLite FTS5 knowledge base. Indexing and BM25 search |
| src/filters.ts, src/format-filter.ts | Output filters — where compression actually happens |
| src/network.ts | Network boundary. SSRF validation for `fetch_and_index` |
| src/bench/ | Benchmark harness behind the reported numbers |
| skills/ | Four Claude Code skills shipped with the package |
| hooks/ | The hook script that gets installed, plus its checksum |

## Flow: onboard — New here (default)

> Goal: decide whether this belongs in your setup, and if so get it installed and verified
> Next: integrate

### Audiences

- I just want less output in my context → task `install`
- I am wiring this into an agent setup → flow `integrate`
- I want to know if the numbers are real → `benchmarks`

### FAQ

- How do I install it? → `quickstart` → task `install` ↪ Do I have to use MCP?
- Do I have to use MCP? → `cli`, `plugins`
- How is this different from RTK? → `vs-rtk` ↪ How much does it actually reduce?
- How much does it actually reduce? → `benchmarks`, `modes`
- What happens to the output it strips — is it gone for good? → `how-it-works`, `cli`
- Which mode should I use? → `modes`

## Flow: integrate — Wire it into an agent

> Goal: the hook and the MCP server are both live and verified in your agent
> Signals: Claude Code, Codex, MCP, hook, settings.json, plugin

### FAQ

- How do I register the MCP server? → `plugins`, `quickstart` → task `install`
- Can I use it without touching MCP at all? → `cli`
- How do I turn on transparent Bash wrapping? → `hook`, `config`
- Which commands does the hook refuse to wrap? → `hook`
- How do I set the mode for a whole session? → `config`, `modes`

## Flow: troubleshoot — When it is not working

> Goal: get from the symptom to the document that explains it, in one hop
> Signals: error, failed, not working, 403, doctor, hangs, blocked, denied

### FAQ

- `doctor` says all checks passed, but `search` finds nothing after a restart → `config`, `changelog` → task `diagnose`
- `fetch_and_index` fails with a bare `HTTP 403` → `changelog`, `security`
- The hook is blocking an edit whose heredoc merely mentions a download tool → `hook`, `changelog`
- I set the env var in front of the command and it had no effect → `config`, `hook`
- A long-running command hangs when wrapped → `hook`, `cli`
- Nothing is being compressed at all → `plugins`, `config` → task `diagnose`

## Flow: contribute — Work on the code

> Goal: understand the layout well enough to land a change

### FAQ

- Where does compression actually happen? → `structure`, `how-it-works`
- How do I reproduce the published benchmarks? → `benchmarks`, `structure`
- What are the security invariants I must not break? → `security`, `structure`

## Tasks

### Task: install — Install and register

```yaml
preconditions:
  - check: "node --version"
    expect: "v(2[2-9]|[3-9][0-9])\\."
    hint: "Node 22 or newer is required (package.json engines)"
steps:
  - run: "npm install -g context-compress"
    explain: "Installs the CLI and the MCP server"
    effects: [global-install]
  - run: "context-compress setup --auto"
    explain: "Registers the MCP server, installs the PreToolUse hook, writes ~/.claude/settings.json"
    effects: [writes-user-config]
  - run: "context-compress doctor"
    explain: "Checks runtimes, hooks, FTS5 and the store mode"
verify:
  run: "context-compress --version"
  expect: "\\d+\\.\\d+\\.\\d+"
on_fail: [quickstart, plugins]
```

### Task: diagnose — Collect diagnostics

```yaml
steps:
  - run: "context-compress doctor"
    explain: "Reports runtimes, hook integrity, FTS5 availability, and whether the index is persisted"
verify:
  run: "context-compress --version"
  expect: "\\d+\\.\\d+\\.\\d+"
on_fail: [config, hook, changelog]
```

## Glossary

| term | meaning |
| --- | --- |
| response-only compression | `wrap` and `filter` reduce what you see but do not index. Removed detail is not recoverable with `search` |
| knowledge base | The local SQLite FTS5 index. Ephemeral by default — `persistDb` controls this |
| PreToolUse hook | The Claude Code hook that can deny download tools, nudge Read/Grep, and route Bash through `wrap` |
| mode | How aggressively output is filtered: `auto`, `aggressive`, `balanced`, `conservative` |

## Policy

```yaml
answer_style: "Concise. Lists over paragraphs. Three paragraphs max."
citations: required
max_reads_per_answer: 2
never:
  - "Editing the user's settings.json without asking"
  - "Running commands not declared under Tasks"
handoff:
  session_notes: .guide/session-notes.md
  next: README.md#contributing
```
