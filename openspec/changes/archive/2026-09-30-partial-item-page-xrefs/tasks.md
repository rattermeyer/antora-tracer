## 1. Partial Target Discovery

- [x] 1.1 Define the internal partial-target record and index it by component, version, module, and normalized partial path.
- [x] 1.2 Scan classified page contents for partial includes and retain including page source path and published URL.
- [x] 1.3 Preserve partial source provenance and existing component/module/version metadata when processing graph items.

## 2. Link Generation

- [x] 2.1 Resolve partial relationship targets in `buildXref` to qualified Antora xrefs with explicit item anchors.
- [x] 2.2 Pass shared partial-target resolution into `LinkResolver` for generated HTML matrix and attachment links.
- [x] 2.3 Preserve safe fallback behavior when no including page is discoverable.
- [x] 2.4 Handle multiple including pages deterministically without changing graph node identity.

## 3. Verification and Documentation

- [x] 3.1 Add extension regression coverage for `xref:tracer:ROOT:self-traceability/use-cases#UC-007[UC-007]`.
- [x] 3.2 Add `LinkResolver` regression coverage for `/tracer/stable/self-traceability/use-cases.html#UC-007`.
- [x] 3.3 Rebuild the example site in Devbox and browser-check the served UC-007 link.
- [x] 3.4 Run the affected tests and TypeScript/format checks.
