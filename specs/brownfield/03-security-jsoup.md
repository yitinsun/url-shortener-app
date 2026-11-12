# 03 — Security permitAll demo and Jsoup

Brownfield playbook. Run after `02-legal-paths.md`. This is a **demo**, not product login. No users, JWT, or login page.

Both dependencies are outside `TECH_STACK.md`. Wait for a new human signature before editing `backend/pom.xml`.

What it adds:

1. `SecurityFilterChain` — CSRF off; documented routes `permitAll()`; no form login and no HTTP basic.
2. `HtmlSanitizeFilter` (`OncePerRequestFilter`) — Jsoup rejects HTML/script in `longUrl`.
3. On a finding, throw `SanitizationException` and let `GlobalExceptionHandler` return the existing **400** JSON. Do not invent a second error shape.

`LegalPathFilter` stays the allowlist and runs **first**. This filter runs after it (`HIGHEST_PRECEDENCE + 30`) so illegal URLs still get HTML 404.

## Maven

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-security</artifactId>
</dependency>
<dependency>
    <groupId>org.jsoup</groupId>
    <artifactId>jsoup</artifactId>
    <version>1.18.1</version>
</dependency>
```

Do not pin Spring Security; the Boot 3.3 parent BOM does that. Do not add OAuth2 or JWT libraries.

## Security filter chain

`com.yitinsun.urlshortener.config.SecurityConfig`:

- Disable CSRF so `POST /api/v1/shorten` from Swagger and curl still works.
- Disable `formLogin`, `httpBasic`, and `logout`.
- `permitAll` for `/api/v1/shorten`, `/short/**`, Swagger, `/v3/api-docs/**`, and `/error`.
- `anyRequest().permitAll()` so unknown paths still reach `LegalPathFilter` (HTML 404, not 401).

Locking the API with `authenticated()` is a later re-plan, not this demo.

## Jsoup

Buffer `POST` JSON so the controller can still read the body. Treat markup as unsafe. A plain `https://example.com/path` must pass.

Reject rather than silently clean. Apply only to `longUrl` on `POST /api/v1/shorten`.

Unsafe when `Jsoup.isValid(value, Safelist.none())` is false, or when `Jsoup.parseBodyFragment(value).body().childrenSize() > 0`.

## Tests

- Existing ITs still pass (Security must not CSRF-block POST).
- `longUrl` containing HTML or `<script>` → **400** JSON whose message mentions sanitization or HTML.
- `HtmlSanitizer` unit tests: clean URL vs `<script>` / `<img>`.

## Files

| File | Role |
|:-----|:-----|
| `backend/pom.xml` | security starter, jsoup 1.18.1 |
| `config/SecurityConfig.java` | permitAll demo |
| `web/RepeatableBodyRequestWrapper.java` | replay POST body |
| `web/HtmlSanitizer.java` | `looksUnsafe` |
| `web/SanitizationException.java` | signals the handler |
| `web/HtmlSanitizeFilter.java` | filter after the allowlist |
| `web/GlobalExceptionHandler.java` | map to 400 JSON |
