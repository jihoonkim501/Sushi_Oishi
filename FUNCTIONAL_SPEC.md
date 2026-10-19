# 스시오이시 (Sushi-Oishi) — 기능 명세서

| 항목 | 내용 |
| --- | --- |
| 문서 버전 | 1.0 |
| 작성일 | 2026-10-19 |
| 대상 범위 | MVP (v1) — 모바일 웹(PWA) |
| 상위 문서 | `PROJECT_SPEC.md`, `REQUIREMENTS.md` |
| 관련 문서 | `DESIGN.md` (화면·컴포넌트·토큰·문구) |
| 위치 | 저장소 루트 `project/FUNCTIONAL_SPEC.md` |

> **에이전트 읽기 규칙**
> - 이 문서는 "어떻게 동작하는가"를 정의한다. 구현은 이 문서의 처리 절차, 비즈니스 규칙(BR), API, 데이터 정의를 그대로 따른다.
> - 각 기능 절의 **관련 요구사항**으로 `REQUIREMENTS.md`와 연결된다. 커밋·테스트 이름에 기능 ID(`F3-2`)나 규칙 ID(`BR-ORD-04`)를 인용한다.
> - 화면의 색·크기·간격·애니메이션은 `DESIGN.md`를 따르며, 이 문서에는 동작만 적는다.
> - 이 문서에 없는 동작이 필요하면 구현 전에 이 문서에 먼저 추가한다.

---

## 목차

1. 기능 총괄
2. 화면 구성과 흐름
3. 기능 상세 (F1~F6)
4. 공통 기능 (C-1~C-7)
5. 데이터 명세
6. API 상세 명세
7. 상태 정의
8. 메시지·문구
9. 순서 엔진 공유 테스트 케이스
10. 인수 테스트 시나리오 (E2E)
11. 문서 반영 필요 항목

---

## 1. 기능 총괄

| 기능 ID | 기능명 | 화면 | API | 관련 요구사항 |
| --- | --- | --- | --- | --- |
| F1-1 | 카메라 촬영 | 홈 | - | FR-IMG-001 |
| F1-2 | 갤러리 선택 | 홈 | - | FR-IMG-002 |
| F1-3 | 사진 확인 | 사진 확인 | - | FR-IMG-003 |
| F1-4 | 클라이언트 이미지 준비 (회전·축소·변환) | 사진 확인 | - | FR-IMG-004~006 |
| F2-1 | 업로드 검증 | 로딩 | POST /scans | FR-IMG-007 |
| F2-2 | 모델 추론 | (서버) | POST /scans | FR-DET-001 |
| F2-3 | 후처리 (필터·NMS·상한·좌표 복원) | (서버) | POST /scans | FR-DET-002~006 |
| F2-4 | 인식 실패 처리 | 인식 실패 | POST /scans | FR-DET-007, FR-ERR-001 |
| F2-5 | 모델 버전 기록 | (서버) | POST /scans, GET /health | FR-DET-008 |
| F2-6 | 분석 지연·취소 | 로딩 | - | FR-ERR-005, 006 |
| F3-1 | 순서 점수 매핑과 정렬 | (서버·클라이언트) | POST /scans | FR-ORD-001, 002, 007 |
| F3-2 | 동점 위치 정렬 | (서버·클라이언트) | POST /scans | FR-ORD-003~005 |
| F3-3 | 순서 재계산 | 결과 | PATCH items | FR-ORD-006, 008 |
| F4-1 | 박스·배지·라벨 표시 | 결과 | - | FR-RES-001, 002, 004 |
| F4-2 | 좌표 변환과 확대·이동 | 결과 | - | FR-RES-003, 012 |
| F4-3 | 박스 선택 | 결과 | - | FR-RES-006 |
| F4-4 | 결과 다시 보기 | 결과 | GET /scans/{id} | FR-RES-011 |
| F5-1 | 순서 시트 표시 | 결과 | - | FR-RES-005, 009 |
| F5-2 | 행 선택 | 결과 | - | FR-RES-006, FR-TYP-003 |
| F5-3 | 먹음 체크 | 결과 | PATCH items | FR-RES-007 |
| F5-4 | 다음 차례·완료 표시 | 결과 | - | FR-RES-008, 010 |
| F6-1 | 종류 선택 시트 | 결과 | - | FR-COR-001, 002, 007 |
| F6-2 | 수정 저장 | (서버) | PATCH items | FR-COR-003, 004 |
| F6-3 | 수정 반영·실패 복구 | 결과 | PATCH items | FR-COR-005, 006 |
| C-1 | 기기 식별과 소유 확인 | 전체 | 전체 | FR-DEV-001~004 |
| C-2 | 초밥 종류 조회·캐시 | 전체 | GET /sushi-types | FR-TYP-001, 002, FR-ORD-007 |
| C-3 | 설정과 사진 저장 동의 | 홈(설정 시트), 동의 다이얼로그 | POST /scans | FR-IMG-008, NFR-PRI-001~003 |
| C-4 | 오류 처리 | 전체 | 전체 | FR-ERR-002~004, 007, 008 |
| C-5 | 헬스체크·로그·API 문서 | (서버) | GET /health | FR-OPS-001~003 |
| C-6 | 요청 한도 | (서버) | POST /scans | FR-OPS-004 |
| C-7 | 출처·라이선스 표시 | 설정 시트 | - | FR-OPS-005 |

---

## 2. 화면 구성과 흐름

### 2.1 화면 목록

| 화면 ID | 경로 | 화면명 | 진입 조건 | 이탈 |
| --- | --- | --- | --- | --- |
| S-01 | `/` | 홈 | 기본 | S-02 |
| S-02 | `/review` | 사진 확인 | 대기 사진(pendingImage) 있음. 없으면 `/`로 replace | S-01, S-03 |
| S-03 | `/loading` | 로딩 | 업로드 요청 진행 중. 아니면 `/`로 replace | S-04, S-05, S-01 |
| S-04 | `/result/:scanId` | 결과 | scanId 존재 | S-01 |
| S-05 | `/not-found` | 인식 실패 | 422 응답 직후 | S-01 |
| S-06 | (시트) | 설정 | 홈 우상단 설정 아이콘 | S-01 |
| S-07 | (시트) | 종류 선택 (SushiPicker) | 결과 화면 길게 누름 | S-04 |
| S-08 | (다이얼로그) | 사진 저장 동의 | 동의 여부 미결정 상태에서 `분석하기` | S-03 |
| S-09 | (전체 화면) | 오류 | 5xx, 알 수 없는 오류 | S-01 |

### 2.2 화면 흐름

```
S-01 홈 ──촬영/선택──▶ S-02 사진 확인 ──다시 찍기──▶ S-01
                         │
                         └─분석하기─▶ [동의 미결정?] ─예─▶ S-08 동의 ─선택─┐
                                         │아니오                          │
                                         ▼                                ▼
                                     S-03 로딩 ◀───────────────────────────┘
                                         │
              ┌──────────────┬───────────┼───────────────┬───────────────┐
           200 OK         422 NO_SUSHI   4xx 기타/네트워크   5xx/30초 초과    뒤로 가기
              ▼              ▼              ▼               ▼               ▼
          S-04 결과      S-05 실패     S-02 + 토스트     S-09 오류       요청 취소 → S-02
              │              │
          홈 버튼         다시 찍기
              ▼              ▼
            S-01           S-01
```

- S-02 → S-03, S-03 → S-04, S-03 → S-05 이동은 `replace`로 처리해 뒤로 가기 시 로딩 화면으로 돌아가지 않는다.
- S-04에서 뒤로 가기는 S-01로 간다.

---

## 3. 기능 상세

### F1. 촬영 / 업로드 준비

#### F1-1 카메라 촬영 · F1-2 갤러리 선택

**관련 요구사항**: FR-IMG-001, FR-IMG-002

**화면 요소 (S-01 홈)**

| 요소 | 컴포넌트 | 동작 |
| --- | --- | --- |
| 설정 아이콘 (우상단) | IconButton | S-06 설정 시트 열기 |
| 메인 문구 | Text | `home.title`, `home.subtitle` |
| 촬영하기 | Button primary | 숨겨진 `<input type="file" accept="image/*" capture="environment">` 클릭 |
| 앨범에서 선택 | Button secondary | 숨겨진 `<input type="file" accept="image/*">` 클릭 (capture 없음) |
| 촬영 팁 | Text caption | `home.tip` |

