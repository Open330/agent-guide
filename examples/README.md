# examples

Three manifests, in increasing order of what they exercise. Copy the one whose shape matches your project and replace the contents.

| file | shape | exercises |
| :--- | :--- | :--- |
| [`AGENT_GUIDE.minimal.md`](AGENT_GUIDE.minimal.md) | anything | The smallest valid manifest — **Core** level, ~25 lines |
| [`AGENT_GUIDE.md`](AGENT_GUIDE.md) | CLI tool | Five flows, four Tasks, flow switching — **Interactive** level |
| [`AGENT_GUIDE.library.md`](AGENT_GUIDE.library.md) | library / SDK | An `upgrade` flow with a real migration, import-based `verify` |

All three are fictional projects. Nothing in them resolves — they are shape references, not working manifests.

## Which one applies to you

**Start with the minimal one.** Core level is where most of the value already is: an overview, a `Not for` line, a document map with good `covers`, and one flow with an FAQ. Everything above that is optional.

**Copy the CLI example** if your project installs a binary and has a setup that can fail. It shows what `## Tasks` buys you — `preconditions` that check the runtime before wasting the user's time, and a `verify` command that proves the install worked rather than assuming it.

**Copy the library example** if your project is imported rather than run. Two things differ from the CLI shape:

- The `upgrade` flow does real work. Libraries break their users on major versions, and "what breaks in v2" is a question with a documented answer — which is exactly the evidence the [authoring protocol](../.context/architecture/authoring-protocol.md) says an `upgrade` flow needs.
- `verify` is an import check rather than a `--version` call:

  ```yaml
  verify:
    run: "python -c \"import strictly; print(strictly.__version__)\""
    expect: "\\d+\\.\\d+\\.\\d+"
  ```

## What to look at rather than copy

The `covers` column. It is the entire routing mechanism, and it is the part people get wrong first.

```
| errors | docs/errors.md | ValidationError, error message format, catching, custom messages |
```

Those are the words someone types when they are stuck. `error handling documentation` is not.

The `Not for` line, too. All three examples name things the project deliberately does not do, and none of those lines could have been derived by reading a README.

## Real manifests

The examples above are fictional. For manifests written against real repositories — including the verification counts and what broke in the process — see [`experiments/`](../experiments/). This repository's own [`AGENT_GUIDE.md`](../AGENT_GUIDE.md) is real too, and sits at **Guided** level because there is no CLI yet to write a `verify` command against.
