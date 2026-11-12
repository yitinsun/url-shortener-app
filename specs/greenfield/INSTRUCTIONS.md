# AI Agent Instructions: Autonomous Spring Boot URL Shortener with Lifecycle Governance

You are an advanced, context-aware AI software engineering node operating inside a stateful orchestration graph. You will build, test, and containerize the URL shortener **backend** under strict compliance and observability standards matching Java 21 and MySQL 8.0.

Governing documents (do not contradict them):

* Product: `specs/greenfield/PRD.md`
* Architecture: `specs/greenfield/SYSTEM_DESIGN.md`
* Toolchain: `specs/greenfield/TECH_STACK.md`
* Tests: `specs/greenfield/TESTING_PLAN.md`
* Lifecycle gates: `specs/greenfield/ORCHESTRATION_MANIFEST.md`
* Halt rules: `AGENTS.md`

Do not generate `frontend/**` from these instructions.

## 1. Observability, Lineage & Decision Logging

Maintain a continuous file named `SDLC_AUDIT_LOG.json` in the **workspace root**. The file is a JSON array. Append one object for every file generation, class modification, test execution, or self-correction run:

```json
{
  "timestamp": "2026-11-11T16:00:00Z",
  "stage": "IMPLEMENTATION",
  "action_taken": "Created Base62Encoder.java to implement SYSTEM_DESIGN.md section 3.",
  "upstream_dependency": "specs/greenfield/SYSTEM_DESIGN.md",
  "upstream_dependency_hash": "<SHA-256 of the governing markdown file>",
  "rationale": "Deterministic ID-to-Base62 encoding avoids hash-collision retries on insert."
}
```

Allowed `stage` values: `REQUIREMENTS`, `ARCHITECTURE`, `IMPLEMENTATION`, `TESTING`, `COMPLIANCE`, `OBSERVABILITY`, `RELEASE`, `REPAIR`, `REPLAN`.

Preserve historical entries. Never overwrite the log on re-plan; only append. Do not write `"n/a"` for `upstream_dependency_hash` when a governing markdown file exists.

## 2. Reliability Metrics Tracking

Write aggregated telemetry to `SDLC_METRICS.json` in the workspace root after every execution loop. Do not leave metrics as unnamed context variables. Do not invent JaCoCo ratios. Copy the line ratio from `backend/target/site/jacoco/jacoco.csv` after a real `mvn clean test`.

```json
{
  "success_rate": {
    "compiled_ok": 0,
    "syntax_failures": 0
  },
  "retry_rollback_frequency": 0,
  "mttr_ms": null,
  "stage1_epoch_ms": null,
  "stage7_epoch_ms": null,
  "end_to_end_latency_ms": null,
  "jacoco_line_ratio": null,
  "updated_at": "2026-11-11T16:00:00Z"
}
```

* **Success Rate:** successful compiled code blocks vs syntax failures generated.
* **Retry/Rollback Frequency:** increment on each Gate 4 fallback loop.
* **MTTR:** milliseconds from a failing `mvn test` line to a successful re-run of that suite.
* **End-to-End Latency:** `stage7_epoch_ms - stage1_epoch_ms` when Stage 7 completes.
* Leave Stage 7 fields **null** until that stage actually finishes.

## 3. Hard Policy Compliance Guardrails

* **No concatenated SQL:** All MySQL access must use Spring Data JPA repositories with parameterized queries. Native `@Query` is allowed only when `TECH_STACK.md` performance override applies, and must use bind parameters (`:name` or `?1`). String concatenation of SQL is a Gate 4C failure.
* **Secret isolation:** Do not hardcode credentials, production passwords, or API keys in Java or property files. Map secrets through `${PROPERTY:DEFAULT}` as defined in `TECH_STACK.md`. Lab defaults are for local/dev only; production must inject real environment values.
* **No test bypass:** Never add `@Ignore` or `@Disabled` (JUnit 4 or 5) to make a suite pass.

## 4. Work Execution Cycle (State Gate Constrained)

1. **Gate 2 lock:** Do not generate functional Java sources, `backend/pom.xml`, or `backend/src/**` until Gate 2 is approved. Approval is a workspace file `GATE2_APPROVAL.txt` containing a line of the form `[APPROVED: HUMAN_ENGINEER_ID]`. Documentation under `specs/`, `AGENTS.md`, `.cursor/rules/**`, `Dockerfile`, and `docker-compose.yml` may exist before Gate 2; they do not unlock Stage 3.
2. **Bounded retry:** If compilation or tests fail, follow the 3-retry protocol in `ORCHESTRATION_MANIFEST.md`. Fix production or test code so assertions pass. Do not weaken coverage below 80%.
3. **Lineage:** After each mutation, append to `SDLC_AUDIT_LOG.json` with the SHA-256 of the markdown file that justified the change (`PRD.md`, `SYSTEM_DESIGN.md`, `TECH_STACK.md`, or `TESTING_PLAN.md`).
