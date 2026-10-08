# Random BGB
BGB 참여 인원 선발을 위한 랜덤 추천 시스템

## 기술 스택
- html5 문서에 마크업과 js 를 직접 작성한다,


## 공통 커밋 및 브랜치 관리 규칙

- 모든 개발은 현재 브랜치에서 직접 진행합니다.
- 사용자가 명시적으로 요청한 경우에만 별도 브랜치나 worktree를 사용하며, 플러그인의 자동 생성 규칙보다 이 기준을 우선합니다.
- 커밋 메시지 작성 요청은 실제 커밋 없이 `commit-message-rules.md`에서 커밋 메시지 규칙을 찾아 한글 메시지만 제공합니다.
- 푸시 요청은 같은 규칙으로 커밋 메시지를 작성한 뒤 커밋과 푸시를 진행합니다.

## 개발·검증 플러그인 규칙
- `Superpowers`는 요구사항 정리, 계획과 TDD 기반 개발에 사용합니다.
- `Ponytail`은 과잉 설계 방지와 최소 구현에 사용합니다.
- `Compound Engineering`은 코드, 테스트, 보안, API 계약과 문서의 최종 검증에 사용합니다.
- `Compound Engineering` 검토의 Codex 네이티브 서브에이전트는 `gpt-6.1-sol` 모델로 실행하며, 외부 모델과 외부 모델 CLI 호출은 사용하지 않습니다.
- 복잡·고위험 작업은 `정책·문서 확인 > Superpowers 개발 > Ponytail 단순화 > Compound Engineering 검토 > 최종 검증` 순서로 진행합니다.
- 각 플러그인 실행전 설치 여부를 판단하고 설치되어 있지않을 경우 설치 진행 여부를 확인한뒤 사용자 응답에 따라 플러그인 활용 여부를 결정합니다. 설치에 동의하지 않은 경우 대체할 수 있는 다른 방법으로 통해 작업을 진행합니다.
- 플러그인 설치에 동의한 경우 아래 url 을 통해 환경에 맞는 플러그인 설치 방법을 확인한 뒤 설치 후 작업을 진행합니다.
  - `Superpowers` : https://github.com/obra/superpowers
  - `Ponytail` : https://github.com/dietrichgebert/ponytail
  - `Compound Engineering` : https://github.com/everyinc/compound-engineering-plugin


## 공통 검증
- 모든 Codex 네이티브 서브에이전트는 `spawn_agent` 호출 시 `model: "gpt-6.1-sol"`, `reasoning_effort: "medium"`을 명시합니다. 모델 override가 적용되도록 `fork_turns`는 `"none"` 또는 필요한 최근 턴 수를 나타내는 양의 정수 문자열로 설정하고, 상위 모델을 강제로 상속하는 `"all"`은 사용하지 않습니다.
- Codex에서는 오케스트레이터 세션을 제외하고 동시에 활성화하는 서브에이전트를 최대 3명으로 제한합니다. 이 활성화 수 제한은 Codex 네이티브 서브에이전트에만 적용합니다.
- 복잡·고위험 작업에서 문서와 코드를 함께 수정하면 변경 범위를 정리한 뒤 문서·코드 정합성, 누락, 보안·정책 역전과 테스트 공백을 별도로 검토합니다.
