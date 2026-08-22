## 1. Config schema

- [x] 1.1 In `src/config/TraceabilityConfig.ts`, change `relations` from `Record<role, Record<role, string[]>>` to `Record<role, Record<role, Record<type, { reverse: string }>>>`
- [x] 1.2 Add `labels?: Record<string, string>` replacing `inverseLabels`, with updated doc comment (display-only)
- [x] 1.3 Validate: every relation type has a mandatory `reverse`; reject a reverse value that collides with a primary key elsewhere (unless self-reverse); reject a missing reverse with an error naming the type
- [x] 1.4 Build a reverse→primary index (`reverse → { primary, sourceRole, targetRole }`) at config load for canonicalization and allowance lookups

## 2. Validation

- [x] 2.1 Extend `isRelationAllowed` to allow a type that is the reverse of a relation declared in the opposite direction
- [x] 2.2 `getAllowedRelations` reports the primary type for the reverse direction (or returns the derived reverse), so warnings list sensible allowed values

## 3. Graph canonicalization

- [x] 3.1 Delete `INVERSE_MAP` and `PRIMARY_MAP` from `src/types.ts` and remove their usages
- [x] 3.2 In `src/TraceabilityGraph.ts`, replace `_resolveInverseType`'s `inverseLabels`/`INVERSE_MAP` lookups with the reverse→primary index
- [x] 3.3 In `addRelationship`, canonicalize a reverse-authored edge (swap fromId/targetId, rename type to primary) before storage; dedupe an already-present canonical edge by marking `bidirectional: true` (first-writer-wins)

## 4. Display labels

- [x] 4.1 Add a `humanize(type)` helper (underscore → space, title-case)
- [x] 4.2 Replace incoming-display `inverseLabels` lookups with `labels[type] ?? humanize(type)`, and use the reverse type's label for the incoming side
- [x] 4.3 Ensure matrix headers, link lists, and graph labels all use `labels`/`humanize`

## 5. Migrate presets and example config

- [x] 5.1 Migrate `src/presets/requirements-engineering.yml` to keyed+reverse (choose reverse names: `addresses↔addressed_by`, `validated_by↔validates`, `verifies↔verified_by`, `refines↔refined_by`, `depends_on↔is_prerequisite_of`, `conflicts_with↔conflicts_with`) and move `inverseLabels` → `labels`
- [x] 5.2 Migrate `src/presets/agile.yml`, `medical-iec62304.yml`, `minimal.yml` the same way
- [x] 5.3 Repair and migrate `examples/traceability.yml` (restore `relations:` header, add reverses for `leads_to↔is_derived_from`, `considers↔considered_by`, fix matrices' `coverageRelations` to canonical types)

## 6. Tests

- [x] 6.1 Config: keyed+reverse parsing, mandatory-reverse validation error, self-reverse, reverse-collision rejection
- [x] 6.2 `isRelationAllowed`: reverse type allowed, unrelated type rejected
- [x] 6.3 Graph: reverse-authored edge canonicalizes to primary; double-authoring dedupes with `bidirectional`; same-type cycle not merged
- [x] 6.4 Matrix: reverse-authored link counted against `coverageRelations` of the canonical type
- [x] 6.5 Labels: `labels` override used; `humanize` default; incoming view uses reverse label

## 7. Documentation

- [x] 7.1 `reference/configuration.adoc` — document keyed `relations` + mandatory `reverse`, `labels` (display-only), remove `inverseLabels` references
- [x] 7.2 `reference/presets.adoc` — update preset relation tables to the reverse form
- [x] 7.3 `reference/traceability-macros.adoc` — update incoming-display wording to `labels`
- [x] 7.4 `how-to/custom-domain-model.adoc` — update the `extends`/relations examples to keyed+reverse
- [x] 7.5 Rebuild the example site and regenerate matrices to verify self-traceability
