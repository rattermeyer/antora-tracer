## Context

The CLI already has `completion install` with per-user path resolution, recursive directory creation, write-error handling, and a no-write global `--dry-run`. It also has a readline-based single-line prompt. `package.json` publishes `skills/` and declares `./skills` as a Pi package resource, so the installer can locate bundled skills relative to the CLI package root without adding dependencies.

## Goals / Non-Goals

**Goals:**
- Provide an interactive multi-select when invoked without harness arguments in a TTY, and explicit harness arguments for scripts.
- Install all packaged skill directories into supported harness destinations under the selected home directory.
- Preserve existing skill directories by default; require explicit overwrite approval and accurately report partial results.
- Preview intended writes and conflicts under global `--dry-run`.
- Treat Pi package installation as an alternative that may already provide the same skills.

**Non-Goals:**
- Do not edit `.pi/settings.json`, shell startup files, project configuration, or package-manager settings.
- Do not invoke `pi install` or any external executable.
- Do not sync/uninstall skills or add per-skill selection in the initial command.
- Do not add a prompt/TUI dependency.

## Decisions

**Command shape: `skills install [harness...]`.**
With no names in a TTY, show a numbered multi-select prompt with no harnesses selected by default. Display whether each destination exists as a hint. Accept comma-separated selections and `all`; a blank response cancels without changes. When names are provided, skip the selector; reject unknown names before any write. With no names and no TTY, fail with usage directing the user to pass names.

**Harness paths are fixed per-user paths.**
Use `homedir()` and support Pi → `.agents/skills`, Claude Code → `.claude/skills`, and Codex → `.codex/skills`. The `.agents/skills` path is Pi's documented user-level Agent Skills directory. Stage/copy bundled skill directories; do not ask for arbitrary destinations. This avoids path traversal and harness-specific path configuration in v1.

**Pi package integration is explanatory, not an automatic external install.**
The package already declares `pi.skills: ["./skills"]`; installing Antora Tracer through `pi install npm:@antora-tracer/core` exposes the skills automatically. If `pi` is explicitly selected here, install standalone copies into `~/.agents/skills/`. Do not invoke `pi install` or edit Pi settings.

**No overwrite by default; explicit confirmation per conflict.**
Check each `<destination>/<skill-name>` before writing. In interactive mode prompt individually for conflicts; on approval replace only that skill directory. In non-interactive mode, skip conflicts unless an explicit `--overwrite` option is present. Stage a fresh copy in a sibling temporary directory before replacing an existing directory, and clean it up on errors. Report installed, replaced, skipped, and failed skills separately; any failure makes the command exit non-zero.

**Dry run is read-only.**
Resolve the selected harnesses, detect destinations and conflicts, and list planned actions without mkdir, copying, overwrite prompts, or writes.

## Risks / Trade-offs

- [Harness conventions may change] → Keep destinations in one small mapping and document them; future harnesses require an explicit supported entry.
- [Copying creates stale per-user snapshots] → Match current Claude/Codex guidance; Pi package users should prefer package auto-discovery, which the CLI explains.
- [Overwrite can remove user edits] → Never overwrite silently; ask per existing skill or require `--overwrite` in non-interactive mode, and stage the replacement before swapping.
- [Partial install across harnesses] → Report each outcome and non-zero exit on any failure; do not roll back successful installs in other harnesses.