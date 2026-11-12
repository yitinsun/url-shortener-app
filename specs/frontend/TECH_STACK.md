# Frontend technology stack

This is the only allowed toolchain for `frontend/`. It is not part of `backend/pom.xml`.

## 1. Versions

* **Runtime:** Node.js **24**
* **UI:** React 19, TypeScript 5
* **Build:** Vite 6
* **Tests:** Vitest and React Testing Library

Module root: `frontend/` (`frontend/package.json`).

## 2. Dependency allow-list

Runtime and build:

* `react`, `react-dom`
* `vite`, `@vitejs/plugin-react`, `typescript`
* `@fontsource/fraunces`, `@fontsource/source-sans-3`

Test only:

* `vitest`, `jsdom`
* `@testing-library/react`, `@testing-library/user-event`, `@testing-library/jest-dom`
* `@types/react`, `@types/react-dom` (type declarations only; the published React 19 package has no `.d.ts` files)

Do not add a component library, CSS framework, router (the product is one route plus a tiny unknown-path fallback), chart package, analytics SDK, or an HTTP client framework. Use `fetch`.

Fonts are imported from the Fontsource packages so the page does not depend on a third-party stylesheet at runtime.

## 3. Dev server and the API

The browser talks to the Vite origin. Proxy API calls to the Spring Boot port so v1 does not need a CORS change in `backend/`.

`frontend/vite.config.ts`:

* Dev server port **5173**.
* Proxy `/api` → `http://localhost:8080`.

`POST /api/v1/shorten` is therefore a same-origin `fetch("/api/v1/shorten")` in dev.

The short URL in the **201** body is absolute (`http://localhost:8080/short/...` by default). **Open short link** uses that absolute URL. Do not proxy `GET /short/**` through Vite; the redirect must be served by the API.

Optional env: `VITE_API_ORIGIN` defaults to empty in dev (same-origin `/api`) and to the public API origin in a built client. Do not hardcode a production secret. There is no auth header.

## 4. Layout when the app is generated

```text
frontend/
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── api/shorten.ts
    ├── styles.css
    └── assets/
        ├── hero-desk.webp
        ├── step-paste.webp
        ├── step-code.webp
        └── step-open.webp
```

`api/shorten.ts` is the only module that knows the path, the JSON fields, and the status codes. Components do not assemble the URL string themselves.

## 5. Backend gate

Editing these frontend files does not unlock `backend/pom.xml` or `backend/src/**`. Gate 2 in `AGENTS.md` still applies to Java.