**처리 절차**
1. 사용자가 버튼을 누르면 해당 `input`의 `click()`을 호출한다.
2. `change` 이벤트에서 `files[0]`을 얻는다. 파일이 없으면(취소) 아무것도 하지 않는다.
3. 파일 MIME이 `image/`로 시작하지 않으면 토스트 `error.notImage`를 띄우고 종료한다.
4. F1-4의 이미지 준비를 시작하고, 완료되면 `pendingImage`를 스토어에 저장한 뒤 S-02로 이동한다.
5. 준비 중에는 버튼을 비활성화하고 스피너를 표시한다.
6. 같은 파일을 다시 선택할 수 있도록 처리 후 `input.value = ''`로 초기화한다.

**예외**
| 상황 | 처리 |
| --- | --- |
| 이미지 디코딩 실패 (손상 파일, 브라우저 미지원 HEIC) | 토스트 `error.decodeFailed`, 홈 유지 |
| 디코딩 후 너비 또는 높이 < 200px | 토스트 `error.tooSmall`, 홈 유지 |

#### F1-3 사진 확인

**관련 요구사항**: FR-IMG-003

**화면 요소 (S-02)**

| 요소 | 동작 |
| --- | --- |
| 사진 미리보기 | `pendingImage.objectUrl`, `object-fit: contain`, 배경 검정 |
| 다시 찍기 | `pendingImage`의 objectURL을 `URL.revokeObjectURL`로 해제하고 스토어에서 제거 → S-01 |
| 분석하기 | C-3 동의 확인 → S-03 이동 + F2 요청 시작 |

**규칙**
- S-02를 새로고침하면 `pendingImage`가 없으므로 S-01로 replace 한다.
- `분석하기` 연타 방지: 첫 탭 후 버튼 비활성화.

#### F1-4 클라이언트 이미지 준비

**관련 요구사항**: FR-IMG-004~006

**처리 절차** (`fe/src/features/scan/image.ts` `prepareImage(file): Promise<PreparedImage>`)
1. `createImageBitmap(file, { imageOrientation: 'from-image' })`로 EXIF 방향이 적용된 비트맵을 만든다. 지원하지 않는 브라우저는 `<img>` 로드 후 `naturalWidth/Height`를 사용한다 (최신 브라우저는 EXIF 방향을 자동 적용).
2. 긴 변 `L = max(w, h)`. `L > 1280`이면 `scale = 1280 / L`, 아니면 `scale = 1` (확대하지 않음).
3. `OffscreenCanvas`(미지원 시 `<canvas>`)에 `round(w*scale) × round(h*scale)`로 그린다.
4. `convertToBlob({ type: 'image/jpeg', quality: 0.8 })`로 JPEG를 만든다. 이 단계에서 EXIF는 제거된다.
5. 결과 Blob이 5MB를 넘으면 quality를 0.6으로 한 번 더 시도하고, 그래도 넘으면 `error.tooLarge`.
6. `PreparedImage = { blob, objectUrl, width, height }`를 반환한다.

**규칙**
- BR-IMG-01: 서버로 보내는 이미지는 항상 JPEG다. HEIC·PNG도 이 단계에서 JPEG로 바뀐다.
- BR-IMG-02: 확대하지 않는다. 640×480 원본은 640×480으로 전송한다.
- BR-IMG-03: 결과 화면 표시는 이 `PreparedImage`를 사용한다 (서버 좌표 기준 이미지와 같은 비율).

---

### F2. 초밥 인식

#### F2-1 업로드 검증 (서버)

**관련 요구사항**: FR-IMG-007, NFR-SEC-003, 004, 008

**처리 절차** (`ScanController` → `ImagePreprocessor`)
1. `X-Device-Id` 검증 (C-1). 실패 시 `400 INVALID_DEVICE_ID`.
2. 요청 한도 확인 (C-6). 초과 시 `429 RATE_LIMITED`.
3. `image` 파트가 없으면 `400 VALIDATION_ERROR`.
4. 파일 크기 > 5,242,880 bytes → `413 IMAGE_TOO_LARGE`. (컨테이너 설정 `spring.servlet.multipart.max-file-size=6MB`로 1차 차단, 초과 시 같은 에러 코드로 변환)
5. 헤더 바이트(매직 넘버)로 형식 판별: JPEG(`FF D8 FF`), PNG(`89 50 4E 47`). 그 외 → `415 UNSUPPORTED_FORMAT`.
6. `ImageIO` 리더로 너비·높이만 먼저 읽고, `w*h > 50,000,000`이면 `413 IMAGE_TOO_LARGE`.
7. 디코딩. 실패 시 `400 INVALID_IMAGE`.
8. EXIF Orientation(1~8)을 읽어 회전·반전 적용 (클라이언트에서 이미 처리했더라도 안전장치).
9. 긴 변 > 1280이면 축소 (bilinear). 결과가 **기준 이미지**이며 `imageWidth`, `imageHeight`가 된다.

#### F2-2 모델 추론

**관련 요구사항**: FR-DET-001, NFR-PERF-003, 008

**처리 절차** (`SushiDetector`)
1. 기준 이미지를 640×640 letterbox로 변환한다.
    - `r = min(640 / W, 640 / H)`, `newW = round(W*r)`, `newH = round(H*r)`
    - `padX = (640 - newW) / 2`, `padY = (640 - newH) / 2` (실수 유지, 그릴 때만 floor)
    - 패딩 색 RGB(114,114,114)
2. 텐서 변환: NCHW, RGB 순서, `value / 255.0f` (정확한 규칙은 `ml/exports/MODEL_CARD.md` 기준).
3. 추론 동시 실행 수 제한: 세마포어 permits = `sushioishi.inference.max-concurrency` (기본 2). 10초 안에 permit을 못 얻으면 `503 SERVER_BUSY`.
4. `OrtSession.run` 실행. 세션은 애플리케이션 시작 시 1회 생성해 재사용한다.
5. 출력 텐서를 `RawDetection(cx, cy, w, h, classIndex, confidence)` 목록으로 파싱한다 (출력 형태는 MODEL_CARD 기준. Ultralytics 기본 내보내기라면 `[1, 4+C, A]`, 각 앵커의 클래스 점수 중 최댓값을 confidence로 사용).

#### F2-3 후처리

**관련 요구사항**: FR-DET-002~006

**처리 절차** (`PostProcessor`)

| 단계 | 규칙 ID | 내용 |
| --- | --- | --- |
| 1 | BR-DET-01 | confidence < 0.40 제거 (`sushioishi.inference.min-confidence`) |
| 2 | BR-DET-02 | 640 공간 좌표 → 기준 이미지 좌표: `x = (x640 - padX) / r`, `y = (y640 - padY) / r` |
| 3 | BR-DET-03 | 좌표를 `[0, W] × [0, H]`로 자르고 정수로 반올림. 자른 뒤 너비나 높이가 8px 미만이면 제거 |
| 4 | BR-DET-04 | 클래스 무관 NMS: confidence 내림차순으로 순회, 이미 채택된 박스와 IoU ≥ 0.50이면 제거 |
| 5 | BR-DET-05 | 남은 박스가 40개를 넘으면 confidence 상위 40개만 유지 |
| 6 | BR-DET-06 | `labels.json`으로 classIndex → class_id 변환. `sushi_types`에 없는 class_id는 `unknown` |

**IoU 정의**: `IoU = 교집합 넓이 / (A 넓이 + B 넓이 - 교집합 넓이)`. 넓이가 0이면 IoU = 0.

**좌표 복원 예시**: 기준 이미지 1280×960 → `r = 0.5`, `newW=640`, `newH=480`, `padX=0`, `padY=80`. 모델 박스 `(x1=100, y1=130, x2=180, y2=190)` → 기준 이미지 `(200, 100, 360, 220)`.

#### F2-4 인식 실패 처리

**관련 요구사항**: FR-DET-007, FR-ERR-001

