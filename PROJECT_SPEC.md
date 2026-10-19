# 스시순 (SushiSoon) — 프로젝트 기획 및 개발 명세

> 이 문서는 사람과 AI 코딩 에이전트가 함께 읽는 **단일 기준 문서(Source of Truth)** 다.
> 에이전트는 작업 전 이 문서를 먼저 읽고, 여기 정의된 구조·명명·API·스키마를 따른다.
> 문서와 코드가 다르면 **문서를 기준으로 코드를 고치거나, 문서를 먼저 수정한 뒤** 코드를 바꾼다.
> 디자인 관련 규칙은 `DESIGN.md`를 따른다.
> 이 파일은 저장소 루트(`project/`)에 둔다. 폴더 구성은 6.2장을 따른다.

---

## 0. 에이전트 작업 규칙 (먼저 읽기)

1. **범위**: 현재 단계는 MVP(v1)다. 2장의 v2 항목과 12장의 v3(지도·리뷰) 항목은 명시적 요청 없이 구현하지 않는다. 단, 12.5장의 "지금 지켜둘 설계 원칙"은 v1부터 따른다.
2. **언어**: 백엔드는 Java, 프론트는 TypeScript. 모델 학습 코드만 Python(`ml/`)이다.
3. **명명**: 초밥 종류 식별자는 4장의 `class_id`(영문 소문자 + `_`)만 사용한다. 한글 이름은 표시용이다.
4. **API 계약**: 7장의 요청/응답 필드명을 임의로 바꾸지 않는다. 바꿔야 하면 7장을 먼저 수정한다.
5. **DB 변경**: 스키마 변경은 반드시 Flyway 마이그레이션 파일(`V{번호}__{설명}.sql`)로 한다. JPA `ddl-auto`는 `validate`로 둔다.
6. **순서 점수표**: 하드코딩하지 않는다. DB `sushi_types` 테이블이 기준이며, 프론트는 API로 받아 캐시한다.
7. **테스트**: 순서 엔진, 전처리, NMS는 단위 테스트를 반드시 작성한다.
8. **비밀값**: API 키·DB 비밀번호는 환경 변수로만 받는다. 코드와 커밋에 넣지 않는다.
9. **작업 단위**: 9장 체크리스트의 한 항목 = 한 브랜치/PR을 기본으로 한다.
10. **폴더**: 백엔드 코드는 `be/`, 프론트 코드는 `fe/`, 디자인 자료는 `design/`, 모델 학습은 `ml/`에만 둔다. 루트에 새 폴더를 만들지 않는다.

---

## 1. 프로젝트 개요

**한 줄 정의**: 초밥 사진 한 장을 찍으면 각 피스에 박스와 이름을 표시하고, 담백한 것부터 진한 것 순으로 1~N번 먹는 순서를 알려주는 웹/앱 서비스.

**동기**: 모둠초밥이 나오면 어떤 생선인지 모르는 피스가 많고, 맛있게 먹는 순서를 아는 사람도 드물다.

**목표**
- 사진 한 장으로 피스별 이름 + 먹는 순서를 **3초 이내**에 보여준다.
- 주요 15종 초밥에서 **mAP50 0.80 이상**을 달성한다.
- 기획·디자인·프론트·백엔드·모델을 1인이 직접 만들어 포트폴리오로 정리한다.

**플랫폼 전략**
- **v1: 모바일 웹 (PWA)**. URL 공유만으로 사용 가능, 스토어 심사 없음.
- **v2: 앱**. 같은 웹 코드를 Capacitor로 감싸 iOS/Android로 출시. 실시간 카메라 인식·온디바이스 추론이 필요해질 때 전환.
- **v3: 지도 + 나만의 초밥 기록**. 초밥집을 지도에서 찾고, 스캔 결과를 가게에 연결해 나만의 리뷰로 남기는 서비스로 확장 (12장).

**프레임워크 선택 이유**: 프론트는 React를 유지한다. 지도 SDK(카카오맵·네이버지도) 연동 자료, 폼·UI 라이브러리, 앱 전환(Capacitor/React Native), Next.js를 통한 가게 페이지 검색 노출까지 v3 확장에 필요한 생태계가 가장 넓기 때문이다. Svelte·Solid·Qwik은 검토했으나 이 앱의 병목은 서버 추론이라 프론트 성능 이점이 작고, 1인 개발에서는 자료량이 더 중요하다고 판단했다.

---

## 2. 범위

