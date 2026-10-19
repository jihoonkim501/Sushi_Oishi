# 스시순 (SushiSoon)

작업을 시작하기 전에 아래 두 문서를 반드시 읽고 따른다.

- `PROJECT_SPEC.md`: 기획, 기능, 순서 로직, 모델, 아키텍처, API, DB, 로드맵 (기준 문서)
- `DESIGN.md`: 디자인 토큰, 컴포넌트, 화면, 문구 규칙

## 폴더

| 폴더 | 내용 |
| --- | --- |
| `be/` | 백엔드. Java 21 + Spring Boot, Gradle. IntelliJ로 개발 |
| `fe/` | 프론트엔드. React + Vite + TypeScript (PWA) |
| `design/` | 디자인 자료. Figma 내보낸 이미지, 아이콘, 일러스트 원본 |
| `ml/` | 모델 학습. Python, YOLO 학습 노트북과 ONNX 내보내기 |

## 핵심 규칙

- 현재 단계는 MVP(v1)다. v2·v3 기능은 요청이 있을 때만 구현한다.
- API 필드명, DB 스키마, class_id는 `PROJECT_SPEC.md`를 먼저 수정한 뒤 코드를 바꾼다.
- UI 색·폰트·간격은 `DESIGN.md`의 토큰만 사용한다.
- DB 변경은 Flyway 마이그레이션으로만 한다.
- 비밀값은 환경 변수로만 받는다.
