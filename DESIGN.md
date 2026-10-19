# 스시순 (SushiSoon) — 디자인 가이드

> 이 문서는 디자인(Figma)과 프론트엔드 구현(React)이 함께 따르는 **디자인 기준 문서**다.
> AI 코딩 에이전트는 UI를 만들거나 고칠 때 이 문서의 토큰·컴포넌트·화면 규칙을 따른다.
> 색상·간격·폰트 값을 코드에 직접 쓰지 않고 3장의 CSS 변수(`tokens.css`)만 사용한다.
> 기능·API·데이터 규칙은 `PROJECT_SPEC.md`를 따른다.

---

## 0. 에이전트 작업 규칙 (먼저 읽기)

1. 색·폰트·간격·모서리·그림자는 **반드시 토큰(CSS 변수)** 으로 쓴다. `#F2704E` 같은 값을 컴포넌트에 직접 쓰지 않는다.
2. 새 컴포넌트를 만들기 전에 5장 목록에 있는지 확인한다. 없으면 5장에 먼저 명세를 추가한다.
3. 모든 화면은 **모바일 우선(360~430px)** 으로 만들고, 768px 이상에서는 가운데 정렬된 최대 480px 컬럼으로 보여준다.
4. 라이트/다크 두 테마를 모두 지원한다. 새 색을 추가할 때는 두 테마 값을 함께 정의한다.
5. 색만으로 상태를 구분하지 않는다. 항상 숫자·아이콘·텍스트를 함께 쓴다.
6. 문구는 7장의 톤(짧은 해요체)을 따르고, 정의된 문구가 있으면 그대로 쓴다.

---

## 1. 디자인 컨셉

**키워드**: 카운터 너머 셰프가 알려주는 순서 · 차분함 · 사진이 주인공

- **사진이 주인공**: 결과 화면의 70%는 사진이다. UI는 사진을 가리지 않게 얇고 조용하게.
- **번호가 먼저 보인다**: 번호 배지만 강하게. 사용자는 이름보다 "몇 번을 먹지?"를 먼저 찾는다.
- **연한 것에서 진한 것으로**: 번호 배지 색이 순서에 따라 연한 색 → 진한 색으로 변해, 숫자를 읽지 않아도 흐름이 보인다.
- **한 손 조작**: 주요 버튼은 화면 하단 1/3 안, 엄지가 닿는 위치에 둔다.

**무드 레퍼런스**: 나무 카운터, 흰 밥, 김의 검정, 와사비의 연두, 연어의 주황.

---

## 2. 컬러

### 2.1 브랜드·기본 팔레트

| 토큰 | 라이트 | 다크 | 사용처 |
| --- | --- | --- | --- |
| `--color-primary` | #F2704E | #F2704E | 셔터 버튼, 강조 테두리, 선택된 박스 (채움·선 용도) |
| `--color-primary-strong` | #C84A2B | #E0603E | 흰 글자가 올라가는 메인 버튼 배경 (흰 글자 대비 4.5:1 이상) |
| `--color-on-primary` | #FFFFFF | #FFFFFF | primary-strong 위 글자 |
| `--color-bg` | #FAF7F2 | #141414 | 화면 배경 (밥 흰색 / 김 검정) |
| `--color-surface` | #FFFFFF | #1E1E1E | 카드, 하단 시트 |
| `--color-surface-muted` | #F1ECE4 | #2A2A2A | 리스트 행 hover, 보조 영역 |
| `--color-text` | #1E1E1E | #F5F2ED | 본문 |
| `--color-text-muted` | #6B6560 | #A39E98 | 보조 문구, 그룹 태그 |
| `--color-border` | #E4DED5 | #3A3A3A | 구분선, 카드 테두리 |
| `--color-wasabi` | #6E9440 | #8DB255 | 먹음 체크, 성공 상태 |
| `--color-wood` | #C9A57A | #B08F66 | 보조 강조, 일러스트 |
| `--color-danger` | #C0392B | #E06655 | 에러 |
| `--color-overlay-scrim` | rgba(0,0,0,0.45) | rgba(0,0,0,0.6) | 사진 위 라벨 배경 |

### 2.2 순서 배지 컬러 (그룹별)

`PROJECT_SPEC.md` 4.1의 `group` 값에 1:1로 대응한다. 위에서 아래로 갈수록 진해진다.

