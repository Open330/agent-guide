---
guide: "0.1"
name: OAC (Open Agent Contribution)
tagline: Turn leftover AI agent tokens into open source pull requests
status: beta
language: en
base: https://raw.githubusercontent.com/Open330/open-agent-contribution/main/
links:
  repo: https://github.com/Open330/open-agent-contribution
  issues: https://github.com/Open330/open-agent-contribution/issues
  npm: https://www.npmjs.com/package/@open330/oac
  chat: https://github.com/Open330/open-agent-contribution/discussions
escalate_to: https://github.com/Open330/open-agent-contribution/issues/new
---

# OAC — Agent Guide

<!-- TODO(maintainer): the three-sentence overview below, the Not for line, and
     `status` in the frontmatter cannot be derived from the repository. The repo
     never states whether it is alpha/beta/stable, and the README never says what
     OAC refuses to do. Confirm all three and delete this comment. -->

OAC points an AI coding agent you already pay for at someone else's repository and turns idle token budget into pull requests. It scans a target repo for TODOs, lint findings, test gaps and open issues, estimates the token cost of each, picks the set that fits your remaining budget, and executes the work in isolated git worktrees before opening PRs and logging every contribution under `.oac/`. It runs as a local CLI (`oac`) or as a scheduled GitHub Action, and drives Claude Code, Codex, or OpenCode as the actual worker.

**Not for:** running an agent against a repo you have no intent to contribute to · replacing human code review on the PRs it opens · a hosted or multi-tenant service — everything runs on your machine with your own agent credentials

## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| quickstart | README.md#quick-start | first run, `npm install -g`, `npx`, setup wizard, nothing is configured yet, prerequisites | S |
| commands | README.md#commands | which subcommand does what, `oac r`, `--dry-run`, `--retry-failed`, `--concurrency`, exit code 2, exit code 4 | M |
| config | docs/config-reference.md | `oac.config.ts`, `defineConfig`, `totalTokens`, `issueLabels`, scanner toggles, env var interpolation, every option and default | L |
| config-layers | README.md#configuration | where the config file is read from, `~/.config/oac`, global vs project vs repo, `preferences.json`, `promptForRunMode`, `new-pr` vs `branch-only` | M |
| troubleshooting | README.md#troubleshooting | not working, failed, `command not found`, nothing happened, permission denied, stale worktree, invalid provider | M |
| action | action/README.md | running in CI, workflow inputs, outputs, `ANTHROPIC_API_KEY`, required permissions, scheduled runs | M |
| action-example | examples/oac-cron.yml | a workflow file to copy, cron schedule, `workflow_dispatch`, secrets, `permissions:` block | S |
| concurrency | README.md#concurrency--multi-user-safety | two people ran it at once, duplicate PRs, how it knows a PR is already open, team usage | M |
| maintainers | README.md#for-maintainers-target-repos | I own the repo being contributed to, how do I set the rules, `.oac/README.md`, off-limits paths, per-issue plans, badge | M |
| policy | README.md#ai-contribution-policy-oac | should we accept agent-written PRs, disclosure, intake process, reviewing this kind of contribution | M |
| architecture | README.md#architecture | where does the code live, module boundaries, event bus, tech stack, what depends on what | M |
| agents | README.md#supported-ai-agents | which model backends work, `claude-code`, `codex`, `opencode`, writing my own adapter, `AgentProvider` | S |
| how-it-works | README.md#how-it-works | epic vs single task, why one PR touched many files, backlog persistence, incremental re-analysis | M |
| contributing | CONTRIBUTING.md | working on OAC itself, changesets, biome, branch naming, PR checklist, local dev setup | M |
| changelog | CHANGELOG.md | what changed, why my version number went backwards, recent fixes, when a flag was added | L |
| multi-agent-spec | docs/multi-agent-support-technical-spec.md | the design behind adapter routing, external CLI contracts, what is deliberately out of scope | L |

## Code map — where things live

