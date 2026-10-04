# Agent Skill Installation Specification

## Purpose

Let users install Antora Tracer's bundled agent skills into one or more supported harnesses through an interactive or scriptable CLI command, while protecting existing user-installed files.

## Requirements

### Requirement: Select one or more harnesses interactively
The CLI SHALL provide `antora-tracer skills install` and, when no harness arguments are given in an interactive terminal, SHALL present a multi-select list of supported harnesses and allow the user to confirm one or more selections before installation.

#### Scenario: User selects multiple harnesses
- **WHEN** the user invokes `antora-tracer skills install` interactively and selects Claude Code and Codex
- **THEN** the CLI installs the bundled skills for both selected harnesses and reports each outcome separately

#### Scenario: User selects no harnesses
- **WHEN** the user submits the selection with no harness selected
- **THEN** the CLI makes no changes and reports that no harnesses were selected

#### Scenario: Selection cancelled
- **WHEN** the user cancels the interactive selection
- **THEN** the CLI makes no filesystem changes

### Requirement: Explicit harness arguments support scripted installs
The CLI SHALL accept one or more explicit harness names (`pi`, `claude`, or `codex`) so installations can run without an interactive prompt. It SHALL reject unsupported names before writing any harness destination.

#### Scenario: Explicit multiple harnesses
- **WHEN** the user runs `antora-tracer skills install claude codex`
- **THEN** the CLI attempts installation for exactly those harnesses and does not prompt for selection

#### Scenario: Unsupported harness name
- **WHEN** any supplied harness name is unsupported
- **THEN** the CLI reports the supported names, exits unsuccessfully, and makes no installation changes

#### Scenario: No interactive terminal and no harness arguments
- **WHEN** the user invokes the command without harness arguments where stdin is not a TTY
- **THEN** the CLI reports that explicit harness names are required and makes no changes

### Requirement: Install all bundled skills to per-user destinations
For Claude Code and Codex, the CLI SHALL install each bundled skill directory into the harness's per-user skill directory, creating the destination parent when necessary. For Pi, the CLI SHALL install standalone skills to Pi's documented `~/.agents/skills/` directory and SHALL explain that package installation is the recommended auto-discovery option.

#### Scenario: Claude Code destination
- **WHEN** Claude Code is selected
- **THEN** the CLI targets `<home>/.claude/skills/`

#### Scenario: Codex destination
- **WHEN** Codex is selected
- **THEN** the CLI targets `<home>/.codex/skills/`

#### Scenario: Pi standalone destination
- **WHEN** Pi is selected for standalone skill installation
- **THEN** the CLI targets `<home>/.agents/skills/` and explains the `pi install npm:@antora-tracer/core` alternative

#### Scenario: Destination does not exist
- **WHEN** a supported harness destination does not yet exist
- **THEN** the CLI creates the destination and installs the selected skills there

### Requirement: Preserve existing installed skills unless replacement is approved
The CLI SHALL NOT silently replace an existing destination skill directory. It SHALL identify conflicts and request explicit overwrite approval before replacing any existing skill content. In non-interactive mode without explicit overwrite authorization, conflicts SHALL be skipped and reported without modifying them.

#### Scenario: Existing skill without overwrite approval
- **WHEN** a destination already contains an Antora Tracer skill directory and the user has not approved replacement
- **THEN** the CLI leaves that directory unchanged and reports it as skipped

#### Scenario: Existing skill with overwrite approval
- **WHEN** an existing destination skill is found and the user explicitly approves overwrite
- **THEN** the CLI replaces that skill with the bundled version and reports the replacement

#### Scenario: Mixed new and existing skills
- **WHEN** some destination skills exist and others do not
- **THEN** the CLI installs non-conflicting skills and separately reports conflicts, without claiming skipped files were installed

### Requirement: Dry run previews selected installation actions
The command SHALL honor the global `--dry-run` flag, listing selected harnesses, destination paths, new installs, and existing-skill conflicts without creating directories, prompting for overwrite approval, or modifying files.

#### Scenario: Dry run with missing destination
- **WHEN** a selected harness destination does not exist and `--dry-run` is enabled
- **THEN** the CLI reports the destination and skills it would install without creating the directory

#### Scenario: Dry run with existing skill
- **WHEN** one or more target skill directories already exist and `--dry-run` is enabled
- **THEN** the CLI reports those conflicts and performs no writes or overwrite prompts

### Requirement: Installation errors are reported per harness
The CLI SHALL report each selected harness's destination and installation result. If a destination cannot be created or written, it SHALL report failure and exit unsuccessfully, without presenting that harness as successfully installed.

#### Scenario: One selected harness destination is unwritable
- **WHEN** installation to one selected harness fails because of filesystem permissions
- **THEN** the CLI reports that harness as failed, reports other harness outcomes truthfully, and exits unsuccessfully
