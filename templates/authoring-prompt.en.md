<!-- Agent Guide — authoring prompt (English)
     Paste this into an agent in a repository that has no AGENT_GUIDE.md yet.
     Also available as `agent-guide author`.

     The block is self-contained. It carries the format rather than pointing at
     a spec, so it works in a private repository or with network access blocked. -->

```
Write this repository's AGENT_GUIDE.md.

IMPORTANT: this is not a summary of the README. It is a routing table that
connects the questions people actually ask to the documents that answer them.
If you write a summary, you have failed.

━━ THE FORMAT ━━

---
guide: "0.1"
name: <product>
status: <alpha|beta|stable|maintenance>
base: https://raw.githubusercontent.com/<org>/<repo>/main/
links: {repo: ..., issues: ...}
escalate_to: <new issue URL>
---

# <product> — Agent Guide

<Three sentences. The agent uses them verbatim rather than summarising.>

**Not for:** <something this project does not do> · <another> · <another>

## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| quickstart | README.md#quick-start | install, setup, first run, requirements | S |

## Code map — where things live

| path | what |
| --- | --- |
| src/cli/ | command entry points |

## Flow: onboard — New here (default)

> Goal: the state the reader should be in when this flow ends
> Signals: keywords that suggest switching into this flow from another
> Next: the flow id or document to offer when this one finishes

### Audiences
- <first-person label> → `doc-id` | task `task-id` | flow `flow-id`

### FAQ
- <question in the user's own words> → `doc-id`, `doc-id2` → task `task-id` ↪ <follow-up>

## Tasks

### Task: install — <title>

```yaml
preconditions:
  - check: "node --version"
    expect: "v2[0-9]\\."
    hint: "what a human should read"
steps:
  - run: "<the command exactly as the docs give it>"
    explain: "one line"
    effects: [global-install]     # only where the command alone hides the consequence
verify:
  run: "<command that proves it worked>"
  expect: "<regex>"
on_fail: [doc-id]
```

## Glossary

| term | meaning |
| --- | --- |

## Policy

```yaml
answer_style: "Concise. Lists over paragraphs."
citations: required
max_reads_per_answer: 2
never: ["Running commands not declared under Tasks"]
```

The section keys — Docs, Code map, Flow:, Tasks, Glossary, Policy — are FIXED
ENGLISH. Everything after " — " and every table header is written in this
repository's own language. Column order is normative; header text is free.

━━ THE PROCEDURE ━━

1. SURVEY — cap yourself at about 15 file reads. Do not read source file
   bodies. Directory listings count against the budget too; if one returns more
   than ~100 entries, stop and use the top level only.
   README heading list / package manifest / docs tree filenames and first five
   lines / whether AGENTS.md and CONTRIBUTING.md exist / CHANGELOG / top-level
   source directory names.

2. PICK ENTRY POINTS — the Docs table holds 8–12. With more documents than
   that, cut on two criteria:
   (a) is there a question an outsider would arrive with, that this document
       answers? (design plans, TODO logs and bug notes are not destinations)
   (b) does it describe shipped behaviour or intended behaviour?
   If anything you cut is unreachable from what you kept, add a final row:
   | more | docs/ | anything not listed above — search here first |

3. FAQ — mine these, do not invent them. In priority order:
   issues labelled question → CHANGELOG bug and change descriptions → README
   Troubleshooting and collapsed <details> blocks → for a fork, the upstream
   README → comparison tables.
   If the issue tracker returns nothing, check whether the query failed rather
   than the tracker being empty, and tell me at the end if you could not.
   Write questions in the USER'S VOICE. A document heading turned into a
   question is a failure.

4. COVERS — the terms someone actually types. Verbatim error strings are the
   strongest entries. Never reuse the document's own title words.
   YES: "login, token, session expired, 401"    NO: "authentication architecture"

5. FLOWS — always create onboard and mark it (default). Others only with
   evidence:
   user-visible behaviour changed between versions → upgrade
   (a "Breaking" label is not required — a package rename, a raised runtime
    floor, or a version series that sorts wrong all qualify)
   troubleshooting content or repeated error reports → troubleshoot
   CI / SDK / Action / plugin in nature → integrate
   CONTRIBUTING.md or AGENTS.md present → contribute
   That is a list of examples, not an enum. If a genuinely distinct audience
   exists, give it a flow. But NEVER create a flow whose FAQ would be one line —
   some personas are served by a single Audiences entry.

6. TASKS — copy commands from the documentation unchanged, with two exceptions:
   · A command that acts outside the user's own machine (opening pull requests,
     deploying, writing to a third-party repository, incurring cost) must not be
     copied verbatim. Use the safe variant, say why in explain, and name the
     unsafe form under Policy.never. If there is no safe variant, do not create
     the Task.
   · Tag `effects` where the command alone hides the consequence:
     global-install, writes-user-config, network-write, third-party,
     destructive, costs-money. The vocabulary is open — invent one if none fits.
     Do not tag something like `npm test`, which has no consequence to name.
   `verify` must be a command you have CONFIRMED exists. If you cannot:
     verify: none         + why: "nothing changes, so there is no post-state"
     verify: unverified   + why: "could not be run where this was written"
   If neither applies and you still cannot confirm it, do not create the Task.
   Take preconditions from the package manifest (engines and the like). Prose
   requirements are fine too — put the source in the hint.

7. SELF-CHECK — when the file is written, without exception:
   · every path in Docs and Code map EXISTS — check them one at a time
   · every README anchor resolves to a real heading
   · every id in an FAQ, Audiences entry or on_fail resolves
   · exactly one flow is marked (default)
   · every flow's FAQ has at least two lines
   Report how many references you verified.

8. ASK ME AT THE END. Three things cannot be derived from a repository:
   · Not for — what this project does not do. THIS IS THE IMPORTANT ONE.
     A README never says what a project refuses to do, so you have to ask.
   · whether the three-sentence overview emphasises the right things
   · status
   Fill in a draft, but mark it at the top of the file:
   <!-- TODO(maintainer): confirm the three above, then delete this comment -->

When you are done, also tell me where this was ambiguous and whether anything
could not be expressed in the format.
```
