# be

- 빌드: `./gradlew build`
- 테스트: `./gradlew test`

## Stack
- Java 21
- Spring Boot
- Gradle
- PostgreSQL / PostGIS

## Architecture
- Follow existing package and layer conventions.
- Keep Controller, Service, Repository responsibilities separate.
- Use DTOs for API requests and responses.
- Do not introduce new dependencies without explaining why.

## Development Rules
- Inspect existing code before making changes.
- Do not overwrite unrelated user changes.
- Do not commit or push without approval.
- Run relevant tests after implementation.
- Report changed files, test commands, and failures.

## Parallel Work
- Respect the file ownership assigned to each task.
- Do not edit another agent's assigned files.
- Report interface changes before changing shared API contracts.
