# Agent Guide v0.1 — 규격 초안

Last Updated: 2026-08-27
Status: **Superseded by [`SPEC.md`](../../SPEC.md)** — 영문 정본이 저장소 루트에 있습니다.
이 문서는 설계 과정의 기록으로 남깁니다. 규범적 참조는 `SPEC.md`를 보세요.

| 자리 | 이름 |
| :--- | :--- |
| 매니페스트 파일 | `AGENT_GUIDE.md` |
| 저장소 · npm 패키지 | `agent-guide` |
| 산문 지칭 | **Agent Guide** (약어 없음) |

---

## 1. 범위

Agent Guide는 두 가지를 정의한다.

1. **매니페스트** — 프로젝트가 저장소 루트에 두는 `AGENT_GUIDE.md`
2. **세션 프로토콜** — 그 매니페스트를 받은 에이전트가 따라야 할 대화 절차

핵심 개념은 **flow**다. flow는 하나의 대화 세션 유형이며, 온보딩은 그중 하나일 뿐이다. 업그레이드, 문제 해결, 연동, 기여가 모두 같은 뼈대를 공유한다. 문서 지도·코드 지도·Tasks는 공유 자산이고, flow는 그것을 조합해 목적이 다른 대화를 만든다.

이 문서에서 MUST / SHOULD / MAY는 RFC 2119를 따른다.

## 2. 왜 Markdown인가

**1차 소비자가 파서가 아니라 LLM이다.** 보통 "구조화된 데이터 vs 산문"에서 데이터 포맷이 이기는 건 프로그램이 읽기 때문인데, 여기서는 에이전트가 읽는다. 에이전트는 잘 구조화된 Markdown을 중첩 YAML만큼 안정적으로 읽는다. 그럼 YAML이 남기는 이점은 엄격한 검증과 툴링뿐이고, 그건 부차적 관심사다.

Markdown을 고른 실질적 이유:

- **작성 장벽이 낮다.** 도입의 유일한 병목은 매니페스트 작성이다. YAML 들여쓰기를 두려워하는 사람은 많아도 표를 못 쓰는 사람은 없다.
- **GitHub 저장소 화면에서 렌더링된다.** 사람도 읽는 문서가 되고, 그러면 메인테이너가 최신으로 유지할 동기가 생긴다.
- **선례가 이쪽이다.** README, AGENTS.md, SKILL.md, CLAUDE.md 모두 Markdown이다.

다만 전부 산문으로 가지는 않는다. **정밀함이 필요한 곳 — frontmatter와 Tasks·Policy — 만 YAML**이다. 실행 명령과 검증 정규식이 애매하면 위험하기 때문이다.

## 3. 발견 (Discovery)

에이전트는 다음 순서로 매니페스트를 찾는다. 먼저 발견된 것을 쓰고 멈춘다.

1. `./AGENT_GUIDE.md`
2. `./.guide/AGENT_GUIDE.md`
3. `./docs/AGENT_GUIDE.md`
4. 호스팅 서비스: `https://<host>/.well-known/agent-guide.md`

원격 저장소만 아는 경우 raw URL로 1~3을 시도한다. 전부 실패하면 에이전트는 **저장소를 임의로 탐색하지 않고**, 사용자에게 매니페스트 위치를 묻거나 내용 붙여넣기를 요청해야 한다(MUST). 이 규칙이 없으면 토큰 폭발이라는 원래 문제로 되돌아간다.

## 4. 매니페스트 형식

### 4.1 전체 골격

```
AGENT_GUIDE.md
├── frontmatter (YAML)   버전·정체성·기준 URL
├── H1 + 개요 문단        에이전트가 그대로 쓰는 3문장
├── **Not for:**         안 맞는 사용자를 돌려보내는 줄
├── ## Docs              문서 지도 (표)          ─┐
├── ## Code map          코드 지도 (표)          ├─ 공유 자산
├── ## External          외부 문서 (표)          │
├── ## Flow: <id>        세션 유형 (여러 개)  ←──┘ 위 자산을 id 로 조합
├── ## Tasks             실행 절차 (YAML 블록)
├── ## Glossary          용어 (표)
└── ## Policy            행동 계약 (YAML 블록)
```