| 토큰 | group | 배경 | 글자 | 의미 |
| --- | --- | --- | --- | --- |
| `--badge-white` | WHITE | #CFE6F0 | #1E1E1E | 흰살 (가장 담백) |
| `--badge-light` | SHELL, SQUID, SHRIMP | #BFE0D4 | #1E1E1E | 조개·연체·갑각 |
| `--badge-red` | RED | #F2A7A0 | #1E1E1E | 붉은살 |
| `--badge-blue` | BLUE | #9DB7D1 | #1E1E1E | 등푸른 생선 |
| `--badge-fatty` | FATTY | #E8945A | #1E1E1E | 기름진 것 |
| `--badge-gunkan` | GUNKAN | #C2553A | #FFFFFF | 군함 (진한 풍미) |
| `--badge-sauce` | SAUCE | #7A3B2E | #FFFFFF | 양념 |
| `--badge-finish` | FINISH | #F2C94C | #1E1E1E | 계란 (마무리, 예외적으로 노랑) |
| `--badge-unknown` | UNKNOWN | #D6D2CC | #1E1E1E | 미확인 |

배지는 테마와 무관하게 같은 색을 쓰고, **흰 테두리 2px**로 어떤 사진 위에서도 보이게 한다.

---

## 3. 디자인 토큰 (`fe/src/styles/tokens.css`)

```css
:root {
  /* color */
  --color-primary: #F2704E;
  --color-primary-strong: #C84A2B;
  --color-on-primary: #FFFFFF;
  --color-bg: #FAF7F2;
  --color-surface: #FFFFFF;
  --color-surface-muted: #F1ECE4;
  --color-text: #1E1E1E;
  --color-text-muted: #6B6560;
  --color-border: #E4DED5;
  --color-wasabi: #6E9440;
  --color-wood: #C9A57A;
  --color-danger: #C0392B;
  --color-overlay-scrim: rgba(0, 0, 0, 0.45);

  /* order badge */
  --badge-white: #CFE6F0;
  --badge-light: #BFE0D4;
  --badge-red: #F2A7A0;
  --badge-blue: #9DB7D1;
  --badge-fatty: #E8945A;
  --badge-gunkan: #C2553A;
  --badge-sauce: #7A3B2E;
  --badge-finish: #F2C94C;
  --badge-unknown: #D6D2CC;
  --badge-text-dark: #1E1E1E;
  --badge-text-light: #FFFFFF;

  /* typography */
  --font-sans: "Pretendard Variable", Pretendard, -apple-system, "Apple SD Gothic Neo", "Noto Sans KR", sans-serif;
  --text-display: 700 28px/1.3 var(--font-sans);
  --text-title: 700 22px/1.35 var(--font-sans);
  --text-heading: 600 18px/1.4 var(--font-sans);
  --text-body-strong: 600 17px/1.45 var(--font-sans);
  --text-body: 400 16px/1.5 var(--font-sans);
  --text-caption: 400 14px/1.45 var(--font-sans);
  --text-label: 600 12px/1.3 var(--font-sans);
  --text-badge: 700 15px/1 var(--font-sans);

  /* spacing (4px 기반) */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;

  /* radius */
  --radius-sm: 6px;
  --radius-md: 8px;
  --radius-lg: 16px;
  --radius-sheet: 20px;
  --radius-full: 999px;

  /* elevation */
  --shadow-sheet: 0 -4px 24px rgba(0, 0, 0, 0.12);
  --shadow-badge: 0 1px 4px rgba(0, 0, 0, 0.35);

  /* motion */
  --ease-out: cubic-bezier(0.2, 0.8, 0.2, 1);
  --duration-fast: 120ms;
  --duration-base: 200ms;
  --duration-slow: 320ms;

  /* layout */
  --content-max: 480px;
  --gutter: 16px;
  --tap-min: 44px;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --color-primary-strong: #E0603E;
    --color-bg: #141414;
    --color-surface: #1E1E1E;
    --color-surface-muted: #2A2A2A;
    --color-text: #F5F2ED;
    --color-text-muted: #A39E98;
    --color-border: #3A3A3A;
    --color-wasabi: #8DB255;
    --color-wood: #B08F66;
    --color-danger: #E06655;
    --color-overlay-scrim: rgba(0, 0, 0, 0.6);
  }
}

:root[data-theme="dark"] {
  --color-primary-strong: #E0603E;
  --color-bg: #141414;
  --color-surface: #1E1E1E;
  --color-surface-muted: #2A2A2A;
  --color-text: #F5F2ED;
  --color-text-muted: #A39E98;
  --color-border: #3A3A3A;
  --color-wasabi: #8DB255;
  --color-wood: #B08F66;
  --color-danger: #E06655;
  --color-overlay-scrim: rgba(0, 0, 0, 0.6);
}
```

`group` → 배지 토큰 매핑 (`constants/badge.ts`):

