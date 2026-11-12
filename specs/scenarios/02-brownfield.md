# Brownfield scenario

**Intent:** change the running backend after Gate 4 without skipping the dependency allow-list, tests, or error pages. This file is an evaluation index. The playbooks generate the changes.

**Decomposition:** one playbook → impact → code and tests → `mvn clean test` from `backend/`. A new `pom` dependency or a table change waits for a human signature.

| Order | Change | Playbook | Modules | API / data |
|:------|:-------|:---------|:--------|:-----------|
| 1 | OpenAPI UI | `01-add-swagger.md` | `backend/pom.xml`, `OpenApiConfig`, controller and DTO annotations | `/swagger-ui.html`, `/v3/api-docs` |
| 2 | Allowlist and HTML 404 for illegal paths | `02-legal-paths.md` | `LegalPathFilter`, `LegalPaths`, error pages | Fence around the greenfield routes. Redirect stays `GET /short/{code}` |
| 3 | Security + Jsoup demo | `03-security-jsoup.md` | `SecurityConfig`, `HtmlSanitizeFilter` | 400 JSON if `longUrl` contains HTML. Routes stay `permitAll` |
| 4 | Docs and measured metrics | `04-refine.md` | README, audit log, scenario outputs | No schema |

**Orchestration path:** post–Gate 4, one playbook at a time. Greenfield already specifies `GET /short/{shortCode}`. Do not reopen that path as a second design.

**Validation:** after each playbook, the greenfield ITs still pass, plus the cases named in that playbook. Command remains `mvn clean test`.

**Outputs in `backend/`:**

- Swagger: `pom.xml` springdoc 2.6.0, `config/OpenApiConfig.java`, OpenAPI annotations on the shorten controller and DTO records. `GET /short/{shortCode}` stays `@Hidden`.
- Allowlist: `web/LegalPaths.java`, `web/LegalPathFilter.java`, `web/FriendlyErrorPages.java`, `web/FriendlyErrorController.java`.
- Security demo: `config/SecurityConfig.java` (`permitAll`, CSRF off). Jsoup: `web/HtmlSanitizer.java`, `web/HtmlSanitizeFilter.java`.
- Docs: `README.md`, `SDLC_AUDIT_LOG.json`, `SDLC_METRICS.json`.
- Client: `frontend/` (React 19, Vite 6). It calls `POST /api/v1/shorten` only. `npm test` in that folder: 9 tests, 0 failures. No coverage percentage is defined for the client.
- No schema change. No Actuator. No click-count column.
- Docker: image `url-shortener-app-application:latest` exists. Compose did not start; host port 3306 was already in use. Stage 7 stays open.
