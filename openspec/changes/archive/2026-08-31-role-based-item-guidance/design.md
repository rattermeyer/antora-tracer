## Context

The traceability config (`TraceabilityConfig`) defines `roles` as a plain string list and `relations`/`matrices`/`labels`/`extends`, but carries no per-role authoring guidance. Item-writing guidance lives hardcoded in the `requirements-writing` and `use-case-engineering` skills, which re-discover the project's model by grepping `.adoc` files. Custom roles receive no guidance, and guidance cannot be customized per project.

## Goals / Non-Goals

**Goals:**
- Make per-role item authoring guidance data-driven (config + AsciiDoc), customizable per project.
- Ship default guidance with the presets.
- Render the guidance into the consuming site as human-facing docs.
- Give the agent a deterministic way to resolve guidance (a CLI command).

**Non-Goals:**
- Not changing the item block syntax, roles semantics, or the graph.
- Not automating ID assignment beyond the existing `next-id` command.
- Not making `idPrefix` authoritative — it stays a fallback.

## Decisions

### D1: Additive `roleGuidance` section

```yaml
traceability:
  roles: [requirement, design, test]
  roleGuidance:
    requirement:
      page: guidance/requirement.adoc
      idPrefix: REQ
```

`roles` stays `string[]`. `roleGuidance` is a new parallel map merged through `extends:`.

*Alternative considered:* change `roles` to a map of objects — rejected, breaks every existing config.

### D2: Guidance is an AsciiDoc page, defaults ship with the preset

A role's guidance is a full AsciiDoc page (description, writing rules, template, checklist), not a YAML string. Default pages live beside the preset (e.g. `src/presets/guidance/`) and are copied into the published package. Resolution order: a project-local page referenced by its own `roleGuidance` wins; otherwise the preset's shipped page is used.

*Alternative considered:* encode guidance as YAML multiline strings — rejected, EARS/Wiegers content is prose-heavy and unreadable as YAML.

### D3: `idPrefix` is a fallback, not an authority

The agent derives the ID prefix and item placement from the project's existing items first; it falls back to `roleGuidance.<role>.idPrefix` only when context is silent, and asks the user when neither is available.

*Alternative considered:* treat `idPrefix` as authoritative — rejected, it would ignore existing project conventions.

### D4: CLI resolution (`role-guidance <role>`)

A new `antora-tracer role-guidance <role>` command resolves the guidance through the `extends` chain and outputs the resolved page path, the resolved `idPrefix`, and the page content. The agent calls this instead of re-deriving config resolution.

*Alternative considered:* the skill reads `traceability.yml` and follows the pointer itself — rejected, it re-implements preset merging and shipped-default path resolution.

### D5: Render via content-catalog registration

The extension registers resolved guidance pages into the content catalog at build time, the same mechanism used for generated matrices and the overview. A project on a default preset gets the guidance rendered without copying files; an override page simply wins.

*Alternative considered:* require projects to copy guidance pages into their own content sources — rejected, it reintroduces a manual step and drift.

### D6: Existing skills become default guidance content

`requirements-writing` (EARS) and `use-case-engineering` (Wiegers) become the shipped default guidance pages for `requirement` and `use_case`. A single generic `write-item` skill consumes resolved guidance.

## Risks / Trade-offs

- [Risk: the default guidance pages drift from the old skills during migration] → Mitigation: convert skill content verbatim first, then evolve.
- [Risk: registering guidance pages into the catalog could collide with a project page of the same path] → Mitigation: resolve project-local first; register only the resolved default page under a namespaced attachment path.
- [Risk: `role-guidance` output is large if it dumps full page content] → Mitigation: output path + idPrefix by default, content only with a `--content` flag.
- [Risk: shipped guidance pages are not in the npm `files` list] → Mitigation: add the guidance directory to `files` and verify the published tarball.

## Migration Plan

1. Add `roleGuidance` to the config schema, parsing, and `extends` merge.
2. Convert the two skills' content into default guidance pages under `src/presets/guidance/`.
3. Add the `role-guidance <role>` CLI command.
4. Register guidance pages into the content catalog at build time.
5. Add the `write-item` skill; keep the old skills until the guidance pages are proven equivalent.
6. Update docs and the example site; rebuild and verify.

## Open Questions

- Exact registered path/namespace for rendered guidance (e.g. `attachment$guidance/<role>.adoc` vs a `guidance` module).
- Whether the old `requirements-writing` / `use-case-engineering` skills are retired immediately or kept for a transition window.