- 서버: 후처리 결과가 0개면 DB에 아무것도 저장하지 않고 `422 NO_SUSHI_DETECTED`를 반환한다. 동의한 원본 이미지도 저장하지 않는다.
- 클라이언트: 422를 받으면 S-05로 replace 한다. `pendingImage`는 유지해 S-05에서 썸네일로 보여줄 수 있다.

**화면 요소 (S-05)**

| 요소 | 내용 |
| --- | --- |
| 일러스트 | 빈 접시 |
| 제목 | `notFound.title` |
| 팁 3개 | `notFound.tip1~3` (위에서, 밝은 곳, 접시 전체) |
| 다시 찍기 | Button primary → `pendingImage` 해제 → S-01 |

#### F2-5 모델 버전 기록

**관련 요구사항**: FR-DET-008

- 설정 `sushioishi.model.version`(예: `v1`)과 `sushioishi.model.path`를 읽는다.
- 모든 스캔의 `scans.model_version`과 응답 `modelVersion`에 기록한다.
- `GET /health`에 같은 값을 노출한다.

#### F2-6 분석 지연·취소 (클라이언트)

**관련 요구사항**: FR-ERR-005, 006

**처리 절차 (S-03)**
1. 진입 시 `AbortController`를 만들고 `POST /scans`를 시작한다.
2. 문구: 0초 `loading.step1` → 1.5초 `loading.step2` → 10초 `loading.slow`.
3. 30초가 지나면 `abort()` 후 토스트 `error.timeout`과 함께 S-02로 replace.
4. 뒤로 가기(popstate) 또는 화면 이탈 시 `abort()` 하고 S-02로 이동한다. 취소된 요청은 오류 토스트를 띄우지 않는다.
5. 성공 응답을 받으면 응답을 쿼리 캐시 `['scan', scanId]`에 넣고, `PreparedImage`를 C-8 로컬 사진 보관소에 저장한 뒤 S-04로 replace.

**클라이언트 계측** (NFR-PERF-001): `분석하기` 탭 시각 ~ S-04 첫 렌더 완료 시각을 `performance.mark`로 측정해 콘솔(개발) 또는 로그 API(v2)로 남긴다.

---

### F3. 먹는 순서 산정

#### F3-1 순서 점수 매핑과 정렬 · F3-2 동점 위치 정렬

**관련 요구사항**: FR-ORD-001~005, 007

서버 `OrderEngine`(Java)과 클라이언트 `orderEngine.ts`(TS)는 **같은 알고리즘**을 구현하고, 9장의 공유 테스트 케이스를 모두 통과해야 한다.

**입력**: `items[]` — 각 항목 `{ classId, confidence, box: {x1,y1,x2,y2} }`, `scoreOf(classId)` 함수
**출력**: 같은 항목들에 `order`(1..N)를 붙여 order 오름차순으로 정렬한 배열

**비즈니스 규칙**

| 규칙 ID | 내용 |
| --- | --- |
| BR-ORD-01 | `score = sushi_types[classId].order_score`. 표에 없으면 `unknown`의 점수(50) |
| BR-ORD-02 | 1차 정렬: score 오름차순 |
| BR-ORD-03 | 박스 중심 `cx = (x1+x2)/2`, `cy = (y1+y2)/2`, 높이 `h = y2 - y1` (실수 연산) |
| BR-ORD-04 | **행 그룹핑** (같은 score끼리만 적용): ① `(cy 오름차순, cx 오름차순, confidence 내림차순)`으로 정렬 ② 앞에서부터 순회하며 첫 항목을 현재 행의 기준(anchor)으로 둔다 ③ 다음 항목이 `cy - anchor.cy ≤ 0.5 × anchor.h`이면 같은 행, 아니면 새 행을 시작하고 그 항목이 새 기준이 된다 ④ 행은 만든 순서대로, 행 안은 `(cx 오름차순, confidence 내림차순)`으로 정렬 |
| BR-ORD-05 | 최종 동점(같은 행, 같은 cx, 같은 confidence)은 `x1`, `y1` 오름차순 |
| BR-ORD-06 | order는 최종 정렬 순서대로 1부터 1씩 증가 |
| BR-ORD-07 | 비교 함수에 "같은 행" 판정을 직접 넣지 않는다. 행 판정은 비추이적이라 Java `TimSort`가 `Comparison method violates its general contract` 예외를 낼 수 있다. 반드시 BR-ORD-04의 그룹핑 후 정렬 방식으로 구현한다 |

**의사 코드**

```
function assignOrder(items, scoreOf):
    groups = groupBy(items, it -> scoreOf(it.classId))       # score별 묶음
    result = []
    for score in sortedAscending(groups.keys):
        g = sortBy(groups[score], cy ASC, cx ASC, confidence DESC)
        rows = []
        for it in g:
            if rows.isEmpty or it.cy - rows.last.anchor.cy > 0.5 * rows.last.anchor.h:
                rows.add(Row(anchor = it, members = [it]))
            else:
                rows.last.members.add(it)
        for row in rows:
            result.addAll(sortBy(row.members, cx ASC, confidence DESC, x1 ASC, y1 ASC))
    for i, it in enumerate(result): it.order = i + 1
    return result
```

**점수표 조회**
- 서버: `SushiTypeCache`가 `sushi_types` 전체를 메모리에 보관하고 10분마다 갱신한다 (FR-ORD-007).
- 클라이언트: C-2 캐시 사용.

#### F3-3 순서 재계산

**관련 요구사항**: FR-ORD-006, 008

- 트리거: 아이템 class_id 수정(F6). 먹음 체크(F5-3)는 순서를 바꾸지 않는다.
- 서버: PATCH 처리 트랜잭션 안에서 해당 스캔의 모든 detection을 다시 읽어 `OrderEngine`을 실행하고 `order_index`를 일괄 갱신한다.
- 클라이언트: PATCH 요청 전에 `orderEngine.ts`로 먼저 계산해 즉시 표시하고(낙관적 갱신), 서버 응답이 오면 서버 결과로 덮어쓴다.
- BR-ORD-08: 재계산 시 `eaten`, `corrected`, `confidence`, `box`는 바뀌지 않는다.
- BR-ORD-09: 수정된 아이템의 confidence는 원래 모델 값을 유지하지만, 화면에서는 `corrected=true`이면 저신뢰 표시를 하지 않는다.

---

### F4. 결과 오버레이

#### F4-1 박스·배지·라벨 표시

**관련 요구사항**: FR-RES-001, 002, 004

**표시 규칙**

| 규칙 ID | 조건 | 표시 |
| --- | --- | --- |
| BR-RES-01 | 기본 | 흰 박스 + 좌상단 `SushiBadge(order, group)` + 이름 라벨 (`nameKo`) |
| BR-RES-02 | `confidence < 0.60` 이고 `corrected = false` | 점선 박스, 이름 뒤 `?` |
| BR-RES-03 | 표시 박스 너비 < 56px | 이름 라벨 숨김 (배지만) |
| BR-RES-04 | `eaten = true` | 박스·배지 opacity 0.4, 배지 숫자 대신 체크 아이콘 |
| BR-RES-05 | `selectedItemId = itemId` | 강조 테두리, 배지 1.15배 |
| BR-RES-06 | 배지 겹침 | order가 작은 쪽이 위 (`z-index = 1000 - order`) |
| BR-RES-07 | 배지 위치 | 박스 좌상단에서 (-14px, -14px). 사진 표시 영역 밖으로 나가면 영역 안으로 밀어 넣음 |
| BR-RES-08 | 배지 색 | `group` → `DESIGN.md` 2.2 배지 토큰 (`constants/badge.ts`) |

**결과 진입 애니메이션**: order 순서대로 60ms 간격 등장 (`DESIGN.md` 8장). reduced-motion이면 생략.

#### F4-2 좌표 변환과 확대·이동

**관련 요구사항**: FR-RES-003, 012

**좌표 변환** (`DetectionOverlay`)
1. 사진 컨테이너 크기 `Cw × Ch`를 `ResizeObserver`로 측정한다.
2. `s = min(Cw / imageWidth, Ch / imageHeight)` (`object-fit: contain`과 동일)
3. `offX = (Cw - imageWidth*s) / 2`, `offY = (Ch - imageHeight*s) / 2`
4. 각 박스의 표시 좌표: `left = x1*s + offX`, `top = y1*s + offY`, `width = (x2-x1)*s`, `height = (y2-y1)*s`
5. 컨테이너 크기가 바뀔 때마다(회전, 시트 높이 변화) 다시 계산한다.

