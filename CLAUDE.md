# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

작업을 시작하기 전에 아래 두 문서를 반드시 읽고 따른다.

- `PROJECT_SPEC.md`: 기획, 기능, 순서 로직, 모델, 아키텍처, API, DB, 로드맵 (기준 문서)
- `DESIGN.md`: 디자인 토큰, 컴포넌트, 화면, 문구 규칙

작업 내용에 따라 아래 문서도 읽는다.

- `REQUIREMENTS.md`: 요구사항(FR/NFR) ID와 수용 기준. 기능 완료 판단 기준
- `FUNCTIONAL_SPEC.md`: 화면 흐름, 기능별 처리 절차, 비즈니스 규칙(BR), API·DB 상세, 테스트 케이스

## 폴더

| 폴더 | 내용 |
| --- | --- |
| `be/` | 백엔드. Java 21 + Spring Boot, Gradle. IntelliJ로 개발 |
| `fe/` | 프론트엔드. React + Vite + TypeScript (PWA) |
| `design/` | 디자인 자료. Figma 내보낸 이미지, 아이콘, 일러스트 원본 |
| `ml/` | 모델 학습. Python, YOLO 학습 노트북과 ONNX 내보내기 |

## 개발 명령어

### `be/`
```
docker compose up -d        # 로컬 PostgreSQL (be/ 디렉터리에서)
./gradlew bootRun           # 서버 실행 (localhost:8080)
./gradlew build             # 빌드
./gradlew test              # 전체 테스트
./gradlew test --tests "com.sushioishi.order.OrderEngineTest"   # 단일 테스트 클래스
```
테스트는 Testcontainers(PostgreSQL)를 쓰므로 Docker가 떠 있어야 한다.

### `fe/`
```
npm install
npm run dev       # 개발 서버 (vite.config.ts가 /api를 localhost:8080으로 프록시)
npm run build     # tsc -b && vite build
npm run lint       # oxlint
```
테스트 러너(vitest 등)는 아직 설정되지 않았다.

## 아키텍처 개요

```
[React PWA] --POST /api/v1/scans(multipart image)--> [Spring Boot]
  ImagePreprocessor(EXIF 보정·리사이즈) → SushiDetector(ONNX Runtime 추론)
  → PostProcessor(신뢰도 필터+NMS) → OrderEngine(점수 정렬) → ScanService(저장·응답)
                              ↓                      ↓
                        PostgreSQL            S3 호환 스토리지(원본, 동의 시)
```

- 백엔드 패키지(`be/src/main/java/com/sushioishi/`)는 기능별로 나뉜다: `scan`(Controller/Service/엔티티), `inference`(탐지·전처리·NMS), `order`(OrderEngine·점수표), `correction`(오답 수정 저장), `storage`(S3), `common`(예외·설정·레이트리밋). 현재는 각 패키지가 `package-info.java`만 있는 스캐폴드 상태이며 실제 구현은 아직 없다.
- 순서 로직(`OrderEngine`, PROJECT_SPEC.md 4.2)은 서버(Java)와 클라이언트(`fe/src/features/scan/orderEngine.ts`, TS)에 **동일하게 두 번 구현**한다. 사용자가 오인식을 수정하면 프론트가 즉시 재계산하고, 서버 응답으로 최종 동기화한다. 두 구현의 결과가 반드시 같아야 하므로 테스트 케이스를 공유한다.
- 먹는 순서 점수(`order_score`)는 코드에 하드코딩하지 않는다. `sushi_types` 테이블(Flyway `V2__seed_sushi_types.sql`)이 기준이고, 프론트는 `GET /api/v1/sushi-types`로 받아 캐시한다.
- 소유자 식별은 계정 없이 `X-Device-Id` 헤더(UUID)로만 한다. 스캔 조회·수정은 항상 `device_id` 조건을 같이 건다.
- 프론트는 기능별 폴더 구조(`fe/src/features/scan/`: `api.ts`, `hooks.ts`(TanStack Query), `types.ts`, `orderEngine.ts`)를 쓴다. 전역 클라이언트 상태는 Zustand(`store/useScanStore.ts`), 서버 상태는 TanStack Query로 분리한다. v3(지도·리뷰)에서 `features/map/`, `features/visit/`를 같은 패턴으로 추가할 계획이므로 이 구조를 유지한다.
- API 응답 필드는 camelCase, 박스 좌표는 리사이즈된 이미지(긴 변 1280px) 기준 픽셀값이다. 상세 계약은 PROJECT_SPEC.md 7장, 에러 코드 표 포함.

## 핵심 규칙

- 현재 단계는 MVP(v1)다. v2·v3 기능은 요청이 있을 때만 구현한다.
- API 필드명, DB 스키마, class_id는 `PROJECT_SPEC.md`를 먼저 수정한 뒤 코드를 바꾼다.
- UI 색·폰트·간격은 `DESIGN.md`의 토큰만 사용한다.
- DB 변경은 Flyway 마이그레이션(`V{번호}__{설명}.sql`)으로만 하고, JPA `ddl-auto`는 `validate`로 둔다.
- 비밀값은 환경 변수로만 받는다.
- 커밋 메시지와 테스트 이름에 요구사항 ID(`FR-ORD-003`)나 규칙 ID(`BR-ORD-04`)를 인용한다.

## 작업 흐름 (이슈 → 브랜치 → 커밋 → PR)

상세: `.github/WORKFLOW.md`, `.github/COMMIT_CONVENTION.md`

- 브랜치명: `{part}/{type}/{이슈번호}-{작업내용}` (예: `be/feat/12-create-db-setting`). `part`는 `be fe design ml docs infra`, `type`은 `feat fix refactor chore docs test style`.
- 커밋 메시지: `[PART/Type] subject` (예: `[BE/Feat] Entity 구성`). 커밋 하나는 PART 하나만 다루며, subject는 한글 결과 설명형으로 간결하게 쓴다.
- PR은 이슈를 `Closes #이슈번호`로 연결한다.
