---
name: url-shortener-sdlc
description: >-
  Runs the gated spec-first Spring Boot SDLC for this repo (PRD, design, stack,
  tests, Gate 2 HITL, JaCoCo, audit log). Use when implementing the URL
  shortener backend from specs/greenfield, or when the user mentions AGENTS.md,
  Gate 2, or the backend SDLC.
disable-model-invocation: true
---

# URL shortener backend SDLC

Cursor loads this file when the skill is attached. Product behavior lives in `specs/greenfield/`. Do not invent APIs, `pom` dependencies, or coverage.

## Instructions

1. Read `AGENTS.md`.
2. Read `specs/greenfield/INSTRUCTIONS.md` and `specs/greenfield/ORCHESTRATION_MANIFEST.md`.
3. Read `PRD.md`, `SYSTEM_DESIGN.md`, `TECH_STACK.md`, and `TESTING_PLAN.md` in `specs/greenfield/` for their roles only.
4. Keep `specs/contracts/openapi.yaml` aligned with `PRD.md`.
5. Honor Gate 2: no `backend/pom.xml` or `backend/src/**` until `GATE2_APPROVAL.txt` contains `[APPROVED: …]`.
6. After approval, run 3A schema, 3B Base62, and 3C Boot together, then `mvn clean test` from `backend/`.
7. Brownfield playbooks in `specs/brownfield/` start only after Gate 4. `specs/scenarios/` records evaluation; it does not generate code.
8. Do not create `frontend/src/**` in this skill. The React specs live in `specs/frontend/` and are a separate pass.
