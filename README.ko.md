<div align="center">

# Agent Guide

**README는 읽지 않는 사람을 위해 쓰여 있습니다.**<br/>
대신 매니페스트를 배포하고, 상대의 에이전트가 프로젝트를 안내하게 하세요.

[![npm](https://img.shields.io/npm/v/@open330/agent-guide?color=cb3837&logo=npm&logoColor=white)](https://www.npmjs.com/package/@open330/agent-guide)
[![spec](https://img.shields.io/badge/spec-v0.1-5b21b6)](SPEC.md)
[![code](https://img.shields.io/badge/code-MIT-blue)](LICENSE)
[![spec licence](https://img.shields.io/badge/spec-CC%20BY%204.0-blue)](LICENSE-SPEC)
[![status](https://img.shields.io/badge/status-alpha-orange)](#상태)
[![Agent Guide: Interactive](https://img.shields.io/badge/Agent_Guide-Interactive-brightgreen)](AGENT_GUIDE.md)

[English](README.md) · **한국어**

[시작하기](#시작하기) · [무엇을 얻나](#무엇을-얻나) · [어디에 위치하나](#어디에-위치하나) · [CLI](#cli) · [근거](#정말-작동합니까) · [규격](SPEC.md)

</div>

---

## 시작하기

**가이드를 만들 저장소 안에서** 에이전트를 열고 이걸 붙여넣으세요.

<div><img src="https://quickstart-for-agents.vercel.app/api/header.svg?theme=github-dark&title=%EC%9D%B4+%EC%A0%80%EC%9E%A5%EC%86%8C%EC%9D%98+AGENT_GUIDE.md%EB%A5%BC+%EC%9E%91%EC%84%B1%ED%95%98%EC%84%B8%EC%9A%94&lang=Agents" width="100%" /></div>

```
https://raw.githubusercontent.com/Open330/agent-guide/main/templates/authoring-prompt.ko.md
를 읽고 그대로 따라 이 저장소의 AGENT_GUIDE.md를 작성하세요.
```

<div><img src="https://quickstart-for-agents.vercel.app/api/footer.svg?theme=github-dark&text=%EB%B3%B5%EC%82%AC+%C2%B7+%EC%97%90%EC%9D%B4%EC%A0%84%ED%8A%B8%EC%97%90+%EB%B6%99%EC%97%AC%EB%84%A3%EA%B8%B0+%C2%B7+AGENT_GUIDE.md+%EC%83%9D%EC%84%B1" width="100%" /></div>

<sub>세션에 네트워크가 막혀 있다면 <code>npx @open330/agent-guide author --ko</code>가 출력하는 전문을 붙여넣으세요. 프롬프트는 자기완결적입니다.</sub>

몇 분 뒤 `AGENT_GUIDE.md`가 생기고, 에이전트가 멈춰서 **저장소만 읽어서는 알 수 없는 세 가지**를 물어봅니다. 그중 중요한 건 **이 프로젝트가 하지 _않는_ 일**입니다. README는 자기가 못 하는 일을 절대 쓰지 않고, 그 줄이 에이전트가 없는 기능을 지어내는 것을 막습니다.

그다음 검증하고, 독자가 붙여넣을 블록을 받습니다.

```bash
npx @open330/agent-guide validate         # 모든 경로·앵커·id가 해석되지 않으면 실패
npx @open330/agent-guide prompt --inline  # 내 README에 넣을 붙여넣기 블록
```

---

## 무엇을 얻나

독자는 블록 하나를 자기 에이전트에 붙여넣습니다. README를 훑는 대신 대화를 합니다.

> **🤖** context-compress는 큰 툴 출력이 에이전트의 컨텍스트 창에 들어가는 것을 막습니다. 셸 명령을 가로채 샌드박스에서 실행하고 필터된 응답만 돌려주며, 전체 데이터는 로컬 FTS5 인덱스에 검색 가능한 상태로 남습니다.
>
> **이건 하지 않습니다:** 에이전트 자신의 대화 이력 압축 · 코드 검색 도구 대체
>
> 무엇을 하시겠어요? — **onboard**(기본) · integrate · troubleshoot · contribute
>
> 자주 나오는 질문: 어떻게 설치하나요? · MCP를 꼭 써야 하나요? · RTK와 뭐가 다른가요? …

> **🧑** doctor는 다 통과했다는데 재시작하면 search에 아무것도 안 잡혀요
>
> **🤖** 버그가 아니라 기본값입니다 — `persistDb`가 false라 인덱스가 메모리로 열리고 서버가 종료되면 사라집니다. `CONTEXT_COMPRESS_PERSIST_DB=1`을 설정하세요. `[출처: README.md#configuration, CHANGELOG.md]`
>
> 이건 **troubleshoot** flow에 해당합니다 — 전환할까요? 끝나면 원래 자리로 돌아옵니다.

여기서 일반 README가 못 하는 일이 셋 있습니다.

| | |
| :--- | :--- |
| **라우팅했습니다** | 질문에는 "persistence"라는 단어가 없고 "search에 안 잡힌다"만 있습니다. 매니페스트가 증상을 문서에 잇기 때문에 저장소를 훑지 않고 파일 하나만 열었습니다 |
| **출처를 밝혔습니다** | 모든 답이 어디서 왔는지 말합니다. 매니페스트가 안 다루는 것은 추측하지 않고 그렇다고 말합니다 |
| **한계를 압니다** | `Not for`는 필수입니다. 없는 기능을 확신 있게 설명하는 것을 막는 가장 값싼 방법입니다 |

<details>
<summary><b>이 저장소로 시험해보기</b> — 여기서 에이전트에 붙여넣으세요</summary>

```
당신은 이 프로젝트의 Agent Guide 세션을 진행합니다. 아래 개요는 그대로 쓰세요.

Agent Guide is a manifest format and a session protocol that lets any AI agent run an interactive walkthrough of your project. You add one file — `AGENT_GUIDE.md` — and a paste block to your README; a reader's agent then answers their questions from your docs, cites where each answer came from, and runs your setup steps with their consent. Onboarding is the default session, but the same manifest also drives upgrades, troubleshooting, integration and contribution.

이건 하지 않습니다: defining contributor rules — that is `AGENTS.md`, and we hand off to it · generating or replacing your documentation · packaging or distributing agents · hosting anything

무엇을 하시겠어요?
  - onboard (기본) — New here
  - author — Put a manifest in my repo
  - troubleshoot — The agent is not behaving
  - contribute — Help build the spec

자주 나오는 질문:
  - How is this different from AGENTS.md?
  - Do I still need AGENTS.md?
  - If I already have llms.txt, is this redundant?
  - What is a Flow?
  - Why Markdown instead of YAML?

■ 규칙 (지금은 파일을 열지 마세요. 위 내용을 보여주고 내 답을 기다리세요.)
· 내가 질문하면 그때 ./AGENT_GUIDE.md 를 읽고, Docs 표의 covers로 열 문서를 고르세요.
  보통 1~2개면 됩니다.
· 문서에서 온 답은 경로를 적고, 매니페스트 밖이면 그렇게 표시하세요.
  추론은 환영합니다. 표시 없는 단정만 하지 마세요.
· 경로가 안 잡히면 저장소 루트 → frontmatter base → 파일명 검색 순으로 스스로 해결하세요.
· Tasks의 명령은 동의를 받고, effects가 붙은 단계는 무슨 영향인지 말한 뒤 명시적 승낙을 받으세요.
· 다른 Flow의 Signals에 맞으면 먼저 답하고 전환을 제안하세요.

간결하게, 내가 쓰는 언어로 답하세요.
```

<sub><code>agent-guide prompt --inline</code>이 생성합니다. 첫 응답을 블록이 들고 가므로 에이전트가 아무것도 열지 않고 답합니다. 첫 토큰까지의 시간이 절반이 됩니다. 매니페스트와 어긋나면 <code>validate</code>가 경고합니다.</sub>

<!-- agent-guide:inline 38bab678 -->

</details>

---

## 매니페스트 생김새

가장 작은 형태는 25줄 정도입니다.

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

섹션 키 — `Docs`, `Flow:`, `Tasks`, `Policy` — 는 영문 고정이라 어떤 언어로 쓴 매니페스트든 같은 방식으로 읽힙니다. 사람이 읽는 부분은 전부 저장소의 언어입니다.

무게를 지는 건 두 열입니다.

- **`covers`** 가 라우팅 테이블입니다. 문서 제목이 아니라 **막힌 사람이 실제로 칠 말**을 적으세요. `Authentication`보다 `ValidationError, 401, 세션 만료`가 낫습니다. 에러 메시지 원문이 가장 강하고, 언어를 넘나들며 작동합니다.
- **`Not for`** 는 필수이고 파일에서 가장 쓰기 어려운 줄입니다. 나머지는 저장소에서 유도할 수 있지만 이것만은 안 됩니다.

더 보기: [`examples/`](examples/) · [형식 치트시트](.context/reference/manifest-format.md) · [SPEC.md](SPEC.md)

---

## 어디에 위치하나

이미 있는 파일을 대체하지 않습니다. 다른 계층입니다.

| | 대상 | 형태 | 성격 |
| :--- | :--- | :--- | :--- |
| `llms.txt` | LLM 일반 | 링크 목록 | 정적 색인, 단발 조회 |
| `AGENTS.md` | 코딩 에이전트 | 자연어 규약 | 기여자 규칙 — 빌드·테스트·스타일 |
| `apm.yml` | 에이전트 배포 | 매니페스트+락파일 | 에이전트 구성의 재현 가능한 설치 |
| **`AGENT_GUIDE.md`** | **사람 ↔ 에이전트 대화** | **매니페스트 + 세션 프로토콜** | **상태를 가진 세션: 의도 라우팅, 실행, 검증** |

`AGENTS.md`가 이미 있나요? Docs 표에 넣고 넘겨주세요. 다시 쓰지 마세요.

---

## CLI

```bash
npx @open330/agent-guide author            # 매니페스트를 쓰게 하는 프롬프트
npx @open330/agent-guide validate          # 구조·참조·경로·앵커
npx @open330/agent-guide prompt --inline   # 내 README에 넣을 붙여넣기 블록
npx @open330/agent-guide init              # 저장소를 훑어 초안 생성
npx @open330/agent-guide badge             # README에 붙일 준수 수준 배지
```

CI에 넣을 것은 `validate`입니다. 저작 프로토콜이 사람에게 손으로 시키는 검사를 자동화합니다 — 모든 Docs 경로 해석, 모든 제목 앵커 확인, 모든 `id` 추적 — 그리고 계산된 준수 수준을 보고합니다.

```yaml
- run: npx @open330/agent-guide validate
```

**앵커 10개를 손으로 다 확인했다고 보고한 매니페스트에서 깨진 앵커를 찾아냈고, 같은 실행에서 자기 slug 함수의 버그도 드러냈습니다.** 참조 검사는 눈으로 할 일이 아닙니다.

<details>
<summary><b><code>init</code>이 일부러 미완성을 주는 이유</b></summary>

`init`은 정적 스캔이 알 수 있는 것만 채웁니다 — 경로, 앵커, 패키지 메타데이터. `covers`와 FAQ, 모든 Task는 `TODO(maintainer)` 블록과 함께 비워둡니다.

**그럴듯하지만 틀린 라우팅 테이블은 명백히 빈 것보다 나쁩니다.** 다음 단계가 `author`이고, 그게 에이전트로 하여금 이슈와 CHANGELOG에서 실제로 나온 질문을 캐내게 합니다.

</details>

---

## 준수 수준

낮은 단에서 시작하세요. 가치의 대부분이 거기 있습니다.

| 수준 | 필요한 것 |
| :--- | :--- |
| **Core** | frontmatter · 개요 · `Not for` · `## Docs` · FAQ 있는 flow 1개 · 붙여넣기 블록 |
| **Guided** | Core + `## Policy` · `## Code map` · flow 2개 이상 |
| **Interactive** | Guided + `Signals:`로 flow 전환 · 실행 가능한 `verify`가 있는 `## Tasks` |

이 저장소 자신의 매니페스트는 Interactive가 아니라 **Guided**입니다. `## Tasks`가 없는데, 규격 문서를 상대로 돌릴 수 있는 `verify` 명령이 없기 때문이고 [저작 프로토콜](.context/architecture/authoring-protocol.md)이 그걸 지어내는 것을 금지하기 때문입니다. **우리도 우리 규칙의 예외가 아닙니다.**

---

## 할 수 없는 것

Agent Guide는 **의도를 선언할 뿐 강제하지 않습니다.** 매니페스트의 어떤 것도 에이전트가 명령을 실행하는 것을 막지 못합니다. 붙여넣기 블록은 요청이고 매니페스트는 문서이며, 실행을 실제로 막는 것은 호스트의 권한 시스템뿐입니다.

얼버무리는 게 아니라 측정한 것입니다 — 한 시나리오를 3회 돌렸을 때, 한 에이전트가 평문으로 하지 말라는 말을 듣고도 그중 1회에서 `npm install -g`를 묻지 않고 실행했습니다.

그래서 단계가 자기가 무엇을 할지 선언할 수 있게 했습니다.

```yaml
steps:
  - run: "foo setup --auto"
    explain: "MCP 서버를 등록하고 훅을 설치합니다"
    effects: [writes-user-config]
```

`effects`는 선택이고 어휘는 열려 있습니다. **동의 규칙에 대상을 만들어 주려고 존재합니다** — "명령 실행 전에 동의를 받으세요"는 에이전트가 모호하게 만족시킬 수 있는 요청이지만, "`effects`가 붙은 단계는 명시적 승낙이 필요하고 무슨 영향인지 말하라"는 대상이 있는 규칙입니다. 이걸 넣자 그 에이전트의 동의 체크가 3회 기준 **3/6에서 6/6으로** 올라갔습니다.

`validate`는 전역 설치나 작업 디렉터리 밖 쓰기에 `effects`가 없으면 **경고**합니다. 오류가 아닙니다 — CI를 깨는 오탐은 검사를 지우게 만듭니다.

---

## 정말 작동합니까

[`experiments/`](experiments/)에 시도한 모든 저장소를 실패까지 포함해 남겼습니다. 규격 조항 여럿이 측정 때문에 생겼습니다.

| | 무엇이 깨졌나 | 무엇이 바뀌었나 |
| :-: | :--- | :--- |
| **6** | 과도하게 규정적인 블록 탓에 에이전트가 답하는 대신 멈춰서 사용자에게 선택지를 떠넘김 | "다른 파일 열지 마라"를 첫 응답까지로 한정. "추측하지 마라"를 "답하되 검증 안 된 것은 표시하라"로 |
| **12** | 두 번째 에이전트가 세 질문 연속으로 "이건 troubleshoot flow입니다, 전환할까요?"만 답함. 규칙은 완벽히 지키고 아무도 못 도움 | §4.10이 **먼저 답하고** 전환을 제안하도록 변경. 20/25 → 29/29, 168자 비답변이 758자 진단으로 |
| **19** | 블록을 붙여넣고 첫 글자까지 4.5초 | 블록이 첫 응답을 **들고 가도록** 변경. 첫 토큰까지 4.2s → 2.0s, 첫 응답 전 툴 호출 1 → 0 |

이 숫자들은 [`eval/`](eval/)이 만들었습니다. Claude Code와 Codex를 시나리오에 태우고 **산문이 아니라 툴 호출로** 채점하기 때문에, "저장소를 통째로 읽고 답했나"가 의견이 아니라 **횟수**가 됩니다. 체크는 두 등급으로 나눠 따로 집계합니다 — hard는 사실, soft는 정규식 — 이걸 흐리는 하니스는 정규식을 카운트만큼 믿게 만들기 때문입니다.

**네 번에 걸쳐, 제대로 얼버무린 응답을 하니스가 실패로 채점했습니다.** 그래서 `eval/README.md`에 규칙으로 적혀 있습니다 — **체크가 실패하면 에이전트보다 측정 도구를 먼저 의심할 것.**

---

## 상태

Alpha. 규격은 작성됐고, 스스로에게 적용했으며, 실제 저장소 네 곳에서 측정했습니다. 1.0 전까지 형식은 바뀔 수 있다고 보세요.

설계 기록과 각 결정의 근거: [`.context/`](.context/) · [로드맵](.context/planning/roadmap.md)

## 라이선스

규격과 산문 — `SPEC.md`, `.context/`, `templates/`, `examples/` — 는 [CC BY 4.0](LICENSE-SPEC), 나머지는 [MIT](LICENSE)입니다.

**인용·포크·재구현이 안 되는 프로토콜은 퍼지지 않습니다.**
