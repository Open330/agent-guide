# templates

메인테이너가 자기 저장소에 그대로 복사하는 파일들입니다.

| 파일 | 용도 |
| :--- | :--- |
| [readme-block.en.md](readme-block.en.md) | README에 붙이는 블록 — 영어 정본 |
| [readme-block.ko.md](readme-block.ko.md) | README에 붙이는 블록 — 한국어 |

## 쓰는 법

1. 저장소 언어에 맞는 파일을 골라 README에 붙여넣습니다. **배지 아래, Quickstart 위.**
2. `<org>/<repo>`를 치환합니다. 기본 브랜치가 `main`이 아니면 브랜치명도 바꿉니다.
3. `AGENT_GUIDE.md`를 저장소 루트에 둡니다. ([저작 프로토콜](../.context/architecture/authoring-protocol.md))

M2의 `agent-guide prompt`가 1~2단계를 대신합니다.

## 손대면 안 되는 줄

| 줄 | 빼면 생기는 일 |
| :--- | :--- |
| "지도이지 울타리가 아닙니다" | 에이전트가 금지 목록을 문자 그대로 읽고 막다른 길에서 멈춥니다 |
| "첫 응답까지만 적용됩니다" | 세션 전체로 읽혀 답을 못 하는 에이전트가 됩니다 |
| "동의를 묻지 말고 그냥 쓰세요" | 선언된 `base`를 두고 사용자에게 허락을 구합니다 |
| 로컬 폴백 `./AGENT_GUIDE.md` | 원격 조회가 막힌 Codex 등에서 세션이 시작되지 않습니다 |
| "먼저 답하고" (전환) | 전환 제안만 하고 멈춥니다. Codex에서 세 턴 연속 실측 — 168자, 진단 없음 |

근거: [실험 발견 6·7번](../experiments/README.md)

## 치환을 잊는 경우

`<org>/<repo>`를 안 바꾼 채 커밋하면 원격 URL이 깨집니다. 이건 프롬프트로 막을 문제가 아니라 **검증기가 잡을 문제**입니다.

- `agent-guide validate` — README에 `<org>` 또는 `<repo>`가 남아 있으면 **오류**로 처리 (M2)
- `agent-guide prompt` — 치환된 블록을 바로 출력 (M2)

프롬프트 자체는 이미 안전합니다. 로컬을 먼저 시도하므로, 치환을 잊어도 저장소 안에서는 세션이 정상 동작합니다.