| path | what |
| --- | --- |
| src/core/ | Event bus, Zod config schema, shared types and errors, memory-pressure monitoring |
| src/repo/ | Resolving `owner/repo`, shallow clone into the local cache, metadata caching |
| src/discovery/ | Codebase analyzer, epic grouper, backlog persistence, ranking, dedup |
| src/discovery/scanners/ | The individual finders: lint, test-gap, security, GitHub issues |
| src/budget/ | Token estimation and per-provider counters, complexity scoring, the selection planner |
| src/execution/ | Worktree sandbox, worker, engine, error normalization |
| src/execution/agents/ | One adapter per backend — claude-code, codex, opencode, gemini — plus the registry |
| src/completion/ | What happens after the agent finishes: diff validation, PR creation, issue linking |
| src/tracking/ | Contribution log writing, log schema, leaderboard |
| src/cli/ | CLI entry, config loading, GitHub auth, preferences |
| src/cli/commands/ | One file per subcommand; `run/` is decomposed into pipeline, epic, task, retry, pr, tracking |
| src/daemon/, src/dashboard/ | Scheduled background runs and the Fastify + SSE local dashboard |
| action/ | The bundled GitHub Action entry point |
| tests/ | Vitest suites, mirroring the `src/` layout one directory per module |

## Flow: onboard — New here (default)

> Goal: decide whether OAC belongs on your machine, get it installed, and see what it would do before it does it
> Signals: install, getting started, what is this, first time
> Next: integrate

### Audiences

- I have leftover tokens and want PRs out of them → task `install`
- I maintain a repo and someone pointed OAC at it → `maintainers`, `policy`
- I want it running on a schedule, not by hand → flow `integrate`
- I want to change what it looks for → `config`

### FAQ

- How do I get from zero to a first pull request? → `quickstart` → task `install` ↪ Can I see what it would do before it does it?
- Can I see what it would do before it does it? → `commands` → task `preview`
- Which agent does it actually use to write the code — do I need an API key? → `agents`, `quickstart`
- Does it need Node 24, or will 20 work? → `changelog`, `quickstart`
- It opened one PR that touched six files — I expected one PR per fix → `how-it-works`, `config-layers`
- Can I make it push a branch and let me open the PR myself? → `config-layers`, `commands`
- Where does it record what it did? → `architecture`, `maintainers`

## Flow: integrate — Run it in CI or on a schedule

> Goal: OAC runs unattended against your targets, with sane permissions and a budget it cannot blow through
> Signals: GitHub Action, workflow, cron, CI, secrets, exit code, daemon, scheduled
> Next: troubleshoot

### FAQ

- What do I put in the workflow file? → `action-example`, `action`
- Which secret does it need, and does the token need repo scope? → `action`, `troubleshooting`
- My CI job goes green even though every task failed → `commands`, `action`
- The log is full of spinner escape codes in CI → `commands`
- Can I cap how many agents run at once? → `config`, `commands`
- How do I stop two team members from opening the same PR twice? → `concurrency`
- Can I restrict it to only touch certain directories of my repo? → `maintainers`, `config`

## Flow: troubleshoot — It ran but something is wrong

> Goal: get from the symptom to the section that explains it in one hop
> Signals: error, failed, not working, command not found, permission denied, nothing happened, hangs, stale
> Next: contribute

### FAQ

- `command not found` when it tries to hand work to the agent → `troubleshooting` → task `diagnose`
- It said tasks were discovered, then executed nothing → `troubleshooting`, `config` → task `preview`
- It refuses to start and complains about my config file → `troubleshooting`, `config` ↪ Which provider strings are actually valid?
- Which provider strings are actually valid? → `agents`, `config`
- I wrote `oac.config.ts` but my settings are being ignored → `config-layers`, `changelog`
- Permission denied when it tries to open the PR → `troubleshooting`, `action`
- A run crashed and now every run fails on a leftover worktree → `troubleshooting`, `architecture`
- Two runs opened duplicate PRs for the same issue → `concurrency`

## Flow: upgrade — Moving between versions

> Goal: land on the right version and understand why the numbering looks wrong
> Signals: version, upgrade, npm shows a newer version, deprecated, breaking

