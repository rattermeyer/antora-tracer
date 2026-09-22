## Context

The extension's `registerContentClassifier` pulls every `.adoc` page and partial from the whole content catalog across all components, filtering only on the `.adoc` extension. All downstream work — version grouping, graph parsing, macro expansion, and generated-attachment registration — is derived from those two file lists (`adocFiles`, `adocPartials`), so a single filter at that point excludes a component end to end. `file.src.component` is already available and already captured onto every item (`DocumentParser`, `GraphDiff`, `GraphSnapshot`).

The CLI has a parallel harvest path: `SiteGraph.harvestSiteFiles` builds the playbook and content catalog itself and returns `HarvestedFile[]` (with `component`), which `export neo4j`, `seed`, and `site-graph` feed into the parser. The extension already locates its own playbook entry via a `require`-match in `loadConfig()`.

See `proposal.md` for motivation.

## Goals / Non-Goals

**Goals:**

- Add `excludeComponents: string[]` to the extension config and filter excluded components out of the graph at one choke point.
- Keep the graph produced by CLI playbook harvest identical to the build's graph.
- Preserve existing pending-target semantics for references into excluded components.

**Non-Goals:**

- Module, version, or path/glob matchers — component names only.
- Allowlist mode (`includeComponents`).
- Stub target items, or suppressing the resulting "pending target" warnings.
- Affecting Antora's own rendering or xref resolution of excluded components — they still publish and cross-link normally; only traceability processing is skipped.

## Decisions

### 1. Exclusion lives in the extension config, not `traceability.yml`

Component/module are Antora concepts; `TraceabilityConfig` is deliberately Antora-agnostic and is consumed by CLI directory scans that have no component concept. The playbook already declares which sources exist, so the denylist belongs with whoever edits sources. This also matches the in-repo precedent of `antora-vale-extension`'s `exclude` key.

**Alternative considered:** `TraceabilityConfig.excludeComponents` — rejected: leaks Antora concepts into a config shared with component-less CLI paths, and mixes build scoping into the domain model.

### 2. Filter once in `registerContentClassifier`, not per file

Apply `!excludeComponents.includes(file.src?.component)` to `adocFiles` and `adocPartials` immediately after the `.adoc` filter, before `groupByVersion`. Because `allModules`, `versionComponents`, and every per-component loop are derived from those lists, excluded components automatically get no graph parsing, no macro expansion, and no matrix/overview/guidance attachment registration.

**Alternative considered:** a guard inside `processAsciiDocFile` — rejected: macro expansion and attachment registration iterate the file lists directly, so a per-file guard would leave excluded components still rewritten and still receiving generated attachments.

### 3. Hard-exclude, no stub fabrication

Excluded items never enter the graph. A relationship macro in an included doc whose target lives only in an excluded component stays a "pending target" warning (`TraceabilityGraph` already emits and tracks these), exactly as if the target were never defined. No new stub machinery.

**Alternative considered:** auto-create stub target nodes so incoming edges resolve — rejected: stubs have no role/status/title and would surface as ghost matrix rows; the user's requirement is that excluded content be *absent*, not ghosted.

### 4. Exact-name denylist matching

`excludeComponents` entries match the Antora component name exactly (`file.src.component === name`). No glob, no substring. Component names are named entities, so glob support is speculative.

**Alternative considered:** glob or substring matching (as vale does) — rejected as YAGNI; can be widened later without redesigning the filter since it is one predicate.

### 5. One shared playbook-entry lookup, reused by extension and CLI

`SiteGraph.harvestSiteFiles` already holds the parsed playbook. It will read `excludeComponents` from the playbook's antora-tracer extension entry — reusing the same entry-lookup predicate as `loadConfig` — and filter `files` before returning, so CLI callers stay unchanged. The predicate is factored into one small shared helper to keep the `require`-match list (two known paths plus the `includes("antora-tracer")` / name fallbacks) in a single place rather than drifting across two files.

**Alternative considered:** passing `excludeComponents` as a parameter from each CLI caller — rejected: each caller would then have to reproduce the playbook-entry lookup, duplicating the match list.

## Risks / Trade-offs

- **[Included doc references an excluded item]** → the relationship becomes a "pending target" warning at build time. This is correct (the item is genuinely absent) and intentionally not suppressed; documented in the macros reference.
- **[Match-list drift]** → mitigated by decision 5 (single shared predicate).
- **[Component renamed in `antora.yml`]** → the denylist entry silently stops matching. Acceptable: the component name is the contract; the playbook is edited by the same person who names sources.
- **[Excluded and included components sharing a version]** → safe: filtering happens before `groupByVersion`, so version maps and per-version loops never see the excluded component.

## Migration Plan

- Default `excludeComponents` is `[]`, so existing sites are unchanged.
- No data migration: the graph is rebuilt per build/harvest; nothing is persisted from excluded components.
- Rollback is dropping the config key; no schema or format change.

## Open Questions

None — the deferred items (module/path matchers, allowlist) are recorded non-goals that would not change the specs or task breakdown.