flow가 늘어도 작성 부담이 선형으로 늘지 않는 것이 이 분리의 목적이다. 새 flow는 대개 FAQ 몇 줄과 기존 Task id 참조로 끝난다.

### 4.2 섹션 식별 규칙

에이전트와 검증기는 **H2 제목의 맨 앞 영문 키**로 섹션을 식별한다(MUST).

```markdown
## Docs — 문서 지도
## Flow: upgrade — v1 → v2 마이그레이션
```

- 키(`Docs`, `Code map`, `External`, `Flow:`, `Tasks`, `Glossary`, `Policy`)는 고정이고 영어다.
- ` — ` 뒤의 문구는 자유이며, 사용자에게 보여줄 현지어 제목이다.
- 표는 **열의 순서가 규범이고 헤더 문구는 자유**다. 한국어 저장소는 헤더를 한국어로 쓴다.

영문 키를 강제하는 이유는 어느 언어로 쓴 매니페스트든 같은 방식으로 읽히게 하기 위해서다. 사람이 읽는 부분은 전부 현지어로 남는다.

### 4.3 frontmatter

```yaml
---
guide: "0.1"                 # 필수. 스펙 버전
name: foo                    # 필수
base: https://raw.githubusercontent.com/acme/foo/main/   # 필수. 상대 경로의 기준
tagline: 프롬프트를 코드처럼
status: beta                 # alpha | beta | stable | maintenance
language: ko
links: {repo, docs, issues, homepage, chat}
escalate_to: https://github.com/acme/foo/issues/new
---
```

frontmatter는 작게 유지한다. 여기 들어가는 것은 **사람이 읽을 필요가 없는 메타데이터**뿐이다.

### 4.4 개요와 `Not for`

H1 바로 다음 문단이 개요다. 3문장 이내로 쓴다(SHOULD). 에이전트는 이것을 **요약하지 않고 그대로 쓴다**(MUST). 요약은 왜곡을 낳고, 첫인상은 메인테이너가 직접 통제해야 한다.

```markdown
# foo — Agent Guide

foo는 팀이 LLM 프롬프트를 Git으로 버전 관리하고, 배포 전에 회귀 평가를
자동으로 돌리게 해주는 CLI입니다. 프롬프트 변경이 기존 케이스를 깨뜨리면 배포를 막습니다.

**Not for:** 프로덕션 트래픽 라우팅 · 모델 파인튜닝 · 프롬프트 자동 생성
```

`**Not for:**` 줄은 필수다(MUST). 안 맞는 사용자를 빨리 돌려보내는 것도 세션의 성공이고, 에이전트가 없는 기능을 있다고 답하는 사고를 구조적으로 막는다.

### 4.5 `## Docs` — 라우팅의 심장

열 순서: **id · 경로 · covers · 크기(선택)**

```markdown
## Docs — 문서 지도

| id | 경로 | 이럴 때 연다 | 크기 |
| --- | --- | --- | --- |
| quickstart | docs/quickstart.md | 설치, install, API 키, 첫 실행 | S |
| architecture | docs/architecture.md | 설계, 플러그인, 확장, 내부 동작 | L |
```

- `id`는 매니페스트 내에서 유일해야 한다(MUST). FAQ와 Task가 이것을 참조한다.
- 세 번째 열(covers)이 라우팅의 전부다. 에이전트는 질문을 covers·FAQ와 대조해 열 문서를 **먼저 고르고**, 그다음에 연다. 순서가 반대가 되면 안 된다(MUST NOT: 라우팅 전 임의 파일 열람).
- covers는 **문서 제목이 아니라 사용자가 실제로 쓸 표현**으로 적는다. "인증 아키텍처"가 아니라 `로그인, 토큰, 세션 만료`다.
- 크기 `S`/`M`/`L`은 읽기 예산 힌트다. `L` 문서는 전체를 읽지 말고 해당 섹션만 읽는 것을 권한다(SHOULD).

