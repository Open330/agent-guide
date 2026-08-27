---
guide: "0.1"
name: foo
base: https://raw.githubusercontent.com/acme/foo/main/
escalate_to: https://github.com/acme/foo/issues/new
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
