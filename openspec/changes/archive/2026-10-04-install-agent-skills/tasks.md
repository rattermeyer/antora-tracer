## 1. CLI behavior

- [x] 1.1 Add `skills install [harness...]` with validated `pi`, `claude`, and `codex` names; verify explicit multi-harness arguments bypass prompting and invalid names fail before writes.
- [x] 1.2 Add a readline multi-select for TTY invocation without arguments, select no harnesses by default, show existing destinations as hints, support comma-separated selections/`all`, and make blank input cancel; verify non-TTY invocation without names fails without writes.
- [x] 1.3 Resolve packaged skill source from the CLI package root and install all bundled skill directories to each selected harness's documented per-user destination, including Pi's `~/.agents/skills/`; verify missing destination parents are created and success output lists destinations.
- [x] 1.4 Preserve existing skill directories: prompt per conflict interactively unless `--overwrite` is set; skip conflicts by default without TTY, and replace only with explicit overwrite approval or `--overwrite`; verify existing user files remain unchanged when not approved.
- [x] 1.5 Honor global `--dry-run` without creating directories, prompting for overwrite, or changing files; verify output lists planned installs and conflicts.
- [x] 1.6 Report independent installed/replaced/skipped/failed outcomes and exit non-zero on filesystem failure; verify a partial multi-harness failure is not reported as full success.
- [x] 1.7 Explain that installing `@antora-tracer/core` as a Pi package already auto-discovers its skills; standalone Pi copies use `~/.agents/skills/`; verify the command explains both choices without editing Pi settings.

## 2. Tests

- [x] 2.1 Add CLI integration tests using isolated temporary HOME directories for supported destinations, multi-select parsing, invalid names, no-TTY behavior, dry-run, overwrite refusal/approval, and filesystem errors.
- [x] 2.2 Verify installed skill directories contain the same bundled skill files and that repeat installation never silently replaces existing content.

## 3. Documentation

- [x] 3.1 Document `antora-tracer skills install` in `examples/tracer/modules/ROOT/pages/reference/cli.adoc`, including interactive and explicit syntax, supported harnesses, overwrite safety, and `--dry-run`.
- [x] 3.2 Update `examples/tracer/modules/ROOT/pages/how-to/install-skills.adoc` and `README.md` to show interactive multi-select and scripted explicit harness selection; explain Pi package auto-discovery and destination behavior.
- [x] 3.3 Rebuild the example site with `pnpm exec antora antora-playbook.yml` and confirm install/CLI documentation renders.

## 4. Verification

- [x] 4.1 Run focused CLI install integration tests and the full `pnpm test` suite.
- [x] 4.2 Run Biome checks on changed TypeScript, tests, JSON, and documentation-adjacent code; verify all harness filesystem tests use isolated temporary homes.