<!-- captain-os-managed:start -->
## Captain OS Adapter

Project manifest: `.captain-os/project.yaml`
Runtime adapter: `.captain-os/runtime-adapters.yaml`
Evidence path: `.ship/lab/runs`
Global blocking: disabled by default

Rules:
- Write simple and minimalist code from the start (KISS): change/add minimum lines, add minimum functions, completely leveraging RAG context and narrow splash radius.
- Pre-existing (old) files in task splash radius must NOT be refactored or simplified without explicit operator consent (Conscious Agreement).
- New files written during the task can be simplified and optimized automatically to ideal functionality without consent.
- Under dynamic captain mode, the active LLM runs final global link-time optimization (LTO) before branch merge.

Use a compact Captain OS checklist for Tier 2+ work:

```text
Captain OS: T?/D? shadow|advisory
✓ intent classified
✓ context pack attached
✓ splash radius attached
✓ crew: Captain local; Runtime local gate; StarPom local gate
✓ evidence: <run/report path or ->
✓ stops checked
---
```
<!-- captain-os-managed:end -->
