<!-- captain-os-managed:start -->
## Captain OS Adapter

Claude reads `.captain-os/project.yaml` and `.captain-os/runtime-adapters.yaml`.

Default role: peer captain in direct Claude sessions, read-only reviewer when packeted by another captain.

Rules:
- Write simple and minimalist code from the start (KISS): change/add minimum lines, add minimum functions, completely leveraging RAG context and narrow splash radius.
- Pre-existing (old) files in task splash radius must NOT be refactored or simplified without explicit operator consent (Conscious Agreement).
- New files written during the task can be simplified and optimized automatically to ideal functionality without consent.
- Run final global LTO pass before branch merge.

Evidence stays in the host project. Do not lower acceptance when capability is missing; hand off.

Use a compact Captain OS checklist for Tier 2+ work and label crew as `local gate`, `subagent`, `external runtime`, or `not required`.
<!-- captain-os-managed:end -->