### FAQ

- npm lists `2026.4.3` and `2026.2.5` — is 4.3 the newer one? → `changelog`
- My config stopped being picked up after I renamed the import → `changelog`, `config-layers`
- I was on Node 20 and the old release refused to install → `changelog`, `quickstart`
- Which flags exist in my version — retry-failed, the r alias, explain? → `changelog`, `commands`

## Flow: contribute — Work on OAC itself

> Goal: get a local checkout building and land a change the maintainers will merge
> Signals: contributing, changeset, biome, pnpm, adapter, local dev
> Next: CONTRIBUTING.md

### FAQ

- How do I build and test it from a clone? → `contributing`, `quickstart`
- Does my PR need a changeset? → `contributing`
- Formatting keeps getting rewritten — which linter is authoritative? → `contributing`
- I want to add support for a different agent CLI → `agents`, `multi-agent-spec`, `architecture`
- Where would a new scanner go? → `architecture`, `multi-agent-spec`

## Tasks

### Task: install — Install and configure

```yaml
preconditions:
  - check: "node --version"
    expect: "v(2[0-9]|[3-9][0-9])\\."
    hint: "Node 20 or newer is required (engines.node in package.json)"
  - check: "git --version"
    expect: "git version"
    hint: "git must be installed — OAC clones targets and uses worktrees"
steps:
  - run: "npm install -g @open330/oac"
    explain: "Installs the oac CLI globally"
  - run: "oac init"
    explain: "Interactive wizard — writes oac.config.ts and creates the .oac/ tracking directory"
  - run: "oac doctor"
    explain: "Checks Node, git, GitHub auth, and which agent CLIs are reachable"
verify:
  run: "oac --version"
  expect: "\\d+\\.\\d+\\.\\d+"
on_fail: [quickstart, troubleshooting]
```

### Task: preview — See what it would do without doing it

```yaml
steps:
  - run: "oac scan --repo owner/repo --format table"
    explain: "Lists discoverable tasks with source, priority and complexity — no context build, no execution"
  - run: "oac run --dry-run --repo owner/repo"
    explain: "Runs the full selection pipeline and prints the plan and colored diff without executing or opening PRs"
verify:
  run: "oac doctor"
  expect: "checks passed"
on_fail: [commands, config, troubleshooting]
```

### Task: diagnose — Check the environment

```yaml
steps:
  - run: "oac doctor"
    explain: "Reports Node, git, GitHub auth status, and each agent CLI it can find"
  - run: "gh auth status"
    explain: "OAC shells out to gh for PR creation and issue access; this confirms you are authenticated"
verify:
  run: "oac doctor"
  expect: "checks passed"
on_fail: [troubleshooting, agents]
```

## Glossary

| term | meaning |
| --- | --- |
| epic | A group of related findings executed together as one unit and shipped as one multi-file PR. The default unit of work, not a single task |
| backlog | Discovered-but-not-yet-executed work persisted under `.oac/context/`, so a later run does not rediscover it from scratch |
| effective budget | Your token budget minus the planner's 10% safety reserve. Tasks are selected against this, not the raw number |
| run mode | What happens at the end: `new-pr`, `update-pr`, `direct-commit`, or `branch-only` |
| provider id | The string naming the agent backend — `claude-code`, `codex`, `opencode` — used in config and `--provider` |
| sandbox | A git worktree in a temp directory. One per unit of work, so parallel agents cannot collide |
| `.oac/` | Git-native audit trail in the target repo: contribution logs, leaderboard, cached context, and the maintainer's contribution rules |

## Policy

```yaml
answer_style: "Concise. Lists over paragraphs. Three paragraphs max."
citations: required
max_reads_per_answer: 2
never:
  - "Running `oac run` without `--dry-run` against a repository the user has not named"
  - "Editing the user's oac.config.ts or preferences.json without asking"
  - "Running commands not declared under Tasks"
handoff:
  session_notes: .guide/session-notes.md
  next: CONTRIBUTING.md
```
