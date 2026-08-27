# .context

**Agent Guide** — 에이전트가 사람을 프로젝트 안으로 안내하는 대화 세션 프로토콜.

| | |
| :--- | :--- |
| 매니페스트 파일 | `AGENT_GUIDE.md` (Markdown + YAML 하이브리드) |
| 저장소 · 패키지 | `agent-guide` |
| 상태 | v0.1 설계 초안 |

> 이 저장소 자체가 [`AGENT_GUIDE.md`](../AGENT_GUIDE.md)를 갖고 있습니다. 규격을 우리가 먼저 지킵니다.

## 문서

| 문서 | 내용 |
| :--- | :--- |
| [planning/product-plan.md](planning/product-plan.md) | 문제 정의, flow 개념, 시나리오, 포지셔닝, 지표, 리스크 |
| [planning/roadmap.md](planning/roadmap.md) | 확정된 결정, 마일스톤 M0~M4, 남은 미결정 |
| [architecture/guide-spec-draft.md](architecture/guide-spec-draft.md) | v0.1 규격 초안 — 발견, 매니페스트 형식, 세션 프로토콜, 초기 프롬프트 |
| [architecture/authoring-protocol.md](architecture/authoring-protocol.md) | 저작 프로토콜 — 에이전트가 매니페스트를 **쓰는** 방법. 저작 프롬프트 정본 |
| [reference/manifest-format.md](reference/manifest-format.md) | `AGENT_GUIDE.md` 형식 치트시트 |
| [reference/readme-block.md](reference/readme-block.md) | README에 붙이는 초기 프롬프트 — 영/한 정본, 짧은 형태, 삽입 위치 |

## 예제

| 파일 | |
| :--- | :--- |
| [`examples/AGENT_GUIDE.minimal.md`](../examples/AGENT_GUIDE.minimal.md) | 필수 필드만. 5분이면 쓴다 |
| [`examples/AGENT_GUIDE.md`](../examples/AGENT_GUIDE.md) | flow 5개, Task 4개를 갖춘 전체 예제 |

## 실험

[`experiments/`](../experiments) — 실제 저장소에 형식을 적용해본 기록과 산출물. 규격에 반영할 발견 5건이 정리되어 있습니다.

Last Updated: 2026-08-27
