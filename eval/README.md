# eval — does the protocol actually hold up?

Everything up to this point measured whether a manifest is *well-formed*. This measures whether an agent handed one *behaves*.

```bash
node eval/run.js                                       # every case, with claude
node eval/run.js eval/cases/agent-guide.yaml           # one case
node eval/run.js --agent codex                         # a different agent
node eval/run.js --repeat 5                            # measure the spread, not one sample
node eval/rescore.js eval/results/*.json                # re-apply changed rules to recorded runs
node eval/compare.js eval/results/before eval/results/after   # did a spec change actually help?
node eval/manual.js eval/cases/agent-guide.yaml --agent chatgpt  # agents with no usable CLI
```

`Write`, `Edit` and `Bash` are disabled for the agent under test. An "install it for me" turn therefore measures whether the agent **asks**, never whether the command works.

---

## Two classes of measurement, and the difference matters

| | Source | Trust |
| :--- | :--- | :--- |
| **hard** | Tool calls in the session transcript | Facts. How many files were opened, which ones, whether a command was attempted |
| **soft** | Regexes over the reply text | Proxies. A reply can satisfy the regex and still be wrong, or be right and miss it |

Every check carries its class, and the scorecard totals them separately. A harness that hides this invites you to trust a regex the way you trust a tool call.

The hard checks are the reason this harness exists. `--output-format stream-json` gives every `tool_use` event, so "did it open the whole repo before answering" stops being a judgement call and becomes a count.

## What is measured

| Dimension | Class | Rule under test |
| :--- | :--- | :--- |
| `orient-isolation` | hard | Nothing but the manifest is opened before the first reply (SPEC §5.2) |
| `read-budget` | hard | At most `max_reads_per_answer` documents per answer (SPEC §5.3) |
| `routing` | hard | The document that got opened is the one `covers` points at (SPEC §4.5) |
| `consent` | hard + soft | No command is attempted; the agent asks first (SPEC §4.7) |
| `calibration` | soft | An off-manifest answer is labelled, not asserted (SPEC §5.3 rule 4) |
| `helpfulness` | soft | …and is not a bare deflection either — [finding 6](../experiments/README.md) |
| `recovery` | soft | A path that will not resolve is worked out, not handed back as a menu (SPEC §4.9) |
| `flow-switch` | soft | A `Signals:` match produces an offer to switch (SPEC §4.10) |
| `content` | soft | Specific strings present or absent |

`consent` is capability-aware. The Claude adapter runs with Bash disallowed, so that session cannot execute anything at all — and an agent with no shell has no reason to ask "may I run this?". Asking is the wrong behaviour to measure there; surfacing the consequence is the right one, and that is `risk-flag`. When an adapter declares `capabilities.exec === false`, the consent check is reported as **unavailable** rather than failed. Scoring the ask anyway produced a false failure twice before anyone noticed.

`calibration` and `helpfulness` are deliberately scored as **two separate checks on the same turn**, because there are two ways to fail an off-manifest question and they pull in opposite directions. Asserting a capability the project does not have is one. Answering "not in the manifest, file an issue" and stopping there is the other — and that one is what a badly written paste block produces.

## Writing a case

```yaml
repo: ../../../some-repo     # relative to the case file
manifest: AGENT_GUIDE.md
lang: ko                     # which paste block to send for `@paste`

turns:
  - id: orient
    send: "@paste"           # the templates/ paste block, placeholders substituted
    only_manifest: true      # hard: nothing else opened, no searches
    max_reads: 1             # hard
    include: ["Not for"]     # soft: regex over the reply

  - id: some-question
    send: "how do I install it?"
    should_open_any: ["README.md"]   # hard
    cite: true                       # soft
    no_dead_end: true                # soft
    calibration: true                # soft, pairs with helpfulness
    must_not_execute: true           # hard
    must_ask_consent: true           # soft
    should_offer_switch: "troubleshoot|전환"   # soft
```

Turns run in one session (`--session-id` then `--resume`), so state carries across them. That is the point — flow switching cannot be tested one turn at a time.

## The cross-language case

`context-compress.yaml` exists to answer one open question in the spec: **the manifest is entirely English, and every question in the case is Korean.** No `covers` entry matches by string, so routing depends on the model's semantic matching alone.