`## Code map`은 **경로 · 담당** 두 열이다. 문서에 없고 코드에만 있는 답을 위한 거친 지도이며, 디렉터리 단위로 적는다. 파일 단위로 쪼개면 금방 낡는다.

`## External`은 **url · covers** 두 열이다.

### 4.6 `## Flow:` — 세션 유형

```markdown
## Flow: upgrade — v1 → v2 마이그레이션

> Goal: 깨지는 변경을 파악하고 변환까지 마친다
> Signals: 업그레이드, 마이그레이션, v2, breaking
> Next: integrate

### Audiences

- 일단 써보고 싶어요 → task `install`
- 우리 CI에 붙이고 싶어요 → `ci-integration`
- 코드에 기여하고 싶어요 → flow `contribute`

### FAQ

- v2에서 뭐가 깨지나요? → `migration-v2` → task `scan-breaking-changes`
- 얼마나 걸리나요? → `migration-v2` ↪ 되돌릴 수 있나요?
```

- 제목의 `Flow:` 다음 토큰이 flow id다(MUST).
- 제목에 `(default)`가 붙은 flow가 초기 진입점이다. 정확히 하나여야 한다(MUST).
- 블록인용의 `Goal:`은 이 flow가 끝났을 때 도달해야 할 상태다. 에이전트의 방향타 역할을 한다.
- `Signals:`는 **다른 flow를 진행하는 도중** 이 flow로 전환할지 감지하는 키워드다.
- `Next:`는 flow가 끝난 뒤 제안할 다음 flow 또는 문서다.
- `### Audiences`는 flow 내부의 2차 분기다. 라벨은 사용자 1인칭으로 쓴다.
- `### FAQ` 각 줄의 문법:

```
- <질문> → `doc-id`[, `doc-id`...] [→ task `task-id`] [↪ <이어질 질문>]
```

`→`는 근거 문서, `→ task`는 실행으로의 연결, `↪`는 followup이다.

### 4.7 `## Tasks` — 실행 절차

```markdown
### Task: install — 로컬 설치

```yaml
preconditions:
  - check: "node --version"
    expect: "v(2[0-9]|[3-9][0-9])\\."
    hint: "Node 20 이상이 필요합니다"
steps:
  - run: "npm i -g @acme/foo"
    explain: "CLI를 전역 설치합니다"
verify:
  run: "foo --version"
  expect: "^foo \\d+\\."
on_fail: [troubleshooting]
```
```

`expect`는 정규식이다. `on_fail`은 Docs id를 가리킨다.

실행 규칙:

- 에이전트는 `steps`의 명령을 실행하기 전 사용자 동의를 받아야 한다(MUST).
- `## Tasks`에 선언되지 않은 명령을 세션의 일부로 실행해서는 안 된다(MUST NOT).
- `verify`가 실패하면 `on_fail` 문서를 열고, 거기서도 답이 없으면 frontmatter의 `escalate_to`를 안내한다(MUST).

### 4.8 `## Policy` — 행동 계약

```yaml
answer_style: "간결하게. 목록 위주. 3문단 이내"
citations: required          # required | optional (기본 required)
max_reads_per_answer: 2      # 기본 2
never:
  - "사용자 동의 없이 파일 수정"
  - "Tasks에 없는 명령 실행"
handoff:
  session_notes: .guide/session-notes.md
  next: AGENTS.md
```

### 4.9 경로 해석 — 막다른 길을 금지한다

`Docs`·`Code map`의 경로는 다음 순서로 해석한다.

1. **저장소 루트** 기준 상대 경로 — 에이전트의 현재 작업 디렉터리가 아니다
2. frontmatter의 `base`를 붙인 원격 URL
3. 저장소 안에서 같은 파일명 검색 — 경로가 바뀐 경우를 잡는다
4. 그래도 없으면 `escalate_to`