**확대·이동**
- 사진과 오버레이를 같은 transform 컨테이너에 넣고 `scale`, `translate`를 함께 적용한다.
- 배율 범위 1.0~4.0, 더블탭 시 1.0 ↔ 2.5 전환.
- 확대 중에도 배지와 라벨 크기는 화면 기준 고정 (`scale(1/zoom)` 역보정).
- 이동은 사진이 컨테이너 밖으로 완전히 나가지 않도록 경계를 제한한다.

#### F4-3 박스 선택

**관련 요구사항**: FR-RES-006

| 입력 | 처리 |
| --- | --- |
| 박스 탭 | `selectedItemId = itemId`, 시트가 접힘 상태면 절반으로 펼치고 해당 행으로 스크롤 |
| 같은 박스 다시 탭 | 선택 해제 |
| 빈 영역 탭 | 선택 해제 |
| 박스 길게 누름 (500ms) | F6-1 종류 선택 시트 |

- 박스 히트 영역은 최소 44×44px. 실제 박스가 작으면 중심 기준으로 투명 영역을 넓힌다.
- 히트 영역이 겹치면 z-index가 높은(order가 작은) 박스가 이벤트를 받는다.

#### F4-4 결과 다시 보기

**관련 요구사항**: FR-RES-011

**처리 절차**
1. S-04 진입 시 쿼리 캐시 `['scan', scanId]`가 있으면 사용, 없으면 `GET /scans/{scanId}` 호출.
2. 사진은 C-8 로컬 사진 보관소에서 `scanId`로 찾는다.
3. 응답 404 → 토스트 `error.scanNotFound` 후 S-01로 replace.

**규칙**
- BR-RES-09: 서버는 원본 이미지를 응답하지 않는다. 사진은 업로드한 기기의 로컬 보관본으로만 표시한다.
- BR-RES-10: 로컬 사진이 없으면(브라우저 데이터 삭제 등) **목록 전용 모드**로 표시한다. 사진 영역 대신 안내 문구 `result.noLocalPhoto`를 보여주고 시트를 전체 높이로 연다. 먹음 체크·수정은 그대로 가능하다.

---

### F5. 순서 리스트

#### F5-1 순서 시트 표시

**관련 요구사항**: FR-RES-005, 009

**화면 요소 (`OrderSheet`)**

| 요소 | 내용 |
| --- | --- |
| 핸들 | 드래그로 높이 전환 |
| 헤더 | `result.sheetTitle` + 진행 `{eatenCount} / {total}` |
| 목록 | `<ol>`, order 오름차순 `OrderRow` |
| OrderRow | 배지(lg) · `nameKo` (저신뢰면 `?`) · 그룹 태그(한글 그룹명) · 체크 버튼 |
| 저신뢰 안내 | 저신뢰 아이템이 1개 이상이면 목록 위 caption `result.lowConfidence` (최초 1회 표시 후 로컬에 기억) |

**시트 높이 상태**

| 상태 | 높이 | 진입 |
| --- | --- | --- |
| COLLAPSED | 88px (다음 차례 1행만) | 아래로 드래그, 사진 확대 시작 시 |
| HALF | 45vh | 기본, 박스 탭 시 COLLAPSED에서 전환 |
| FULL | 90vh | 위로 드래그, 목록 전용 모드 |

- 드래그 종료 시 속도·위치로 가장 가까운 상태에 스냅한다.

**그룹 태그 한글명**

| group | 표시 |
| --- | --- |
| WHITE | 흰살 |
| SHELL | 조개 |
| SQUID | 연체 |
| SHRIMP | 새우 |
| RED | 붉은살 |
| BLUE | 등푸른 |
| FATTY | 기름진 |
| GUNKAN | 군함 |
| SAUCE | 양념 |
| FINISH | 마무리 |
| UNKNOWN | 미확인 |

#### F5-2 행 선택

**관련 요구사항**: FR-RES-006, FR-TYP-003

| 입력 | 처리 |
| --- | --- |
| 행 탭 | `selectedItemId = itemId`, 해당 박스 펄스. 행 아래로 `description` 한 줄 펼침 (Could) |
| 같은 행 다시 탭 | 선택 해제, 설명 접힘 |
| 행 길게 누름 (500ms) | F6-1 |
| 체크 버튼 탭 | F5-3 (행 선택과 별개, 이벤트 전파 중단) |

#### F5-3 먹음 체크

**관련 요구사항**: FR-RES-007

**처리 절차**
1. 체크 버튼 탭 → 로컬 상태 `eaten = !eaten` 즉시 반영 (낙관적 갱신).
2. `PATCH /scans/{scanId}/items/{itemId}` body `{ "eaten": true|false }`.
3. 성공: 응답으로 캐시 갱신.
4. 실패: 원래 값으로 되돌리고 토스트 `error.saveFailed`.
5. 체크로 바뀐 경우 F5-4의 다음 차례로 자동 이동.

**규칙**
- BR-EAT-01: 먹음 체크는 순서를 바꾸지 않는다.
- BR-EAT-02: 순서와 다르게 먹어도 된다 (3번을 먼저 체크 가능). 다음 차례는 항상 "안 먹은 것 중 order 최소".
- BR-EAT-03: 같은 아이템에 대한 연속 탭은 마지막 상태만 서버에 반영되도록 요청을 300ms 디바운스한다.

#### F5-4 다음 차례·완료 표시

**관련 요구사항**: FR-RES-008, 010

- `nextItem = items.filter(!eaten).minBy(order)`
- nextItem 행: 좌측 강조 바 + 배경 강조 + 우측 `result.next` 라벨.
- 체크 후 nextItem이 바뀌면 시트를 해당 행으로 스크롤하고 `selectedItemId = nextItem.itemId`.
- 모든 아이템이 eaten이면 nextItem 없음 → 헤더 아래 `result.allDone` 배너. 하나라도 해제하면 배너를 숨긴다.

---

### F6. 인식 결과 수정

#### F6-1 종류 선택 시트

**관련 요구사항**: FR-COR-001, 002, 007

**화면 요소 (S-07 `SushiPicker`)**

| 요소 | 내용 |
| --- | --- |
| 제목 | `picker.title` |
| 현재 값 | 시트 상단 "지금: 광어" |
| 그리드 | 3열, `sushi_types`에서 `unknown` 제외, order_score 오름차순. 셀 = 그룹 색 점 + nameKo + nameJa |
| 잘 모르겠어요 | 그리드 아래 전체 너비 버튼 → `unknown` |
| 닫기 | 바깥 탭, 아래로 스와이프, 뒤로 가기 |

**규칙**
- BR-COR-01: 현재 class_id와 같은 셀을 선택하면 시트만 닫고 요청하지 않는다.
- BR-COR-02: 길게 누름 판정은 500ms, 이동 거리 10px 이상이면 취소 (스크롤과 구분). 판정 시 가능하면 `navigator.vibrate(10)`.

#### F6-2 수정 저장 (서버)

**관련 요구사항**: FR-COR-003, 004, NFR-REL-005

**처리 절차** (`PATCH /scans/{scanId}/items/{itemId}`, body에 `classId` 포함 시)
1. C-1 소유 확인. 스캔이 없거나 소유자가 다르면 `404 SCAN_NOT_FOUND`.
2. itemId가 해당 스캔의 detection이 아니면 `404 ITEM_NOT_FOUND`.
3. `classId`가 `sushi_types`에 없으면 `400 INVALID_CLASS_ID`.
4. 트랜잭션 시작.
5. 기존 class_id와 같으면 6~7 생략.
6. `corrections`에 `(detection_id, before_class, after_class)` 기록.
7. `detections.class_id` 갱신, `corrected = true`.
8. `eaten`도 있으면 함께 갱신.
9. 스캔의 전체 detection으로 `OrderEngine` 재실행, `order_index` 일괄 갱신.
10. 커밋 후 전체 `ScanResponse` 반환.

**규칙**
- BR-COR-03: 수정할 때마다 corrections를 쌓는다. 재학습 데이터는 detection별 최신 기록의 `after_class`를 쓴다.
- BR-COR-04: `unknown`으로 수정하는 것도 수정으로 기록한다.
- BR-COR-05: 원래 모델 값으로 되돌려도 `corrected`는 `true`로 남는다.

