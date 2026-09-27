## Why

The `antora-tracer` CLI has no shell completions, so users must remember command and option names or repeatedly consult `--help`. Generating and installing completions for Bash, Zsh, and Fish makes the existing command tree easier to discover directly in the shell.

## What Changes

- Add a `completion` command that generates a completion script for Bash, Zsh, or Fish and writes it to stdout.
- Add an installation action that writes the selected shell's generated script to its completion directory and prints shell-specific activation instructions.
- Do not modify shell startup files.

## Capabilities

### New Capabilities

- `cli-shell-completion`: Generate and install shell completions for the Antora Tracer CLI.

### Modified Capabilities

<!-- None. -->

## Impact

- `src/cli.ts`: expose completion generation and installation through the existing Commander CLI.
- `test/cli.test.ts` or a focused CLI test: verify generated scripts and installation behavior for supported shells.
- `examples/tracer/modules/ROOT/pages/reference/cli.adoc`: document generation, installation, and activation.
- Shell-specific completion destinations and activation instructions for Bash, Zsh, and Fish must be defined. Installation must not edit startup files.
- No dependency or existing command behavior changes are intended.
