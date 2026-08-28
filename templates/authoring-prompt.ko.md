<!-- Agent Guide — 저작 프롬프트 (한국어)
     AGENT_GUIDE.md 가 없는 저장소에서 이걸 붙여넣으면 에이전트가 만들어 줍니다.
     `agent-guide author --ko` 로도 출력됩니다.

     이 블록은 자기완결적입니다. 규격을 받아오지 않아도 형식을 알 수 있어야
     비공개 저장소나 네트워크가 막힌 환경에서도 동작합니다. -->

```
이 저장소의 AGENT_GUIDE.md를 작성하세요.

【중요】이건 README 요약본이 아닙니다. 사용자가 실제로 던지는 질문과, 그 답이
있는 문서를 잇는 라우팅 테이블입니다. 요약을 쓰면 실패입니다.

━━ 만들 형식 ━━

---
guide: "0.1"
name: <제품명>
status: <alpha|beta|stable|maintenance>
base: https://raw.githubusercontent.com/<org>/<repo>/main/
links: {repo: ..., issues: ...}
escalate_to: <새 이슈 URL>
---

# <제품명> — Agent Guide

<개요 3문장. 에이전트가 요약하지 않고 그대로 씁니다.>

**Not for:** <이 프로젝트가 하지 않는 일> · <또 하나> · <또 하나>

## Docs — 어디를 볼 것인가

| id | 경로 | 이럴 때 연다 | 크기 |
| --- | --- | --- | --- |
| quickstart | README.md#quick-start | 설치, 처음, 안 깔림, 요구사항 | S |

## Code map — 코드가 사는 곳

| 경로 | 담당 |
| --- | --- |
| src/cli/ | 명령 진입점 |

## Flow: onboard — 처음 오셨나요 (default)

> Goal: 이 flow가 끝났을 때 사용자가 도달해야 할 상태
> Signals: 다른 flow 진행 중 이리로 전환할 키워드
> Next: 끝난 뒤 제안할 flow id 또는 문서 경로

### Audiences
- <1인칭 라벨> → `doc-id` | task `task-id` | flow `flow-id`

### FAQ
- <사용자 말투의 질문> → `doc-id`, `doc-id2` → task `task-id` ↪ <이어질 질문>

## Tasks

### Task: install — <제목>

```yaml
preconditions:
  - check: "node --version"
    expect: "v2[0-9]\\."
    hint: "사람이 읽을 안내"
steps:
  - run: "<문서에 있는 명령 그대로>"
    explain: "한 줄 설명"
    effects: [global-install]     # 명령만 봐선 모를 결과가 있을 때만
verify:
  run: "<성공을 확인하는 명령>"
  expect: "<정규식>"
