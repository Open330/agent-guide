# `AGENT_GUIDE.md` 형식 치트시트 (v0.1)

Last Updated: 2026-08-27

한 장으로 보는 요약입니다. 규범적 설명은 [SPEC.md](../../SPEC.md) §4, 실제 파일은 [`examples/AGENT_GUIDE.md`](../../examples/AGENT_GUIDE.md)·[`examples/AGENT_GUIDE.minimal.md`](../../examples/AGENT_GUIDE.minimal.md)를 보세요.

## 섹션 일람

H2 제목의 **맨 앞 영문 키**로 식별합니다. ` — ` 뒤 문구는 현지어 자유.

| 섹션 | 필수 | 형태 | 내용 |
| :--- | :-: | :--- | :--- |
| frontmatter | R | YAML | 버전·이름·기준 URL |
| `# ` + 다음 문단 | R | 산문 | 개요 3문장. 에이전트가 그대로 사용 |
| `**Not for:**` | R | 한 줄 | 안 맞는 사용 사례 |
| `## Docs` | R | 표 | 문서 지도 |
| `## Flow: <id>` | R | 절 | 세션 유형. 1개 이상, 정확히 하나가 `(default)` |
| `## Code map` | O | 표 | 디렉터리별 담당 |
| `## External` | O | 표 | 저장소 밖 문서 |
| `## Tasks` | O | YAML 블록 | 실행 절차 |
| `## Glossary` | O | 표 | 용어 |
| `## Policy` | O | YAML 블록 | 행동 계약 |

## frontmatter

| 키 | | 설명 |
| :--- | :-: | :--- |
| `guide` | R | 스펙 버전. v0.1은 `"0.1"` |
| `name` | R | 제품명 |
| `base` | R | 상대 경로의 기준 URL(원격) 또는 `.`(로컬) |
| `tagline` | O | 한 줄 |
| `status` | O | `alpha` \| `beta` \| `stable` \| `maintenance` |
| `language` | O | 응답 언어 |
| `links` | O | `repo`, `docs`, `issues`, `homepage`, `chat` |
| `escalate_to` | O | 답을 못 찾았을 때 안내할 URL |
| `upstream` | O | 포크 전용. `{name, url}`. 없으면 원본의 CHANGELOG·FAQ가 포크의 것으로 오인된다 |

## 표 — 열 순서가 규범, 헤더 문구는 자유

```
## Docs        | id | 경로 | covers | 크기(S/M/L, 선택) |
## Code map    | 경로 | 담당 |
## External    | url | covers |
## Glossary    | 용어 | 뜻 |
```

`covers`가 라우팅의 전부입니다. 문서 제목이 아니라 **사용자가 실제로 쓸 표현**으로 적으세요.
`로그인, 토큰, 세션 만료` (○) / `인증 아키텍처` (✗)

## Flow

```markdown
## Flow: <id> — <현지어 제목> [(default)]

> Goal: 이 flow가 끝났을 때 도달해야 할 상태
> Signals: 다른 flow 도중 여기로 전환할 키워드
> Next: 끝난 뒤 제안할 flow id 또는 문서 경로

### Audiences
- <1인칭 라벨> → `doc-id` | task `task-id` | flow `flow-id`

### FAQ
- <질문> → `doc-id`[, `doc-id`] [→ task `task-id`] [↪ <이어질 질문>]
```

| 기호 | 뜻 |
| :-: | :--- |
| `→ \`id\`` | 근거 문서 |
| `→ task \`id\`` | 실행으로 연결 |
| `↪` | followup 질문 |

## Task

````markdown
### Task: <id> — <현지어 제목>

```yaml
preconditions:            # 선택
  - check: "node --version"
    expect: "v(2[0-9]|[3-9][0-9])\\."     # 정규식
    hint: "Node 20 이상이 필요합니다"
steps:                    # 필수
  - run: "npm i -g foo"
    explain: "무엇을 하는지 한 줄"
    effects: [global-install]   # 선택. 명령만 봐서는 모를 결과에만
verify:                   # 필수
  run: "foo --version"
  expect: "^foo \\d+\\."                  # 정규식
on_fail: [troubleshooting]                # 선택. Docs id
```
````

