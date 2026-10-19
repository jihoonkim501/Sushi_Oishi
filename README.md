# sushi-oishi

초밥 사진 한 장을 찍으면 각 피스에 박스와 이름을 표시하고, 담백한 것부터 진한 것 순으로 먹는 순서를 알려주는 모바일 웹(PWA) 서비스.

- 기획·기능·API·DB 명세: [`PROJECT_SPEC.md`](./PROJECT_SPEC.md)
- 디자인 토큰·컴포넌트·화면 규칙: [`DESIGN.md`](./DESIGN.md)
- 에이전트 작업 규칙: [`CLAUDE.md`](./CLAUDE.md)
- 이슈/브랜치/커밋/PR 작업 흐름: [`.github/WORKFLOW.md`](./.github/WORKFLOW.md)

## 폴더 구조

| 폴더 | 내용 |
| --- | --- |
| `be/` | 백엔드. Java 21 + Spring Boot, Gradle |
| `fe/` | 프론트엔드. React + Vite + TypeScript (PWA) |
| `design/` | 디자인 자료 |
| `ml/` | 모델 학습 (Python, YOLO) |

## 로컬 실행

### 백엔드 (`be/`)

```
cd be
docker compose up -d        # 로컬 PostgreSQL
./gradlew bootRun
```

### 프론트엔드 (`fe/`)

```
cd fe
npm install
npm run dev
```
