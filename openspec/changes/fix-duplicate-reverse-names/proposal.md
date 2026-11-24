## Why

`validate` accepts a configuration where two relations declare the **same `reverse` name**, and `TraceabilityConfig.getInverseType()` then resolves that name to whichever primary it finds first while iterating the relations map. So a reverse-direction lookup depends on declaration order, and the shadowed relation's reverse can never be resolved. Any reverse-direction matrix cell or rendered link label keyed on the reverse name is misattributed, with no error and no warning.

A project extending a preset naturally reaches for a reverse name the preset already owns (the presets define 87 distinct relation names), so the collision is easy to hit.

## What Changes

- `validateConfig` reports an error when two relations in the merged configuration declare the same `reverse` name but a **different** primary — the case that makes resolution order-dependent.
- Verbatim reuse of the same `(primary, reverse)` pair across role pairs stays allowed, since it resolves unambiguously and is already used by the presets.
- `getInverseType` is unchanged: with conflicting reverses rejected, its first-match scan is no longer ambiguous.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities
- `preset-inheritance`: configuration validation rejects a relation set whose reverse names are ambiguous.

## Impact

- `src/config/TraceabilityConfig.ts` — `validateConfig`, in the relations loop.
- `test/config-loader.test.ts` — a regression test.
- No preset, graph, or API change.