### verify 를 쓸 수 없을 때

`verify`는 필수지만, 명령 대신 쓰는 값이 둘 있다. 각각 `why:`가 함께 필요하다.

```yaml
verify: none          # 바뀌는 게 없는 Task — 미리보기, 진단
why: "--dry-run 은 아무것도 쓰지 않으므로 검증할 사후 상태가 없다"
```

```yaml
verify: unverified    # 작성 환경에서 성공을 확인할 수 없었다
why: "전체 Xcode 빌드가 필요해 작성자가 실행하지 못했다"
```

`unverified`를 만난 에이전트는 성공을 확인할 수 없다고 사용자에게 알려야 한다(MUST).

"검증 못 하면 Task를 만들지 마라"는 규칙은 빌드가 비싼 프로젝트에서 **가장 중요한 Task를 삭제**시킨다. 정직한 `unverified`가 지어낸 `expect`보다 낫고, 둘 다 침묵보다 낫다.

### effects — 선택이지만, 붙이면 동의 규칙에 대상이 생긴다

명령만 봐서는 알 수 없는 결과에만 답니다. `npm test`에는 필요 없습니다.

| 자주 쓰는 태그 | 언제 |
| :--- | :--- |
| `global-install` | 전역 패키지 설치 |
| `writes-user-config` | 홈 디렉터리 설정 파일 수정 |
| `network-write` | 원격에 쓰기 (push, PR 생성) |
| `third-party` | 남의 저장소·서비스에 영향 |
| `destructive` | 삭제·되돌릴 수 없는 변경 |
| `costs-money` | 과금 발생 |

**어휘는 열려 있습니다.** 맞는 게 없으면 새로 만드세요. 닫힌 목록은 금방 낡고, 작성자를 "가장 가까운 틀린 태그"로 몰아넣습니다.

`validate`는 전역 설치·`sudo`·`rm -rf`·원격 쓰기 같은 패턴에 `effects`가 없으면 **경고**합니다. 오류가 아닙니다 — CI를 깨는 오탐은 검사를 지우게 만들고, 경고는 읽힙니다.

### preconditions 는 동의 없이 실행해도 된다

`preconditions`는 **선언된 읽기 전용 탐침**입니다. 사용자가 이 Task를 필요로 하는지 알아보려는 것이고, `node --version` 하나 돌리는 데 동의를 받게 하면 마찰만 늘고 안전은 늘지 않습니다. `steps`와 `verify`는 예외가 아닙니다.

### 사용자 기계 밖에 영향을 주는 명령

PR 생성, 배포, 외부 저장소 쓰기, 과금처럼 사용자 기계 밖에 영향을 주는 명령은 **문서에서 그대로 가져오지 않는다**(MUST NOT). 안전한 변형을 쓰고 `explain`에 이유를 적으며, 위험한 형태는 `Policy.never`에 넣는다.

```yaml
steps:
  - run: "oac run --dry-run --repo owner/repo"
    explain: "무엇을 제안할지만 보여준다. --dry-run 없는 형태는 실제 PR을 연다."
```

안전한 변형이 없으면 그 Task를 만들지 않는다.

## Policy

```yaml
answer_style: "간결하게. 목록 위주. 3문단 이내"
citations: required          # required | optional (기본 required)
max_reads_per_answer: 2      # 기본 2
never: ["사용자 동의 없이 파일 수정", "Tasks에 없는 명령 실행"]
handoff:
  session_notes: .guide/session-notes.md
  next: AGENTS.md
```

## 자주 하는 실수

| 실수 | 왜 문제인가 |
| :--- | :--- |
| covers에 문서 제목을 적음 | 라우팅이 안 됨. 사용자는 그 단어로 묻지 않는다 |
| `(default)` flow가 없거나 둘 이상 | 초기 진입점이 모호해진다 |
| `Not for`를 생략 | 안 맞는 사용자가 끝까지 남고, 에이전트가 없는 기능을 지어낸다 |
| Code map을 파일 단위로 쪼갬 | 금방 낡는다. 지도는 거칠어야 오래 간다 |
| 개요가 다섯 문장 | 첫 응답이 길어지고 에이전트가 임의로 요약하기 시작한다 |
