# CLI Shell Completion Specification

## Purpose

Let users discover Antora Tracer CLI commands and options through native shell completion, and install the generated completion script without modifying their shell startup files.

## Requirements

### Requirement: Generate shell completion scripts
The CLI SHALL provide a `completion` command that emits a completion script to standard output for each supported shell: Bash, Zsh, and Fish.

#### Scenario: Generate a script for a supported shell
- **WHEN** a user runs `antora-tracer completion <shell>` with `bash`, `zsh`, or `fish`
- **THEN** the CLI writes a completion script for that shell to standard output
- **AND** the output is usable by that shell's completion mechanism

#### Scenario: Reject an unsupported shell
- **WHEN** a user requests completion for a shell other than Bash, Zsh, or Fish
- **THEN** the CLI reports the supported shells and exits unsuccessfully

### Requirement: Install shell completion scripts
The CLI SHALL provide an installation action that writes the selected shell's generated completion script to an appropriate completion directory for the current user.

#### Scenario: Install completion for a supported shell
- **WHEN** a user runs `antora-tracer completion install <shell>` with `bash`, `zsh`, or `fish`
- **THEN** the CLI writes the same script that generation would emit to that shell's completion directory
- **AND** reports the installed path and shell-specific activation steps
- **AND** does not modify shell startup files

#### Scenario: Installation destination is not writable
- **WHEN** the selected completion directory cannot be created or the script cannot be written
- **THEN** the CLI reports the failure and exits unsuccessfully
- **AND** does not report installation as successful

#### Scenario: Reject unsupported installation shell
- **WHEN** a user requests installation for a shell other than Bash, Zsh, or Fish
- **THEN** the CLI reports the supported shells and exits unsuccessfully

### Requirement: Document shell completion use
The CLI reference SHALL describe script generation, installation, and the activation steps printed by installation for Bash, Zsh, and Fish.

#### Scenario: User consults CLI reference
- **WHEN** a user reads the shell completion section of the CLI reference
- **THEN** they can determine how to generate a script, install it, and activate completions without startup files being edited automatically
