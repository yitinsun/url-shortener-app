# Frontend test plan

From `frontend/`, `npm test` runs Vitest and must finish with zero failures. Do not skip a case to go green. There is no coverage percentage in this plan; do not invent one.

Render with React Testing Library. Mock `fetch`. Do not start Spring Boot.

## 1. Create form

| Case | Expect |
|:-----|:-------|
| Submit a valid `https` URL with lifetime blank | `POST /api/v1/shorten`, JSON body has `longUrl` and **no** `ttlInDays` |
| Submit with lifetime `365` | Body includes `ttlInDays: 365` |
| Empty URL, `http://` missing, length over 2048, or TTL `0` | No `fetch`; an inline error is visible |
| **201** body | “Short link ready”, the `shortUrl`, `shortCode`, and a formatted `expiresAt` |
| Second **201** for the same URL | Still “Short link ready” (the API does not flag reuse) |

## 2. Errors

| Case | Expect |
|:-----|:-------|
| **400** `{ status, error, message }` | `message` is shown; the typed URL remains |
| **503** with a `message` | That `message` is shown |
| `fetch` rejects | “The link service could not be reached.” |

## 3. Pictures and actions

| Case | Expect |
|:-----|:-------|
| First paint | Hero `alt` “Desk with a notebook, a brass pen, and a paper strip”, plus the three step alts from `DESIGN.md` |
| Copy control after success | Clipboard receives `shortUrl` |
| Open control | An anchor whose `href` is `shortUrl` |

## 4. Command

`npm test` on Node.js 24. A production build check, when the app exists, is `npm run build` and must succeed without calling the API.