| 구분 | MVP (v1) | 이후 (v2+) |
| --- | --- | --- |
| 인식 | 15종 초밥 박스 + 이름 | 30종 이상, 롤·군함 세분화 |
| 순서 | 규칙 기반 점수 정렬 | 사용자 취향 가중치 반영 |
| 입력 | 촬영 / 갤러리 업로드 | 실시간 카메라 프리뷰 인식 |
| 결과 | 박스 오버레이 + 순서 리스트 | 피스별 상세 설명, 공유 이미지 |
| 계정 | 없음 (기기 ID) | 소셜 로그인, 기록 동기화 |
| 피드백 | 오답 수정/신고 | 수정 데이터로 재학습 자동화 |
| 지도·리뷰 | 없음 | v3: 초밥집 지도, 스캔을 가게에 연결, 나만의 리뷰 (12장) |
| 플랫폼 | 모바일 웹 (PWA) | Capacitor 앱 |

---

## 3. 기능 정의와 유저 플로우

### 3.1 기능 목록

| ID | 기능 | 설명 | 단계 |
| --- | --- | --- | --- |
| F1 | 촬영 / 업로드 | 카메라 촬영 또는 갤러리 선택. 업로드 전 클라이언트에서 긴 변 1280px, JPEG 0.8로 축소 | MVP |
| F2 | 초밥 인식 | 서버에서 객체 탐지 → 피스별 박스 + 클래스 + 신뢰도 | MVP |
| F3 | 순서 산정 | 인식된 피스를 점수표로 정렬해 1~N번 부여 | MVP |
| F4 | 결과 오버레이 | 사진 위에 번호·이름 박스 표시, 탭하면 강조 | MVP |
| F5 | 순서 리스트 | 하단 시트에 번호순 리스트, 먹은 피스 체크 | MVP |
| F6 | 수정 / 신고 | 잘못 인식된 피스의 이름을 사용자가 선택 → 서버 저장 → 순서 재계산 | MVP |
| F7 | 히스토리 | 지난 촬영 결과 목록 | v2 |
| F8 | 초밥 도감 | 종류별 설명, 제철, 맛 특징 | v2 |
| F9 | 공유 카드 | 번호 박스가 그려진 이미지를 저장/공유 | v2 |

### 3.2 사용자 시나리오

회전초밥집에서 모둠 12피스가 나왔다. 휴대폰 브라우저로 서비스를 열고 접시를 찍는다. 3초 뒤 각 피스 위에 `1 광어`, `2 도미` 같은 번호 박스가 뜬다. 하단 리스트를 보며 1번부터 먹고, 먹은 피스는 체크한다. 틀린 피스는 길게 눌러 이름을 고친다.

### 3.3 유저 플로우

1. 홈 → `촬영하기` 또는 `앨범에서 선택`
2. 사진 확인 → `분석하기` → 업로드 + 로딩
3. 결과 화면: 사진 위 번호 박스 + 하단 순서 시트
   - 박스 탭 ↔ 리스트 행 탭은 서로 연동되어 강조
   - 먹음 체크 시 박스 투명도 40%
4. 오인식 피스 길게 누름 → 15종 선택 → 순서 즉시 재계산
5. 인식 0개 → `초밥을 찾지 못했어요` 화면 + 재촬영 팁

---

## 4. 먹는 순서 로직

순서는 모델이 아니라 **규칙 기반 점수표**로 정한다. 원칙: 흰살 → 조개·연체·갑각 → 붉은살 → 등푸른 → 기름진 것 → 군함(진한 풍미) → 양념 → 계란(마무리). **점수가 낮을수록 먼저 먹는다.**

### 4.1 순서 점수표 (MVP 15종, `sushi_types` 초기 데이터)

