## Context

`export neo4j` currently requires `-i` and calls `collectAdocFiles`; `site-graph` and `seed` already harvest the full cross-source graph via `harvestSiteFiles` (see the archived changes). See proposal.md — Why.

## Goals / Non-Goals

**Goals:**
- Give `export neo4j` the same two-input-mode shape `seed` already has.

**Non-Goals:**
- Changing the Neo4j export format or `Neo4jExporter` itself.
- A combined "harvest + export" for any other command.

## Decisions

### 1. Mirror `seed`'s two-input-mode pattern
Add an optional `<playbook>` positional; `-i` takes precedence when both are given (same as `seed`). When a playbook is given, call `harvestSiteFiles(playbook)` and process each file with its component/module/version scope, then hand `extension.graph` to `Neo4jExporter` unchanged.
Rationale: one consistent CLI idiom, and `harvestSiteFiles` already does the multi-repo harvest without a build.

### 2. `-i` wins over a positional playbook
If both `-i` and `<playbook>` are present, use `-i` (local). Rationale: explicit option outranks positional; matches `seed`.

## Risks / Trade-offs

- [Scope drift] `harvestSiteFiles` pulls partials and every module; the exported graph is larger than a single-dir export → intended (that is the point).
- [Dependency] `harvestSiteFiles` lazily loads `@antora/*` modules and errors with a clear message when absent → already handled in `site-graph`.