```ts
export const BADGE_BY_GROUP = {
  WHITE:   { bg: 'var(--badge-white)',   fg: 'var(--badge-text-dark)' },
  SHELL:   { bg: 'var(--badge-light)',   fg: 'var(--badge-text-dark)' },
  SQUID:   { bg: 'var(--badge-light)',   fg: 'var(--badge-text-dark)' },
  SHRIMP:  { bg: 'var(--badge-light)',   fg: 'var(--badge-text-dark)' },
  RED:     { bg: 'var(--badge-red)',     fg: 'var(--badge-text-dark)' },
  BLUE:    { bg: 'var(--badge-blue)',    fg: 'var(--badge-text-dark)' },
  FATTY:   { bg: 'var(--badge-fatty)',   fg: 'var(--badge-text-dark)' },
  GUNKAN:  { bg: 'var(--badge-gunkan)',  fg: 'var(--badge-text-light)' },
  SAUCE:   { bg: 'var(--badge-sauce)',   fg: 'var(--badge-text-light)' },
  FINISH:  { bg: 'var(--badge-finish)',  fg: 'var(--badge-text-dark)' },
  UNKNOWN: { bg: 'var(--badge-unknown)', fg: 'var(--badge-text-dark)' },
} as const;
```

---

## 4. 타이포그래피

- 폰트: **Pretendard** (웹폰트, `font-display: swap`). 숫자는 `font-variant-numeric: tabular-nums`.
- 최소 본문 크기 16px (iOS 입력 확대 방지 및 가독성).

| 스타일 | 크기 / 굵기 | 사용처 |
| --- | --- | --- |
| display | 28 / Bold | 홈 메인 문구 |
| title | 22 / Bold | 화면 제목 |
| heading | 18 / SemiBold | 시트 제목 |
| body-strong | 17 / SemiBold | 순서 리스트 초밥 이름 |
| body | 16 / Regular | 본문 |
| caption | 14 / Regular | 설명, 팁 |
| label | 12 / SemiBold | 그룹 태그, 사진 위 이름 라벨 |
| badge | 15 / Bold | 번호 배지 숫자 |

---

## 5. 컴포넌트

각 컴포넌트는 `fe/src/components/`에 같은 이름으로 만든다.

### 5.1 `SushiBadge`
- 원형, 지름 28px (리스트용 `size="lg"`는 32px)
- 배경/글자: 2.2 그룹 색, 테두리 2px 흰색, `--shadow-badge`
- 숫자: `--text-badge`, 가운데 정렬
- Props: `order: number`, `group: Group`, `size?: 'md' | 'lg'`, `dimmed?: boolean`

### 5.2 `DetectionBox`
- 테두리 2px, 모서리 `--radius-md`, 채움 없음
- 기본: 흰색 테두리 (opacity 0.9)
- 선택됨: `--color-primary` 테두리 3px + 배지 1.15배 확대
- 먹음: 박스·배지 opacity 0.4, 배지 숫자 대신 체크 아이콘
- 저신뢰(confidence < 0.6): 점선 테두리 + 이름 뒤 `?`
- 좌상단(박스 바깥 위 -14px, 왼쪽 -14px)에 `SushiBadge`
- 배지 오른쪽에 이름 라벨: `--text-label`, 흰 글자, `--color-overlay-scrim` 배경, `--radius-sm`, 좌우 패딩 6px
- 박스 너비 < 56px이면 이름 라벨 숨김 (배지만)
- 탭 영역은 최소 44×44px 보장 (박스가 작으면 투명 히트 영역 확장)

### 5.3 `DetectionOverlay`
- 이미지 위 절대 위치 레이어. 좌표 계산 규칙은 `PROJECT_SPEC.md` 8.2
- 박스끼리 배지가 겹치면 order가 작은 쪽을 위(z-index)에 둔다

### 5.4 `OrderSheet` (하단 시트)
- 배경 `--color-surface`, 상단 모서리 `--radius-sheet`, `--shadow-sheet`
- 높이 3단: 접힘(88px, 다음에 먹을 1개만) / 절반(45vh, 기본) / 전체(90vh)
- 상단 핸들 36×4px, `--color-border`
- 헤더: "먹는 순서" (`--text-heading`) + 진행 표시 "3 / 12"
- 행(`OrderRow`): 높이 64px, 좌측 `SushiBadge size="lg"`, 이름(`--text-body-strong`), 아래 그룹 태그(`--text-label`, `--color-text-muted`), 우측 체크 버튼(44×44)
- 다음에 먹을 행: 좌측 3px `--color-primary` 바 + 배경 `--color-surface-muted`
- 먹은 행: 이름에 opacity 0.5, 체크 아이콘 `--color-wasabi`