에이전트는 1에서 실패했다고 멈춰서는 안 된다(MUST NOT). **`base`가 선언되어 있다면 그것은 메인테이너가 이미 승인한 경로다. 별도 동의를 구하지 말고 사용한다**(SHOULD).

시도한 경로와 결과는 한 줄로 알린다(SHOULD). 사용자에게 선택지를 떠넘기는 것은 실패다 — 스스로 해결하고 결과를 보고한다.

### 4.10 flow 전환

대화 중 사용자 발화가 다른 flow의 `Signals:`와 맞으면:

1. 에이전트는 전환할지 **묻는다**(MUST). 말없이 옮겨가지 않는다.
2. 동의하면 해당 flow로 이동하고, 이전 flow와 진행 위치를 기억한다(MUST).
3. 전환한 flow가 끝나면 원래 flow로 돌아갈지 제안한다(SHOULD).

> 사용자: 설치했는데 `foo eval`에서 에러가 나요
> 에이전트: 문제 해결 flow로 잠깐 넘어갈까요? 진단 정보부터 모으겠습니다. 끝나면 원래 하시던 첫 평가 실행으로 돌아옵니다.

정해진 순서를 따라가는 게 아니라 대화가 경로를 정한다는 것이 이 프로토콜의 요지다.

## 5. 세션 프로토콜

```
DISCOVER → ORIENT → ROUTE ⇄ ANSWER ⇄ ACT → HANDOFF
                      ↑______________|
                      └── SWITCH (flow 전환, §4.10)
```

### 5.1 DISCOVER
매니페스트를 찾아 읽는다. 이 단계에서 읽는 파일은 매니페스트 하나뿐이다(MUST).

### 5.2 ORIENT — 첫 응답

첫 응답은 다음을 정확히 이 순서로 포함한다(MUST).

1. 개요 문단 — 그대로, 150단어 이내
2. `status`와 `Not for` 중 사용자에게 중요한 항목
3. **flow 선택지** — 각 flow의 현지어 제목, `(default)`인 것을 기본값으로 표시
4. 기본 flow의 FAQ에서 상위 4~6개 질문

첫 응답 이전에 매니페스트 외 파일을 여는 것은 금지한다(MUST NOT). "혹시 몰라서" 문서를 미리 읽는 행동이 이 프로토콜이 없애려는 바로 그 문제다.

첫 질문은 "당신은 누구인가"가 아니라 **"무엇을 하려 하는가"**다. 후자가 실행에 더 가깝다. Audiences는 flow를 고른 뒤의 2차 분기로 내려간다.

### 5.3 ROUTE → ANSWER — 질의 루프

각 질문마다:

1. 질문을 현재 flow의 FAQ 및 Docs의 covers와 대조한다.
2. 매칭된 문서만 연다. 기본 상한은 2개(`max_reads_per_answer`).
3. 답변에는 출처를 표기한다 — `[출처: docs/quickstart.md#api-key]` (MUST).
4. 매칭이 없어도 **답할 수 있으면 답한다**. 다만 근거의 출처를 구분해서 밝힌다(MUST).
   - 문서에서 온 답 → 경로를 적는다
   - 매니페스트 밖의 일반 지식이나 추론 → "매니페스트 밖" 또는 "확인 필요"로 표시한다
   - 확인할 방법이 없는 사실 → 모른다고 말하고 `escalate_to`를 안내한다

   금지되는 것은 **추론 자체가 아니라 근거 없는 단정**이다. 표시된 추론은 사용자에게 도움이 되고, 표시되지 않은 단정은 환각이다.
5. 다른 flow의 `Signals:`에 걸리면 §4.10으로 간다.
6. `↪` followup이 있으면 다음 질문 후보를 함께 제시한다(SHOULD).

### 5.4 ACT — 실행

§4.7의 규칙을 따른다. 사용자가 "설치해줘"처럼 실행 의도를 드러내면 ANSWER 대신 ACT로 넘어간다.

### 5.5 HANDOFF — 마무리

세션 종료 시 다음을 제안한다(SHOULD).