#### F6-3 수정 반영·실패 복구 (클라이언트)

**관련 요구사항**: FR-COR-005, 006

1. 선택 즉시: 스냅샷 저장 → 로컬 아이템 class_id·nameKo·group 변경, `corrected=true` → `orderEngine.ts`로 재계산 → 화면 갱신 → 토스트 `result.reordered`.
2. `PATCH` 요청.
3. 성공: 서버 응답으로 캐시 교체 (클라이언트 계산과 다르면 서버 우선).
4. 실패: 스냅샷으로 복원, 토스트 `error.correctionFailed`.
5. 요청 진행 중에는 같은 아이템의 추가 수정을 막는다 (다른 아이템은 가능).

---

## 4. 공통 기능

### C-1 기기 식별과 소유 확인

**관련 요구사항**: FR-DEV-001~004, NFR-EXT-001

**클라이언트**
- 앱 시작 시 `localStorage['sushioishi.deviceId']` 확인 → 없으면 `crypto.randomUUID()` 생성·저장.
- `localStorage` 접근이 실패하면(사파리 개인정보 보호 모드 등) 메모리 값으로 동작하고, 새로고침 시 이전 결과는 볼 수 없음을 허용한다.
- `api.ts`의 fetch 래퍼가 모든 요청에 `X-Device-Id`를 붙인다.

**서버**
- `DeviceIdResolver`(HandlerMethodArgumentResolver 또는 필터) 한 곳에서만 헤더를 읽는다.
- 형식: UUID 문자열(대소문자 무시). 없거나 형식 오류 → `400 INVALID_DEVICE_ID`. `/api/v1/health`, Swagger 경로는 제외.
- `devices`에 없으면 `INSERT ... ON CONFLICT DO NOTHING`.
- 스캔 조회·수정 쿼리는 항상 `WHERE id = :scanId AND device_id = :deviceId`. 결과 없으면 `404 SCAN_NOT_FOUND` (존재 여부를 노출하지 않음).

### C-2 초밥 종류 조회·캐시

**관련 요구사항**: FR-TYP-001, 002, FR-ORD-007

- 서버: `GET /sushi-types`는 `SushiTypeCache` 값을 반환, `Cache-Control: public, max-age=600`.
- 클라이언트: TanStack Query `['sushiTypes']`, `staleTime = 24h`, `gcTime = 7d`. 앱 시작 시 `localStorage['sushioishi.sushiTypes.v1']`로 초기값을 채우고 백그라운드 갱신, 성공 시 다시 저장.
- 결과 화면은 종류 목록이 없어도 응답의 `nameKo`, `group`으로 표시할 수 있다. 수정 시트는 종류 목록이 필요하므로, 없으면 로딩 후 연다.

### C-3 설정과 사진 저장 동의

**관련 요구사항**: FR-IMG-008, NFR-PRI-001~003

**동의 상태**: `localStorage['sushioishi.consent']` = `granted` | `denied` | (없음 = 미결정)

**동의 다이얼로그 (S-08)**
- 미결정 상태에서 `분석하기`를 누를 때 1회 표시.
- 제목 `consent.title`, 본문 `consent.body`, 버튼 `consent.agree`(granted) / `consent.decline`(denied).
- 어떤 버튼을 눌러도 선택을 저장하고 분석을 계속한다. 바깥 탭으로 닫으면 `denied`로 저장하고 계속한다.

**업로드 반영**: `consent=true`는 `granted`일 때만 보낸다.

**서버 처리**
- `consent=true`이고 스캔 결과가 1개 이상일 때만 기준 이미지를 JPEG로 다시 인코딩해(EXIF 없음) `scans/{yyyy}/{MM}/{scanId}.jpg`에 저장한다.
- 저장 실패 시 `image_url = NULL`로 스캔은 정상 처리하고 WARN 로그.
- 저장은 응답 지연을 줄이기 위해 트랜잭션 커밋 후 비동기로 실행하고, 완료되면 `image_url`을 갱신한다.

**설정 시트 (S-06)**

| 항목 | 동작 |
| --- | --- |
| 화면 모드 | 시스템 / 라이트 / 다크. `localStorage['sushioishi.theme']`, `<html data-theme>` 적용 |
| 사진 저장 동의 | 토글. 바꾸면 즉시 `consent` 갱신, 이후 스캔부터 적용 |
| 데이터 출처 | C-7 목록 |
| 버전 | 앱 버전, `GET /health`의 modelVersion |

### C-4 오류 처리

**관련 요구사항**: FR-ERR-002~004, 007, 008

**서버**: `@RestControllerAdvice`에서 모든 예외를 `ErrorResponse { code, message }`로 변환한다. 6.7의 코드표 외 예외는 `500 INTERNAL_ERROR`, 메시지는 고정 문구, 스택 트레이스는 로그에만.

**클라이언트 매핑**

| 응답 | 발생 화면 | 처리 |
| --- | --- | --- |
| 네트워크 실패 (`TypeError: Failed to fetch`) | S-03 | S-02로 이동 + 토스트 `error.network` (다시 시도 액션) |
| `navigator.onLine === false` | S-02 분석하기 | 요청하지 않고 토스트 `error.offline` |
| 400 INVALID_IMAGE / 415 | S-03 | S-01로 이동 + 토스트 `error.decodeFailed` |
| 413 | S-03 | S-01로 이동 + 토스트 `error.tooLarge` |
| 422 NO_SUSHI_DETECTED | S-03 | S-05 |
| 429 | S-03 | S-02 유지 + 토스트 `error.rateLimited` (`Retry-After` 초가 있으면 그 시간 동안 분석하기 비활성) |
| 404 SCAN_NOT_FOUND | S-04 | S-01 + 토스트 `error.scanNotFound` |
| 400 INVALID_DEVICE_ID | 전체 | 기기 ID 재생성 후 1회 재시도, 실패 시 S-09 |
| PATCH 실패 (모든 오류) | S-04 | 롤백 + 토스트 (`error.saveFailed` / `error.correctionFailed`) |
| 503 / 500 | S-03 | S-09 오류 화면 (`error.server`, 홈으로) |

### C-5 헬스체크·로그·API 문서

**관련 요구사항**: FR-OPS-001~003, NFR-PRI-004

- `GET /api/v1/health`: 모델 세션 로드 여부와 DB 연결(`SELECT 1`)을 확인. 둘 다 정상이면 200 `UP`, 하나라도 실패하면 503 `DOWN`.
- 스캔 로그 (INFO, JSON 한 줄):
  `{"event":"scan","scanId":"…","deviceIdHash":"sha256 앞 8자","items":12,"lowConfidence":2,"msPre":45,"msInfer":380,"msPost":6,"msTotal":510,"model":"v1","consent":false}`
- 수정 로그: `{"event":"correction","scanId":"…","itemId":…,"from":"tai","to":"hirame"}`
- 기기 ID 원문, 이미지 바이트, EXIF는 로그에 남기지 않는다.
- Swagger UI: `/swagger-ui.html`, 운영 프로필에서는 `springdoc.swagger-ui.enabled=false`.

### C-6 요청 한도

**관련 요구사항**: FR-OPS-004

- 대상: `POST /api/v1/scans`만.
- 기준: 기기 ID별 토큰 버킷, 용량 10, 1분에 10개 충전 (Bucket4j 인메모리).
- 초과 시 `429 RATE_LIMITED`, 헤더 `Retry-After: {초}`.
- 기기 ID 헤더를 바꿔 우회하는 경우를 막기 위해 IP별 분당 30회 보조 제한을 함께 둔다.

### C-7 출처·라이선스 표시

**관련 요구사항**: FR-OPS-005, CR-7

- 설정 시트 하단 "데이터 출처" 목록: 데이터셋 이름, 저작자, 라이선스, 링크.
- 목록 원본은 `fe/src/constants/credits.ts`. 모델 학습에 실제로 사용한 데이터셋만 넣는다 (`ml/exports/MODEL_CARD.md`와 일치).

### C-8 로컬 사진 보관소 (클라이언트)

**관련 요구사항**: FR-RES-011, BR-RES-09, 10

