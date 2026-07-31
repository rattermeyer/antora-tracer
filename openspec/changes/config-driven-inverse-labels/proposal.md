# Proposal: Config-driven inverse relationship labels

## Problem
The `INVERSE_MAP` in `types.ts` hardcodes inverse labels for relationship types. When users define new relation types in their `traceability.yml` config (e.g., `leads-to`, `validates`), the `traceability:incoming[]` macro falls back to the raw type name — there's no way to define a user-friendly inverse label without editing TypeScript code.

This contradicts the extension's design philosophy: users should define their entire domain model in YAML.

## Solution
Move inverse label definitions into configuration. The built-in presets ship with the current INVERSE_MAP values. Users can override or extend them in their `traceability.yml`. The extension's `expandIncomingMacros()` looks up config first, then falls back to the compile-time `INVERSE_MAP`, then to the raw type name.

## What changes

### Configuration
- Add `inverseLabels` to each preset YAML
- Add `inverseLabels` to `examples/traceability.yml`

### Code
- `TraceabilityConfig.ts` — parse `inverseLabels` from config
- `antora-extension.ts` `expandIncomingMacros()` — lookup chain: config → INVERSE_MAP → raw type

### No changes to
- `types.ts` — INVERSE_MAP stays as compile-time fallback
- `DocumentParser` — labels don't affect parsing

## Scope
Configuration and one method. Fully backward compatible.
