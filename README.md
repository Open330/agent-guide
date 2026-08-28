<div align="center">

# Agent Guide

**Your README is written for people who don't read it.**<br/>
Ship a manifest instead, and let their agent walk them through the project.

[![npm](https://img.shields.io/npm/v/@open330/agent-guide?color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@open330/agent-guide)
[![spec](https://img.shields.io/badge/spec-v0.1-5b21b6)](SPEC.md)
[![code](https://img.shields.io/badge/code-MIT-blue)](LICENSE)
[![spec licence](https://img.shields.io/badge/spec-CC%20BY%204.0-blue)](LICENSE-SPEC)
[![status](https://img.shields.io/badge/status-alpha-orange)](#status)

[Start here](#start-here) · [What you get](#what-you-get) · [Where this sits](#where-this-sits) · [CLI](#the-cli) · [Evidence](#does-it-actually-work) · [Spec](SPEC.md)

</div>

---

## Start here

Open an agent **inside the repository you want a guide for**, and paste this:

<div><img src="https://quickstart-for-agents.vercel.app/api/header.svg?theme=github-dark&title=Write+this+repository%27s+AGENT_GUIDE.md&lang=Agents" width="100%" /></div>

```
Read https://raw.githubusercontent.com/Open330/agent-guide/main/templates/authoring-prompt.en.md
and follow it exactly to write this repository's AGENT_GUIDE.md.
```

<div><img src="https://quickstart-for-agents.vercel.app/api/footer.svg?theme=github-dark&text=copy+%C2%B7+paste+into+your+agent+%C2%B7+get+AGENT_GUIDE.md" width="100%" /></div>

<sub>Korean: swap in <code>authoring-prompt.ko.md</code>. No network in that session? Run <code>npx @open330/agent-guide author</code> and paste what it prints — the whole prompt is self-contained.</sub>

A few minutes later you have an `AGENT_GUIDE.md`, and the agent stops to ask you three things it could not answer from your repository. **The important one is what your project does _not_ do.** A README never says that, and it is the line that stops an agent inventing features you never built.

Then check it, and get the block your readers will paste:

```bash
npx @open330/agent-guide validate         # every path, anchor and id — resolved, or it fails
npx @open330/agent-guide prompt --inline  # the paste block for YOUR readme
```

---

## What you get

Your reader pastes one block into their agent. Instead of skimming your README, they have a conversation:

> **🤖** context-compress keeps large tool output out of your agent's context window. It intercepts shell commands, runs them in a sandbox, and returns only the filtered response — the full data stays searchable in a local FTS5 index.
>
> **Not for:** compressing the agent's own conversation history · replacing a code search tool
>
> What would you like to do? — **onboard** (default) · integrate · troubleshoot · contribute
>
> Common questions: How do I install it? · Do I have to use MCP? · How is this different from RTK? …

> **🧑** doctor says everything passed, but after a restart search comes up empty
>
> **🤖** That is the persistence default, not a bug — `persistDb` is false, so the index opens in memory and is dropped when the server exits. Set `CONTEXT_COMPRESS_PERSIST_DB=1`. `[src: README.md#configuration, CHANGELOG.md]`
>
> This matches the **troubleshoot** flow — want me to switch? We can come back to where you were after.

Three things there that a plain README cannot do:

| | |
| :--- | :--- |
| **It routed** | The question said "search comes up empty", never "persistence". The manifest maps symptoms to documents, so it opened one file instead of grepping the repo |
| **It cited** | Every answer names where it came from. Where the manifest does not cover something, it says so rather than guessing |
| **It knows its limits** | `Not for` is required — the cheapest way to stop an agent confidently describing a feature that does not exist |

<details>
<summary><b>Try it on this repository</b> — paste this into an agent here</summary>

```
You are running an Agent Guide session for this project. Use the overview below as written.

Agent Guide is a manifest format and a session protocol that lets any AI agent run an interactive walkthrough of your project. You add one file — `AGENT_GUIDE.md` — and a paste block to your README; a reader's agent then answers their questions from your docs, cites where each answer came from, and runs your setup steps with their consent. Onboarding is the default session, but the same manifest also drives upgrades, troubleshooting, integration and contribution.

Not for: defining contributor rules — that is `AGENTS.md`, and we hand off to it · generating or replacing your documentation · packaging or distributing agents · hosting anything

What would you like to do?
  - onboard (default) — New here
  - author — Put a manifest in my repo
  - troubleshoot — The agent is not behaving
  - contribute — Help build the spec

Common questions:
  - How is this different from AGENTS.md?
  - Do I still need AGENTS.md?
  - If I already have llms.txt, is this redundant?
  - What is a Flow?
  - Why Markdown instead of YAML?

RULES (do not open any file yet — show the above and wait for my answer)
- When I ask something, read ./AGENT_GUIDE.md then pick documents by the `covers`
  column in its Docs table. One or two is usually enough.
- Cite the path for anything from a document. Label anything outside the manifest
  as such — reasoning is welcome, unlabelled certainty is not.
- If a path will not resolve, work it out yourself: repo root, then the frontmatter
  `base`, then a filename search. Do not hand the choice back to me.
- Tasks commands need my go-ahead. A step tagged `effects` needs an explicit yes and
  a plain sentence saying what the effect is.
- If what I say matches another Flow's Signals, answer first, then offer to switch.

Keep it short, and answer in my language.
```

<sub>Generated by <code>agent-guide prompt --inline</code>: it carries the first reply, so the agent answers
without opening anything. Time to first token roughly halves. <code>validate</code> warns when it drifts from
the manifest.</sub>

<!-- agent-guide:inline 38bab678 -->

</details>

---

## What a manifest looks like

The smallest valid one is about 25 lines.

```markdown
---
guide: "0.1"
name: foo
base: https://raw.githubusercontent.com/acme/foo/main/
---

# foo — Agent Guide

프롬프트를 Git으로 버전 관리하고, 배포 전에 회귀 평가를 자동으로 돌리는 팀용 CLI입니다.

**Not for:** 프로덕션 트래픽 라우팅 · 모델 파인튜닝

## Docs — 문서 지도

| id | 경로 | 이럴 때 연다 |
| --- | --- | --- |
| quickstart | docs/quickstart.md | 설치, 첫 실행, API 키, 요구사항 |
| concepts | docs/concepts.md | 개념, 용어, 동작 방식 |

## Flow: onboard — 처음 오셨나요 (default)

### FAQ

- 설치는 어떻게 하나요? → `quickstart`
- 어떻게 동작하나요? → `concepts`
```

Section keys — `Docs`, `Flow:`, `Tasks`, `Policy` — are fixed English so any agent parses a manifest in any language. Everything a human reads is yours.

Two columns carry most of the weight:

- **`covers`** is the routing table. Write what a stuck user would *type*, not your document titles. `ValidationError, 401, session expired` beats `Authentication`. Error strings are the strongest entries available, and they work across languages.
- **`Not for`** is required, and it is the hardest line in the file. Everything else can be derived from your repo. This one cannot.

More: [`examples/`](examples/) · [format cheat sheet](.context/reference/manifest-format.md) · [SPEC.md](SPEC.md)

---

## Where this sits

Not a replacement for the files you already have — a different layer.

| | Audience | Shape | What it is |
| :--- | :--- | :--- | :--- |
| `llms.txt` | LLMs generally | A list of links | A static index for one-shot lookup |
| `AGENTS.md` | Coding agents | Prose conventions | Contributor rules — build, test, style |
| `apm.yml` | Agent deployment | Manifest + lockfile | Reproducible install of agent config |
| **`AGENT_GUIDE.md`** | **A human talking to an agent** | **Manifest + session protocol** | **A stateful session: intent routing, execution, verification** |

Already have `AGENTS.md`? List it in the Docs table and hand off to it. Do not restate it.

---

## The CLI

```bash
npx @open330/agent-guide author            # the prompt that writes your manifest
npx @open330/agent-guide validate          # structure, references, paths, anchors
npx @open330/agent-guide prompt --inline   # the paste block for your README
npx @open330/agent-guide init              # scaffold a draft by scanning the repo
```

`validate` is the one to put in CI. It automates the check the authoring protocol asks a human to do by hand — every Docs path resolved, every heading anchor confirmed, every `id` traced to a row — and reports the compliance level it computed.

```yaml
- run: npx @open330/agent-guide validate
```

It found a broken README anchor in a manifest whose author had already reported all ten anchors verified, and in the same run, a bug in its own slug function. Reference checking is not something to do by eye.

<details>
<summary><b>Why <code>init</code> deliberately gives you something incomplete</b></summary>

`init` fills in what a static scan can know — paths, anchors, package metadata — and leaves `covers`, the FAQ and every Task empty behind a `TODO(maintainer)` block.

A plausible but wrong routing table is worse than an obviously empty one. The next step is `author`, which makes an agent mine your issues and CHANGELOG for the questions people actually asked.

</details>

---

## Compliance levels

Start at the bottom rung. Most of the value is there.

| Level | Requires |
| :--- | :--- |
| **Core** | frontmatter · overview · `Not for` · `## Docs` · one flow with an FAQ · the paste block |
| **Guided** | Core + `## Policy` · `## Code map` · two or more flows |
| **Interactive** | Guided + flow switching via `Signals:` · `## Tasks` with a runnable `verify` |

This repository's own manifest is **Guided**, not Interactive. It has no `## Tasks`, because there is no `verify` command you can run against a specification — and the [authoring protocol](.context/architecture/authoring-protocol.md) forbids inventing one. We are not exempt from our own rules.

---

## What it cannot do

Agent Guide **declares intent; it does not enforce it.** Nothing in a manifest stops an agent from running a command. The paste block is a request, the manifest is a document, and the only thing that actually gates execution is the host's permission system.

Measured, not hedged: across three runs of one scenario, one agent ran `npm install -g` without asking in one of them, having been told not to in plain language.

So a step can declare what it will do to you:

```yaml
steps:
  - run: "foo setup --auto"
    explain: "Registers the MCP server and installs the hook"
    effects: [writes-user-config]
```

`effects` is optional and its vocabulary is open. It exists so the consent rule has something to attach to — "get consent before running commands" is a request an agent can satisfy vaguely, while "a step tagged `effects` needs an explicit yes, and say what the effect is" has an object. Adding it moved that agent from **3/6 to 6/6** on the consent check across three runs.

`validate` warns — never errors — when a step installs globally or writes outside the working directory without naming it. A false positive that fails CI gets the check deleted.

---

## Does it actually work?

[`experiments/`](experiments/) keeps every repository this was tried on, including the failures. Several spec clauses exist because a measurement forced them:

| | What broke | What changed |
| :-: | :--- | :--- |
| **6** | An over-prescriptive paste block made the agent stop and hand the user a menu instead of answering | "open nothing else" scoped to the first reply only; "never guess" became "answer, but label what is unverified" |
| **12** | A second agent answered three questions in a row with nothing but "this matches the troubleshoot flow, shall I switch?" — obeying the rule perfectly, helping nobody | §4.10 now requires the answer first, offer alongside. That agent went 20/25 → 29/29, and a 168-character non-answer became a 758-character diagnosis |
| **19** | Pasting the block and waiting for the first character took 4.5 seconds | The block now *carries* the first reply rather than asking the agent to compute it. Time to first token 4.2s → 2.0s, tool calls before the first reply 1 → 0 |

[`eval/`](eval/) produced those numbers. It drives Claude Code and Codex through scenarios and scores them from **tool calls, not prose**, so "did it read the whole repo before answering" is a count rather than an opinion. Checks are reported in two classes and totalled separately — hard ones are facts, soft ones are regexes — because a harness that blurs the two invites you to trust a regex the way you trust a count.

Four separate times a reply hedged correctly and the harness scored it failed. Hence the standing rule in `eval/README.md`: **when a check fails, suspect the instrument before the agent.**

---

## Status

Alpha. The spec is drafted, dogfooded, and measured against four real repositories. Treat the format as subject to change before 1.0.

The design record, including why each decision went the way it did: [`.context/`](.context/) · [roadmap](.context/planning/roadmap.md)

## Licence

The specification and prose — `SPEC.md`, `.context/`, `templates/`, `examples/` — are [CC BY 4.0](LICENSE-SPEC). Everything else is [MIT](LICENSE).

A protocol that cannot be quoted, forked, or reimplemented elsewhere does not spread.
