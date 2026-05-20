# Runtime Adapter Contract

All runtimes use the same adapter shape.

```yaml
runtimeId: codex | claude-code | gemini-coding
ownerRegistryId: captain-codex | captain-claude | captain-gemini
instructionEntrypoint: AGENTS.md | CLAUDE.md | GEMINI.md
captainEligibility: primary | secondary | crew_only | disabled
defaultRole: captain | read_only_judge | worker
capabilities: {}
constraints: {}
captainOsHooks: {}
handoff: {}
```

Capability absence does not lower acceptance. The runtime must hand off or block final claim when it cannot gather required evidence.
