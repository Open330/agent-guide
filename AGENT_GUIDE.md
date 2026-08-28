---
guide: "0.1"
name: Agent Guide
tagline: Let any agent walk users through your project, interactively
status: alpha
base: https://raw.githubusercontent.com/Open330/agent-guide/main/
links:
  repo: https://github.com/Open330/agent-guide
  issues: https://github.com/Open330/agent-guide/issues
escalate_to: https://github.com/Open330/agent-guide/issues/new
---

# Agent Guide — Agent Guide

Agent Guide is a manifest format and a session protocol that lets any AI agent run an interactive walkthrough of your project. You add one file — `AGENT_GUIDE.md` — and a paste block to your README; a reader's agent then answers their questions from your docs, cites where each answer came from, and runs your setup steps with their consent. Onboarding is the default session, but the same manifest also drives upgrades, troubleshooting, integration and contribution.

**Not for:** defining contributor rules — that is `AGENTS.md`, and we hand off to it · generating or replacing your documentation · packaging or distributing agents · hosting anything

## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| spec | SPEC.md | the format, session protocol, MUST rules, discovery, path resolution, 규격, 프로토콜 | L |
| authoring | .context/architecture/authoring-protocol.md | how to write a manifest, the authoring prompt, what an agent should mine, 저작, 작성법 | M |
| format | .context/reference/manifest-format.md | field reference, section keys, table columns, cheat sheet, 필드, 형식 | M |
| readme-block | .context/reference/readme-block.md | the paste prompt, why it is worded that way, what not to remove, 프롬프트, 초기 프롬프트 | M |
| templates | templates/README.md | copy-paste README blocks, placeholders to replace, 템플릿 | S |
| plan | .context/planning/product-plan.md | why this exists, positioning, AGENTS.md, llms.txt, comparison, 기획, 왜, 비교 | L |
| roadmap | .context/planning/roadmap.md | status, milestones, what is decided, what is not, CLI, 로드맵, 계획 | M |
| experiments | experiments/README.md | real repos we tried this on, what broke, evidence, findings, 실험, 검증 | M |
| eval | eval/README.md | how this is measured, hard vs soft checks, writing a scenario, 평가, 측정, 하니스 | M |
| cli | README.md#the-cli | validate, init, prompt, badge, author, command list, npm install, CLI, 명령어, 설치 | S |
| example-min | examples/AGENT_GUIDE.minimal.md | the smallest valid manifest, minimum required fields, starting point, 최소 예제 | S |
| example-full | examples/README.md | which example to copy, CLI vs library shape, 전체 예제, 예제 | M |

## Code map — where things live

| path | what |
| --- | --- |
| src/parse.js | Markdown → manifest model. Section keys, table columns, FAQ line grammar |
| src/validate.js | Every rule in SPEC §4, plus the compliance-level computation |
| src/prompt.js | The paste block, the `--inline` variant, and git-remote substitution |
| src/init.js | Repo scan → draft manifest. Deliberately leaves covers and FAQ empty |
| src/badge.js | Compliance-level badge |
| src/cli.js | Command dispatch and the report formatting |
| eval/ | The behavioural harness — runs real agents against scenarios and scores them |
| eval/cases/ | Scenario definitions. One YAML file per repo under test |
| tests/ | Validator tests. `node --test` |

## Flow: onboard — New here (default)

> Goal: work out whether this belongs in your project, and understand what it actually does
> Next: author

### Audiences

- I maintain a project and want this in it → flow `author`
- I want to understand the design first → `plan`
- I want to help build the spec → flow `contribute`

### FAQ

- How is this different from AGENTS.md? → `plan` ↪ Do I still need AGENTS.md?
- Do I still need AGENTS.md? → `plan`, `spec`
- If I already have llms.txt, is this redundant? → `plan`
- What is a Flow? → `spec` ↪ How many flows should I write?
- Why Markdown instead of YAML? → `plan`, `spec`
- Show me the smallest example → `example-min`, `example-full`
- Is there an example for a library rather than a CLI? → `example-full`

