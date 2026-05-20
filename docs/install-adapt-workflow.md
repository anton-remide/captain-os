# Install And Adapt Workflow

Captain OS installs as a managed block and local manifest, not as a replacement for project rules.

Flow:

1. `captain-os init --dry-run`
2. Review created files and patched managed blocks.
3. `captain-os init --apply`
4. `captain-os doctor`
5. Run host project smoke/gates.

The host project keeps:

- `AGENTS.md`, `CLAUDE.md`, `GEMINI.md`;
- `.captain-os/project.yaml`;
- `.captain-os.lock.json`;
- `.ship/lab/runs`;
- `.ship/repair-ledger.json`;
- `.brain`.
