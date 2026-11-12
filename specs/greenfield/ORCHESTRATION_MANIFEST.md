# Agentic Orchestration & Lifecycle Governance Manifest

This manifest defines the stateful execution graph, gate criteria, and governance constraints for the backend URL shortener SDLC. The Java module is `backend/`. Frontend work is outside this graph.

## 1. Lifecycle State Machine Graph (DAG)

```
[1. REQUIREMENTS] ──(Gate 1)──> [2. ARCHITECTURE] ──(Gate 2: HITL)──> [3. IMPLEMENTATION]
       ▲                                    │                              │
       │                                    │                         (Gate 3: sync)
       │                                    ▼                              ▼
       │                         [FALLBACK & REPAIR] <── (Gate 4 fail)── [4 & 5. TEST & COMPLIANCE]
       │                                                                   │
       │                                                              (Gate 4 pass)
       │                                                                   ▼
[7. RELEASE READY] <──(Gate 6)── [6. OBSERVABILITY / CONTAINERS] <──(Gate 5)┘
       ▲
       └── (Dynamic Re-plan Trigger: return to Stage 1)
```

## 2. Lifecycle Stage Specifications & Gate Governance

### Stage 1: Requirements Analysis (`specs/greenfield/PRD.md`)
* **Agent Context:** Product Manager Agent.
* **Exit Gate 1 (Automated):** Every functional requirement maps to a named API signature in `PRD.md` and `specs/contracts/openapi.yaml`. Core constraints (Java 21, MySQL 8.0, Base62) are explicit in `PRD.md`.

### Stage 2: Architecture & Design (`SYSTEM_DESIGN.md` / `TECH_STACK.md`)
* **Agent Context:** System Architect Agent.
* **Dependencies:** Wait until Gate 1 passes.
* **Exit Gate 2 (CRITICAL — Human-in-the-Loop):**
  * Halt Stage 3. Emit a structural delta of schema, indexes, and `backend/pom.xml` dependency footprint versus the previous approved baseline.
  * Human writes `GATE2_APPROVAL.txt` in the workspace root with `[APPROVED: HUMAN_ENGINEER_ID]` (replace with the engineer identifier).
  * On approval, the orchestrator records a **Gate 2 snapshot** (git tag `gate2-approved` or a documented workspace snapshot) used as the Safe-Stop rollback point. Then unlock Stage 3.

### Stage 3: Implementation (Parallel Path Execution)
* **Agent Context:** Software Engineer Agents (parallel).
  * *Sub-Path 3A:* `backend/src/main/resources/db/schema.sql` from `SYSTEM_DESIGN.md` DDL (utf8mb4, `AUTO_INCREMENT=56800235`).
  * *Sub-Path 3B:* `com.yitinsun.urlshortener.encoding.Base62Encoder` (+ unit tests from `TESTING_PLAN.md`).
  * *Sub-Path 3C:* Spring Boot module (`backend/pom.xml`, `backend/src/main/resources/application.yml`, entities, repositories, services, controllers, exception handler).
* **Exit Gate 3 (Synchronization Barrier):** Paths 3A, 3B, and 3C must all complete before Stage 4. Partial delivery (encoder without schema, or controllers without `backend/pom.xml`) does not pass Gate 3.

### Stage 4 & 5: Testing, Validation & Policy Compliance (`TESTING_PLAN.md`)
* **Agent Context:** QA Engineer Agent and Compliance/Security Guardrail Agent.
* **Exit Gate 4 (Automated):**
  * Check 4A: `mvn clean test` in `backend/` completes with **100%** test success (zero failures, zero `@Disabled` / `@Ignore`).
  * Check 4B: JaCoCo fails the build unless **line coverage >= 80%**.
  * Check 4C: No hardcoded secrets (except documented `${PROPERTY:lab-default}` placeholders); no concatenated SQL; repositories use parameterized JPA.

