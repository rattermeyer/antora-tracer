# Proposal: Reconcile Requirements-to-Design Coverage

## Why

After the requirements reconciliation (replacing the legacy 59-item requirements.adoc with 67 spec-backed REQ items), the self-traceability matrix shows only 30.1% requirements-to-design coverage. Three ARC items describe real behavior but have no spec requirements to address. Most uncovered REQs can be addressed by existing ARC items — they just need `addresses:` links. The remaining gaps need new architecture concepts.

## What

1. **Three new specs** (already created in `openspec/specs/`): `matrix-attachment-sync`, `circular-reference-detection`, `partial-file-processing` — each covering tested, active behavior that was previously spec'd only in archived changes.

2. **Three new REQ items** (REQ-108..110) in `requirements.adoc` for the new specs.

3. **`addresses:` links** added to existing ARC items for ~29 uncovered REQs, mapping each REQ to the ARC item that owns the implementing component.

4. **Four new ARC items** (ARC-030..033) for capability areas with no existing architecture concept: CI/CD PDF pipeline, landing page, Lunr search indexing, and example site patterns.

5. **Two new ADRs** (ADR-006, ADR-007) capturing architecture decisions for circular reference detection and partial file processing.

6. **Tests for partial file processing** — ARC-029's behavior is currently untested.

## Outcome

- 70 REQ items (67 + 3 new), all backed by `openspec/specs/`
- 26 ARC items (22 + 4 new), all with `addresses:` links to REQs
- ~100% requirements-to-design coverage (up from 30.1%)
- 0 orphaned ARC items
- 8 ADRs total (5 existing + 2 new + 1 for the new ARC concepts)