- IndexedDB `sushioishi` / store `photos` / key `scanId` / value `{ blob, width, height, createdAt }`.
- 최대 20건 보관, 초과 시 `createdAt`이 가장 오래된 것부터 삭제.
- 저장 실패(용량 부족, 개인정보 보호 모드)는 무시하고 진행한다. 이 경우 새로고침하면 목록 전용 모드가 된다.

---

## 5. 데이터 명세

Flyway 파일: `be/src/main/resources/db/migration/V1__init.sql`, `V2__seed_sushi_types.sql`

### 5.1 `devices`

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| id | UUID | N | - | PK. 클라이언트 생성 기기 ID |
| created_at | TIMESTAMPTZ | N | now() | 최초 요청 시각 |

### 5.2 `sushi_types`

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| class_id | VARCHAR(32) | N | - | PK. 예: `hirame` |
| name_ko | VARCHAR(32) | N | - | 광어 |
| name_ja | VARCHAR(32) | N | - | ヒラメ |
| group_code | VARCHAR(16) | N | - | CHECK IN (WHITE, SHELL, SQUID, SHRIMP, RED, BLUE, FATTY, GUNKAN, SAUCE, FINISH, UNKNOWN) |
| order_score | INT | N | - | CHECK 0~100 |
| description | TEXT | Y | - | 한 줄 설명 |

시드: `PROJECT_SPEC.md` 4.1의 15종 + `('unknown', '미확인', '不明', 'UNKNOWN', 50, NULL)`.

### 5.3 `scans`

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| device_id | UUID | N | - | FK → devices.id |
| image_url | VARCHAR(512) | Y | NULL | 동의 시 스토리지 키 |
| image_width | INT | N | - | 기준 이미지 너비 (CHECK > 0) |
| image_height | INT | N | - | 기준 이미지 높이 (CHECK > 0) |
| model_version | VARCHAR(32) | N | - | 예: `v1` |
| created_at | TIMESTAMPTZ | N | now() | |

인덱스: `idx_scans_device_created (device_id, created_at DESC)` — v2 히스토리 대비.

### 5.4 `detections`

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| id | BIGSERIAL | N | - | PK. API의 `itemId` |
| scan_id | UUID | N | - | FK → scans.id ON DELETE CASCADE |
| class_id | VARCHAR(32) | N | - | FK → sushi_types.class_id |
| confidence | REAL | N | - | CHECK 0~1, 모델 원래 값 |
| x1, y1, x2, y2 | INT | N | - | 기준 이미지 픽셀. CHECK x1 < x2, y1 < y2 |
| order_index | INT | N | - | 1..N. UNIQUE (scan_id, order_index) DEFERRABLE INITIALLY DEFERRED |
| eaten | BOOLEAN | N | false | |
| corrected | BOOLEAN | N | false | |

인덱스: `idx_detections_scan (scan_id)`.
`order_index` 일괄 갱신 중 일시 중복을 허용하기 위해 유니크 제약을 지연(DEFERRABLE)으로 둔다.

### 5.5 `corrections`

| 컬럼 | 타입 | NULL | 기본값 | 설명 |
| --- | --- | --- | --- | --- |
| id | BIGSERIAL | N | - | PK |
| detection_id | BIGINT | N | - | FK → detections.id ON DELETE CASCADE |
| before_class | VARCHAR(32) | N | - | FK → sushi_types |
| after_class | VARCHAR(32) | N | - | FK → sushi_types |
| created_at | TIMESTAMPTZ | N | now() | |

인덱스: `idx_corrections_detection (detection_id, created_at DESC)`.

### 5.6 클라이언트 저장소

| 위치 | 키 | 값 |
| --- | --- | --- |
| localStorage | `sushioishi.deviceId` | UUID |
| localStorage | `sushioishi.consent` | `granted` / `denied` |
| localStorage | `sushioishi.theme` | `system` / `light` / `dark` |
| localStorage | `sushioishi.sushiTypes.v1` | 종류 목록 JSON |
| localStorage | `sushioishi.lowConfidenceHintSeen` | `1` |
| IndexedDB | `sushioishi.photos[scanId]` | C-8 |

모든 localStorage 접근은 try/catch로 감싼다.

---

## 6. API 상세 명세

공통
- Base URL: `/api/v1`
- 요청·응답 JSON 필드는 camelCase, 문자 인코딩 UTF-8
- 헤더 `X-Device-Id` 필수 (`/health` 제외)
- 시각 값은 ISO-8601 UTC (`2026-10-19T01:30:00Z`)

### 6.1 `POST /scans` — 인식 + 순서

**요청**: `multipart/form-data`

| 파트 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| image | file | Y | JPEG/PNG, ≤ 5MB, ≤ 25MP |
| consent | text (`true`/`false`) | N | 기본 false |

**응답 201 Created** — `Location: /api/v1/scans/{scanId}`, 본문 `ScanResponse`

```json
{
  "scanId": "b3f1c2e0-6a1d-4b6f-9a8e-2f7d1c0e9a11",
  "imageWidth": 1280,
  "imageHeight": 960,
  "modelVersion": "v1",
  "createdAt": "2026-10-19T01:30:00Z",
  "items": [
    {
      "itemId": 1042,
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

- `items`는 항상 `order` 오름차순.
- `confidence`는 소수점 둘째 자리로 반올림해 응답한다 (DB에는 원래 값).

**오류**: 400 INVALID_DEVICE_ID, 400 VALIDATION_ERROR, 400 INVALID_IMAGE, 413 IMAGE_TOO_LARGE, 415 UNSUPPORTED_FORMAT, 422 NO_SUSHI_DETECTED, 429 RATE_LIMITED, 503 MODEL_UNAVAILABLE, 503 SERVER_BUSY, 500 INTERNAL_ERROR

### 6.2 `GET /scans/{scanId}` — 결과 조회

| 파라미터 | 위치 | 규칙 |
| --- | --- | --- |
| scanId | path | UUID. 형식 오류면 404 SCAN_NOT_FOUND |

**응답 200**: `ScanResponse` (6.1과 동일)
**오류**: 400 INVALID_DEVICE_ID, 404 SCAN_NOT_FOUND

### 6.3 `PATCH /scans/{scanId}/items/{itemId}` — 수정·먹음 체크

**요청 본문**

```json
{ "classId": "hirame", "eaten": true }
```

| 필드 | 타입 | 필수 | 규칙 |
| --- | --- | --- | --- |
| classId | string | N | `sushi_types`에 존재 |
| eaten | boolean | N | |

- 두 필드 모두 없으면 `400 VALIDATION_ERROR`. 알 수 없는 필드는 무시한다.
- **응답 200**: 갱신된 전체 `ScanResponse` (order 재계산 반영).
- **오류**: 400 INVALID_DEVICE_ID, 400 VALIDATION_ERROR, 400 INVALID_CLASS_ID, 404 SCAN_NOT_FOUND, 404 ITEM_NOT_FOUND
- 멱등성: 같은 본문을 반복해도 결과가 같다. 단 classId 변경은 실제 값이 바뀔 때만 corrections에 기록된다.

### 6.4 `GET /sushi-types` — 종류 목록

**응답 200** (`Cache-Control: public, max-age=600`)

```json
{
  "types": [
    { "classId": "hirame", "nameKo": "광어", "nameJa": "ヒラメ", "group": "WHITE", "orderScore": 10, "description": "가장 담백한 흰살 생선" },
    { "classId": "unknown", "nameKo": "미확인", "nameJa": "不明", "group": "UNKNOWN", "orderScore": 50, "description": null }
  ]
}
```

- `orderScore` 오름차순, 같으면 `classId` 오름차순.

### 6.5 `GET /health` — 상태

**응답 200**: `{ "status": "UP", "modelVersion": "v1", "db": "UP", "model": "UP" }`
**응답 503**: `{ "status": "DOWN", "modelVersion": "v1", "db": "UP", "model": "DOWN" }`

### 6.6 DTO 타입 (TypeScript 기준)

```ts
type Group = 'WHITE' | 'SHELL' | 'SQUID' | 'SHRIMP' | 'RED' | 'BLUE' | 'FATTY' | 'GUNKAN' | 'SAUCE' | 'FINISH' | 'UNKNOWN';