| order_score | class_id | name_ko | name_ja | group | 근거 |
| --- | --- | --- | --- | --- | --- |
| 10 | hirame | 광어 | ヒラメ | WHITE | 가장 담백함 |
| 12 | tai | 도미 | 鯛 | WHITE | 담백, 약간의 단맛 |
| 14 | hotate | 가리비 | ホタテ | SHELL | 담백하고 달큰함 |
| 20 | ika | 오징어 | イカ | SQUID | 담백, 식감 위주 |
| 22 | ebi | 새우(익힌) | 海老 | SHRIMP | 담백, 단맛 |
| 24 | amaebi | 단새우 | 甘海老 | SHRIMP | 단맛, 부드러움 |
| 30 | maguro_akami | 참치 붉은살 | 赤身 | RED | 산뜻한 붉은살 |
| 40 | aji | 전갱이 | 鯵 | BLUE | 향이 있음 |
| 42 | saba | 고등어(초절임) | 鯖 | BLUE | 향·식초맛이 강함 |
| 50 | salmon | 연어 | サーモン | FATTY | 지방 많음 |
| 55 | toro | 참치 뱃살 | トロ | FATTY | 지방 매우 많음 |
| 60 | ikura | 연어알(군함) | いくら | GUNKAN | 짠맛, 강한 풍미 |
| 62 | uni | 성게(군함) | 雲丹 | GUNKAN | 진한 풍미 |
| 70 | unagi | 장어 | 鰻 | SAUCE | 달고 진한 소스 |
| 80 | tamago | 계란 | 玉子 | FINISH | 디저트처럼 달달함 |

`unknown` 클래스: order_score 50, group `UNKNOWN`.

### 4.2 알고리즘 (`OrderEngine`)

```
입력: detections[] (class_id, confidence, box)
1. confidence < 0.40 인 항목 제거
2. NMS: IoU >= 0.50 인 박스 중 confidence 높은 것만 유지
3. 각 항목에 sushi_types.order_score 매핑 (없으면 unknown = 50)
4. 정렬 키: (order_score ASC, box 중심 y ASC, box 중심 x ASC)
   - 같은 점수면 사진 왼쪽 위부터 → 손이 가는 순서
   - y 비교 시 박스 높이의 50% 이내 차이는 같은 줄로 보고 x로 비교
5. 정렬 순서대로 order = 1..N 부여
출력: 정렬된 items[]
```

- 사용자가 클래스를 수정하면 3~5단계만 다시 실행한다.
- 프론트는 `GET /api/v1/sushi-types` 결과를 캐시해 **동일 로직을 TypeScript로도 구현**한다 (수정 즉시 화면 반영, 서버 응답으로 최종 동기화).

---

## 5. AI 인식 모델

### 5.1 방침
공개 데이터셋 + 직접 촬영 사진으로 **YOLO 계열 소형 모델(n 또는 s)을 파인튜닝**하고, **ONNX로 내보내 Spring 서버에서 ONNX Runtime Java로 추론**한다. 학습은 서비스와 분리된 오프라인 작업이다.

### 5.2 공개 데이터셋 후보 (Roboflow Universe)

