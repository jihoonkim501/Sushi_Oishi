# sushi-oishi — 디자인 가이드

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
| `--color-primary-strong` | #C84A2B | #C84A2B | 흰 글자가 올라가는 메인 버튼 배경, 토글 켜짐 (흰 글자 대비 4.7:1. 다크에서도 같은 값: 밝은 값은 3.55:1로 미달) |
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
| `--color-on-scrim` | #FFFFFF | #FFFFFF | scrim·사진 위 글자/아이콘/박스 테두리 |
| `--color-photo-bg` | #000000 | #000000 | 사진 확인·결과 사진 영역 배경 (`#000` 직접 사용 금지) |
| `--color-backdrop` | rgba(0,0,0,0.5) | rgba(0,0,0,0.7) | 시트·다이얼로그 뒤 딤 배경 |
| `--color-toggle-off` | #8A847E | #8A847E | 토글 꺼짐 트랙 (surface 대비 3.7:1 / 4.5:1, 비텍스트 3:1 충족) |

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
  --color-on-scrim: #FFFFFF;
  --color-photo-bg: #000000;
  --color-backdrop: rgba(0, 0, 0, 0.5);
  --color-toggle-off: #8A847E;

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
    --color-backdrop: rgba(0, 0, 0, 0.7);
  }
}

:root[data-theme="dark"] {
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
  --color-backdrop: rgba(0, 0, 0, 0.7);
}

