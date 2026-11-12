# URL shortener

Gated Spring Boot service plus the React client in `frontend/`. Specs live in `specs/greenfield/` and `specs/frontend/`.

## Prerequisites

- JDK 21
- Maven 3.9+
- MySQL 8 on localhost for the dev profile. Database `shortener_dev`, user `root`. The lab default for `DB_PASSWORD` is `Tiger`.
- Docker is optional. `backend/Dockerfile` and `docker-compose.yml` are in the repo. On 2026-11-12, `docker compose up --build` built `url-shortener-app-application:latest` and then exited because host port 3306 is already used by local MySQL. The application container did not start.

## Tests

From `backend/`:

```powershell
mvn clean test
```

JaCoCo fails the build below 80% line coverage. The measured ratio is copied from `backend/target/site/jacoco/jacoco.csv` into `SDLC_METRICS.json`.

## Run

In Cursor, launch **URL Shortener (dev / MySQL)** or **URL Shortener (test / H2)**.

From `backend/` after `mvn package`:

```powershell
java -jar target\url-shortener-0.1.0.jar
```

The dev profile listens on port **8080**.

## Client

From `frontend/`, with the API already on port 8080:

```powershell
npm install
npm test
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` to port 8080. **Open short link** uses the absolute short URL from the API and is not proxied. Node.js 24.

## URLs

- `POST /api/v1/shorten`
- `GET /short/{code}` returns **302**, or an HTML **404** when the code is missing or expired
- `http://localhost:8080/swagger-ui.html`
- `http://localhost:8080/v3/api-docs`

Any other path returns the HTML 404. A `longUrl` that contains HTML returns **400** JSON.

## Specs and lineage

- `specs/greenfield/` — first build
- `specs/brownfield/` — Swagger, legal paths, Security/Jsoup, this docs pass
- `GATE2_APPROVAL.txt`
- `SDLC_AUDIT_LOG.json`
- `SDLC_METRICS.json`

## Limits

- Passwords in `application.yml` and Compose are lab defaults.
- Short codes are plain Base62 of the numeric id and can be guessed.
- Spring Security is a permitAll demo. CSRF, form login, and HTTP basic are off. There is no login.
- Click counts, a stats API, and Actuator are not in this build.
- Stage 7 is open. The image exists, and the Compose stack has not started.
