## Why

Antora Tracer publishes reusable agent skills, but users must follow separate manual steps for each harness and remember each harness's personal install location. A CLI installer can make choosing and installing skills to multiple supported harnesses consistent while preserving the existing Pi package integration and protecting user-installed skills from silent replacement.

## What Changes

- Add `antora-tracer skills install` with an interactive multi-select prompt when no harness is specified.
- Accept explicit harness arguments (`pi`, `claude`, `codex`) for non-interactive and scripted installation.
- Install the packaged skills to each selected harness's documented per-user skill directory and report the destination and result.
- Treat `pi install npm:@antora-tracer/core` as Pi's recommended package-auto-discovery path; when `pi` is explicitly selected for standalone installation, copy skills to Pi's documented `~/.agents/skills/` directory.
- Do not silently overwrite existing skill directories; report conflicts and require explicit overwrite approval before replacing files.
- Support `--dry-run` and handle missing destination directories, permissions errors, and unavailable harnesses without partial-success claims.
- Update the CLI reference, skill installation how-to, and CLI tests.

## Capabilities

### New Capabilities
- `agent-skill-installation`: The CLI interactively selects one or more agent harnesses or accepts explicit harness arguments, installs bundled skills to their per-user locations, preserves existing data unless replacement is explicitly approved, and reports results.

### Modified Capabilities
- `cli-shell-completion`: None. This change adds a separate skill installer command and does not alter shell completion behavior.

## Impact

- `src/cli.ts`: add `skills install`, selection prompt, supported destinations, and safe installation behavior.
- `test/cli.test.ts` or a focused CLI test file: verify selection, dry-run, conflicts, and filesystem failures.
- `examples/tracer/modules/ROOT/pages/reference/cli.adoc`: document command and options.
- `examples/tracer/modules/ROOT/pages/how-to/install-skills.adoc`: document interactive and scripted install modes, including Pi's existing package auto-discovery.
- No dependency additions; use Node.js filesystem and readline APIs already present.