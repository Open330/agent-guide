---
guide: "0.1"
name: amux
tagline: agent mux — the tmux-native, agent-first terminal for macOS
status: alpha
base: .
language: en
links:
  repo: https://github.com/Open330/amux
  issues: https://github.com/Open330/amux/issues
  upstream: https://github.com/manaflow-ai/cmux
escalate_to: https://github.com/Open330/amux/issues/new
---

# amux — Agent Guide

<!-- TODO(maintainer): the three sentences below, the Not for line, and `status`
     in the frontmatter cannot be derived from the repository. `status: alpha`
     was taken from the README badge (`status-alpha · v0.1.0`) — confirm it is
     still accurate. Confirm or rewrite, then delete this comment. -->

amux is a native macOS terminal whose every workspace is a real tmux session on a dedicated `tmux -L amux` server, so sessions outlive the app. It projects tmux windows and panes into native Ghostty surfaces over control mode (`-CC`), and correlates Claude Code / Codex / Gemini hook events through the muxa daemon so the sidebar shows which agent is working, waiting, or errored. It is a friendly fork of [cmux](https://github.com/manaflow-ai/cmux) and inherits its workspace UI, socket control plane, and SSH tmux mirror.

**Not for:** Linux or Windows · running as a plugin inside another terminal · replacing tmux itself · a hosted or web-based terminal <!-- TODO(maintainer): confirm — the README never states what amux refuses to do -->

## Docs — where to look

| id | path | ask about this when | size |
| --- | --- | --- | --- |
| readme | README.md | what is this, amux vs cmux, why fork, `tmux -L amux`, build from source, zig, `xcodebuild` Command Line Tools, headless prompt, `--tag` | M |
| upstream-faq | docs/upstream-cmux-README.md#faq | Ghostty, libghostty, Linux, Windows, iPhone, TestFlight, which agents work, subagents, teams, is it free, `cmux hooks setup`, session restore, `⌘⇧O` | L |
| config | docs/configuration.md | `cmux.json`, `~/.config/cmux`, `terminal.scrollSpeed`, `paneBorderColor`, `autoResumeAgentSessions`, hibernation, quit confirmation, window title | L |
| cli | docs/cli-contract.md | scripting it, unix socket, `send`, `read-screen`, screenshot, automation, argument shape, exit codes | L |
| events | docs/events.md | subscribe, event stream, payload schema, watching for pane/workspace changes | M |
| agent-hooks | docs/agent-hooks.md | Claude Code hooks, Codex, Gemini, `waiting_input`, badges not showing, wrapper, `~/.cmuxterm` | M |
| notifications | docs/notifications.md | OSC 9, OSC 777, bell, unread badge, ring around pane, `.m4r`, desktop notification never fires | M |
| custom-sidebars | docs/custom-sidebars.md | write my own panel, extension sidebar, right sidebar tab, SwiftUI interpreter, `@State` | L |
| remote | docs/remote-daemon-spec.md | SSH, remote host, mirror, ControlMaster, `AF_UNIX` path too long, remote PTY, non-UTF-8 locale | L |
| agent-notes | AGENTS.md | typing lag, 100% CPU, `hitTest`, `.equatable()`, `Localizable.xcstrings`, `project.pbxproj`, "Executed 0 tests", submodule detached HEAD, `reload.sh` | L |
| contributing | CONTRIBUTING.md | first build after clone, GhosttyKit rebuild, running the test suites, dogfood profile, bun/biome | M |
| changelog | CHANGELOG.md | what changed, was this fixed, regression, which version, PR number | L |

## Code map — where things live

| path | what |
| --- | --- |
| Sources/ | The macOS app itself. `AppDelegate+*`, `TerminalController+Control*` (socket command surface), `Workspace*`, `Sidebar*`, `RemoteTmux*` (the `-CC` mirror engine), `Dock*`, `Sleepy*` |
| Packages/macOS/ | 36 SPM modules the app composes — `CmuxCore`, `CmuxTerminal`, `CmuxControlSocket`, `CmuxMuxa` (agent daemon client), `CmuxSidebar*`, `CmuxRemoteDaemon`, `CmuxUpdater` |
| Packages/iOS/ | The iOS beta — `CmuxMobileShell`, `CmuxMobileTerminal`, `CmuxMobileRPC`, `CmuxAgentChatUI` |
| CLI/ | The `cmux` command-line binary and its socket client, including the agent-hook catalog |
| daemon/ | The remote daemon deployed to SSH hosts |
| mux/ | Rust workspace (`crates/`, `bindings/`) with its own README |
| Native/ | C/FFI shims — currently the command-palette nucleo matcher |
| webviews/ | Embedded web UI bundled into the app (agent session view, markdown viewer) |
| web/ | The website and localized message catalogs (`web/messages/en.json`, `ja.json`) |
| workers/ | Presence service worker |
| scripts/ | Everything you run by hand: `setup.sh`, `reload.sh`, `cmux-debug-cli.sh`, plus CI lint and release scripts |
| skills/ | Agent skills shipped with the repo (`cmux-debugging`, `cmux-architecture`, `cmux-browser`, …) |
| Resources/ | `Info.plist`, `Localizable.xcstrings` — every user-facing string lands here |
| ghostty/, vendor/ | Submodules: the Ghostty fork, `bonsplit`, `amux-runtime` |
| cmuxTests/, cmuxUITests/, tests/, tests_v2/ | Test targets. Files under `cmuxTests/` must also be wired into `cmux.xcodeproj` |
| docs/ | Feature docs and living specs. The 12 entry points above link onward to the rest |
| .context/plans/ | `R01-fable.md` (architecture) and `R02-fable.md` (productization) roadmaps |

## Flow: onboard — New here (default)

> Goal: understand what amux is, whether it fits, and get a debug build running
> Signals: what is amux, install, build, first run, requirements
> Next: integrate

### Audiences

- I just want to try it → `readme` → task `preflight`
- I use cmux already and want to know what changed → `readme`, `upstream-faq`
- I am evaluating it against tmux or another terminal → `upstream-faq`, `readme`

### FAQ

- Is this a fork of Ghostty? → `upstream-faq` ↪ So what is amux forked from?
- So what is amux forked from? → `readme`, `upstream-faq`
- Does it work with the agent I already use? → `upstream-faq`, `agent-hooks`
- If it is just tmux underneath, why not run tmux? → `readme`, `upstream-faq`
- Will it touch my `~/.tmux.conf` or my existing tmux sessions? → `readme`
- Can I run this on Linux, or from my phone? → `upstream-faq`
- Do my sessions really survive quitting the app? → `readme`, `upstream-faq`
- What do I need installed before building? → `readme`, `contributing` → task `preflight`

## Flow: integrate — Drive it from something else

> Goal: amux is scripted, hooked to your agents, and reachable on the machines you care about
> Signals: socket, CLI, hooks, automation, SSH, remote, sidebar extension, cmux.json

### FAQ

- How do I send a prompt into a workspace without stealing focus? → `readme`, `cli`
- What can I actually drive over the socket? → `cli`, `events`
- I want to react when a pane or workspace changes — what do I subscribe to? → `events`
- The sidebar shows no agent badges at all → `agent-hooks`, `readme`
- How do I get Claude Code / Codex hook events flowing? → `agent-hooks`
- Can I build my own sidebar panel instead of using the built-in one? → `custom-sidebars`
- How do I attach to tmux on a remote box over SSH? → `remote`
- Where do I set scroll speed, border colors, or turn off agent auto-resume? → `config`
- My notification never fires even though the process finished → `notifications`, `config`

## Flow: troubleshoot — When it misbehaves

> Goal: get from the symptom to the document or changelog entry that explains it, in one hop
> Signals: crash, hang, lag, 100% CPU, beachball, blank, stale, does not resume, error

### FAQ

- `xcodebuild` complains about Command Line Tools → `readme`
- Typing in the terminal feels laggy after my change → `agent-notes`
- The app pegs a CPU core while a sidebar or list is on screen → `agent-notes`, `changelog`
- My agent came back in the wrong working directory after a session restore → `upstream-faq`, `changelog`
- Agent sessions reopen as plain shells instead of resuming → `upstream-faq`, `config`
- Terminal content duplicates itself when I resize the window → `changelog`
- A global hotkey (⌘`) or a shortcut stopped responding → `changelog`, `config`
- Remote tmux panes are the wrong size, or the socket path is rejected → `remote`, `changelog`
- The build works on my machine but a user reports it broken on an older macOS → `agent-notes`

## Flow: contribute — Work on the code

> Goal: land a change that survives CI and review
> Signals: PR, test, lint, submodule, localization, pbxproj
> Next: AGENTS.md

### FAQ

- What do I run right after cloning? → `contributing`, `readme` → task `preflight`
- I added a test file but it reports "Executed 0 tests" → `agent-notes`
- I need to change something inside Ghostty itself → `contributing`, `agent-notes`
- CI failed on a package or workspace consistency check I have never heard of → `agent-notes`, `contributing`
- Does this string I just added need to be localized? → `agent-notes`
- Where does my new keyboard shortcut have to be registered? → `agent-notes`, `config`
- How do I rebuild and relaunch without clobbering my other builds? → `readme`, `contributing`

<!-- The full contributor contract — pitfalls, typing-latency rules, release
     process, submodule workflow — lives in AGENTS.md (symlink to CLAUDE.md).
     This guide deliberately does not restate it; see `agent-notes` and the
     Policy handoff below. -->

## Tasks

### Task: preflight — Confirm the build toolchain

```yaml
preconditions:
  - check: "xcodebuild -version"
    expect: "Xcode (2[6-9]|[3-9][0-9])\\."
    hint: "Xcode 26+ is required (README, Build from source). If this errors, run: sudo xcode-select -s /Applications/Xcode.app/Contents/Developer"
steps:
  - run: "xcodebuild -version"
    explain: "amux needs Xcode 26 or newer"
  - run: "zig version"
    explain: "zig builds GhosttyKit; scripts/setup.sh aborts without it (brew install zig)"
  - run: "tmux -V"
    explain: "tmux 3.x owns session existence — amux runs its own server as `tmux -L amux`"
verify:
  run: "tmux -V"
  expect: "^tmux 3\\."
on_fail: [readme, contributing]
```

<!-- TODO(maintainer): no Task exists for the actual build (`./scripts/setup.sh`,
     `./scripts/reload.sh --tag dev --launch`). Neither script exposes a
     verifiable success command that could be confirmed without a full Xcode
     build, so per the protocol the Task was left out rather than invented.
     Add one if a cheap post-build check exists. -->

## Glossary

| term | meaning |
| --- | --- |
| workspace | One amux workspace == one real tmux session on the `-L amux` server. Closing the app does not end it |
| tag | The `--tag` passed to `reload.sh`. Each tag gets its own bundle id and socket, so builds run side by side |
| control mode | `tmux -CC`. How amux projects tmux windows/panes into native surfaces instead of drawing tmux's own UI |
| muxa / muxad | The separate agent-observability daemon. It owns agent state (`working`, `waiting_input`, `waiting_choice`, `error`), not amux |
| surface | A single rendered pane — terminal, browser, markdown viewer, or canvas |
| attend | Jump to the agent that has been blocked longest (⌘⇧J) |
| GhosttyKit | The prebuilt Ghostty library the app renders through. Built by `scripts/setup.sh`, skippable with `CMUX_SKIP_ZIG_BUILD=1` |
| bonsplit | The vendored split/tab-bar layout engine under `vendor/` |

## Policy

```yaml
answer_style: "Concise. Lists over paragraphs. Three paragraphs max."
citations: required
max_reads_per_answer: 2
never:
  - "Editing the user's ~/.tmux.conf or default tmux server"
  - "Committing a submodule pointer before the submodule commit is pushed"
  - "Running commands not declared under Tasks"
handoff:
  session_notes: .guide/session-notes.md
  next: AGENTS.md
```