### Stage 6: Observability & Containers
* **Agent Context:** Release / Platform Agent.
* **Exit Gate 5 (Automated):**
  * `SDLC_AUDIT_LOG.json` and `SDLC_METRICS.json` exist and contain Stage 3–5 entries.
  * `backend/Dockerfile` builds with Java 21 and starts with `--spring.profiles.active=prod`.
  * Root `docker-compose.yml` wires that image to MySQL 8.0 via `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (no secrets in Java).
  * App health: process listens on **8080**.

### Stage 7: Release Ready
* **Agent Context:** Orchestrator + human operator.
* **Exit Gate 6:** `SDLC_METRICS.json` and the Outputs section of `specs/scenarios/01-greenfield.md` match **actual** artifacts and measured coverage. Gate 6 fails if either claims files, Docker, or percentages that are not in the workspace. This tree has no separate engineering-summary file.

## 3. Resilience, Self-Correction & Fault Management

### Bounded Retries & Fallback Strategy
* **Scope:** Compilation or test failures in Stage 4.
* **Maximum Loop Count:** **3 retries**.
* **Self-Correction Policy:** On failure, pipe Maven logs and stack traces into a patch of the failing class, append `SDLC_AUDIT_LOG.json`, increment `retry_rollback_frequency`, and record MTTR when the suite passes.

### Fallback, Rollback & Safe-Stop Control
* **Trigger:** Three retries exhausted without a green `mvn clean test`.
* **Rollback Protocol:**
  1. Halt all code write streams immediately.
  2. Reset the workspace to the **Gate 2 snapshot** (`gate2-approved` tag, or the recorded pre-Stage-3 tree). Do not reset `specs/greenfield/` unless those specs changed mid-run.
  3. Enter **Safe-Stop Mode:** freeze background agent loops, write a high-severity entry to `SDLC_AUDIT_LOG.json`, and emit the full error trace. Do not start Stage 6.

## 4. Dynamic Re-Planning Loop
* **Trigger:** An upstream spec changes during a run (for example `PRD.md` adds custom aliases). Custom aliases are **out of v1**; adding them is a re-plan, not a silent patch.
* **Behavior:** Invalidate downstream file hashes recorded in `SDLC_AUDIT_LOG.json`, halt generation, keep the historical log, and restart at **Stage 1**.

## 5. Controlled Autonomy Rules & Approval Gates

```
[Agent Action Pipeline] ──> [Impact Evaluation]
                                   │
         ┌─────────────────────────┴─────────────────────────┐
         ▼ (High Impact)                                     ▼ (Low Impact)
[HALT Execution Loop]                               [Execute Autonomously]
         │                                                   │
         ▼                                                   ▼
[Verify GATE2 / human signature]                    [Log Action & Telemetry]
         │                                                   │
         └─────────────────────────┬─────────────────────────┘
                                   ▼
                       [Commit State Changes]
```

### 5.1 High-Impact Threshold Actions (Human Intervention Required)
Pause workers and wait for a human signature file for:
* **Schema changes:** any add/modify/remove of SQL table definitions after Gate 2.
* **Dependency modifiers:** packages in `backend/pom.xml` outside the baseline in `TECH_STACK.md` (including springdoc, Security, jsoup, actuator).
* **Test-bar reduction:** lowering coverage below 80% or deleting mandatory cases in `TESTING_PLAN.md`.

### 5.2 Low-Impact Autonomous Actions (Machine Execution Approved)
Allowed without halt if logged in `SDLC_AUDIT_LOG.json`:
* Refactoring method bodies to fix compile or test failures.
* Adding tests **above** the mandatory matrix.
* Adding log or metric hooks that do not change API contracts.

## 6. After Gate 4

Brownfield changes are separate playbooks, in order:

1. `specs/brownfield/01-add-swagger.md`
2. `specs/brownfield/02-legal-paths.md`
3. `specs/brownfield/03-security-jsoup.md`
4. `specs/brownfield/04-refine.md`

Each playbook that adds a dependency or a table is high-impact and needs a new human signature. Do not start them during Stage 3.
