# 01 — Swagger UI (springdoc)

Brownfield playbook. Run only after Gate 4 is green. Adding this dependency is **high impact**: it is not in `specs/greenfield/TECH_STACK.md`. Wait for a new human signature before editing `backend/pom.xml`.

Swagger publishes the HTTP API that already exists. It does not change status codes, the schema, or redirect behavior. The written contract stays `specs/contracts/openapi.yaml`.

**Library:** `springdoc-openapi-starter-webmvc-ui` 2.6.0 (Jakarta / OpenAPI 3). Do not use Springfox.

| Item | Value |
|:-----|:------|
| Module | `backend/` |
| Spring Boot | 3.3.x |
| Java | 21 |
| Root package | `com.yitinsun.urlshortener` |
| JSON API | `POST /api/v1/shorten` |
| Redirect | `GET /short/{shortCode}` → **302** (hide from the UI) |

After enablement: `http://localhost:8080/swagger-ui.html` and `http://localhost:8080/v3/api-docs`.

## 1. Maven

```xml
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.6.0</version>
</dependency>
```

Do not add the WebFlux starter. Check with `mvn -q dependency:tree -Dincludes=org.springdoc` from `backend/`.

## 2. YAML

Append to `backend/src/main/resources/application.yml`:

```yaml
springdoc:
  api-docs:
    path: /v3/api-docs
    enabled: ${SPRINGDOC_ENABLED:true}
  swagger-ui:
    path: /swagger-ui.html
    enabled: ${SPRINGDOC_SWAGGER_UI_ENABLED:true}
    operations-sorter: method
    tags-sorter: alpha
    display-request-duration: true
    try-it-out-enabled: true
    persist-authorization: false
  show-actuator: false
  packages-to-scan: com.yitinsun.urlshortener.web
  paths-to-match:
    - /api/v1/**
```

`paths-to-match` keeps the UI on the JSON API. Mark `RedirectController` with `@Hidden`. In the `prod` profile, default both `enabled` flags to false unless the env var turns them on.

## 3. OpenAPI bean

`com.yitinsun.urlshortener.config.OpenApiConfig` exposes title **URL Shortener API**, version `0.1.0`, and a server URL from `app.base-url`. The bean is documentation only.

Do not add a Bearer/JWT security scheme. The create API stays public.

## 4. Annotations

Use `io.swagger.v3.oas.annotations.*` on `UrlShortenerController` and the DTO records (`ShortenRequest`, `ShortenResponse`, `ErrorResponse`). Annotations must not change paths, status codes, or validation. Document **201**, **400**, and **503** on `POST /api/v1/shorten` as in `openapi.yaml`.

## 5. What this playbook does not do

- No Spring Security in this change (`03-security-jsoup.md` is separate).
- No schema change.
- No replacement for `UrlShortenerControllerIT`.

## 6. Smoke check

1. Start the backend on port 8080.
2. `GET /swagger-ui.html` shows **URL Shortener API** `0.1.0`.
3. The catalog lists `POST /api/v1/shorten` and omits `GET /short/{shortCode}`.
4. Try-it-out with a valid `https://…` URL returns **201**.
5. `GET /v3/api-docs` is OpenAPI 3 JSON.
6. `mvn clean test` from `backend/` stays green.
