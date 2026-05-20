# 📜 Changelog — Captain OS

All notable changes to the **Captain OS** meta-operating system will be documented in this file. The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [2.2.0] — 2026-05-20
### Added
- **Dynamic Expert Dispatching (DED):** Implemented domain-aware AI pilot selection. Instead of rigid roles, the system inspects the modified files (e.g., `trading`, `database`, `frontend`) and dispatches specialized expert roles.
- **Multi-LLM Fire Chat Protocol:** Added parallel consensus reviews across state-of-the-art 2026 models (**Gemini 3.1 Pro**, **Claude 4.7**, and **Codex 5.3 / GPT-5.5**). The Arbiter node executes a consensus debate requiring a 2/3 majority with zero critical security blocks.
- **SRE & Control Systems Framework:** Refactored the runtime regulation into an engineering model:
  - **Error Budgets & Exponential Back-off Throttling:** Delay commit hooks progressively when the budget is exceeded.
  - **Tech Debt GC Credits:** Grants gate tolerance and throttle relief when legacy modules or dead code are verified as pruned.
  - **SLO Index & Structural Entropy:** Calculates project density, import cohesion, and automatically locks adaptive soft gates into hard blocking gates if SLOs are violated.
- **CLI Sandboxing & Path Anchoring:** Added `findRootCwd()` to recursive parent search, resolving path drift when CLI commands are executed from deep subfolders.
- **Smart Test Runner Timeout:** Added a strict 60s `timeout` inside the SimplifyCode snapshot engine to prevent hanging test runners and initiate automatic **Mechanical Rollback** on `ETIMEDOUT`.
- **Backward-Compatible Fixtures Mode:** Added `context.fixtureMode` fallback to keep frozen legacy test signatures (Bohr, Lovelace) passing perfectly during verification runs.

### Changed
- **Decoupling from Plexo:** Stripped all application-specific domains, names, and assets (e.g., `studio.plexo.institute`) from the compiler, CLI output, and template managers to ensure perfect portability of the CLI core.

---

## [2.1.0] — 2026-05-10
### Added
- **PHPE Core Integration:** Introduced the first prototype of the Plexo Homeostatic Progression Engine tracking repository metrics (Scale, Connectivity, Protection, Entropy).
- **Time Viscosity:** Basic commit hook throttling based on repo density and ignore counts.
- **Architectural Fog Prompt Debuff:** Automated addition of тройной-аудит context rules to LLM prompts when project health drops below threshold.

---

## [2.0.0] — 2026-04-15
### Added
- **Lute Flow Onboarding Engine:** Implemented Zero-Config scanners during CLI initialization (`npx captain-os init`), analyzing repository sizes and files instantly.
- **Interactive Gate Matrix:** A stunning console dashboard separating gates into **Hard Locked** (P0 Secrets, Core Lock validations) and **Soft Adaptive** (Notion Sync, UI style compliance, test density).
- **Adaptive Toggle CLI:** Added `--skip-adaptive` flag to quickly spin up bare-metal sandboxes bypassing soft gates for rapid prototyping.

---

## [1.5.0] — 2026-02-28
### Added
- **SimplifyCode Snapshot Engine:** Automated snapshotting of codebases before running refactoring cycles.
- **Mechanical Rollback:** Automatic git restore and state cleanup if test execution fails during a coding cycle.

---

## [1.0.0] — 2025-11-20
### Added
- **Quality Gate Core Runtime:** Launched the initial set of 13 Quality Gates protecting code health:
  - Secrets Leak Preventer (Gate 1)
  - Core Locks Validator (Gate 2)
  - Architectural Integrity Parser (Gate 3)
  - Custom Design System Token Auditor (Gate 10)
  - Environment/Routes Boundary Leakage Gate (Gate 12)
- **Pre-commit Automation:** Git hook integrations preventing bad commits locally before CI servers are reached.

---

## [0.1.0-local-p11a] — 2025-09-01
### Added
- **Initial CLI Prototype:** Basic project initialization and core gate validation shell.
