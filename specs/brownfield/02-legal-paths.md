# 02 — Legal paths and friendly HTML

Brownfield playbook. Run after `01-add-swagger.md`. Greenfield already specifies `GET /short/{shortCode}`, `shortUrl = {APP_BASE_URL}/short/{shortCode}`, and HTML **404** for a missing or expired code. This playbook adds the allowlist fence and turns off Whitelabel for every other URL. It does not rename spec folders and it does not change the redirect path.

No new Maven dependencies. No Spring Security (that is `03-security-jsoup.md`). No schema change.

## Legal URL allowlist

Host is `http://localhost:8080` in local `dev` / `test`.

| Legal pattern | Methods | Notes |
|:--------------|:--------|:------|
| `/api/v1/shorten` | **POST** | JSON create. Other methods are illegal. |
| `/short/{shortCode}` | **GET** | `{shortCode}` is Base62 `[0-9A-Za-z]{1,10}`. |
| `/swagger-ui.html` | GET | From playbook 01. |
| `/swagger-ui/**` | GET | UI assets. |
| `/v3/api-docs` | GET | OpenAPI JSON. |
| `/v3/api-docs.yaml` | GET | OpenAPI YAML. |
| `/v3/api-docs/**` | GET | Springdoc extras. |
| `/error` | internal | Slip-net only. Do not advertise it. |

**Illegal examples:** `/`, `/index.html`, `/foo`, `/b9K2x1` (no `/short/` prefix), `GET /api/v1/shorten`, `/short/` with no code.

Actuator is **not** on the v1 classpath. Do not allowlist `/actuator/**` in this playbook.

Implement `LegalPaths` plus a `OncePerRequestFilter` (`LegalPathFilter`, order `HIGHEST_PRECEDENCE + 20`) on `/**`:

1. Legal pattern → continue the chain.
2. Anything else → **404** friendly HTML. Do not forward into a controller that might 302 or return JSON.

Package: `com.yitinsun.urlshortener.web`.

## HTML vs JSON

| Request | Body |
|:--------|:-----|
| `POST /api/v1/shorten` 400 / 503 | JSON `ErrorResponse` |
| `GET /short/{shortCode}` missing or expired | HTML 404 |
| Illegal path | HTML 404 |
| Container error that still reaches `/error` with `Accept: text/html` | Same HTML 404 |

Turn Whitelabel off in `application.yml`:

```yaml
server:
  error:
    whitelabel:
      enabled: false
    include-message: never
```

The page must include a visible title, a short explanation, the escaped request path, and links to `POST /api/v1/shorten`, `/swagger-ui.html`, and `/short/{code}`. It must not say “Whitelabel Error Page” or show a stack trace. Escape `<`, `&`, and `"`.

`ERR_CONNECTION_REFUSED` means nothing is listening on 8080. That is not this 404.

## Tests

Keep the greenfield cases. Add:

| Case | Expect |
|:-----|:-------|
| `GET /short/{activeCode}` | 302 + `Location` |
| `GET /short/unknown` | 404, `text/html`, friendly heading, no “Whitelabel” |
| `GET /b9K2x1` | 404 HTML |
| `GET /` and `GET /nope` | 404 HTML |
| `GET /api/v1/shorten` | 404 HTML |
| `POST /api/v1/shorten` valid | 201 JSON |
| `GET /v3/api-docs` | 200 JSON containing `/api/v1/shorten` and not a bare `/{shortCode}` path |

`mvn clean test` from `backend/` must stay green. No `@Disabled`.
