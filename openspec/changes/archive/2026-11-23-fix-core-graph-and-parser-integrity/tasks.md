## 1. Graph Reconciliation

- [x] 1.1 Preserve inverse-pair provenance when canonicalized relationships are rebuilt.
- [x] 1.2 Add regression coverage for reverse-authored links parsed from separate scoped documents.

## 2. Verification

- [x] 2.1 Run the focused regression test and production build.
- [x] 2.2 Run broader validation; the full suite reports one 2-second CLI-test timeout that passes in isolation, and the Antora build is unavailable because `asciidoctor` is missing.
- [x] 2.3 Confirm existing architecture documentation already describes the restored deduplication behavior.