## Flow: author — Put a manifest in my repo

> Goal: a valid AGENT_GUIDE.md in your repo root and a working paste block in your README
> Signals: write one, add to my repo, generate, authoring, 작성, 내 저장소, 만들기

### FAQ

- How do I write one? → `authoring` ↪ Can my agent write it for me?
- Can my agent write it for me? → `authoring`
- How do I install the CLI? → `cli` → task `install`
- How do I know my manifest is valid? → `cli`, `format` → task `check`
- What fields are required? → `format`, `example-min`
- What goes in the README? → `templates`, `readme-block`
- All my docs live inside README.md — does that work? → `authoring`, `format`
- My project has 40 documents. Which ones go in the table? → `authoring`
- How do I keep it from going stale? → `authoring`, `roadmap`

## Flow: troubleshoot — The agent is not behaving

> Goal: find out whether the problem is your manifest or the paste block
> Signals: not working, ignored, wrong document, hallucinated, made up, stuck, 안 됨, 이상해

### FAQ

- The agent read my whole repo before answering → `readme-block`, `experiments`
- The agent stopped and asked me what to do instead of answering → `readme-block`, `experiments`
- The agent answered something that is not in my docs → `spec`, `readme-block`
- A Korean question routed to the wrong document → `authoring`, `experiments`
- The agent never offers to switch flows → `spec`, `format`

## Flow: contribute — Help build the spec

> Goal: understand what is decided, what is open, and where to push
> Next: roadmap

### FAQ

- What is still undecided? → `roadmap`
- What have you actually tested this on? → `experiments`, `eval`
- How do you measure whether an agent obeys the protocol? → `eval`
- What is the CLI able to check? → `cli`, `spec`
- How do I run the tests? → `roadmap` → task `dev-setup`
- Where do I file a spec change? → `roadmap`, `plan`

## Tasks

### Task: install — Install the CLI

```yaml
steps:
  - run: "npm install -g @open330/agent-guide"
    explain: "Puts an `agent-guide` binary in your global npm prefix. One dependency (yaml); Node 20 or newer"
    effects: [global-install]
verify:
  run: "agent-guide --help"
  expect: "tooling for AGENT_GUIDE.md"
on_fail: [cli, roadmap]
```

### Task: check — Validate a manifest

```yaml
steps:
  - run: "agent-guide validate"
    explain: "Structure, id references, paths, anchors, README block, compliance level"
verify: none
why: "The step is the check. Its exit code is the result — there is nothing further to assert."
on_fail: [format, spec]
```

### Task: dev-setup — Work on the tooling

```yaml
preconditions:
  - check: "node --version"
    expect: "v(2[0-9]|[3-9][0-9])\\."
    hint: "Node 20 or newer is required (package.json engines)"
steps:
  - run: "npm install"
    explain: "Installs the single runtime dependency plus nothing else"
  - run: "npm test"
    explain: "Validator tests"
verify:
  run: "npm test"
  expect: "fail 0"
on_fail: [roadmap]
```

## Glossary

| term | meaning |
| --- | --- |
| manifest | The `AGENT_GUIDE.md` file itself — a routing table, not a summary of your docs |
| flow | One kind of session. Onboarding is the default; upgrade, troubleshoot, integrate and contribute are others |
| covers | The search terms in the Docs table. Routing depends entirely on these |
| Not for | The line naming what the project does not do. Required, and the hardest line to derive from a repo |
| compliance level | Core, Guided, or Interactive — how much of the spec a manifest uses |

## Policy

```yaml
answer_style: "Concise. Lists over paragraphs. Three paragraphs max."
citations: required
max_reads_per_answer: 2
never:
  - "Claiming a milestone is done when the roadmap says otherwise"
handoff:
  session_notes: .guide/session-notes.md
  next: .context/planning/roadmap.md
```
