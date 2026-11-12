# Greenfield scenario

**Intent:** build the URL shortener backend from specs. This file is an evaluation index. It does not generate code.

**Decomposition**

1. Requirements → `specs/greenfield/PRD.md` and `specs/contracts/openapi.yaml` (Gate 1: named APIs, Java 21, MySQL 8, Base62).
2. Architecture → `SYSTEM_DESIGN.md`, `TECH_STACK.md` (Gate 2: a human line `[APPROVED: …]` in `GATE2_APPROVAL.txt`).
3. Implementation in parallel, after approval (Gate 3 sync):
   - **3A** `backend/src/main/resources/db/schema.sql`
   - **3B** `Base62Encoder` + unit tests
   - **3C** `backend/pom.xml`, JPA, controllers, exception handler
4. Tests / compliance (Gate 4): `mvn clean test` from `backend/`, JaCoCo ≥ 80%, parameterized JPA, no `@Disabled`.

**Orchestration path:** Stages 1→2→HITL→3A/3B/3C→4, as in `specs/greenfield/ORCHESTRATION_MANIFEST.md`.

**Validation (when Stage 4 runs):** `Base62EncoderTest`, `UrlShortenerServiceTest`, `ExpiredMappingCleanupJobTest`, `UrlShortenerControllerIT`. Command: `mvn clean test` on JDK 21 from `backend/`.

**Outputs present in the workspace:**

- `backend/pom.xml`, `backend/src/main/java/**`, `backend/src/main/resources/db/schema.sql`, `backend/src/main/resources/application.yml`
- `backend/Dockerfile` and root `docker-compose.yml`. Image `url-shortener-app-application:latest` was built on 2026-11-12T16:41:42Z. `docker compose up` exited 1 because host port 3306 was already bound. The application container did not start. Stage 7 stays open.
- Later playbooks also added `OpenApiConfig`, `LegalPathFilter`, `SecurityConfig`, and `HtmlSanitizeFilter`
- JaCoCo after `mvn clean test` on 2026-11-12T16:33:30Z: 25 tests, 0 failures. `jacoco.csv` sums to 244 lines covered and 51 missed (244/295).

Policy: `specs/greenfield/ORCHESTRATION_MANIFEST.md`. Stage 7 is open.
