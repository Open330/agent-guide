# Runbook — trying Agent Guide on a repo yourself

The three experiments in this directory were run by an agent. This is the same
procedure done by hand, on a repository of your choosing, start to finish.

Budget: about 20 minutes, most of it waiting on the authoring agent.

---

## 0. Make the CLI available

The package is not published yet, so link it from this repo once:

```bash
cd ~/workspace-open330/agent-onboard
npm link          # effects: global-install — puts `agent-guide` on your PATH
```

Prefer not to install globally? Use the path directly and substitute it
everywhere below:

```bash
alias ag='node ~/workspace-open330/agent-onboard/src/cli.js'
```

Undo the link later with `npm unlink -g agent-guide`.

## 1. Pick a repository

Pick one whose **shape differs** from what has already been covered, or the run
tells you nothing new. Already done: a CLI with an MCP server, a GitHub Action,
and a native app with 33 documents.

| Candidate | Shape | What it would stress |
| :--- | :--- | :--- |
| `workspace/agent-skills` | Markdown only, no runnable binary | Core level with **no Tasks at all** — is a manifest still worth it when nothing executes? |
| `workspace-ext/language-insight-api` | HTTP service | `integrate` as the primary flow; the reader is calling it, not installing it |
| `workspace-open330/arxiblog` | Bun CLI, no `docs/` | Everything lives in the README. Tests whether anchor-only Docs tables hold up |

The first is the most informative. Every manifest so far has had something to
install, and the compliance ladder claims Core is where most of the value sits —
that claim has never actually been tested.

## 2. Scaffold a draft

```bash
cd <the repo>
agent-guide init            # prints to stdout so you can look before writing
agent-guide init --write    # writes AGENT_GUIDE.md
```

What comes out is deliberately incomplete: paths, anchors and package metadata
filled in, and `covers`, the FAQ and every Task left empty with a
`TODO(maintainer)` block. A static scan cannot know those, and a plausible but
wrong routing table is worse than an obviously empty one.

## 3. Let an agent write the real thing

Open an agent **in that repository** and paste the authoring prompt from
[`.context/architecture/authoring-protocol.md` §4](../.context/architecture/authoring-protocol.md).
It is built to make the agent mine your issues and CHANGELOG for questions
people actually asked, rather than summarise your README — which is what you get
if you just ask for "an AGENT_GUIDE.md".

Watch for two things while it works:

- **Does it stay under ~15 file reads?** If it starts reading source files, the
  A1 budget is not landing and the Code map will be over-specific.
- **Does it stop and ask you three questions at the end?** The overview, the
  `Not for` line and `status` cannot be derived from a repo. If it silently
  filled them in, that is the finding — tell us.

## 4. Answer the three questions yourself

`Not for` is the one that matters. A README never says what a project refuses to
do, and it is both the hardest line to write and the one that stops an agent
inventing features you do not have.

Then delete the `TODO(maintainer)` comment block.

## 5. Check it

```bash
agent-guide validate
```

Every Docs path resolved, every heading anchor confirmed, every `id` in an FAQ or
`on_fail` traced to a row, plus the compliance level it computed. Errors are
broken references; warnings are things that will make the session worse.

## 6. Actually have the conversation

```bash
agent-guide prompt          # your repo's paste block, <org>/<repo> substituted
```

Paste it into Claude Code, Codex, Cursor or ChatGPT — in that repository — and
ask real questions. Five minutes of this tells you more than the validator does.

**The first reply is the test.** It should give the overview verbatim, the
`Not for` line, the flow choices with the default marked, and the top FAQ — and
it should have opened **nothing but the manifest** to do it. If it read your
README first, the paste block is not steering.

Then ask, in rough order of what breaks:

| Ask | What it checks |
| :--- | :--- |
| Something phrased as a symptom, not a feature name | Whether `covers` holds search terms or document titles |
| Something the manifest genuinely does not cover | Whether it labels the answer instead of asserting or stonewalling |
| Something that should trigger another flow's `Signals` | Whether it answers **and** offers to switch, rather than only offering |
| "set it up for me" | Whether it names the consequence and waits |

## 7. Optional — score it

Copy a case from [`eval/cases/`](../eval/cases) and edit the turns:

```bash
node eval/run.js eval/cases/<yours>.yaml --agent claude --repeat 3
```

Use `--repeat 3`. One run is a smoke test, and a single scorecard has already
been wrong once in this project's history — [finding 15](README.md) went from
"the fix worked" to "the fix held for one of the two rules" on the second look.

---

## What to send back

The interesting output is not the manifest. It is:

1. **Where the authoring protocol was ambiguous** — a rule you could not follow,
   a case the format cannot express, a place you had to guess.
2. **Any question that routed to the wrong document**, with the question verbatim.
3. **Whether the agent asked you the three questions** in step 3.

That is exactly what findings 8 through 18 in [README.md](README.md) are made of,
and every spec clause with a "measured:" note beside it started as one of these.
