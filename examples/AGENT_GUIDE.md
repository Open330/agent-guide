---
guide: "0.1"
name: foo
tagline: 프롬프트를 코드처럼
status: beta
language: ko
base: https://raw.githubusercontent.com/acme/foo/main/
links:
  repo: https://github.com/acme/foo
  docs: https://foo.dev/docs
  issues: https://github.com/acme/foo/issues
escalate_to: https://github.com/acme/foo/issues/new
---

# foo — Agent Guide

foo는 팀이 LLM 프롬프트를 Git으로 버전 관리하고, 배포 전에 회귀 평가를 자동으로 돌리게 해주는 CLI입니다. 프롬프트 변경이 기존 케이스를 깨뜨리면 배포를 막습니다.

**Not for:** 프로덕션 트래픽 라우팅이나 A/B 분배 · 모델 파인튜닝 · 프롬프트 자동 생성

## Docs — 문서 지도

| id | 경로 | 이럴 때 연다 | 크기 |
| --- | --- | --- | --- |
| quickstart | docs/quickstart.md | 설치, install, API 키, 첫 실행, 요구사항 | S |
| concepts | docs/concepts.md | 개념, 용어, 평가자, 게이트, 케이스 | M |
| ci-integration | docs/ci.md | CI, GitHub Actions, 파이프라인, PR 체크, 자동화 | M |
| architecture | docs/architecture.md | 설계, 아키텍처, 플러그인, 확장, 내부 동작 | L |
| comparison | docs/comparison.md | 비교, 차이, LangSmith, Braintrust, 대안 | S |
| troubleshooting | docs/troubleshooting.md | 오류, 에러, 실패, 안 됨, 디버깅 | M |
| migration-v2 | docs/migration/v2.md | 마이그레이션, 업그레이드, v2, breaking change | M |

## Code map — 코드 지도

| 경로 | 담당 |
| --- | --- |
| src/engine/ | 평가 실행 루프. 케이스 로딩부터 판정까지 |
| src/evaluators/ | 평가자 플러그인. 새 평가 방식은 여기에 추가 |
| src/store/ | 실행 이력 저장. 기본은 로컬 SQLite |

## External — 외부 문서

| url | 이럴 때 연다 |
| --- | --- |
| https://foo.dev/docs/api | API, 함수 시그니처, 옵션 |

## Flow: onboard — 처음 오셨나요 (default)

> Goal: 이게 나에게 맞는 도구인지 판단하고, 맞으면 첫 성공까지 간다
> Next: integrate

### Audiences

- 일단 써보고 싶어요 → task `install`
- 우리 CI에 붙이고 싶어요 → `ci-integration`
- 코드에 기여하고 싶어요 → flow `contribute`

### FAQ

- 설치는 어떻게 하나요? → `quickstart` → task `install`
- LangSmith나 Braintrust와 뭐가 다른가요? → `comparison` ↪ 셀프호스팅이 되나요?
- 셀프호스팅이 되나요? → `architecture`, `ci-integration`
- 기존 프롬프트를 어떻게 가져오나요? → `quickstart`, `concepts`
- 평가자를 직접 만들 수 있나요? → `architecture`

## Flow: integrate — 우리 서비스·CI에 붙이기

> Goal: PR 체크로 게이트가 도는 상태까지 간다

### FAQ

- GitHub Actions에서 어떻게 돌리나요? → `ci-integration` → task `first-eval`
- 실패했을 때 PR을 막으려면? → `ci-integration`, `concepts`
- 실행 이력은 어디에 쌓이나요? → `architecture`

## Flow: upgrade — v1 → v2 마이그레이션

> Goal: 깨지는 변경을 파악하고 변환까지 마친다
> Signals: 업그레이드, 마이그레이션, v2, 버전 올리, breaking

### FAQ

- v2에서 뭐가 깨지나요? → `migration-v2` → task `scan-breaking-changes`
- 얼마나 걸리나요? → `migration-v2`
- 되돌릴 수 있나요? → `migration-v2`

## Flow: troubleshoot — 안 될 때

> Goal: 증상에서 원인 문서까지 최단 경로로 간다
> Signals: 에러, 실패, 안 돼, 안 됨, 오류, crash, 멈춰

### FAQ

- 설치는 됐는데 실행이 안 됩니다 → `troubleshooting` → task `collect-diagnostics`
- 평가가 계속 실패합니다 → `troubleshooting`, `concepts`

## Flow: contribute — 코드에 기여하기

> Goal: 구조를 이해하고 첫 PR까지 간다
> Next: AGENTS.md

### FAQ

- 어디부터 봐야 하나요? → `architecture`
- 평가자를 새로 추가하려면? → `architecture`

## Tasks

### Task: install — 로컬 설치

```yaml
preconditions:
  - check: "node --version"
    expect: "v(2[0-9]|[3-9][0-9])\\."
    hint: "Node 20 이상이 필요합니다"
steps:
  - run: "npm i -g @acme/foo"
    explain: "CLI를 전역 설치합니다"
    effects: [global-install]
  - run: "foo doctor"
    explain: "설치 상태와 환경 변수를 점검합니다"
verify:
  run: "foo --version"
  expect: "^foo \\d+\\."
on_fail: [troubleshooting]
```

### Task: first-eval — 첫 평가 실행

```yaml
steps:
  - run: "foo init"
    explain: "샘플 프롬프트 세트와 케이스를 생성합니다"
  - run: "foo eval"
    explain: "평가를 실행합니다"
verify:
  run: "foo eval --json"
  expect: "\"passed\""
on_fail: [troubleshooting, concepts]
```

### Task: scan-breaking-changes — v2 호환성 점검

```yaml
steps:
  - run: "foo migrate scan"
    explain: "현재 설정에서 v2와 충돌하는 부분을 찾습니다"
verify:
  run: "foo migrate scan --exit-code"
  expect: "^0$"
on_fail: [migration-v2]
```

### Task: collect-diagnostics — 진단 정보 수집

```yaml
steps:
  - run: "foo doctor --verbose"
    explain: "환경과 설정을 점검합니다"
verify:
  run: "foo doctor --exit-code"
  expect: "^0$"
on_fail: [troubleshooting]
```

## Glossary — 용어

| 용어 | 뜻 |
| --- | --- |
| 케이스(case) | 입력과 기대 조건 한 쌍. 평가의 최소 단위 |
| 게이트(gate) | 통과 기준. 미달이면 배포를 막는다 |

## Policy

```yaml
answer_style: "간결하게. 목록 위주. 3문단 이내"
citations: required
max_reads_per_answer: 2
never:
  - "사용자 동의 없이 파일 수정"
  - "Tasks에 없는 명령 실행"
handoff:
  session_notes: .guide/session-notes.md
  next: AGENTS.md
```