interface Box { x1: number; y1: number; x2: number; y2: number; }

interface ScanItem {
  itemId: number;
  order: number;
  classId: string;
  nameKo: string;
  group: Group;
  confidence: number;
  box: Box;
  eaten: boolean;
  corrected: boolean;
}

interface ScanResponse {
  scanId: string;
  imageWidth: number;
  imageHeight: number;
  modelVersion: string;
  createdAt: string;
  items: ScanItem[];
}

interface SushiType {
  classId: string;
  nameKo: string;
  nameJa: string;
  group: Group;
  orderScore: number;
  description: string | null;
}

interface ErrorResponse { code: ErrorCode; message: string; }
```

### 6.7 오류 코드

| HTTP | code | 상황 | message (응답 문구) |
| --- | --- | --- | --- |
| 400 | INVALID_DEVICE_ID | X-Device-Id 없음·형식 오류 | 기기 정보를 확인할 수 없어요. |
| 400 | VALIDATION_ERROR | 필수 값 누락, 본문 형식 오류 | 요청 형식이 올바르지 않아요. |
| 400 | INVALID_IMAGE | 이미지 디코딩 실패 | 사진을 읽을 수 없어요. |
| 400 | INVALID_CLASS_ID | 없는 classId | 알 수 없는 초밥 종류예요. |
| 404 | SCAN_NOT_FOUND | 스캔 없음·다른 기기 | 결과를 찾을 수 없어요. |
| 404 | ITEM_NOT_FOUND | 스캔에 없는 itemId | 해당 초밥을 찾을 수 없어요. |
| 404 | NOT_FOUND | 존재하지 않는 경로 | 잠시 문제가 생겼어요. |
| 405 | METHOD_NOT_ALLOWED | 허용되지 않는 메서드 | 잠시 문제가 생겼어요. |
| 413 | IMAGE_TOO_LARGE | 5MB 또는 25MP 초과 | 사진이 너무 커요. |
| 415 | UNSUPPORTED_FORMAT | JPEG/PNG 외 | 지원하지 않는 사진 형식이에요. |
| 422 | NO_SUSHI_DETECTED | 인식 결과 0개 | 초밥을 찾지 못했어요. |
| 429 | RATE_LIMITED | 요청 한도 초과 | 잠시 후 다시 시도해주세요. |
| 500 | INTERNAL_ERROR | 처리되지 않은 예외 | 잠시 문제가 생겼어요. |
| 503 | MODEL_UNAVAILABLE | 모델 로드 실패 | 지금은 분석할 수 없어요. |
| 503 | SERVER_BUSY | 추론 대기 10초 초과 | 사용자가 많아요. 잠시 후 다시 시도해주세요. |

---

## 7. 상태 정의

### 7.1 클라이언트 스토어 (`useScanStore`, Zustand)

| 필드 | 타입 | 설명 |
| --- | --- | --- |
| pendingImage | `PreparedImage \| null` | S-01 → S-03 사이 임시 사진 |
| selectedItemId | `number \| null` | 선택된 아이템 |
| sheetState | `'COLLAPSED' \| 'HALF' \| 'FULL'` | 시트 높이 |
| zoom | `{ scale, x, y }` | 사진 확대 상태 |
| pendingPatches | `Set<number>` | PATCH 진행 중인 itemId |

서버 데이터(`ScanResponse`, `SushiType[]`)는 스토어가 아니라 TanStack Query 캐시에 둔다.

### 7.2 업로드 요청 상태 (S-03)

```
IDLE → PREPARING → UPLOADING → (SUCCESS | NOT_FOUND | FAILED | CANCELLED | TIMEOUT)
```

| 상태 | 화면 |
| --- | --- |
| PREPARING | S-01 스피너 (F1-4) |
| UPLOADING | S-03 |
| SUCCESS | → S-04 |
| NOT_FOUND | → S-05 |
| FAILED | C-4 매핑 |
| CANCELLED | → S-02, 토스트 없음 |
| TIMEOUT | → S-02, `error.timeout` |

### 7.3 아이템 표시 상태

| 상태 | 조건 | 우선순위 |
| --- | --- | --- |
| selected | `selectedItemId = itemId` | 1 (다른 상태와 겹쳐 표시) |
| eaten | `eaten` | 2 |
| next | 안 먹은 것 중 order 최소 | 3 |
| lowConfidence | `confidence < 0.60 && !corrected` | 4 |
| default | 그 외 | - |

`eaten`과 `lowConfidence`가 함께면 eaten 표시만 한다.

---

## 8. 메시지·문구

`DESIGN.md` 7장의 키를 우선 사용한다. 아래 표시 `(신규)`는 `DESIGN.md` 7장에 추가해야 하는 키다.

| 키 | 문구 |
| --- | --- |
| home.title | 초밥, 어떤 순서로 먹어야 할까요? |
| home.subtitle | 사진 한 장이면 알려드려요 |
| home.capture | 촬영하기 |
| home.gallery | 앨범에서 선택 |
| home.tip | 접시 전체가 보이게 위에서 찍어주세요 |
| review.retake | 다시 찍기 |
| review.analyze | 분석하기 |
| loading.step1 | 초밥을 살펴보고 있어요 |
| loading.step2 | 먹는 순서를 정리하고 있어요 |
| loading.slow (신규) | 조금 더 걸리고 있어요 |
| result.sheetTitle | 먹는 순서 |
| result.next | 다음 차례 |
| result.lowConfidence | 확실하지 않아요. 길게 눌러 고칠 수 있어요 |
| result.reordered | 순서를 다시 계산했어요 |
| result.allDone | 맛있게 드셨나요? 모두 드셨어요 |
| result.noLocalPhoto (신규) | 사진은 찍은 기기에만 저장돼요. 순서는 아래에서 볼 수 있어요 |
| picker.title | 어떤 초밥인가요? |
| picker.unknown | 잘 모르겠어요 |
| notFound.title | 초밥을 찾지 못했어요 |
| notFound.tip1 (신규) | 접시 바로 위에서 찍어주세요 |
| notFound.tip2 (신규) | 밝은 곳에서 찍어주세요 |
| notFound.tip3 (신규) | 접시 전체가 화면에 들어오게 해주세요 |
| consent.title (신규) | 사진을 인식 품질 개선에 써도 될까요? |
| consent.body (신규) | 허용하면 찍은 사진을 저장해 인식 정확도를 높이는 데 써요. 사람 얼굴이 나오지 않게 찍어주세요. 설정에서 언제든 바꿀 수 있어요. |
| consent.agree (신규) | 허용 |
| consent.decline (신규) | 허용 안 함 |
| settings.title (신규) | 설정 |
| settings.theme (신규) | 화면 모드 |
| settings.consent (신규) | 사진 저장 허용 |
| settings.credits (신규) | 데이터 출처 |
| error.notImage (신규) | 사진 파일만 선택할 수 있어요 |
| error.decodeFailed (신규) | 사진을 읽을 수 없어요. 다른 사진으로 해주세요 |
| error.tooSmall (신규) | 사진이 너무 작아요 |
| error.tooLarge | 사진이 너무 커요 |
| error.network | 연결이 불안정해요. 다시 시도해주세요 |
| error.offline (신규) | 인터넷에 연결되어 있지 않아요 |
| error.timeout (신규) | 분석이 오래 걸려요. 다시 시도해주세요 |
| error.rateLimited | 잠시 후 다시 시도해주세요 |
| error.server | 잠시 문제가 생겼어요 |
| error.scanNotFound (신규) | 결과를 찾을 수 없어요 |
| error.saveFailed (신규) | 저장하지 못했어요. 다시 시도해주세요 |
| error.correctionFailed (신규) | 수정하지 못했어요. 원래대로 돌려놓았어요 |

문구는 `fe/src/constants/messages.ts` 한 파일에서 관리한다.

---

## 9. 순서 엔진 공유 테스트 케이스

- 파일 위치: `be/src/test/resources/order-cases.json` (기준 파일 1개)
- Java `OrderEngineTest`와 TS `orderEngine.test.ts`(Vitest, `../be/src/test/resources/order-cases.json` 읽기)가 같은 파일을 사용한다.
- 박스는 모두 너비 80, 높이 60. `c(cx, cy)` = `{x1: cx-40, y1: cy-30, x2: cx+40, y2: cy+30}`.
- 점수: hirame 10, tai 12, maguro_akami 30, salmon 50, unknown 50, toro 55, ikura 60, unagi 70, tamago 80.
- `expected`는 order 1부터의 `id` 목록.

| ID | 목적 | 입력 (id: classId, 중심, confidence) | expected |
| --- | --- | --- | --- |
| TC-ORD-01 | 점수 순 정렬 | a: salmon (100,100) 0.9 · b: hirame (300,100) 0.9 · c: tamago (100,300) 0.9 · d: maguro_akami (300,300) 0.9 | b, d, a, c |
| TC-ORD-02 | 동점 같은 줄 → 왼쪽 먼저 | a: hirame (300,100) 0.9 · b: hirame (100,110) 0.9 | b, a |
| TC-ORD-03 | 동점 다른 줄 → 위 먼저 | a: hirame (300,100) 0.9 · b: hirame (100,200) 0.9 | a, b |
| TC-ORD-04 | 미등록 클래스 → unknown(50), salmon과 위치 비교 | a: salmon (300,100) 0.9 · b: engawa (100,100) 0.7 | b, a (b의 classId 출력은 `unknown`) |
| TC-ORD-05 | 행 기준(anchor) 고정, 연쇄 병합 없음 | p: hirame (300,100) · q: hirame (200,125) · r: hirame (100,150) (모두 0.9) | q, p, r |
| TC-ORD-06 | 같은 줄·같은 cx → confidence 높은 것 먼저 | a: salmon (200,100) 0.7 · b: salmon (200,110) 0.9 | b, a |
| TC-ORD-07 | 빈 입력 | (없음) | (빈 목록) |
| TC-ORD-08 | 실제 접시 2줄 × 4피스 | p1: tamago (100,100) · p2: salmon (250,100) · p3: hirame (400,100) · p4: ikura (550,100) · p5: tai (100,250) · p6: salmon (250,250) · p7: maguro_akami (400,250) · p8: unagi (550,250) (모두 0.9) | p3, p5, p7, p2, p6, p4, p8, p1 |
| TC-ORD-09 | 수정 후 재계산 (TC-ORD-08에서 p3을 toro로) | TC-ORD-08과 같고 p3만 toro | p5, p7, p2, p6, p3, p4, p8, p1 |

**계산 근거 (TC-ORD-05)**: cy 정렬 p(100) → q(125) → r(150). 기준 p, h=60 → 임계 30. q는 125-100=25 ≤ 30 → 같은 행. r은 150-100=50 > 30 → 새 행. 1행 {p, q}를 cx로 정렬하면 q(200), p(300). 결과 q, p, r. 기준을 매번 직전 항목으로 바꾸는 방식(연쇄)이면 r도 1행에 들어가 r, q, p가 되므로, 이 케이스로 구현 차이를 잡는다.

**JSON 형식 예시**

```json
[
  {
    "id": "TC-ORD-02",
    "items": [
      { "id": "a", "classId": "hirame", "confidence": 0.9, "box": { "x1": 260, "y1": 70, "x2": 340, "y2": 130 } },
      { "id": "b", "classId": "hirame", "confidence": 0.9, "box": { "x1": 60, "y1": 80, "x2": 140, "y2": 140 } }
    ],
    "expected": ["b", "a"]
  }
]
```

**후처리 테스트 케이스 (`PostProcessorTest`, Java 전용)**

| ID | 입력 | 기대 |
| --- | --- | --- |
| TC-PP-01 | confidence 0.39, 0.40 두 박스 (겹치지 않음) | 0.40만 남음 |
| TC-PP-02 | 같은 위치 hirame 0.8, tai 0.6 (IoU 0.7) | hirame만 남음 (클래스 무관 NMS) |
| TC-PP-03 | IoU 0.49인 두 박스 | 둘 다 남음 |
| TC-PP-04 | 45개 박스 (겹침 없음) | confidence 상위 40개 |
| TC-PP-05 | 기준 1280×960, 모델 박스 (100,130,180,190) | (200,100,360,220) |
| TC-PP-06 | 이미지 밖으로 나간 박스 (-20, 10, 50, 70), W=1280 | x1=0으로 잘림 |
| TC-PP-07 | 자른 뒤 너비 5px | 제거 |
| TC-PP-08 | labels.json에 있으나 sushi_types에 없는 클래스 | unknown |

---

## 10. 인수 테스트 시나리오 (E2E)

실기기(iPhone Safari, Android Chrome) 수동 테스트 + 가능한 항목은 Playwright(모바일 에뮬레이션, API 목킹)로 자동화한다.

| ID | 시나리오 | Given | When | Then |
| --- | --- | --- | --- | --- |
| E2E-01 | 촬영 흐름 | 홈 화면 | 촬영하기 → 촬영 → 사진 확인 → 다시 찍기 | 홈으로 돌아오고 업로드 요청이 없다 |
| E2E-02 | 축소 업로드 | 4032×3024 세로 사진 | 갤러리 선택 → 분석하기 | 요청 이미지가 960×1280 JPEG, 결과 박스가 피스 위에 있다 |
| E2E-03 | 오버레이 정확도 | 12피스 결과 | 기기 회전, 시트 높이 변경, 2배 확대 | 박스가 계속 피스 위에 있고 배지 크기는 그대로다 |
| E2E-04 | 먹음 진행 | 결과 6피스 | 1~6번을 순서대로 체크 | 매번 다음 차례가 이동하고 마지막에 완료 배너가 뜬다 |
| E2E-05 | 다시 보기 | 3개 체크한 결과 | 새로고침 | 같은 순서, 체크 3개 유지, 사진 표시 |
| E2E-05b | 로컬 사진 없음 | 사이트 데이터 중 IndexedDB만 삭제 | 결과 URL 새로고침 | 목록 전용 모드, 체크 상태 유지 |
| E2E-06 | 수정 | 1번 hirame 결과 | 1번 길게 눌러 toro 선택 | 토스트, 해당 피스 번호가 뒤로 이동, 새로고침 후에도 유지 |
| E2E-06b | 수정 실패 | 오프라인 상태 | 수정 시도 | 원래대로 복원 + 오류 토스트 |
| E2E-07 | 인식 실패 | 빈 접시 사진 | 분석하기 | 인식 실패 화면, 다시 찍기로 홈 |
| E2E-08 | 동의 | 첫 실행 | 분석하기 → 허용 안 함 | 분석 진행, 이후 다시 묻지 않음, 서버에 원본 미저장 |
| E2E-09 | 다른 기기 접근 | 기기 A의 결과 URL | 기기 B에서 열기 | 결과 없음 토스트 후 홈 |
| E2E-10 | 요청 한도 | 1분 안에 분석 10회 | 11번째 분석하기 | 한도 토스트, 분석하기 비활성 후 재활성 |

---

## 11. 문서 반영 필요 항목

이 명세서를 쓰면서 정한 내용 중 상위 문서에 반영해야 하는 것들이다. 반영 전까지는 이 문서를 기준으로 구현한다.

| 대상 문서 | 내용 | 상태 |
| --- | --- | --- |
| PROJECT_SPEC.md 4.2 | 같은 줄 판정을 BR-ORD-04 행 그룹핑 방식으로 명확화, confidence 동점 규칙 | 반영 완료 |
| PROJECT_SPEC.md 7.2 | 오류 코드 추가: INVALID_DEVICE_ID, VALIDATION_ERROR, INVALID_CLASS_ID, SCAN_NOT_FOUND, ITEM_NOT_FOUND, SERVER_BUSY, INTERNAL_ERROR / POST 응답 201 + createdAt | 반영 완료 |
| PROJECT_SPEC.md 7.4 | 다른 기기 접근은 404, 추론 동시 실행 제한 | 반영 완료 |
| DESIGN.md 6장 | 홈 우상단 설정 아이콘·설정 시트(S-06), 동의 다이얼로그(S-08), 결과 목록 전용 모드 | 반영 완료 |
| DESIGN.md 6.4 | 결과 상단바 `공유` 버튼은 v1에서 숨김 (REQUIREMENTS Q-1) | 반영 완료 (v1 숨김 확정) |
| DESIGN.md 7장 | 8장의 (신규) 문구 키 | 반영 완료 |