### 5.5 `ShutterButton`
- 지름 72px 원, 배경 `--color-primary`, 안쪽 흰 링 4px
- 누름: scale 0.94, `--duration-fast`

### 5.6 `Button`
- variant: `primary`(배경 `--color-primary-strong`, 글자 `--color-on-primary`), `secondary`(테두리 `--color-border`, 글자 `--color-text`), `ghost`
- 높이 52px, 모서리 `--radius-lg`, 글자 `--text-body-strong`, 가로 꽉 채움이 기본
- 비활성: opacity 0.4, 로딩: 글자 대신 스피너

### 5.7 `SushiPicker` (수정용 바텀시트)
- 제목: "어떤 초밥인가요?"
- 3열 그리드, 각 셀 = 그룹 색 원(24px) + 한글 이름 + 일본어 이름(caption)
- 현재 선택 값은 `--color-primary` 테두리
- 맨 아래 "잘 모르겠어요" → `unknown`

### 5.8 `Toast`
- 하단 시트 위 16px, `--color-text` 배경 + `--color-bg` 글자, 2.5초 후 사라짐
- 예: "순서를 다시 계산했어요"

---

## 6. 화면 설계

### 6.1 홈 (`/`)

```
┌─────────────────────────┐
│  스시순           (테마)  │
│                         │
│  [일러스트: 나무 도마 위  │
│   초밥 3피스, 번호 배지]  │
│                         │
│  초밥, 어떤 순서로        │  ← display
│  먹어야 할까요?           │
│  사진 한 장이면 알려드려요 │  ← body, muted
│                         │
│  [   📷  촬영하기    ]    │  ← Button primary
│  [   앨범에서 선택   ]    │  ← Button secondary
│                         │
│  접시 전체가 보이게 위에서 │  ← caption, muted
│  찍어주세요               │
└─────────────────────────┘
```

### 6.2 사진 확인 (`/review`)
- 전체 화면 사진 미리보기 (배경 `#000`)
- 하단 고정: `다시 찍기`(secondary) / `분석하기`(primary) 가로 2분할

### 6.3 로딩 (`/loading`)
- 업로드한 사진을 흐리게(blur 8px) 배경으로
- 사진 위를 위→아래로 지나가는 스캔 라인 (`--color-primary`, 2px, 1.4초 반복)
- 문구: "초밥을 살펴보고 있어요" → 1.5초 후 "먹는 순서를 정리하고 있어요"
- `prefers-reduced-motion` 시 스캔 라인 대신 스피너

### 6.4 결과 (`/result/:scanId`)

```
┌─────────────────────────┐
│ ←                  공유 │  ← 사진 위 반투명 상단바
│                         │
│   ①광어    ②도미         │
│   ┌──┐    ┌──┐          │
│   └──┘    └──┘   ⑤연어   │  ← DetectionOverlay
│      ③오징어   ┌──┐      │
│      ┌──┐     └──┘      │
│      └──┘   ⑥장어        │
│                         │
├──────── ─── ────────────┤  ← 핸들
│ 먹는 순서         2 / 6  │
│ ▌① 광어      흰살    ✓  │  ← 먹음
│ ▌② 도미      흰살    ○  │  ← 다음 차례 (강조)
│  ③ 오징어    연체    ○  │
│  ...                    │
└─────────────────────────┘
```

- 상단 약 55%: 사진 + 오버레이 (시트를 내리면 확대)
- 박스 탭 → 시트가 해당 행으로 스크롤 + 행 강조
- 행 탭 → 해당 박스 강조 + 짧은 펄스(scale 1 → 1.15 → 1, `--duration-slow`)
- 박스 또는 행 길게 누름(500ms) → `SushiPicker`
- 체크 → 다음 차례 행으로 자동 이동

### 6.5 인식 실패 (`/not-found`)
- 아이콘: 빈 접시 일러스트
- 제목: "초밥을 찾지 못했어요"
- 팁 3개 (아이콘 + caption):
  1. 접시 바로 위에서 찍어주세요
  2. 밝은 곳에서 찍어주세요
  3. 접시 전체가 화면에 들어오게 해주세요
- 버튼: `다시 찍기`(primary)

### 6.6 에러 상태
| 상황 | 표시 |
| --- | --- |
| 네트워크 오류 | 토스트 "연결이 불안정해요. 다시 시도해주세요" + 다시 시도 버튼 |
| 용량 초과 | 토스트 "사진이 너무 커요" (클라이언트 축소 후에도 실패 시) |
| 요청 과다 | 토스트 "잠시 후 다시 시도해주세요" |
| 서버/모델 오류 | 전체 화면 "잠시 문제가 생겼어요" + 홈으로 |

