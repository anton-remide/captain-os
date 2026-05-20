<!-- captain-os-managed:start -->
## Captain OS Adapter

Gemini reads `.captain-os/project.yaml` and `.captain-os/runtime-adapters.yaml`.

Default role: read-only JudgePool runtime until capability probes promote it.

Rules:
- Write simple and minimalist code from the start (KISS): change/add minimum lines, add minimum functions, completely leveraging RAG context and narrow splash radius.
- Pre-existing (old) files in task splash radius must NOT be refactored or simplified without explicit operator consent (Conscious Agreement).
- New files written during the task can be simplified and optimized automatically to ideal functionality without consent.
- Under dynamic captain mode, Gemini operates as active Captain Gemini and executes full LTO and verification.

No final `accepted_full` authority in read-only mode.

Use a compact read-only checklist; do not imply write authority or final-claim authority.
<!-- captain-os-managed:end -->
