# 로드맵

Last Updated: 2026-08-27

---

## 확정된 결정

| 항목 | 결정 | 근거 |
| :--- | :--- | :--- |
| 프로토콜 명칭 | **Agent Guide** (약어 없음) | 확산된 선례(robots.txt, llms.txt, AGENTS.md)는 전부 약어가 아니라 파일 이름으로 불린다. AG·AIP·AOP는 모두 충돌 |
| 파일명 | `AGENT_GUIDE.md` | `GUIDE.md`는 기존 저장소와 충돌하고 macOS에서 대소문자 구분이 안 된다. 복수형 `AGENTS_GUIDE.md`는 AGENTS.md의 부록으로 읽혀 포지셔닝을 해친다 |
| 포맷 | Markdown 하이브리드 | 1차 소비자가 파서가 아니라 LLM. 작성 장벽·GitHub 렌더링·선례가 모두 Markdown 쪽. Tasks·Policy·frontmatter만 YAML |
| 범위 | flow 기반. 온보딩은 flow 하나 | 업그레이드·문제 해결·연동·기여가 같은 뼈대를 공유한다 |
| 저장소·패키지 | `agent-guide` | |

## 마일스톤

### M0 — 설계 확정 — 완료
- [x] 기획서
- [x] 규격 초안 (Markdown 하이브리드, flow 도입)
- [x] 형식 치트시트
- [x] 예제 2종 (최소 / 전체)
- [x] 도그푸딩 — 본 저장소의 `AGENT_GUIDE.md`와 `README.md` (준수 수준 Guided, 참조 19건 검증 통과)
- [x] 실제 저장소 적용 1/3 — context-compress. 실패 2건에서 규격 개정 ([experiments](../../experiments/README.md))
- [x] 실제 저장소 적용 2·3 — open-agent-contribution(65/65), cmux(36/36). 독립 에이전트가 저작 프로토콜만으로 작성
- [x] 이름 확정 — `@open330/agent-guide` (스코프 패키지). GitHub `Open330/agent-guide` 공개

### M1 — 스펙 공개 (v0.1) — 완료
- [x] 본 저장소 자체의 `AGENT_GUIDE.md` (도그푸딩)
- [x] README — 계층 비교표, 동작하는 초기 프롬프트 블록, 준수 수준 사다리
- [x] `templates/` — README 블록 영/한
- [x] `SPEC.md` 정본 (영문). 초안은 설계 기록으로 `.context/`에 보존
- [x] 예제 3종: 최소 / CLI 도구 / 라이브러리 + `examples/README.md` 선택 가이드
- [x] LICENSE 2종 (`LICENSE-SPEC` CC BY 4.0, `LICENSE` MIT)

### M2 — CLI (v0.2)
- [x] `agent-guide validate` — 구조·참조·경로·앵커 검사, README 플레이스홀더 검사, 준수 수준 판정. `--json`/`--strict`/`--no-paths`
- [x] `agent-guide init` — 저장소 스캔 후 초안 생성. `covers`·FAQ·Tasks는 의도적으로 비움
- [x] `agent-guide prompt` — git 원격에서 `<org>/<repo>`·브랜치 치환
- [x] 테스트 16종. 자기 매니페스트 검증을 CI에 포함
- [x] GitHub Action 워크플로
- [x] 패키지명 확정 — `@open330/agent-guide` (스코프 패키지라 이름 충돌 없음)
- [x] 타르볼 실사용 검증 — 41.6 kB / 16 파일, 설치 후 4개 명령 전부 동작
- [x] npm 배포 — `@open330/agent-guide@0.1.0` 게시 완료
- [x] 저장소 공개 전환 — 보안 감사(시크릿 clean, 절대경로 365곳 정리) 후 PUBLIC