- 질문·답변·실행 결과를 `handoff.session_notes` 경로에 저장
- 답하지 못한 질문이 있었다면 이슈 초안 작성 (`escalate_to`)
- flow의 `Next:`가 지정한 다음 flow 또는 다음 문서 안내

세션 노트는 부수 효과가 아니라 설계 의도다. **답하지 못한 질문 목록이 곧 메인테이너에게 가장 값진 문서 개선 신호**다.

## 6. 초기 프롬프트 (정본)

README에 붙이는 블록. 자기완결적이며 외부 조회는 매니페스트 1회뿐이다.

영어 정본, 짧은 형태(3줄), README 삽입 위치, 치환 규칙은 [reference/readme-block.md](../reference/readme-block.md)에 모아두었다. 아래는 한국어 정본이다.

````markdown
## 🤖 에이전트와 함께 시작하기

아래 블록을 통째로 복사해 사용하는 AI 에이전트에 붙여넣으세요.

```
당신은 Agent Guide v0.1 세션을 진행합니다.

1. 다음 순서로 매니페스트를 하나만 읽으세요:
   https://raw.githubusercontent.com/<org>/<repo>/main/AGENT_GUIDE.md
   → 실패하면 로컬 ./AGENT_GUIDE.md
   → 둘 다 실패하면 저장소를 뒤지지 말고 내게 파일 내용을 요청하세요.
2. 매니페스트의 Policy를 따르세요. 규칙:
   - 첫 응답 전에 다른 파일을 열지 마세요.
   - 답변마다 출처 경로를 표기하세요.
   - 매니페스트에 없는 내용은 지어내지 말고, 모른다고 말한 뒤 escalate_to를 안내하세요.
   - 명령 실행은 Tasks에 선언된 것만, 내 동의를 받고 하세요.
3. 첫 응답: 개요 문단 그대로 → Not for → Flow 선택지(기본값 표시)
   → 기본 Flow의 FAQ 상위 5개. 그다음 내 질문을 기다리세요.
4. 대화 중 내 말이 다른 Flow의 Signals에 해당하면, 전환할지 먼저 묻고
   그 Flow가 끝나면 원래 자리로 돌아오세요.
```
````

`<org>/<repo>`는 CLI가 채워 넣는다.

## 7. 다른 표준과의 관계

| | 대상 | 형태 | 성격 |
| :--- | :--- | :--- | :--- |
| `llms.txt` | LLM 일반 | 링크 목록 | 정적 색인, 단발 조회 |
| `AGENTS.md` | 코딩 에이전트 | 자연어 규약 | 기여자 규칙(빌드·테스트·컨벤션) |
| `apm.yml` | 에이전트 배포 | 매니페스트+락파일 | 에이전트 구성의 재현 가능한 설치 |
| **`AGENT_GUIDE.md`** | **사람 ↔ 에이전트 대화** | **매니페스트 + 세션 프로토콜** | **상태를 가진 세션, 의도 라우팅, 실행·검증** |

경쟁이 아니라 계층이 다르다. `AGENT_GUIDE.md`는 `llms.txt`나 `AGENTS.md`가 이미 있으면 그것을 Docs 표에 넣어 참조하고, 기여 flow의 `Next:`로 `AGENTS.md`를 넘겨준다.

## 8. 준수 수준

| 수준 | 조건 |
| :--- | :--- |
| **Core** | frontmatter · 개요 · `Not for` · `## Docs` · flow 1개(FAQ 포함) · README 초기 프롬프트 |
| **Guided** | Core + `## Policy` · `## Code map` · flow 2개 이상 |
| **Interactive** | Guided + `Signals:`로 flow 전환 · `## Tasks`에 검증 가능한 `verify` |

배지를 수준별로 제공한다. 도입 사다리를 낮은 단에서 시작하게 만드는 장치다.

## 9. 확장

- 규격이 정의하지 않은 H2 섹션은 검증기가 경고만 낸다. 오류가 아니다.
- v0.2 후보: 다국어 매니페스트, MCP 서버 형태의 제공, 세션 노트 표준 포맷, flow 간 상태 전달.