on_fail: [doc-id]
```

## Glossary

| 용어 | 뜻 |
| --- | --- |

## Policy

```yaml
answer_style: "간결하게. 목록 위주"
citations: required
max_reads_per_answer: 2
never: ["Tasks에 없는 명령 실행"]
```

섹션 키(Docs, Code map, Flow:, Tasks, Glossary, Policy)는 **영문 고정**입니다.
" — " 뒤 제목과 표 헤더는 이 저장소의 언어로 쓰세요. 표는 열 순서가 규범이고
헤더 문구는 자유입니다.

━━ 절차 ━━

1. 수집 — 파일 열람 15회 이내. 소스 파일 본문은 읽지 마세요. 디렉터리 나열도
   예산에 포함되며, 한 번에 100개가 넘으면 최상위만 봅니다.
   README 제목 목록 / 패키지 매니페스트 / docs 트리의 파일명과 첫 5줄 /
   AGENTS.md·CONTRIBUTING.md 존재 여부 / CHANGELOG / 최상위 소스 디렉터리 이름

2. 진입점 선별 — Docs 표는 8~12개입니다. 문서가 더 많으면 두 기준으로 자릅니다.
   (a) 바깥 사람이 찾아올 질문이 있는 문서인가 (설계 계획·TODO·버그 노트는 아님)
   (b) 배포된 동작을 설명하는가, 의도된 동작을 설명하는가
   잘라낸 것 중 진입점에서 도달 못 하는 게 남으면 마지막에 한 줄 넣으세요:
   | more | docs/ | 위에 없는 주제 — 여기부터 찾는다 |

3. FAQ — 지어내지 말고 캐내세요. 우선순위:
   이슈의 question 라벨 → CHANGELOG의 버그·변경 설명 → README의 Troubleshooting과
   접힌 <details> → 포크라면 원본 README → 비교표
   이슈가 0건이면 조회 실패인지 정말 빈 건지 확인하고, 모르겠으면 마지막에 알려주세요.
   질문은 **사용자의 말투**로 씁니다. 문서 제목을 물음표로 바꾸면 실패입니다.

4. covers — 질문자가 실제로 칠 검색어. 에러 메시지 원문이 가장 좋습니다.
   문서 제목의 단어를 그대로 쓰지 마세요.
   ○ "로그인, 토큰, 세션 만료, 401"   ✗ "인증 아키텍처"

5. Flow — onboard는 항상 만들고 (default)를 붙입니다. 나머지는 증거가 있을 때만:
   버전 사이에 사용자가 체감하는 동작 변화 → upgrade
   (CHANGELOG에 "Breaking" 라벨이 없어도 됩니다. 패키지 이름 변경, 런타임 하한
    변경, 버전 정렬이 깨진 일 전부 해당합니다)
   트러블슈팅 문서나 반복되는 오류 문의 → troubleshoot
   CI·SDK·Action·플러그인 성격 → integrate
   CONTRIBUTING.md나 AGENTS.md 존재 → contribute
   이건 목록이 아니라 예시입니다. 구분되는 사용자층이 따로 보이면 새로 만드세요.
   단 **FAQ가 한 줄뿐인 flow는 만들지 마세요.** Audiences 한 줄로 충분한
   페르소나도 있습니다.

6. Tasks — 명령은 문서의 코드 블록에서 그대로 가져옵니다. 예외가 둘:
   · 사용자 기계 밖에 영향을 주는 명령(PR 생성, 배포, 외부 저장소 쓰기, 과금)은
     그대로 넣지 말고 --dry-run 같은 안전한 변형을 쓰고 explain에 이유를 적으세요.
     안전한 변형이 없으면 그 Task를 만들지 말고 Policy.never에 넣으세요.
   · 명령만 봐선 모를 결과에는 effects를 답니다. global-install,
     writes-user-config, network-write, third-party, destructive, costs-money 등.
     어휘는 열려 있으니 맞는 게 없으면 새로 만드세요. npm test처럼 결과가 없는
     명령에는 붙이지 마세요.
   verify는 **실제 존재하는 명령**이어야 합니다. 확인할 수 없으면:
     verify: none         + why: "바뀌는 게 없어 검증할 사후 상태가 없다"
     verify: unverified   + why: "작성 환경에서 확인할 수 없었다"
   둘 다 아니면서 확인도 못 하겠으면 그 Task를 만들지 마세요.
   preconditions는 패키지 매니페스트의 engines 등에서 가져옵니다. 문서 산문이
   요구하는 것도 괜찮으니 hint에 근거를 적으세요.

7. 자가 검증 — 다 쓴 뒤 반드시:
   · Docs와 Code map의 **모든 경로가 실제로 존재하는지** 하나씩 확인
   · README 앵커라면 그 제목이 실제로 있는지 확인
   · FAQ·Audiences·on_fail의 모든 id가 해석되는지
   · (default) flow가 정확히 하나인지
   · 각 flow의 FAQ가 두 줄 이상인지
   확인한 참조 개수를 알려주세요.

8. 마지막에 나에게 물으세요. 저장소만 읽어서는 알 수 없는 세 가지입니다:
   · Not for — 이 프로젝트가 하지 않는 일. **가장 중요합니다.**
     README는 자기가 못 하는 일을 절대 쓰지 않으니 여기는 반드시 물어야 합니다.
   · 개요 3문장이 강조점을 제대로 잡았는지
   · status
   초안은 채워 넣되, 파일 상단에 이렇게 표시해 두세요:
   <!-- TODO(maintainer): 위 세 가지 확인 후 이 주석을 지워 주세요 -->

작성이 끝나면 어디가 애매했는지, 형식으로 표현할 수 없어 포기한 게 있었는지
같이 알려주세요.
```
