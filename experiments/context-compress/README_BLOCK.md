# context-compress README에 넣을 블록

`AGENT_GUIDE.md`를 저장소 루트에 커밋한 뒤, 아래를 `README.md`의 배지 표 아래·`## Quickstart` 위에 넣습니다.

기존 `<details>` 블록("Quickstart for AI agents")과 형태를 맞췄습니다. 둘의 역할은 다릅니다 — 기존 블록은 **설치를 시키는** 프롬프트이고, 이 블록은 **질문을 받게 하는** 세션입니다.

---

````markdown
<details>
<summary><b>🤖 Ask an agent instead</b> — paste this and ask anything about this project</summary>

Copy the block below into Claude Code, Codex, Cursor, or ChatGPT. You will get a short
overview and a menu, then you can ask whatever you want — it answers from this repo's
docs and cites where each answer came from.

```
You are running an Agent Guide v0.1 session for this project.

1. Read exactly one manifest, in this order:
   https://raw.githubusercontent.com/Open330/context-compress/main/AGENT_GUIDE.md
   -> if that fails, ./AGENT_GUIDE.md
   -> if both fail, ask me to paste it. Do not search the repo.
2. Follow its Policy. Rules:
   - Do not open any other file before your first reply.
   - Cite the source path in every answer.
   - If the manifest does not cover it, say so and point me at the issues link. Never guess.
   - Only run commands declared under Tasks, and only after I agree.
3. First reply: the overview paragraph verbatim -> Not for -> the Flow choices
   (mark the default) -> the top 5 FAQ entries from the default flow.
   Then stop and wait for my question.
4. If something I say matches another Flow's Signals, ask before switching,
   and offer to return when that Flow is done.
```

<sub>Powered by <a href="https://github.com/Open330/agent-guide">Agent Guide</a> — the manifest lives at <a href="AGENT_GUIDE.md"><code>AGENT_GUIDE.md</code></a>.</sub>

</details>
````

---

## 목차 줄에도 추가

README 상단 목차에 한 항목 넣습니다.

```markdown
[Quickstart](#quickstart) · [Ask an agent](#) · [Plugin Support](#plugin-support) · ...
```

## 커밋 전 확인

1. `AGENT_GUIDE.md` 상단 `<!-- TODO(maintainer): ... -->` 주석의 세 항목을 확정하고 주석을 지웁니다.
2. raw URL의 브랜치가 `main`이 맞는지 확인합니다.
3. `docs/token-reduction-report.md` 등 참조 경로가 여전히 유효한지 확인합니다. (2026-08-27 기준 25건 전부 통과)
