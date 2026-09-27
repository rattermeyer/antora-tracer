## Context

See `proposal.md` for motivation. The CLI uses Commander in `src/cli.ts` and registers commands centrally. Completion scripts must track that command tree without introducing a separately maintained list.

## Goals / Non-Goals

**Goals:**

- Generate usable completion scripts for Bash, Zsh, and Fish from the CLI's registered commands and options.
- Share script generation between stdout output and installation so both paths stay equivalent.
- Install into per-user shell completion locations and print the path plus activation guidance, without editing startup files.

**Non-Goals:**

- Completion of project-specific item IDs, paths, or configuration values.
- Automatic shell startup-file modification or global/system-wide installation.
- Adding completion support for shells other than Bash, Zsh, and Fish.

## Decisions

- Build scripts from the existing Commander command tree so registered subcommands and options remain the source of truth. Prefer Commander-supported completion generation if the installed version provides it; otherwise use the smallest compatible mechanism rather than maintaining command lists manually.
- Use one internal shell-to-script generation path. The `completion <shell>` action writes its result to stdout; `completion install <shell>` writes that same result to the selected destination.
- Keep installation per-user, creating the destination directory when needed. Use conventional shell-specific locations: Bash under `~/.local/share/bash-completion/completions/antora-tracer`, Zsh under `~/.zfunc/_antora-tracer`, and Fish under `~/.config/fish/completions/antora-tracer.fish`.
- Print activation guidance after successful installation. For Bash, source the installed completion file now and add the printed `source` command to `~/.bashrc` for future sessions. For Zsh, add `~/.zfunc` to `fpath` before `compinit`; Fish loads files in its completions directory automatically. Do not execute or persist activation changes.
- Reject unsupported shell names with a non-zero exit and a message listing the supported shells. Report filesystem failures as errors and do not print a success message unless the file was written.

## Risks / Trade-offs

- Bash and Zsh completion discovery varies by distribution and user configuration. Printing explicit activation guidance avoids mutating startup files but may require a user to choose the applicable setup.
- Completion generation may not be built into the installed Commander version. Confirm its actual API before implementation; adding a completion dependency is a fallback only if no suitable built-in support exists.
- Conventional directories are not universal. A custom destination override remains an option if users need nonstandard or system-wide layouts; it is not part of the initial scope.
