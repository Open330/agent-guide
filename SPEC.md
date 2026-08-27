# Agent Guide — Specification v0.1

**Status:** Draft
**File:** `AGENT_GUIDE.md`
**Package / repo:** `agent-guide`
**License:** CC BY 4.0 (see [LICENSE-SPEC](LICENSE-SPEC))

The key words MUST, MUST NOT, SHOULD, SHOULD NOT and MAY are to be interpreted as described in [RFC 2119](https://www.rfc-editor.org/rfc/rfc2119).

---

## 1. Scope

Agent Guide defines two things:

1. **A manifest** — `AGENT_GUIDE.md`, a file a project places in its repository.
2. **A session protocol** — how an agent that has been handed that manifest should conduct the conversation.

The central concept is the **flow**. A flow is one kind of session. Onboarding is the default one, but upgrading, troubleshooting, integrating and contributing all share the same skeleton. The document map, the code map and the tasks are shared assets; flows compose them into conversations with different goals.

### What this is not

Agent Guide does not define contributor conventions — that is `AGENTS.md`, and a manifest hands off to it. It does not generate or replace documentation; it defines the **paths into** documentation and the **procedure** for walking someone through them. It requires no runtime, no daemon and no hosted service: a static file and a paste block complete the system.

## 2. Why Markdown

**The primary consumer is an LLM, not a parser.** The usual argument for a data format over prose assumes a program does the reading. Here an agent does, and an agent reads well-structured Markdown as reliably as it reads nested YAML. What a strict data format would buy — schema validation and tooling — is a secondary concern.

The practical reasons:

- **Low authoring cost.** Writing the manifest is the only real barrier to adoption. Plenty of people fear YAML indentation; nobody fears a table.
- **It renders on the repository page.** That makes it a document humans read too, which is what gives a maintainer a reason to keep it current.
- **Precedent.** README, `AGENTS.md`, `SKILL.md` and `CLAUDE.md` are all Markdown.

Not everything is prose. **The parts that must be precise — frontmatter, Tasks and Policy — are YAML**, because an ambiguous shell command or verification pattern is dangerous.

## 3. Discovery

An agent MUST look for the manifest in this order and stop at the first hit:

1. `./AGENT_GUIDE.md`
2. `./.guide/AGENT_GUIDE.md`
3. `./docs/AGENT_GUIDE.md`
4. Hosted services: `https://<host>/.well-known/agent-guide.md`

When only the remote repository is known, try 1–3 as raw URLs.

If every location fails, the agent MUST NOT crawl the repository looking for one. It asks the user where the manifest is, or asks them to paste it. Without this rule the protocol collapses back into the token blowout it exists to prevent.

## 4. Manifest format

### 4.1 Skeleton

```
AGENT_GUIDE.md
├── frontmatter (YAML)   version, identity, base URL
├── H1 + overview        three sentences the agent uses verbatim
├── **Not for:**         the line that sends the wrong reader away
├── ## Docs              document map (table)          ─┐
├── ## Code map          directory map (table)          ├─ shared assets
├── ## External          off-repo documents (table)     │
├── ## Flow: <id>        session types (one or more) ←──┘ composed by id
├── ## Tasks             executable procedures (YAML blocks)
├── ## Glossary          terms (table)
└── ## Policy            behavioural contract (YAML block)
```

The point of the split is that adding a flow does not add proportional authoring cost. A new flow is usually a few FAQ lines plus references to Tasks that already exist.

### 4.2 Section identification

Agents and validators MUST identify sections by the **English key at the start of the H2 heading**.

```markdown
## Docs — 문서 지도
## Flow: upgrade — v1 to v2 migration (default)
```

- The keys — `Docs`, `Code map`, `External`, `Flow:`, `Tasks`, `Glossary`, `Policy` — are fixed and English.
- Anything after ` — ` is free text: the localized title shown to the user.
- In tables, **column order is normative and header text is free**. A Korean project writes Korean headers.

Fixing the keys in English is what lets a manifest written in any language be read the same way. Everything a human reads stays in the project's own language.

### 4.3 Frontmatter

```yaml
---
guide: "0.1"                 # REQUIRED. Spec version
name: foo                    # REQUIRED
base: https://raw.githubusercontent.com/acme/foo/main/   # REQUIRED. Prefix for relative paths
tagline: Prompts as code
status: beta                 # alpha | beta | stable | maintenance
language: ko                 # response language; defaults to the user's
links: {repo, docs, issues, homepage, chat}
escalate_to: https://github.com/acme/foo/issues/new
upstream: {name: bar, url: https://github.com/orig/bar}   # forks only
---
```

Keep frontmatter small. Only metadata a human has no reason to read belongs here.

`upstream` exists for forks. Without it a fork cannot say that its CHANGELOG, its FAQ, or half its documentation belongs to a differently-named project, and an agent will attribute all of it to the fork. When present, an agent SHOULD name the upstream when citing a document that came from it.

### 4.4 Overview and `Not for`

The paragraph immediately after the H1 is the overview. It SHOULD be three sentences or fewer. The agent MUST use it **as written rather than summarising it** — summaries drift, and a maintainer should control the first impression. Translating it into the user's language is permitted.

```markdown
# foo — Agent Guide

foo lets a team version-control LLM prompts in Git and run a regression
evaluation before every deploy. If a prompt change breaks an existing case, the
deploy is blocked.

**Not for:** production traffic routing · model fine-tuning · prompt generation
```

The `**Not for:**` line is REQUIRED. Sending the wrong reader away quickly is a successful session, and this line structurally prevents an agent from inventing capabilities the project does not have.

### 4.5 `## Docs` — the routing table

Column order: **id · path · covers · size (optional)**

```markdown
## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| quickstart | README.md#quickstart | install, setup, API key, first run | S |
| architecture | docs/architecture.md | design, plugins, extending, internals | L |
```

- `id` MUST be unique within the manifest. FAQ entries and Tasks reference it.
- `path` MAY carry a fragment. Pointing at a README anchor is not a workaround — for most repositories it is the normal case, because most repositories keep their documentation inside the README.
- **The third column is the entire routing mechanism.** The agent matches the question against `covers` and the FAQ, picks what to open, and only then opens it. The reverse order is forbidden (MUST NOT open arbitrary files before routing).
- Write `covers` as **the words a confused user would type**. Not "authentication architecture" but `login, token, session expired`. Verbatim error strings are the strongest entries available. The rule targets routing quality, not letter-avoidance: where the path is a README anchor the slug *is* the title, and overlap there is expected.
- `size` is a reading-budget hint measured in **document length**, not importance: `S` is roughly under 200 lines, `M` under 800, `L` above that. For `L`, an agent SHOULD read the relevant section rather than the whole file. The thresholds are advisory — the field exists so an agent can decide whether to seek or slurp, and any consistent reading of it serves that.

`## Code map` has two columns: **path · what**. It is a coarse map for answers that live only in code. Write it per directory; splitting it per file guarantees it goes stale.

`## External` has two columns: **url · covers**.

### 4.6 `## Flow:` — session types

```markdown
## Flow: upgrade — v1 to v2 migration

> Goal: know what breaks before bumping the pin, then land the change
> Signals: upgrading, migration, v2, breaking, deprecated
> Next: integrate

### Audiences

- I just want to try it → task `install`
- I'm wiring this into CI → `ci-integration`
- I want to contribute → flow `contribute`

### FAQ

- What breaks in v2? → `migration-v2` → task `check-v2`
- How long does it take? → `migration-v2` ↪ Can I roll back?
```

- The token after `Flow:` in the heading is the flow id (MUST). Flow ids are **open**: `onboard`, `integrate`, `upgrade`, `troubleshoot` and `contribute` are conventional, not an enumeration. A project with a genuinely distinct second audience SHOULD give that audience its own flow rather than compressing it into an `Audiences` line.
- Exactly one flow MUST carry `(default)` in its heading. It is the entry point named by the paste block.
- `Goal:` states the condition the flow is finished in. It is the agent's compass, not decoration.
- `Signals:` are the keywords that mark this flow as a switch candidate **while another flow is running**.
- `Next:` names the flow or document to suggest when this one completes.
- `### Audiences` is an optional second-level branch inside a flow. Labels are written in the user's first person.
- `### FAQ` lines use this grammar:

```
- <question> → `doc-id`[, `doc-id`...] [→ task `task-id`] [↪ <follow-up question>]
```

`→` names the supporting documents, `→ task` links to execution, `↪` offers a follow-up.

**Parsing rule.** Everything before the first `→` is question text. Ids are read only *after* a `→`, and only the token following `→ task` is a task id. Backticks inside the question are ordinary code formatting and MUST NOT be treated as references — a question like ``- `--retry-failed` does nothing → `cli` `` is well-formed. Without this rule, backticks are overloaded and an author is forced to degrade the wording of a question to satisfy a parser.

### 4.7 `## Tasks` — executable procedures

````markdown
### Task: install — Install locally

```yaml
preconditions:
  - check: "node --version"
    expect: "v(2[0-9]|[3-9][0-9])\\."
    hint: "Node 20 or newer is required"
steps:
  - run: "npm i -g @acme/foo"
    explain: "Installs the CLI globally"
verify:
  run: "foo --version"
  expect: "^foo \\d+\\."
on_fail: [troubleshooting]
```
````

`expect` is a regular expression. `on_fail` references Docs ids.

**`verify` is required, but it takes two sentinel values in place of a command.** Each requires a `why` line.

```yaml
verify: none          # nothing changes — a dry run, a report, a diagnostic
why: "--dry-run writes nothing, so there is no post-state to assert"
```

```yaml
verify: unverified    # the author could not confirm it in their environment
why: "requires a full Xcode build the author could not run"
```

Putting an unrelated liveness command in `verify` to satisfy the field is a violation: `verify` asserts that the task achieved something, not that the binary still runs. An agent that encounters `unverified` MUST tell the user that success cannot be confirmed before relying on it.

A blanket "if you cannot verify it, do not write the task" rule deletes the most important task in any project with an expensive build. An honest `unverified` beats an invented `expect`, and both beat silence.

**Tasks whose verification is expensive** — a ten-minute compile, a full test suite — MAY set `verify.cost: high`. The agent SHOULD then describe the check and ask before running it rather than running it silently. Without this, a compiled project's only real task is unrepresentable: the author is forced either to omit the build entirely or to substitute a toolchain check that verifies the wrong thing.

```yaml
verify:
  run: "./scripts/build.sh --check"
  expect: "BUILD SUCCEEDED"
  cost: high
```

#### When there is nothing to verify

`verify` is REQUIRED, but two values stand in for a command, and each REQUIRES a `why`:

```yaml
verify: none          # the task changes nothing observable — a preview, a diagnostic
why: "--dry-run writes nothing, so there is no post-state to assert"
```

```yaml
verify: unverified    # confirming success is not possible where the manifest was written
why: "requires a full Xcode build; the author could not run it"
```

An agent encountering `unverified` MUST tell the user it cannot confirm the task succeeded.

These exist because the alternative is worse. A rule that says "omit the Task if you cannot verify it" deletes the central task of any project whose build is expensive, and invites authors to pass off an environment check as a verification. An honest `unverified` beats a fabricated `expect`, and both beat silence.

#### Naming what a step does

A step MAY carry `effects` — short tags naming consequences a reader would not infer from the command itself.

```yaml
steps:
  - run: "npm install -g @acme/foo"
    explain: "Installs the CLI globally"
    effects: [global-install]
  - run: "foo setup --auto"
    explain: "Registers the MCP server and installs the hook"
    effects: [writes-user-config]
```

The vocabulary is open. `global-install`, `writes-user-config`, `network-write`, `third-party`, `destructive` and `costs-money` cover most cases; invent one when none fits. A closed enum would age badly and would tempt authors into the nearest wrong tag.

`effects` exists so the consent rule has something specific to attach to. "Get consent before running commands" is a request an agent can satisfy vaguely; "a step with `effects` needs an explicit yes, and say what the effect is" is a rule with an object. It also gives a validator something to check: a step whose command installs globally or writes outside the working directory and carries no `effects` is worth a warning.

It is OPTIONAL. A manifest without it is valid, and most steps do not need it — `npm test` has no consequence worth naming.

#### Commands with effects beyond the user's machine

Commands are otherwise copied from the documentation unchanged, with one exception. A command that acts outside the user's own machine — opening pull requests, deploying, writing to a third-party repository, incurring cost — MUST NOT be copied verbatim into a Task (MUST NOT). Use the safe variant, say why in `explain`, and name the unsafe form under `Policy.never`:

```yaml
steps:
  - run: "oac run --dry-run --repo owner/repo"
    explain: "Shows what would be proposed. The form without --dry-run opens real pull requests."
```

If no safe variant exists, do not create the Task.

#### What this specification cannot do

Agent Guide **declares intent; it does not enforce it.** Nothing here stops an agent from running a command. The paste block is a request, the manifest is a document, and the only thing that actually gates execution is the host's permission system — Claude Code's approval prompt, Codex's sandbox mode, whatever the next runtime calls it.

This is not a caveat to bury. Measured across three runs of one scenario, one agent ran `npm install -g` without asking in one of them, having been told not to in plain language. The rules in this section reduce that rate; they do not make it zero.

Two consequences follow. **Interactive compliance assumes a host with an execution gate turned on** — claiming the level while running an agent in a bypass mode is claiming something the manifest cannot deliver. And a maintainer writing `## Tasks` should assume a step will occasionally run unasked, which is the real reason §4.7 forbids putting a command with third-party consequences in a Task at all.

#### Execution rules

- The agent MUST obtain the user's consent before running any `steps` command.
- `preconditions` are exempt. They are declared, read-only probes whose purpose is to find out whether the user needs the Task at all, and requiring consent to run `node --version` before being allowed to ask about installing anything is friction with no safety return. `steps` and `verify` are not exempt.
- The agent MUST NOT run commands that are not declared under `## Tasks` as part of the session. It MAY suggest one and ask.
- When `verify` fails, the agent MUST open the `on_fail` documents, and if the answer is not there, point at `escalate_to`.

### 4.8 `## Policy` — behavioural contract

```yaml
answer_style: "Concise. Lists over paragraphs. Three paragraphs max."
citations: required          # required | optional (default: required)
max_reads_per_answer: 2      # default: 2
never:
  - "Editing files without asking"
  - "Running commands not declared under Tasks"
handoff:
  session_notes: .guide/session-notes.md
  next: AGENTS.md
```

### 4.9 Path resolution — no dead ends

Paths in `## Docs` and `## Code map` resolve in this order:

1. Relative to the **repository root** — not the agent's working directory
2. Prefixed with the frontmatter `base`
3. By filename search within the repository, catching moved files
4. Failing all of that, `escalate_to`

An agent MUST NOT stop because step 1 failed. **If `base` is declared, the maintainer has already sanctioned that path; the agent SHOULD use it without asking for separate consent.**

The agent SHOULD report in one line what it tried. Handing the user a menu of options instead of resolving the path is a failure.

### 4.10 Flow switching

When something the user says matches another flow's `Signals:`:

1. The agent MUST answer the question first, using the current flow's routing. The offer to switch accompanies the answer; it MUST NOT replace it.
2. The agent MUST ask before switching. It does not move silently.
3. On agreement it moves to that flow and MUST remember the previous flow and position.
4. When the switched-to flow completes, it SHOULD offer to return.

> **User:** I installed it but `foo eval` errors out
> **Agent:** That's the persistence default, not a bug — `persistDb` is false, so the index opens in memory. [src: README.md#configuration]
> Want me to jump to troubleshooting for a moment? We can come back to the first-run task after.

Rule 1 exists because an agent will otherwise read rule 2 as a gate. Measured: given a `Signals:` match, one agent answered three consecutive questions with nothing but "this matches the troubleshoot flow, shall I switch?" — no diagnosis, no document opened, 168 characters. It had obeyed rule 2 perfectly and helped nobody. **A switch offer is a second sentence, never the whole reply.**

That the conversation determines the path — rather than the path determining the conversation — is the point of this protocol.

## 5. Session protocol

```
DISCOVER → ORIENT → ROUTE ⇄ ANSWER ⇄ ACT → HANDOFF
                      ↑______________|
                      └── SWITCH (§4.10)
```

### 5.1 DISCOVER

Locate and read the manifest. The manifest MUST be the only file read in this phase.

### 5.2 ORIENT — the first reply

The first reply MUST contain the following, in this order:

1. The overview paragraph — as written, 150 words or fewer
2. Whichever of `status` and `Not for` matters to this user
3. **The flow choices**, with the `(default)` one marked
4. The top four to six FAQ entries from the default flow

The agent MUST NOT open any file other than the manifest before this reply. Reading documentation "just in case" is precisely the behaviour this protocol exists to remove.

The opening question is not "who are you" but **"what are you trying to do"**. The latter is closer to action. Audiences drop to a second-level branch after a flow is chosen.

### 5.3 ROUTE → ANSWER

For each question:

1. Match it against the current flow's FAQ and the `covers` column.
2. Open only what matched. The default ceiling is two documents (`max_reads_per_answer`).
3. Cite the source path in the answer — `[src: docs/quickstart.md#api-key]` (MUST).
4. **If nothing matched, still answer when you can** — but the agent MUST distinguish where the answer came from:
   - From a document → cite the path
   - General knowledge or inference outside the manifest → label it "outside the manifest" or "unverified"
   - A fact with no way to check it → say so and point at `escalate_to`

   What is forbidden is **not inference but unlabelled certainty**. Labelled inference helps the user; unlabelled assertion is hallucination.
5. If another flow's `Signals:` match, go to §4.10.
6. Offer any `↪` follow-ups alongside the answer (SHOULD).

### 5.4 ACT

Follow §4.7. When the user signals intent to execute — "install it for me" — move to ACT instead of ANSWER.

### 5.5 HANDOFF

At the end of a session the agent SHOULD offer to:

- Write the questions, answers and execution results to `handoff.session_notes`
- Draft an issue for anything it could not answer (`escalate_to`)
- Move on to whatever the flow's `Next:` names

Session notes are deliberate, not incidental. **The list of unanswered questions is the most valuable documentation signal a maintainer can get.**

## 6. The paste block

The block a project puts in its README. It is self-contained: the only external retrieval it triggers is the manifest itself.

```
You are running an Agent Guide session for this project.
The manifest is a map, not a fence. Your goal is to answer my questions well —
the rules below are how you do that, not what you're graded on.

START
Find this project's AGENT_GUIDE.md — try ./AGENT_GUIDE.md, then the repo root, then
https://raw.githubusercontent.com/<org>/<repo>/main/AGENT_GUIDE.md. Ask me to paste
it only if none of those work.
Open nothing else before your first reply. Then reply with:
  the overview paragraph verbatim -> Not for -> the Flow choices (mark the default)
  -> the default Flow's top 5 FAQ entries -> stop.
("Open nothing else" applies only up to that first reply.)

DURING
- Routing: match my question against the FAQ and the Docs `covers` first, then open
  what you picked. One or two documents is usually enough.
- No dead ends: if a path won't resolve, work it out yourself, in this order:
  (1) relative to the repo root, (2) prefixed with the frontmatter `base` — that's
  declared in the manifest, so just use it, don't ask, (3) search the repo by
  filename, (4) only then the issues link. Tell me in one line what you tried.
  Don't hand the choice back to me.
- Sourcing: cite the path for anything that came from a document. Label anything
  outside the manifest as "outside the manifest" or "unverified". Reasoning is
  welcome — unlabelled certainty is not.
- Off-manifest questions: still answer if you can. Just say it's off-manifest.
- Running things: commands under Tasks need my go-ahead. If something not in Tasks
  would help, suggest it and ask.
- Switching: if what I say matches another Flow's Signals, offer to switch.

Keep it short, and answer in my language.
```

Four properties of this block are load-bearing, and two of them were learned by watching it fail (see [`experiments/`](experiments/)):

| Line | What happens without it |
| :--- | :--- |
| "a map, not a fence" | The agent reads the prohibitions literally and stops at the first dead end |
| "applies only up to that first reply" | Scoped to the whole session, the agent becomes unable to answer anything |
| "just use it, don't ask" | The agent asks permission to use a `base` the manifest already declares |
| local fallback `./AGENT_GUIDE.md` | Sessions never start in agents whose network retrieval is blocked |

Discovery is deliberately **local first**. Two of the three common contexts — a cloned repository, and a subdirectory of one — are served locally, and putting the remote first guarantees a failed first attempt whenever `<org>/<repo>` was left unsubstituted.

Ready-to-paste README blocks in English and Korean are in [`templates/`](templates/).

## 7. Relationship to other formats

| | Audience | Shape | Character |
| :--- | :--- | :--- | :--- |
| `llms.txt` | LLMs generally | A list of links | Static index, one-shot lookup |
| `AGENTS.md` | Coding agents | Prose conventions | Contributor rules — build, test, style |
| `apm.yml` | Agent deployment | Manifest + lockfile | Reproducible install of agent configuration |
| **`AGENT_GUIDE.md`** | **A human talking to an agent** | **Manifest + session protocol** | **Stateful session, intent routing, execution and verification** |

These are layers, not competitors. A manifest lists any `llms.txt` or `AGENTS.md` that already exists in its `## Docs` table and hands off to `AGENTS.md` through the contribute flow's `Next:`. It MUST NOT duplicate their content.

## 8. Compliance levels

| Level | Requires |
| :--- | :--- |
| **Core** | frontmatter · overview · `Not for` · `## Docs` · one flow with an FAQ · the README paste block |
| **Guided** | Core + `## Policy` · `## Code map` · two or more flows |
| **Interactive** | Guided + flow switching via `Signals:` · `## Tasks` where every task's `verify` is a runnable command or a sentinel with `why` |

Badges are offered per level. The ladder exists so that projects can start on the bottom rung, where most of the value already is.

## 9. Extensibility

H2 sections the specification does not define are not errors. A validator emits a warning and moves on.

Anything a maintainer must confirm before publishing SHOULD be marked with an HTML comment, which renders invisibly:

```html
<!-- TODO(maintainer): the overview, the Not for line and status cannot be
     derived from the repository. Confirm them and delete this comment. -->
```

A validator SHOULD warn while such a marker remains.

## 10. Versioning

The `guide` key in frontmatter names the spec version. Within `0.x`, additive changes bump the minor version and breaking changes are announced in the repository's own `## Flow: upgrade`. An agent that encounters a `guide` version newer than it knows SHOULD proceed on a best-effort basis rather than refusing, since the format degrades gracefully — an unknown section is just a section it does not use.

## 11. Authoring

Writing a manifest is an evidence-gathering exercise, not a summarisation exercise. An agent told merely to "write AGENT_GUIDE.md" will almost always produce a condensed README, which is the wrong artifact. The procedure that prevents this — and a paste-ready authoring prompt — is specified in [`.context/architecture/authoring-protocol.md`](.context/architecture/authoring-protocol.md).