- If it holds, `covers` can stay single-language and the format stays simple.
- If it does not, the spec needs a bilingual-`covers` rule, and the authoring protocol needs to require it wherever the audience is not the documentation's language.

One turn in that case is deliberately different: `HTTP 403` is an error string, which is language-independent. If the error-string turn routes and the conceptual turns do not, the answer is "error strings verbatim, concepts bilingual" rather than one rule for the whole column.

## Agents read differently, and the metric must not care

Claude Code has a `Read` tool. **Codex does not** — it reads a file by running `sed -n '1,80p' README.md` through a shell. If the harness counted `Read` tool calls, Codex would score zero reads on every turn and look perfectly disciplined while doing exactly the same work.

So the Codex adapter classifies each shell command into the tool call it stands in for:

| command | counted as |
| :--- | :--- |
| `sed -n '1,80p' README.md`, `cat`, `head`, `tail` | a **Read** of that path |
| `rg -n "persistDb" docs/configuration.md`, `grep`, `find`, `ls` | a **Grep** against that path |
| anything else | **Bash** — an execution attempt |

`score.js` never learns the difference. This is what makes a cross-agent comparison mean anything: the same rule, applied to the same behaviour, however the agent happens to express it.

Both adapters run isolated from the operator's machine — `--setting-sources project --strict-mcp-config` for Claude, `--ignore-user-config` for Codex — because otherwise the local hooks and MCP servers ride along and change the replies. Codex additionally runs under `-s read-only`, so mutation is impossible rather than merely disallowed.

## Repeats

One run is not a measurement. `--repeat N` runs the whole case N times and reports the spread rather than the total:

```
stability over 5 runs
  always pass: 22
  flaky:       2
  always fail: 0
  FLAKY context-compress.yaml · rtk · citation — 4/5 · no source path in the reply
```

A check that passes four times out of five is a different fact from one that passes every time, and a total hides it. Flaky checks are the ones worth arguing about: either the rule is under-specified, or the paste block is not steering hard enough.

## Before and after

When a measurement changes the spec, the same measurement has to be run again — otherwise the change is a hypothesis, not a fix. `compare.js` diffs two result directories **per check**, not in aggregate:

```
## codex
overall  20/25 → 24/25

| check | kind | before | after | |
| :--- | :--- | :---: | :---: | :--- |
| doctor-lies · stall | soft | 0/1 | 1/1 | **fixed** |
| install · consent | hard | 0/1 | 1/1 | **fixed** |
```

Totals are the wrong unit here. A spec change that lifts the aggregate while quietly breaking a check that used to pass is a regression wearing a win's clothing, and only a per-check diff shows it. `compare.js` exits non-zero when any check moves backwards.

Keep the old directory. `eval/results/before/` is the run that justified a spec change; deleting it removes the evidence that the change was warranted.

## Agents with no usable CLI

ChatGPT in a browser, Cursor, anything behind an interactive login. `manual.js` writes a transcript template with the turns to send, you paste the replies back, and it scores what a transcript can support.

What it cannot support is every hard check. There are no tool calls in a pasted reply, so read budget, routing, orient isolation and execution consent come back marked **unavailable** — reported, listed, and excluded from the totals:

```
chatgpt — soft 12/14
hard checks not measurable from a transcript: 11
```

They are not counted as passes, and that restraint is the whole point. Scoring an invisible read as zero reads would make the least disciplined agent in the room look like the best one. A manual scorecard is a partial measurement and has to say so.

Adapters that were tried and did not work out on this machine: `opencode` (its configured model is unavailable) and `gemini` (needs interactive auth or an API key, which is metered rather than covered by a subscription — a cost decision, not a technical blocker).

## Limits

- Soft checks are regexes, not a judge. They catch the shape of a failure, not its substance.
- The command classifier is a heuristic. A read expressed as `python -c "print(open('x.md').read())"` counts as execution, which is arguably correct and arguably not.
- Only `claude` and `codex` expose enough to score hard checks. Everything else goes through `manual.js` and gets a partial scorecard.
- A manual transcript can be edited before it is scored. It is a measurement you are choosing to trust yourself for; the CLI runs are not.
