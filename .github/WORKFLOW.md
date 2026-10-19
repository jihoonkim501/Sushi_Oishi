# 작업 흐름

1. **이슈 작성** — 이슈 템플릿(`bug_report.md` / `feature_task.md`)으로 작업을 먼저 등록한다.
2. **브랜치 생성** — 이슈 번호를 받은 뒤, 그 이슈에서 브랜치를 만든다.
3. **작업 및 커밋** — [커밋 컨벤션](./COMMIT_CONVENTION.md)에 맞춰 커밋한다.
4. **PR 생성** — [PR 템플릿](./PULL_REQUEST_TEMPLATE.md)에 이슈를 연결(`Closes #이슈번호`)한다.

## 브랜치 네이밍

```
{part}/{type}/{이슈번호}-{작업내용}
```

- `part`: `be` `fe` `design` `ml` `docs` `infra` (소문자)
- `type`: `feat` `fix` `refactor` `chore` `docs` `test` `style` (소문자)
- `이슈번호`: `#` 없이 숫자만
- `작업내용`: 영문 kebab-case로 짧게

### 예시

```
be/feat/12-create-db-setting
fe/fix/7-camera-preview-null-check
design/chore/3-color-token-update
```