---

## 7. 문구 (UX Writing)

- 톤: 짧은 해요체, 셰프가 옆에서 알려주듯 친절하게. 느낌표는 쓰지 않는다.
- 초밥 이름은 한국어 우선, 일본어는 보조로만.

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
| result.sheetTitle | 먹는 순서 |
| result.next | 다음 차례 |
| result.lowConfidence | 확실하지 않아요. 길게 눌러 고칠 수 있어요 |
| result.reordered | 순서를 다시 계산했어요 |
| result.allDone | 맛있게 드셨나요? 모두 드셨어요 |
| picker.title | 어떤 초밥인가요? |
| picker.unknown | 잘 모르겠어요 |
| notFound.title | 초밥을 찾지 못했어요 |

---

## 8. 모션

| 상황 | 동작 | 시간 |
| --- | --- | --- |
| 결과 진입 | 배지가 order 순서대로 하나씩 등장 (scale 0.6 → 1, opacity 0 → 1), 60ms 간격 | `--duration-base` |
| 박스/행 선택 | 테두리 색 전환 + 배지 1.15배 | `--duration-fast` |
| 행 탭 → 박스 펄스 | scale 1 → 1.15 → 1 | `--duration-slow` |
| 시트 높이 전환 | translateY | `--duration-slow`, `--ease-out` |
| 먹음 체크 | 체크 아이콘 그리기 + 행 opacity 전환 | `--duration-base` |

`prefers-reduced-motion: reduce`이면 모든 등장·펄스 애니메이션을 끄고 즉시 상태만 바꾼다.

---

## 9. 접근성

- 텍스트 대비: 본문 4.5:1 이상, 큰 텍스트(18.66px Bold 이상) 3:1 이상.
- 탭 영역: 최소 44×44px.
- 오버레이 박스마다 `aria-label="1번 광어, 흰살, 신뢰도 높음"` 형식의 레이블.
- 순서 리스트는 `<ol>`로 마크업하고, 화면 낭독기는 리스트를 우선 읽도록 오버레이 레이어는 `aria-hidden="false"`이되 포커스 순서를 리스트 뒤로 둔다.
- 체크 버튼: `aria-pressed`로 먹음 상태 전달.
- 다크 모드 기본 지원 (어두운 가게에서 사용하는 경우가 많음).

---

## 10. 아이콘·이미지·PWA

- 아이콘: Lucide 아이콘 세트 (선 굵기 2px, 24px 기준). 카메라, 이미지, 체크, 화살표, 공유.
- 일러스트: 플랫, 2~3색 (`--color-wood`, `--color-primary`, `--color-bg`), 선 없음.
- 앱 아이콘: 연어 주황 배경 위 흰색 원형 배지 안에 숫자 "1" + 작은 초밥 실루엣. 512 / 192 / maskable 버전.
- PWA manifest: `name: "스시순"`, `theme_color: #F2704E`, `background_color: #FAF7F2`, `display: standalone`, `orientation: portrait`.

---

## 11. Figma 작업 구조

```
📁 SushiSoon
 ├─ 00 Cover
 ├─ 01 Foundations   (컬러 스타일, 텍스트 스타일, 간격, 그리드 = 이 문서 2~4장)
 ├─ 02 Components    (5장 컴포넌트, variant: state=default/selected/eaten/low)
 ├─ 03 Wireframes    (6장 화면, 회색 박스)
 ├─ 04 UI            (실제 시안, 라이트/다크)
 └─ 05 Prototype     (홈 → 결과 흐름 연결)
```

- 프레임: iPhone 14/15 (390×844) 기준, 4px 그리드, 좌우 마진 16px.
- Figma 변수 이름은 CSS 토큰과 같게 맞춘다 (`color/primary` ↔ `--color-primary`).
- 시안 확정 후 바뀐 값은 이 문서와 `tokens.css`를 **함께** 수정한다.

---

## 12. 디자인 작업 순서

- [ ] 무드보드 (초밥집 카운터, 메뉴판, 기존 음식 인식 앱 레퍼런스)
- [ ] Foundations: 컬러·텍스트 스타일 등록
- [ ] 와이어프레임 6개 화면
- [ ] 컴포넌트: SushiBadge → DetectionBox → OrderSheet → Button → SushiPicker
- [ ] 결과 화면 시안 (라이트/다크), 실제 초밥 사진 위에서 배지 가독성 확인
- [ ] 나머지 화면 시안
- [ ] 프로토타입 연결 후 지인 3명 클릭 테스트
- [ ] 앱 아이콘, 일러스트, PWA 스플래시
