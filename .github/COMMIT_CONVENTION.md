# 커밋 메시지 컨벤션

## 형식

```
[PART/Type] subject
```

- `PART`와 `Type`은 대괄호 안에 슬래시로 구분해서 쓴다. (예: `[BE/Feat]`)

## PART (작업 파트)

| PART | 범위 |
| --- | --- |
| `BE` | `be/` 백엔드 |
| `FE` | `fe/` 프론트엔드 |
| `DESIGN` | `design/` 디자인 자료 |
| `ML` | `ml/` 모델 학습 |
| `DOCS` | 루트 문서 (`PROJECT_SPEC.md`, `DESIGN.md`, `README.md`) |
| `INFRA` | CI/CD, 배포, 레포 설정 |

## Type

| Type | 의미 |
| --- | --- |
| `Feat` | 새 기능 |
| `Fix` | 버그 수정 |
| `Refactor` | 동작 변경 없는 코드 개선 |
| `Chore` | 빌드/설정/의존성 등 |
| `Docs` | 문서 수정 |
| `Test` | 테스트 추가/수정 |
| `Style` | 포맷팅 등 코드 의미 없는 변경 |

## 규칙

- 커밋 하나는 PART 하나만 다룬다. `BE`, `FE`를 동시에 바꿔야 하면 커밋을 나눈다.
- subject는 한글, 명령형보다 결과 설명형으로 간결하게 쓴다. 마침표 없음.
- "왜"가 자명하지 않으면 빈 줄 하나 띄우고 본문에 이유를 적는다.
- `PROJECT_SPEC.md`/`DESIGN.md` 변경이 필요한 작업이면 그 문서 수정 커밋(`[DOCS/...]`)을 먼저 만들고, 뒤따르는 구현 커밋에서 참조한다.

## 예시

```
[BE/Feat] Entity 구성
```

```
[FE/Fix] 카메라 미리보기 초기화 오류 수정
```

```
[INFRA/Chore] GitHub Actions에 be 빌드 워크플로 추가
```