@media (prefers-reduced-motion: reduce) {
  :root {
    --duration-fast: 0ms;
    --duration-base: 0ms;
    --duration-slow: 0ms;
  }
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
- 선택됨: `--color-primary` 테두리 3px + 바깥에 `--color-on-scrim` 1px 링(사진 위 대비 보장) + 배지 1.15배 확대
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
- `BottomSheet`(5.10) 사용. 제목: "어떤 초밥인가요?"
- 3열 그리드, 각 셀 = 그룹 색 원(24px) + 한글 이름 + 일본어 이름(caption)
- 현재 선택 값은 `--color-primary` 테두리
- 맨 아래 "잘 모르겠어요" → `unknown`

### 5.8 `Toast`
- 하단 시트 위 16px, `--color-text` 배경 + `--color-bg` 글자, 2.5초 후 사라짐
- 예: "순서를 다시 계산했어요"
- Props: `message: string`, `action?: { label: string; onAction: () => void }`, `duration?: number`(기본 2500ms, `action`이 있으면 5000ms)
- `role="status"`(오류 토스트는 `role="alert"`), `aria-live` polite. 액션 버튼은 44×44px 이상, 글자 `--color-bg` + `--text-body-strong` + 밑줄(토스트 배경 위 대비 확보, 색만으로 구분하지 않음).
- 한 번에 하나만 표시, 새 토스트가 이전 것을 대체. `prefers-reduced-motion`이면 페이드 없이 즉시 표시·제거.

### 5.9 `IconButton`
- 아이콘만 있는 버튼. 시각 크기 24px 아이콘, **히트 영역 44×44px** (`--tap-min`), 모서리 `--radius-full`
- Props: `icon: ReactNode`, `label: string`(필수, `aria-label`), `onClick`, `disabled?`, `onPhoto?: boolean`
- `onPhoto`이면 배경 `--color-overlay-scrim`, 아이콘 `--color-on-scrim`. 아니면 배경 투명, 아이콘 `--color-text`, hover/눌림 배경 `--color-surface-muted`
- 포커스: `outline: 2px solid var(--color-primary)`, offset 2px
- 용도: 홈 설정(`aria-label="설정"`), 결과 뒤로(`aria-label="뒤로"`), 시트 닫기(`aria-label="닫기"`)

### 5.10 `BottomSheet` (공통 시트 베이스)
- `OrderSheet`(5.4)는 높이 3단이 필요한 별도 구현. `SushiPicker`(5.7)와 `SettingsSheet`(5.11)는 이 베이스를 쓴다.
- 배경 `--color-surface`, 상단 `--radius-sheet`, `--shadow-sheet`, 뒤 `--color-backdrop`
- 최대 높이 85vh, 내용이 넘치면 시트 안에서 스크롤. 하단 `env(safe-area-inset-bottom)` 패딩
- 상단 핸들 36×4px(`--color-border`), 탭하거나 아래로 스와이프하면 닫힘, 바깥(backdrop) 탭·Esc도 닫힘
- Props: `open: boolean`, `onClose: () => void`, `title: string`, `children`
- 접근성: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`=제목, 열릴 때 제목 다음 첫 조작 요소로 포커스 이동, 닫히면 연 버튼으로 포커스 복귀, 탭 포커스 트랩
- 모션: translateY, `--duration-slow` + `--ease-out`. reduced-motion이면 즉시

### 5.11 `SettingsSheet` (S-06)
- `BottomSheet` 사용. 제목 `settings.title`(`--text-heading`). 우상단 `IconButton`(닫기) 병행
- 섹션 순서와 구성 (행 최소 높이 56px, 행 사이 `--color-border` 1px 구분선, 좌우 패딩 `--space-4`):
  1. **화면 모드** (`settings.theme`): `SegmentedControl` 3개 `시스템 / 라이트 / 다크`
  2. **사진 저장 허용** (`settings.consent`): 왼쪽 라벨 + 설명 caption(`--color-text-muted`, `settings.consentHint`), 오른쪽 `Toggle`
  3. **데이터 출처** (`settings.credits`): 목록. 행 = 데이터셋 이름(`--text-body`) + 저작자·라이선스(`--text-caption`, muted). 링크가 있으면 행 전체가 링크(`target="_blank" rel="noopener"`, 외부 링크 아이콘 16px + `aria-label="{이름} 열기, 새 탭"`)
  4. **버전** (`settings.version`): `앱 {appVersion} · 모델 {modelVersion}` (`--text-caption`, muted). 모델 버전을 못 받으면 `모델 -`
- 상태: 데이터 출처 목록이 비어 있으면 섹션 자체를 숨긴다.

### 5.12 `SegmentedControl`
- 가로 꽉 채움, 높이 44px, 배경 `--color-surface-muted`, 모서리 `--radius-md`, 안쪽 패딩 2px
- 선택된 칸: 배경 `--color-surface`, 글자 `--color-text`, `--text-body-strong`, 테두리 1px `--color-border`. 선택 안 된 칸: 글자 `--color-text-muted`, `--text-body`
- Props: `options: { value: string; label: string }[]`, `value: string`, `onChange(value)`, `ariaLabel: string`
- `role="radiogroup"`(칸은 `role="radio"` + `aria-checked`), 방향키로 이동. 각 칸 히트 영역 44px 이상
- 선택 전환은 `--duration-fast` (reduced-motion이면 즉시)

### 5.13 `Toggle`
- 트랙 52×32px, `--radius-full`. 꺼짐 `--color-toggle-off`, 켜짐 `--color-primary-strong`. 손잡이 26px 원 `--color-on-primary`
- 켜짐 상태는 색 외에 손잡이 위치(오른쪽) + 손잡이 안 체크 아이콘(14px)으로도 구분
- 히트 영역은 트랙이 아니라 행 전체(최소 44px 높이)로 확장. 포커스 링은 트랙 기준 `outline 2px --color-primary`, offset 2px
- Props: `checked: boolean`, `onChange(checked)`, `label: string`
- `<button role="switch" aria-checked>`, `aria-label`=label. 전환 `--duration-fast`

### 5.14 `ConsentDialog` (S-08)
- 가운데 정렬 모달. 뒤 `--color-backdrop`, 카드 `--color-surface`, 모서리 `--radius-lg`, 최대 너비 `min(100% - 2*var(--gutter), 360px)`, 패딩 `--space-6`
- 구성 (위→아래): 제목 `consent.title`(`--text-heading`) → 본문 `consent.body`(`--text-body`, 줄 사이 `--space-3`) → 버튼 2개 세로 쌓기 (`--space-3` 간격)
- 버튼: `consent.agree` = `Button primary`, `consent.decline` = `Button secondary`. 두 버튼 시각 위계는 다르지만 둘 다 52px·같은 너비 (거부가 숨겨지지 않게)
- Props: `open: boolean`, `onAgree()`, `onDecline()`, `onDismiss()` (바깥 탭/Esc는 `denied`로 처리: FUNCTIONAL_SPEC C-3)
- 접근성: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`=제목, `aria-describedby`=본문. 열릴 때 초점은 제목 컨테이너(`tabIndex=-1`)에 주고(어느 선택지도 미리 선택된 느낌이 없게), Tab 순서는 허용 → 허용 안 함, 포커스 트랩
- 모션: 페이드 + scale 0.96 → 1, `--duration-base`. reduced-motion이면 즉시

### 5.15 공통 상태 컴포넌트
- `Spinner`: 지름 24px(버튼용)·40px(화면용), 선 2px `--color-primary`(버튼 안 primary 위에서는 `--color-on-primary`). 회전 800ms linear. reduced-motion이어도 스피너는 유지(진행 표시이므로) 단 속도만 1600ms로 느리게
- `ErrorView` (S-09 전체 화면): 가운데 정렬, 아이콘(경고 48px, `--color-danger`) + 제목 `--text-title` + 설명 caption + `Button primary`. Props: `title: string`, `description?: string`, `actionLabel: string`, `onAction()`. `role="alert"`
- `EmptyState` (목록 전용·빈 목록): 아이콘 + 한 줄 문구. Props: `icon`, `message`

---

## 6. 화면 설계

### 6.1 홈 (`/`)

```
┌─────────────────────────┐
│  sushi-oishi        ⚙   │  ← 우상단 설정 IconButton
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
- 우상단 설정 아이콘(Lucide `settings`, `IconButton` `label="설정"`)이 `SettingsSheet`(5.11)를 연다. 테마 토글은 홈 상단에 따로 두지 않고 설정 시트의 화면 모드로 옮긴다.
- 이미지 준비 중(F1-4): 두 버튼 비활성 + 누른 버튼에 `Spinner`. 설정 아이콘은 활성 유지.
- 동의 다이얼로그(`ConsentDialog`, S-08)는 홈이 아니라 사진 확인(6.2)에서 `분석하기`를 눌렀을 때 뜬다.

### 6.2 사진 확인 (`/review`)
- 전체 화면 사진 미리보기 (배경 `#000`)
- 하단 고정: `다시 찍기`(secondary) / `분석하기`(primary) 가로 2분할, 버튼 줄 뒤에 `--color-overlay-scrim` 띠를 깔아 사진 위에서도 읽히게 한다
- 사진 배경은 `--color-photo-bg`
- 미결정 동의 상태의 `분석하기` → `ConsentDialog`가 먼저 뜨고, 선택 후 로딩으로 이동
- `분석하기` 탭 직후 비활성(연타 방지). 429 `Retry-After` 중에는 비활성 + 버튼 아래 caption `error.rateLimited`

### 6.3 로딩 (`/loading`)
- 업로드한 사진을 흐리게(blur 8px) 배경으로
- 사진 위를 위→아래로 지나가는 스캔 라인 (`--color-primary`, 2px, 1.4초 반복)
- 문구: "초밥을 살펴보고 있어요" → 1.5초 후 "먹는 순서를 정리하고 있어요" → 10초 넘으면 `loading.slow`를 아래 caption으로 추가 (문구 교체 아님)
- 문구 영역은 `aria-live="polite"`. 로딩 화면 취소는 시스템 뒤로 가기(요청 abort, 토스트 없음). 별도 취소 버튼은 두지 않는다.
- 배경 사진을 못 쓰면(blob 없음) `--color-bg` 배경 + 화면용 `Spinner`
- `prefers-reduced-motion` 시 스캔 라인 대신 스피너

### 6.4 결과 (`/result/:scanId`)

```
┌─────────────────────────┐
│ ←                       │  ← 사진 위 반투명 상단바 (뒤로 IconButton onPhoto)
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

- **공유 버튼은 v1에서 표시하지 않는다** (결정됨). 상단바에는 뒤로 버튼만 둔다. v2에서 공유 기능을 넣을 때 우상단에 `IconButton`을 추가한다.
- 상단 약 55%: 사진 + 오버레이 (시트를 내리면 확대)
- 박스 탭 → 시트가 해당 행으로 스크롤 + 행 강조
- 행 탭 → 해당 박스 강조 + 짧은 펄스(scale 1 → 1.15 → 1, `--duration-slow`)
- 박스 또는 행 길게 누름(500ms) → `SushiPicker`
- 체크 → 다음 차례 행으로 자동 이동

#### 6.4.1 목록 전용 모드 (로컬 사진 없음, BR-RES-10)
```
┌─────────────────────────┐
│ ←                       │  ← 상단바 (배경 --color-bg, onPhoto 아님)
│  [아이콘: 이미지 없음]     │
│  사진은 찍은 기기에만       │  ← result.noLocalPhoto, caption, muted
│  저장돼요. 순서는 아래에서   │
│  볼 수 있어요              │
├──── (핸들 없음, 고정) ────┤
│ 먹는 순서         2 / 6  │  ← OrderSheet가 전체 높이(90vh) 고정
│ ▌② 도미      흰살    ○  │
│  ...                    │
└─────────────────────────┘
```
- `OrderSheet`가 전체 높이로 열리고 접힘/절반 전환은 비활성(핸들 숨김). 배경은 `--color-bg`, 시트는 `--color-surface` 카드로 보이게 한다.
- 안내 영역: `--color-surface-muted` 배경, 반경 `--radius-lg`, 패딩 `--space-4`, 아이콘 Lucide `image-off` 32px(`--color-text-muted`)
- 박스·배지·확대 동작은 없다. 행 탭은 선택 강조만, 행 길게 누름 → `SushiPicker`, 체크는 그대로 동작
- 배지 등장 애니메이션 없음. 행 진입 stagger도 생략

### 6.5 인식 실패 (`/not-found`)
- 아이콘: 빈 접시 일러스트
- 제목: "초밥을 찾지 못했어요"
- 팁 3개 (아이콘 + caption):
  1. 접시 바로 위에서 찍어주세요
  2. 밝은 곳에서 찍어주세요
  3. 접시 전체가 화면에 들어오게 해주세요
- 버튼: `다시 찍기`(primary)
- 방금 찍은 사진이 있으면(`pendingImage`) 일러스트 아래에 썸네일 96px 높이(`--radius-md`)로 보여준다. 없으면 일러스트만.
- 팁 아이콘은 Lucide(`arrow-down-to-line`, `sun`, `scan`) 20px `--color-wood`, 아이콘은 장식이라 `aria-hidden`

### 6.6 에러 상태
| 상황 | 표시 |
| --- | --- |
| 네트워크 오류 | 토스트 "연결이 불안정해요. 다시 시도해주세요" + 다시 시도 버튼 |
| 용량 초과 | 토스트 "사진이 너무 커요" (클라이언트 축소 후에도 실패 시) |
| 요청 과다 | 토스트 "잠시 후 다시 시도해주세요" |
| 서버/모델 오류 | 전체 화면 "잠시 문제가 생겼어요" + 홈으로 |
| 오프라인 | 토스트 `error.offline` (요청하지 않음) |
| 시간 초과 | 토스트 `error.timeout` + 사진 확인으로 복귀 |

상태별 표시 규칙:

| 상태 | 표시 |
| --- | --- |
| 이미지 준비 중 (홈) | 버튼 비활성 + `Spinner` (6.1) |
| 로딩 (분석) | 6.3 |
| 결과 불러오는 중 (재진입 `GET /scans/{id}`) | 사진 영역 `--color-surface-muted` 스켈레톤 + 시트 행 스켈레톤 4줄(높이 64px, 점멸 없음, reduced-motion 무관) |
| 빈 목록 | 해당 없음 (결과는 항상 1개 이상) |
| 종류 목록 로딩 중 (`SushiPicker` 열기) | 시트 안에 화면용 `Spinner` |
| 수정 저장 실패 | 롤백 + 토스트 `error.correctionFailed`(오류 토스트) |
| 체크 저장 실패 | 롤백 + 토스트 `error.saveFailed` + 액션 `다시 시도` |
| 404 (결과 없음) | 토스트 `error.scanNotFound` 후 홈 |

오류 토스트는 `role="alert"`이며 색만으로 구분하지 않는다: 앞에 경고 아이콘(Lucide `circle-alert` 16px)을 붙인다. 토스트 배경은 항상 `--color-text`로 유지(빨강 배경 금지, 대비 보장).

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
| notFound.tip1 | 접시 바로 위에서 찍어주세요 |
| notFound.tip2 | 밝은 곳에서 찍어주세요 |
| notFound.tip3 | 접시 전체가 화면에 들어오게 해주세요 |
| loading.slow | 조금 더 걸리고 있어요 |
| result.noLocalPhoto | 사진은 찍은 기기에만 저장돼요. 순서는 아래에서 볼 수 있어요 |
| consent.title | 사진을 인식 품질 개선에 써도 될까요? |
| consent.body | 허용하면 찍은 사진을 저장해 인식 정확도를 높이는 데 써요. 사람 얼굴이 나오지 않게 찍어주세요. 설정에서 언제든 바꿀 수 있어요. |
| consent.agree | 허용 |
| consent.decline | 허용 안 함 |
| settings.title | 설정 |
| settings.theme | 화면 모드 |
| settings.themeSystem / themeLight / themeDark | 시스템 / 라이트 / 다크 |
| settings.consent | 사진 저장 허용 |
| settings.consentHint | 켜면 이후 찍는 사진을 서비스 개선에 사용해요 |
| settings.credits | 데이터 출처 |
| settings.version | 버전 |
| common.retry | 다시 시도 |
| common.home | 홈으로 |
| common.close | 닫기 |
| common.back | 뒤로 |
| common.settings | 설정 |
| error.notImage | 사진 파일만 선택할 수 있어요 |
| error.decodeFailed | 사진을 읽을 수 없어요. 다른 사진으로 해주세요 |
| error.tooSmall | 사진이 너무 작아요 |
| error.tooLarge | 사진이 너무 커요 |
| error.network | 연결이 불안정해요. 다시 시도해주세요 |
| error.offline | 인터넷에 연결되어 있지 않아요 |
| error.timeout | 분석이 오래 걸려요. 다시 시도해주세요 |
| error.rateLimited | 잠시 후 다시 시도해주세요 |
| error.server | 잠시 문제가 생겼어요 |
| error.scanNotFound | 결과를 찾을 수 없어요 |
| error.saveFailed | 저장하지 못했어요. 다시 시도해주세요 |
| error.correctionFailed | 수정하지 못했어요. 원래대로 돌려놓았어요 |

---

## 8. 모션

| 상황 | 동작 | 시간 |
| --- | --- | --- |
| 결과 진입 | 배지가 order 순서대로 하나씩 등장 (scale 0.6 → 1, opacity 0 → 1), 60ms 간격 | `--duration-base` |
| 박스/행 선택 | 테두리 색 전환 + 배지 1.15배 | `--duration-fast` |
| 행 탭 → 박스 펄스 | scale 1 → 1.15 → 1 | `--duration-slow` |
| 시트 높이 전환 | translateY | `--duration-slow`, `--ease-out` |
| 먹음 체크 | 체크 아이콘 그리기 + 행 opacity 전환 | `--duration-base` |
| 설정 시트·종류 선택 시트 | translateY + backdrop 페이드 | `--duration-slow`, `--ease-out` |
| 동의 다이얼로그 | 페이드 + scale 0.96 → 1 | `--duration-base` |
| 토글·세그먼트 전환 | 손잡이 이동/선택 칸 전환 | `--duration-fast` |
| 토스트 | 아래에서 페이드 인/아웃 | `--duration-base` |

`prefers-reduced-motion: reduce`이면 모든 등장·펄스·시트·다이얼로그·토스트·토글 전환 애니메이션을 끄고 즉시 상태만 바꾼다(`transition-duration: 0`). 스캔 라인은 스피너로 대체하고, 진행 표시용 스피너만 속도를 낮춰 유지한다. 구현은 `@media (prefers-reduced-motion: reduce)`에서 `--duration-*`를 0ms로 덮어쓰는 방식을 우선한다.

---

## 9. 접근성

- 텍스트 대비: 본문 4.5:1 이상, 큰 텍스트(18.66px Bold 이상) 3:1 이상.
- 탭 영역: 최소 44×44px.
- 오버레이 박스마다 `aria-label="1번 광어, 흰살, 신뢰도 높음"` 형식의 레이블.
- 순서 리스트는 `<ol>`로 마크업하고, 화면 낭독기는 리스트를 우선 읽도록 오버레이 레이어는 `aria-hidden="false"`이되 포커스 순서를 리스트 뒤로 둔다.
- 체크 버튼: `aria-pressed`로 먹음 상태 전달. `aria-label="2번 도미 먹음 표시"` 형식(`{order}번 {nameKo} 먹음 표시`), 눌린 상태는 `aria-pressed`로만 바꾸고 레이블은 고정.
- 오버레이 박스 `aria-label` 형식: `{order}번 {nameKo}, {그룹 한글}, 신뢰도 {높음|낮음}` (confidence >= 0.6 높음). 먹음이면 끝에 `, 먹음`, 수정됨이면 `, 직접 고침`. 박스는 `role="button"`, `tabIndex=0`, Enter로 선택. 길게 누름(종류 수정)의 키보드 대안으로 포커스된 `OrderRow`에 `종류 바꾸기` 버튼(44×44, `aria-label="{order}번 {nameKo} 종류 바꾸기"`)을 항상 노출한다.
- 아이콘 전용 버튼은 `aria-label` 필수 (설정, 뒤로, 닫기). 장식 아이콘은 `aria-hidden="true"`.
- 다이얼로그/시트: `role="dialog"` + `aria-modal` + 포커스 이동·복귀·트랩, Esc 닫기.
- 토글: `role="switch"` + `aria-checked`. 세그먼트: `role="radiogroup"`.
- 토스트: `role="status"`(오류는 `role="alert"`). 로딩 문구는 `aria-live="polite"`.
- 포커스 표시: 모든 조작 요소 `outline: 2px solid var(--color-primary)` + offset 2px, 흰/검정 사진 위에서는 `--color-on-scrim` 안쪽 링 추가.
- 대비 검증 결과(WCAG): 본문·muted 텍스트 모든 배경에서 4.5:1 이상(최저 4.89:1 muted on surface-muted 라이트), 흰 글자 on `--color-primary-strong` 4.7:1, 흰 글자 on `--badge-gunkan` 4.51:1(최소치, 값 변경 금지), 배지 어두운 글자 모두 7:1 이상. `--color-primary`(#F2704E)는 흰 배경에서 2.9:1이라 **글자·아이콘 단독 정보에 쓰지 않고** 선·채움(박스 테두리는 흰 선과 함께)에만 쓴다.
- 다크 모드 기본 지원 (어두운 가게에서 사용하는 경우가 많음).

---

## 10. 아이콘·이미지·PWA

- 아이콘: Lucide 아이콘 세트 (선 굵기 2px, 24px 기준). 카메라(`camera`), 이미지(`image`), 체크(`check`), 뒤로(`arrow-left`), 설정(`settings`), 닫기(`x`), 이미지 없음(`image-off`), 경고(`circle-alert`), 외부 링크(`external-link`). 공유 아이콘은 v1에서 쓰지 않는다.
- 일러스트: 플랫, 2~3색 (`--color-wood`, `--color-primary`, `--color-bg`), 선 없음.
- 앱 아이콘: 연어 주황 배경 위 흰색 원형 배지 안에 숫자 "1" + 작은 초밥 실루엣. 512 / 192 / maskable 버전.
- PWA manifest: `name: "sushi-oishi"`, `theme_color: #F2704E`, `background_color: #FAF7F2`, `display: standalone`, `orientation: portrait`.

---

## 11. Figma 작업 구조

```
📁 sushi-oishi
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