| 데이터셋 | 규모 | 클래스 | 메모 |
| --- | --- | --- | --- |
| [SushiAll](https://universe.roboflow.com/salmonlover/sushiall) | 1,113장 | 참치, 연어, 연어알 등 | CC BY 4.0, 출발점 |
| [sushi_3](https://universe.roboflow.com/atin-esbwa/sushi_3) | 1,023장 | 숫자 라벨 | 클래스 의미 확인 후 사용 |
| [sushi (getyolo)](https://universe.roboflow.com/getyolo/sushi-js746) | 506장 | 접시 위주 | 위치 탐지 보조 |

라이선스 표기 조건(CC BY 4.0 등)을 지키고 서비스 내 출처 화면에 명시한다.

### 5.3 데이터 구축
1. 공개 데이터셋의 클래스를 4.1의 `class_id`로 재매핑
2. 부족한 종류는 직접 촬영 (클래스당 최소 150 인스턴스)
3. 라벨링: Roboflow 또는 CVAT. **박스는 밥까지 포함한 피스 전체**로 통일
4. 증강: 밝기·색온도, 회전 ±15°, 블러, 다양한 접시 배경
5. 분할: train 70 / valid 20 / test 10 (같은 접시 사진이 세트 간에 섞이지 않게)

### 5.4 학습·내보내기
- 환경: Google Colab / Kaggle GPU, 입력 640px, 100~150 epoch
- 산출물: `ml/exports/sushi-yolo-v{버전}.onnx` + `labels.json`(인덱스 → class_id 매핑)
- 모델 출력 텐서 형태와 전처리 규칙(입력 크기, 정규화, 채널 순서)은 `ml/exports/MODEL_CARD.md`에 기록한다. 백엔드 전처리는 이 문서를 따른다.

### 5.5 평가 기준
- test mAP50 ≥ 0.80, 클래스별 recall ≥ 0.70
- 서버 CPU 추론 1장당 ≤ 500ms
- 혼동 행렬로 자주 헷갈리는 쌍(광어↔도미, 연어↔참치 뱃살)을 확인하고 데이터 보강

---

## 6. 시스템 아키텍처

```
[모바일 브라우저 / PWA (React)]
        │  POST /api/v1/scans (multipart image)
        ▼
[Spring Boot API 서버]
   ├─ ImagePreprocessor   : EXIF 회전 보정, 리사이즈(긴 변 1280), 모델 입력(640) 변환
   ├─ SushiDetector       : ONNX Runtime Java 추론 → raw boxes
   ├─ PostProcessor       : 신뢰도 필터 + NMS + 좌표 원본 스케일 복원
   ├─ OrderEngine         : 점수표 정렬, 1~N 부여
   └─ ScanService         : 저장, 응답 조립
        │                       │
        ▼                       ▼
 [PostgreSQL]            [S3 호환 스토리지 (R2/S3)]
                          원본 이미지 (사용자 동의 시)

[오프라인 학습: ml/ (Python, Colab)] → model.onnx → 서버 배포 시 포함/다운로드
```

### 6.1 기술 스택

| 영역 | 기술 | 비고 |
| --- | --- | --- |
| 백엔드 언어 | Java 21 | |
| 백엔드 프레임워크 | Spring Boot (최신 안정 버전), Spring Web, Validation | IntelliJ IDEA로 개발 |
| 빌드 | Gradle (Kotlin DSL) | |
| 추론 | ONNX Runtime Java (`com.microsoft.onnxruntime:onnxruntime`) | CPU |
| 이미지 처리 | `javax.imageio` + `metadata-extractor`(EXIF) | |
| DB | PostgreSQL + Spring Data JPA | 로컬은 Docker |
| 마이그레이션 | Flyway | `ddl-auto=validate` |
| 스토리지 | AWS SDK for Java v2 (S3 호환, Cloudflare R2 가능) | |
| API 문서 | springdoc-openapi (Swagger UI) | |
| 테스트 | JUnit 5, AssertJ, Testcontainers(PostgreSQL) | |
| 프론트 | React + Vite + TypeScript | PWA (`vite-plugin-pwa`) |
| 프론트 라우팅 | React Router | |
| 서버 상태 | TanStack Query | |
| 클라이언트 상태 | Zustand | |
| 스타일 | CSS Modules 또는 Tailwind CSS (DESIGN.md 토큰 사용) | |
| 앱 전환 (v2) | Capacitor | 웹 코드 재사용 |
| 모델 학습 | Python, Ultralytics YOLO | `ml/`에서만 |
| 배포 | Docker. 프론트: Vercel/Netlify 또는 Spring `static` 동봉. 백엔드: Render/Fly.io | |
| CI | GitHub Actions (빌드 + 테스트) | |

### 6.2 저장소 구조 (모노레포)

```
project/                    # 저장소 루트 (IntelliJ로 이 폴더를 열고 be/를 Gradle 프로젝트로 연결)
├─ CLAUDE.md                # 에이전트 진입점: 이 문서와 DESIGN.md를 읽으라는 안내 + 폴더 설명
├─ PROJECT_SPEC.md          # 이 문서
├─ DESIGN.md                # 디자인 규칙
├─ be/                      # 백엔드: Spring Boot (IntelliJ)
│  ├─ build.gradle.kts
│  └─ src/
│     ├─ main/java/com/sushisoon/
│     │  ├─ SushiSoonApplication.java
│     │  ├─ scan/           # ScanController, ScanService, Scan, Detection, DTO
│     │  ├─ inference/      # SushiDetector, ImagePreprocessor, PostProcessor, Nms
│     │  ├─ order/          # OrderEngine, SushiType, SushiTypeRepository
│     │  ├─ correction/     # Correction 엔티티, 저장 로직
│     │  ├─ storage/        # ImageStorage (S3)
│     │  └─ common/         # 예외, 에러 응답, 설정, 레이트 리밋
│     ├─ main/resources/
│     │  ├─ application.yml
│     │  ├─ db/migration/   # V1__init.sql, V2__seed_sushi_types.sql ...
│     │  └─ model/          # sushi-yolo-v1.onnx, labels.json (git-lfs 또는 배포 시 다운로드)
│     └─ test/java/com/sushisoon/
├─ fe/                      # 프론트엔드: React + Vite (IntelliJ Ultimate 또는 VS Code)
│  ├─ vite.config.ts        # /api → localhost:8080 프록시
│  └─ src/
│     ├─ pages/             # HomePage, CapturePage, ReviewPage, LoadingPage, ResultPage, NotFoundPage
│     ├─ components/        # DetectionOverlay, DetectionBox, SushiBadge, OrderSheet, ShutterButton, SushiPicker
│     ├─ features/scan/     # api.ts, hooks.ts, types.ts, orderEngine.ts
│     ├─ store/             # useScanStore.ts (Zustand)
│     ├─ styles/            # tokens.css (DESIGN.md 토큰)
│     └─ constants/
├─ design/                  # 디자인 자료: Figma 내보낸 이미지, 아이콘, 일러스트 원본, 무드보드
├─ ml/                      # 모델 학습: Python 노트북·스크립트
│  ├─ notebooks/
│  ├─ data/                 # git 제외
│  └─ exports/              # onnx, labels.json, MODEL_CARD.md
└─ .github/workflows/
```

---

## 7. 백엔드 명세

### 7.1 처리 파이프라인 (`POST /api/v1/scans`)
1. 이미지 수신: 최대 5MB, `image/jpeg`, `image/png`, `image/heic`(가능 시 변환, 불가 시 415)
2. EXIF 회전 보정 → 긴 변 1280px 리사이즈 (이 크기가 응답 좌표 기준)
3. 원본 저장 (요청 파라미터 `consent=true`일 때만)
4. 모델 입력 변환(640×640 letterbox) → ONNX 추론
5. 후처리: 신뢰도 필터, NMS, 좌표를 1280 기준 이미지로 복원
6. `OrderEngine` 정렬
7. `scans`, `detections` 저장 → 응답

### 7.2 API

공통 헤더: `X-Device-Id: <UUID>` (프론트가 최초 실행 시 생성해 localStorage에 저장)

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| POST | `/api/v1/scans` | multipart `image`, 선택 `consent` → 인식 + 순서 |
| GET | `/api/v1/scans/{scanId}` | 결과 다시 보기 |
| PATCH | `/api/v1/scans/{scanId}/items/{itemId}` | `{ "classId"?: string, "eaten"?: boolean }` → 갱신된 전체 items (순서 재계산) |
| GET | `/api/v1/sushi-types` | 15종 + unknown, 점수, 설명 |
| GET | `/api/v1/health` | `{ "status": "UP", "modelVersion": "v1" }` |

**응답 예시 (`ScanResponse`)**

```json
{
  "scanId": "b3f1c2e0-...",
  "imageWidth": 1280,
  "imageHeight": 960,
  "modelVersion": "v1",
  "items": [
    {
      "itemId": 3,
      "order": 1,
      "classId": "hirame",
      "nameKo": "광어",
      "group": "WHITE",
      "confidence": 0.91,
      "box": { "x1": 120, "y1": 340, "x2": 260, "y2": 410 },
      "eaten": false,
      "corrected": false
    }
  ]
}
```

- 박스 좌표: 리사이즈된 이미지 기준 픽셀 (`imageWidth` × `imageHeight`)
- JSON 필드는 camelCase

**에러 응답**

```json
{ "code": "NO_SUSHI_DETECTED", "message": "초밥을 찾지 못했어요." }
```

| HTTP | code | 상황 |
| --- | --- | --- |
| 400 | INVALID_IMAGE | 이미지 디코딩 실패 |
| 413 | IMAGE_TOO_LARGE | 5MB 초과 |
| 415 | UNSUPPORTED_FORMAT | 지원하지 않는 형식 |
| 422 | NO_SUSHI_DETECTED | 인식 결과 0개 (scan은 저장하지 않음) |
| 429 | RATE_LIMITED | 기기당 분당 10회 초과 |
| 503 | MODEL_UNAVAILABLE | 모델 로드 실패 |

### 7.3 DB 스키마 (Flyway `V1__init.sql` 기준)

| 테이블 | 컬럼 | 비고 |
| --- | --- | --- |
| devices | id UUID PK, created_at | |
| sushi_types | class_id VARCHAR PK, name_ko, name_ja, group_code, order_score INT, description TEXT | `V2__seed_sushi_types.sql`로 4.1 데이터 입력 |
| scans | id UUID PK, device_id FK, image_url NULL, image_width, image_height, model_version, created_at | |
| detections | id BIGSERIAL PK, scan_id FK, class_id FK, confidence REAL, x1, y1, x2, y2 INT, order_index INT, eaten BOOL, corrected BOOL | |
| corrections | id BIGSERIAL PK, detection_id FK, before_class, after_class, created_at | 재학습 데이터 |

### 7.4 구현 메모
- 모델은 애플리케이션 시작 시 한 번 로드(`@PostConstruct` 또는 `@Bean`), `OrtSession`은 재사용. 추론은 스레드 안전성을 확인하고 필요 시 세션 풀 사용.
- `modelVersion`은 설정값(`sushisoon.model.version`)으로 관리하고 응답·DB에 기록.
- 레이트 리밋은 MVP에서 인메모리(Bucket4j 등)로 충분.
- CORS: 개발 시 Vite 프록시를 쓰므로 불필요. 프론트를 다른 도메인에 배포하면 해당 origin만 허용.

---

## 8. 프론트엔드 명세

### 8.1 화면

| 경로 | 화면 | 주요 요소 | 기능 |
| --- | --- | --- | --- |
| `/` | 홈 | 촬영하기(메인), 앨범에서 선택 | F1 |
| `/review` | 사진 확인 | 미리보기, 다시 찍기 / 분석하기 | F1 |
| `/loading` | 로딩 | 스캔 애니메이션, 안내 문구 | F2 |
| `/result/:scanId` | 결과 | 사진 + 박스 오버레이, 하단 순서 시트 | F3~F6 |
| `/not-found` | 인식 실패 | 재촬영 팁 3가지 | F2 |

촬영은 `<input type="file" accept="image/*" capture="environment">`로 기본 카메라 앱을 연다 (v1). 브라우저 내 실시간 카메라(`getUserMedia`)는 v2.

### 8.2 박스 오버레이 구현
- 이미지는 `object-fit: contain`. 렌더링된 이미지의 실제 표시 크기·오프셋을 `ResizeObserver`로 측정.
- `scale = displayWidth / imageWidth`. 각 박스 = `(x1 * scale + offsetX, y1 * scale + offsetY, ...)`로 절대 위치.
- 박스 좌상단에 `SushiBadge`(번호), 옆에 이름 라벨. 박스 너비 < 56px이면 이름 숨김.
- 핀치 줌 시 이미지와 오버레이를 같은 `transform` 컨테이너 안에 둔다.
- 상태: 선택됨 → 강조색 테두리, 먹음 → opacity 0.4, 신뢰도 < 0.6 → 점선 + `?` 표시.

### 8.3 상태와 데이터
- `features/scan/api.ts`: fetch 래퍼, `X-Device-Id` 자동 첨부
- TanStack Query: `useCreateScan`(mutation), `useScan(scanId)`, `useSushiTypes()`(staleTime 길게)
- Zustand `useScanStore`: `selectedItemId`, 로컬 수정 사항
- `features/scan/orderEngine.ts`: 4.2 알고리즘의 TS 구현 (서버와 같은 결과를 내야 함 → 테스트 케이스 공유)
- 업로드 전 `canvas`로 긴 변 1280px, JPEG 0.8 축소

### 8.4 개발 연동
- `vite.config.ts`: `server.proxy['/api'] = 'http://localhost:8080'`
- 배포 옵션 A: 프론트 Vercel + 백엔드 별도 (CORS 설정 필요)
- 배포 옵션 B: `npm run build` 결과를 `be/src/main/resources/static`에 복사해 단일 서버 배포 (1인 운영 권장)

---

## 9. 로드맵과 체크리스트 (주당 10~15시간 기준 12주)

| 단계 | 기간 | 내용 | 통과 조건 |
| --- | --- | --- | --- |
| P0 기획·설계 | 1~2주 | 기획 확정, 와이어프레임, 15종 점수표 | 화면 설계 확정 |
| P1 데이터·모델 | 3~5주 | 데이터 수집, 라벨링, YOLO 학습·평가 | mAP50 ≥ 0.80 (미달 시 10종으로 축소 후 진행) |
| P2 백엔드 | 6~7주 | 추론 API, 순서 엔진, DB 연결 | 응답 3초 이내 |
| P3 프론트 MVP | 8~10주 | 촬영·업로드, 오버레이, 순서 시트 | 실기기 전체 흐름 동작 |
| P4 배포·개선 | 11~12주 | 배포, 지인 테스트, 재학습 | 테스터 10명 사용 |
| (이후) v2 앱 | - | Capacitor 앱 출시, 실시간 인식 검토 | 스토어 출시 |
| (이후) v3 지도·기록 | - | 12장: 가게 연결, 지도, 나만의 리뷰, 로그인 | 내 기록 지도 동작 |

### 체크리스트
- [ ] 모노레포 생성, `PROJECT_SPEC.md` / `DESIGN.md` 커밋
- [ ] Figma 와이어프레임 (DESIGN.md 화면 기준)
- [ ] 공개 데이터셋 다운로드 + class_id 재매핑
- [ ] 직접 촬영 (초밥집 3곳 이상, 목표 300장)
- [ ] 라벨링 → 첫 학습 → 혼동 행렬 확인
- [ ] ONNX 내보내기 + `MODEL_CARD.md` 작성
- [ ] Spring Boot 프로젝트 생성 (Web, JPA, Validation, Flyway, PostgreSQL)
- [ ] `docker-compose.yml`로 로컬 PostgreSQL
- [ ] Flyway V1(스키마), V2(sushi_types 시드)
- [ ] `ImagePreprocessor` + 단위 테스트
- [ ] `SushiDetector` (ONNX Runtime Java) + 샘플 이미지 통합 테스트
- [ ] `PostProcessor`(NMS) + 단위 테스트
- [ ] `OrderEngine` + 단위 테스트 (동점·같은 줄 케이스 포함)
- [ ] `POST /scans`, `GET /scans/{id}`, `PATCH .../items/{id}`, `GET /sushi-types`
- [ ] 에러 응답 + 레이트 리밋
- [ ] React + Vite + TS 프로젝트, PWA 설정, `tokens.css`
- [ ] 홈 → 사진 확인 → 로딩 → 결과 흐름
- [ ] `DetectionOverlay` + `OrderSheet` 연동
- [ ] 수정(`SushiPicker`) + TS `orderEngine`
- [ ] 배포 (Docker), 실기기 테스트
- [ ] 지인 10명 테스트, corrections 데이터로 재학습

---

## 10. 리스크와 대응

| 리스크 | 영향 | 대응 |
| --- | --- | --- |
| 비슷한 생선 구분 실패 (광어↔도미 등) | 순서 오류 | 같은 그룹은 점수가 가까워 영향 작음, 사용자 수정 기능 |
| 데이터 부족 | 정확도 미달 | 클래스 축소, 증강, 수정 데이터 재학습 |
| 가게 조명·각도 | 현장 인식률 하락 | 촬영 가이드, 색온도 증강 |
| Java 전처리·NMS 구현 난이도 | 일정 지연 | 단위 테스트로 Python 결과와 비교. 막히면 추론만 Python(FastAPI) 서비스로 분리 |
| 서버 비용 | 운영 부담 | CPU 추론 + 소형 모델, 무료 티어, v2 온디바이스 검토 |
| 데이터셋 라이선스 | 배포 제약 | CC BY 4.0 표기, 출처 화면 |

---

## 11. 용어

| 용어 | 뜻 |
| --- | --- |
| 피스 | 초밥 한 개 |
| class_id | 초밥 종류 식별자 (4.1 표) |
| order_score | 먹는 순서 점수, 낮을수록 먼저 |
| scan | 사진 1장에 대한 인식 1건 |
| detection / item | scan 안의 피스 1개 |
| correction | 사용자가 고친 인식 결과 |

---

## 12. 확장 계획 (v3): 지도 + 나만의 초밥 기록

> v1·v2 완료 후 진행한다. 에이전트는 12.5장의 원칙만 v1부터 지키고, 나머지는 명시적 요청이 있을 때 구현한다.

### 12.1 컨셉
초밥을 찍으면 "어느 가게인가요?"를 고르게 하고, 그 스캔 기록이 자연스럽게 **나만의 리뷰**가 된다. 지도에서 가게를 누르면 내가 그 가게에서 먹은 초밥 사진, 먹는 순서, 별점, 메모가 함께 보인다. 기본은 개인 기록이며, 공개 공유는 이후 선택 기능으로 둔다.

### 12.2 기능

| ID | 기능 | 설명 |
| --- | --- | --- |
| M1 | 초밥집 지도 | 현재 위치 주변 초밥집을 지도에 표시, 내가 방문한 가게는 다른 핀 색 |
| M2 | 가게 검색 | 이름·지역으로 검색 (외부 장소 검색 API) |
| M3 | 스캔 ↔ 가게 연결 | 결과 화면에서 "어느 가게인가요?" → 주변 가게 목록에서 선택 |
| M4 | 나만의 리뷰 | 방문 단위로 별점(1~5), 메모, 좋았던 피스 체크, 다시 갈지 여부 |
| M5 | 가게 상세 | 내 방문 기록 타임라인, 자주 나온 초밥 종류, 평균 별점 |
| M6 | 내 기록 지도 | 내가 다녀온 가게만 모아 보기 |
| M7 | 공개 리뷰 (선택) | 리뷰 공개 설정, 다른 사용자 리뷰 보기 (신고·검수 기능 필요) |
| M8 | 로그인 | 소셜 로그인 (카카오 우선). 기기 ID 기록을 계정으로 이전 |

### 12.3 유저 플로우
1. 스캔 결과 화면 하단 → `가게 연결하기` → 위치 권한 요청 → 주변 초밥집 목록 → 선택
2. 연결 직후 `이 방문 기록하기` → 별점·메모 입력 → 저장
3. 지도 탭 → 방문한 가게 핀 탭 → 가게 상세 → 방문 기록 → 해당 스캔 결과 다시 보기

### 12.4 설계 초안

**가게 데이터 출처**: 카카오 로컬(키워드 검색) 또는 네이버 지역 검색 API. 외부 API 결과는 `external_place_id` 기준으로 필요한 최소 정보만 저장하고, 저장·표시 조건은 각 서비스 이용약관을 확인한 뒤 확정한다.

**DB 추가 테이블 (예정)**

| 테이블 | 주요 컬럼 | 비고 |
| --- | --- | --- |
| users | id, provider, provider_user_id, nickname, created_at | M8. devices와 1:N 연결 |
| restaurants | id, external_source, external_place_id, name, address, location GEOGRAPHY(Point), created_at | PostGIS 사용, 위치 인덱스 |
| visits | id, user_id(또는 device_id), restaurant_id, visited_at, rating SMALLINT, memo TEXT, revisit BOOL, is_public BOOL | 방문 1회 = 리뷰 1개 |
| scans (변경) | + visit_id NULL FK | 스캔을 방문에 연결 (한 방문에 여러 스캔 가능) |
| visit_favorites | visit_id, detection_id | 좋았던 피스 |

**API 추가 (예정)**

| 메서드 | 경로 | 설명 |
| --- | --- | --- |
| GET | `/api/v1/restaurants/nearby?lat=&lng=&radius=` | 주변 초밥집 (외부 검색 + 캐시) |
| GET | `/api/v1/restaurants/{id}` | 가게 상세 + 내 방문 요약 |
| POST | `/api/v1/visits` | 방문(리뷰) 생성, `scanIds[]` 연결 |
| PATCH | `/api/v1/visits/{id}` | 별점·메모 수정 |
| GET | `/api/v1/me/visits` | 내 방문 기록 목록 (지도용 좌표 포함) |

**기술 추가 (예정)**
- 백엔드: PostgreSQL PostGIS 확장 + Hibernate Spatial, Spring Security + OAuth2 Client (카카오 로그인)
- 프론트: 카카오맵 JavaScript SDK (React 래퍼 사용), `fe/src/features/map/`, `fe/src/features/visit/`
- 가게 페이지를 검색엔진에 노출할 필요가 생기면 프론트를 Next.js로 이전한다 (같은 React 컴포넌트 재사용). 개인 기록 위주라면 Vite 유지.
- 디자인: 지도 핀·가게 카드·별점 컴포넌트는 v3 착수 시 `DESIGN.md`에 먼저 추가한다.

### 12.5 지금(v1)부터 지켜둘 설계 원칙
- 프론트는 기능별 폴더(`features/scan/`)를 유지한다. v3는 `features/map/`, `features/visit/`를 추가하기만 하면 되도록 화면·API 코드를 기능 안에 둔다.
- 백엔드 패키지도 기능별(`scan`, `order`, `inference` …)로 나눈다. v3는 `restaurant`, `visit`, `user` 패키지로 추가한다.
- 소유자 식별은 `device_id`를 한 곳(공통 필터/리졸버)에서만 꺼내 쓴다. 나중에 `user_id`로 바꿀 때 수정 지점을 하나로 만들기 위함이다.
- `scans` 테이블은 다른 테이블이 참조할 수 있도록 UUID PK를 유지한다. v1에서 `visit_id` 컬럼을 미리 만들지는 않는다 (v3 착수 시 Flyway로 추가).
- 결과 화면 하단 레이아웃은 버튼 하나(`가게 연결하기`)가 추가될 공간을 고려한다.

### 12.6 v3 용어

| 용어 | 뜻 |
| --- | --- |
| restaurant | 초밥집 1곳 |
| visit | 한 가게를 한 번 방문한 기록 = 나만의 리뷰 1개 |
| 공개 리뷰 | is_public = true 인 visit |
