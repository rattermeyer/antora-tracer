## 1. Generate completion scripts

- [x] 1.1 Implement `completion <shell>` using the registered CLI command tree for Bash, Zsh, and Fish; verify each command emits a usable shell-specific script and unsupported shells fail with supported-shell guidance.
- [x] 1.2 Keep generation shared with installation; verify both paths produce identical script content for each supported shell.

## 2. Install completions

- [x] 2.1 Install generated scripts to the designed per-user Bash, Zsh, and Fish completion locations; verify the destination file content matches generated output and success output includes its path and activation steps.
- [x] 2.2 Verify installation creates missing destination directories, fails clearly on filesystem errors, and never edits shell startup files.

## 3. Document and verify CLI usage

- [x] 3.1 Document generation, installation, destination locations, and shell activation steps in the CLI reference; verify examples and instructions match command behavior.
- [x] 3.2 Run focused CLI completion checks, validate generated Bash and Zsh script syntax, and build the example site from a temporary Git checkout; verify completions and updated reference work end to end.
