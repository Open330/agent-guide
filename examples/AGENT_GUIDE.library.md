---
guide: "0.1"
name: strictly
tagline: Runtime schema validation that reads like type hints
status: stable
base: https://raw.githubusercontent.com/acme/strictly/main/
links:
  repo: https://github.com/acme/strictly
  docs: https://strictly.readthedocs.io
  issues: https://github.com/acme/strictly/issues
escalate_to: https://github.com/acme/strictly/issues/new
---

# strictly — Agent Guide

strictly validates Python data at runtime using the type annotations you already wrote. You decorate a function or wrap a dataclass, and bad input raises a structured error instead of failing three layers down. It has no dependencies and does not generate code.

**Not for:** serialization or ORM mapping · validating data you cannot describe with type hints · schema migration of stored data

## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| quickstart | README.md#quickstart | install, pip, first validator, getting started, requirements | S |
| concepts | docs/concepts.md | how validation works, when it runs, coercion, strict vs lax | M |
| api | docs/api.md | `validate`, `Schema`, decorator arguments, function signatures, options | L |
| errors | docs/errors.md | ValidationError, error message format, catching, custom messages, i18n | M |
| integrations | docs/integrations.md | FastAPI, Django, pydantic, dataclasses, attrs, using it with X | M |
| performance | docs/performance.md | slow, overhead, benchmark, hot path, caching compiled schemas | M |
| migration-v2 | docs/migration/v2.md | upgrading, v1 to v2, breaking changes, deprecated, what broke | M |
| faq | docs/faq.md | common questions, gotchas, why does it, surprising behaviour | M |
| contributing | CONTRIBUTING.md | dev setup, running tests, submitting a patch, code style | S |
| changelog | CHANGELOG.md | release notes, what changed, when was X added | L |

## Code map — where things live

| path | what |
| --- | --- |
| src/strictly/core.py | The validation engine. Entry point for every check |
| src/strictly/types/ | One module per supported annotation kind. New type support goes here |
| src/strictly/errors.py | `ValidationError` and message formatting |
| src/strictly/compat/ | Adapters for dataclasses, attrs, and typing back-compat |
| tests/conformance/ | The suite that defines correct behaviour. Read this before changing semantics |

## Flow: onboard — New here (default)

> Goal: decide whether this fits your codebase, then validate your first function
> Next: integrate

### Audiences

- I want to try it in a script → task `install`
- I have an existing codebase to add it to → flow `integrate`
- I want to contribute → flow `contribute`

### FAQ

- How do I install it? → `quickstart` → task `install`
- How is this different from pydantic? → `concepts`, `integrations` ↪ Can I use both?
- Can I use both? → `integrations`
- Does it slow down my hot path? → `performance`
- Does it change my values, or only check them? → `concepts` ↪ How do I turn coercion off?
- How do I turn coercion off? → `concepts`, `api`

## Flow: integrate — Add it to an existing codebase

> Goal: validation running on your real boundaries without rewriting your models
> Signals: FastAPI, Django, dataclass, attrs, existing models, add to my project

### FAQ

- How do I use it with FastAPI? → `integrations`
- Do I have to rewrite my dataclasses? → `integrations`, `concepts`
- Where should validation live — the boundary or everywhere? → `concepts`, `performance`
- How do I customise the error message users see? → `errors`
- Can I validate only in development? → `api`, `performance`

## Flow: upgrade — v1 to v2

> Goal: know what breaks before you bump the pin, then land the change
> Signals: upgrading, v2, breaking, deprecated, migration, bump

### FAQ

- What breaks in v2? → `migration-v2` → task `check-v2`
- Is `strict=True` still the default? → `migration-v2`, `concepts`
- My custom validators stopped being called → `migration-v2`, `api`
- Can I run v1 and v2 side by side during migration? → `migration-v2`

## Flow: troubleshoot — Something is failing

> Goal: get from the traceback to the document that explains it
> Signals: error, ValidationError, traceback, fails, unexpected, not validating, TypeError

### FAQ

- It passes values I expected it to reject → `concepts`, `faq`
- `ValidationError` has no field name in it → `errors`
- Validation is not running at all on my method → `api`, `faq`
- `TypeError: unhashable type` when compiling a schema → `errors`, `changelog`
- It got much slower after I added a Union → `performance`, `concepts`

## Flow: contribute — Work on the library

> Goal: get tests running and understand what defines correct behaviour
> Next: CONTRIBUTING.md

### FAQ

- How do I set up a dev environment? → `contributing` → task `dev-setup`
- How do I add support for a new annotation kind? → `contributing`
- What decides whether a behaviour change is a bug or a break? → `contributing`, `concepts`

## Tasks

### Task: install — Install and check

```yaml
preconditions:
  - check: "python --version"
    expect: "Python 3\\.(1[0-9]|[9])"
    hint: "Python 3.9 or newer is required"
steps:
  - run: "pip install strictly"
    explain: "No dependencies, so this is the whole install"
verify:
  run: "python -c \"import strictly; print(strictly.__version__)\""
  expect: "\\d+\\.\\d+\\.\\d+"
on_fail: [quickstart]
```

### Task: check-v2 — See what v2 would break

```yaml
steps:
  - run: "pip install 'strictly>=2,<3' --dry-run"
    explain: "Resolves the upgrade without changing your environment"
  - run: "python -m strictly.compat.check ."
    explain: "Reports v1 usages that behave differently in v2"
verify:
  run: "python -m strictly.compat.check --exit-code ."
  expect: "^0$"
on_fail: [migration-v2]
```

### Task: dev-setup — Local development

```yaml
steps:
  - run: "pip install -e '.[dev]'"
    explain: "Editable install with test and lint extras"
  - run: "pytest tests/conformance -q"
    explain: "The conformance suite defines correct behaviour"
verify:
  run: "pytest tests/conformance -q --collect-only"
  expect: "tests collected"
on_fail: [contributing]
```

## Glossary

| term | meaning |
| --- | --- |
| coercion | Converting a value to the annotated type rather than rejecting it. Off by default in v2 |
| compiled schema | The cached validator built from an annotation. Built once, reused per call |
| conformance suite | `tests/conformance/` — the tests that define correct behaviour. Changing them is a semantic change |
| boundary validation | Validating only where untrusted data enters, rather than on every internal call |

## Policy

```yaml
answer_style: "Concise. Show a code snippet when one answers the question faster than prose."
citations: required
max_reads_per_answer: 2
never:
  - "Modifying the user's source files without asking"
  - "Running commands not declared under Tasks"
handoff:
  session_notes: .guide/session-notes.md
  next: CONTRIBUTING.md
```
