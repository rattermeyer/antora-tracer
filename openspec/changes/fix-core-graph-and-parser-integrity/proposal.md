## Why

In 0.30.0, scoped relationships whose targets are resolved only after parsing can be canonicalized into the same edge while validation still reports the reverse-authored pair as a duplicate. Valid links authored from both sides must remain one bidirectional relation without a validation error.

## What Changes

- Preserve inverse-authoring provenance when canonicalized relationships are rebuilt.
- Add regression coverage for reverse relations parsed from separate scoped documents.

## Capabilities

### New Capabilities
- `relationship-canonicalization`: Valid inverse-authored relations collapse to one canonical edge after endpoint resolution.

### Modified Capabilities

None.

## Impact

- `src/TraceabilityGraph.ts` relationship merge behavior.
- Graph tests for scoped, cross-document relationships.
