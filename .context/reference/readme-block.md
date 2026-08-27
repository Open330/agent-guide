# README 블록 — 정본과 사용법

Last Updated: 2026-08-27

메인테이너가 자기 저장소 README에 붙이는 블록입니다. **이 블록이 사실상 제품의 전부**입니다. 매니페스트가 아무리 좋아도 사용자가 이걸 복사하지 않으면 세션은 시작되지 않습니다.

---

## 1. 설계 원칙 — 가두지 말 것

v0.1 초안의 프롬프트는 실패했습니다. 실험에서 드러난 증상은 이렇습니다.

> 사용자: RTK랑 뭐가 다른가요?
> 에이전트: 로컬에 README.md가 없습니다. 다음 중 택일해 주세요. 1) 원격에서 가져오기(동의 필요) 2) 이슈로 에스컬레이션

매니페스트에 `base`가 원격 URL로 **이미 선언돼 있는데도** 동의를 물었습니다. 메인테이너가 승인해둔 경로인데요. 규칙을 지키느라 답을 못 준 겁니다.

원인은 규칙의 내용이 아니라 **적용 범위**였습니다.

| 초안의 문제 | 고친 방향 |
| :--- | :--- |
| "다른 파일 열지 마라"를 세션 전체에 걸었다 | **첫 응답까지만** 적용한다고 명시 |
| "추측하지 마라"가 도움 자체를 막았다 | 추론은 허용하되 **출처를 구분해 표시**하게 한다 |
| 문서를 못 찾으면 사용자에게 선택지를 떠넘겼다 | **폴백 사다리**를 주고 "막다른 길 금지"를 명시 |
| 금지 목록만 있고 목표가 없었다 | 맨 앞에 **"지도이지 울타리가 아니다"** 한 줄 |

원칙은 하나입니다. **금지되는 것은 추론이 아니라 근거 없는 단정입니다.** 표시된 추론은 사용자에게 도움이 되고, 표시되지 않은 단정이 환각입니다.

## 2. 어디에 넣는가

배지 바로 아래, **Quickstart보다 위**에 둡니다. Quickstart 아래로 내려가면 이미 설치를 시작한 사람만 보게 되는데, 그 사람은 이 블록이 필요 없습니다.

접어두는 것을 권합니다(`<details>`). 사람 독자에게는 README를 길게 만들지 않으면서, 필요한 사람은 한 번 클릭으로 도달합니다.

## 3. 정본은 `templates/`에 있습니다

| 파일 | |
| :--- | :--- |
| [`templates/readme-block.en.md`](../../templates/readme-block.en.md) | 영어 |
| [`templates/readme-block.ko.md`](../../templates/readme-block.ko.md) | 한국어 |

**여기에 복사본을 두지 않습니다.** 한동안 뒀다가 실제로 낡았습니다 — 발견 7의 로컬 우선 순서와 발견 12의 "먼저 답하고" 규칙이 반영되지 않은 채 남아 있었습니다. 정본이 두 곳에 있으면 반드시 갈라집니다.

이 문서는 **왜 그렇게 쓰였는지**를 남기는 자리입니다.

## 5. 짧은 형태 — 4줄

이미 저장소를 클론한 사용자에게는 이걸로 충분합니다. 정본과 함께 제시하되, **기본값은 정본**입니다.

```
Read AGENT_GUIDE.md here and run it as an Agent Guide session — it is a map, not a fence.
First reply only: the overview, Not for, the Flow choices, the default Flow's top FAQ. Nothing else opened.
After that: route through covers, cite paths, label anything unverified, ask before running commands.
If a path will not resolve, fall back to the frontmatter `base` yourself instead of asking me.
```

M3 평가 하니스에서 정본과 짧은 형태의 준수율을 나란히 재고, 차이가 작으면 짧은 형태를 기본으로 승격합니다.

## 6. README에 넣는 형태

````markdown
<details>
<summary><b>🤖 Ask an agent instead</b> — paste this and ask questions about this project</summary>

Copy the block below into Claude Code, Codex, Cursor, or ChatGPT.
It will give you a short overview and a menu, then answer from this repo's docs — with sources.

```
(위 §3 정본)
```

</details>
````

## 7. 치환할 것

| 자리표시자 | 넣을 값 |
| :--- | :--- |
| `<org>/<repo>` | GitHub 사용자·조직명과 저장소명 |
| `main` | 기본 브랜치 이름. `master`면 바꾼다 |

`agent-guide prompt` 명령이 이 치환을 대신합니다(M2).

## 8. 주의

- **raw URL은 기본 브랜치를 가리켜야 합니다.** 태그나 커밋 SHA로 고정하면 매니페스트를 고쳐도 사용자에게 반영되지 않습니다.
- **"지도이지 울타리가 아니다" 첫 줄을 빼지 마세요.** 이 한 줄이 나머지 규칙의 해석 방향을 정합니다. 이게 없으면 에이전트가 금지 목록을 문자 그대로 읽고 막다른 길에서 멈춥니다.
- **"첫 응답까지만"이라는 범위 표시를 빼지 마세요.** 세션 전체로 읽히는 순간 답을 못 하는 에이전트가 됩니다.
- **저장소 언어에 맞추세요.** 영어 저장소에 한국어 블록을 넣으면 아무도 복사하지 않습니다.
- **Codex CLI는 원격 조회가 막힌 경우가 많습니다.** 로컬 폴백을 빼지 마세요.
- **"먼저 답하고" 전환하라는 순서를 빼지 마세요.** 이게 없으면 에이전트가 "이건 troubleshoot Flow입니다, 전환할까요?"만 하고 멈춥니다. Codex에서 세 턴 연속으로 실측됐습니다 — 168자, 진단 없음, 문서 0개.