### M3 — 평가 하니스 (v0.3)
- [x] `eval/run.js` — 실제 에이전트를 시나리오에 태우고 `stream-json`으로 툴 호출까지 기록
- [x] `eval/score.js` — hard(툴 호출 사실) / soft(텍스트 정규식) 두 등급으로 분리 채점
- [x] 시나리오 2종 — 자기 매니페스트(영어), context-compress(영어 매니페스트 × 한국어 질문)
- [x] 교차 언어 라우팅 — 3회 반복 routing 9/9. **단일 언어 `covers`로 충분.** 이중 언어는 권장에 머묾
- [x] Codex 어댑터 — 셸 명령을 툴 호출로 분류. 첫 실행에서 프로토콜 위반 2건 검출
- [x] 반복 실행으로 분산 측정 — Claude 3회 66/66, flaky 0
- [x] §4.10 개정 이후 재측정 — Codex 20/25 → 29/29, Claude 100% 유지, **회귀 0**
- [x] Codex 반복 실행 3회 — `stall` 12/12·`routing` 9/9 유지, **`consent` 1/6으로 미유지**
- [x] `consent` 보강 — `steps`에 선택 필드 `effects`, `validate`는 경고만, §4.7에 "강제하지 않는다" 명시
- [x] `effects` 도입 후 재측정 3회 — Codex 83/87 → **87/87**, `consent` 3/6 → **6/6**, 회귀 0
- [x] CLI 없는 에이전트용 수동 어댑터 — hard 체크는 `unavailable`로 표기하고 총계에서 제외
- ~~gemini 어댑터~~ — 보류. Claude Code + Codex 두 벤더로 충분하다는 판단

### M3.5 — 응답성 (완료)
- [x] `eval/ttft.js` — 첫 텍스트 델타까지의 시간 측정
- [x] `agent-guide prompt --inline` — 블록이 첫 응답을 들고 감. TTFT 4.2s → 2.0s
- [x] 인라인 준수율 3회 검증 — hard 11/11 · soft 17/17, 회귀 0
- [x] 해시 마커 + `validate` 낡음 경고. 우리 README를 인라인으로 도그푸딩
- [x] Codex 인라인 준수율 3회 — **87/87, 회귀 0**. 계산형 대비 변동 없음

### M4 — 확산 (진행 중)
- [x] 준수 수준별 배지 — `agent-guide badge`. shields.io 정적 배지라 호스팅 불필요, Core 미만이면 발급 거부
- [x] 자기 매니페스트 갱신 — CLI 등장 이후 `Code map`·`Tasks` 추가. **Core → Interactive**로 자동 상승
- 보류 — `awesome-*` 목록 등재. **아직 이르다는 판단.** 채택 사례가 하나도 없는 상태에서
  목록에 올리는 것은 규격이 검증됐다는 인상만 주고 실제 근거는 없다
- 사용자 담당 — 도입 저장소 확보. 각 프로젝트 메인테이너의 결정이 필요한 일이라
  이 저장소에서 할 수 있는 부분이 없다

**배지 설계 원칙**: 수준은 `validate`와 동일한 경로로 **계산**되며 선언할 수 없다. 우리 매니페스트가 Guided에 머물다 CLI가 생기자 Interactive로 올라간 것이 그 증거다. 잃을 수 없는 배지는 장식이다.

## 남은 미결정

1. ~~`SPEC.md`를 영문으로 낼 것인가~~ → **영문 정본 + 한국어 README 병행.** 규격은 인용·재구현되어야 하므로 영어, 진입 문서는 양쪽.
2. ~~`validate`의 엄격도~~ → **구조·참조·타입은 오류, 판단이 섞이는 것은 경고.** 근거: CI를 깨는 오탐은 검사를 지우게 만든다.
3. **`.well-known/agent-guide.md`** — 호스팅 서비스용 경로. 실수요가 확인되기 전에는 스펙에 적어만 두고 구현하지 않는다. **유일하게 열려 있는 결정.**

## 지금 하지 않을 것

- 호스팅 서비스, 대시보드, 분석
- 매니페스트 자동 생성의 LLM 의존 (CLI는 정적 스캔 + 템플릿으로 시작)
- MCP 서버 (v0.2 이후 검토)
- YAML 직렬화 병행 지원 (v0.1에서 "두 가지 방식"은 도입을 방해한다)
