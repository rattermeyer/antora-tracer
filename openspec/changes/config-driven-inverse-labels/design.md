# Design: Config-driven inverse relationship labels

## Decision
Add `inverseLabels` to the traceability configuration schema. Users define inverse display labels alongside their relation types in YAML. The extension's incoming macro expansion uses a three-level lookup: config → compile-time INVERSE_MAP → raw type name.

## Lookup chain

```
expandIncomingMacros() gets relation type "refines":
  1. config.inverseLabels["refines"]     → "refined-by"   (user-defined)
  2. types.ts INVERSE_MAP["refines"]     → "refined-by"   (compile-time default)
  3. raw type name                       → "refines"       (fallback)
```

## Config schema

```yaml
inverseLabels:
  refines: "refined-by"
  depends_on: "depends-on-by"
  addresses: "addressed-by"
  verifies: "verified-by"
  leads_to: "led-by"
```

## Code changes

1. `TraceabilityConfig` — add `inverseLabels?: Record<string, string>` to interface
2. `expandIncomingMacros()` — replace hardcoded `INVERSE_MAP[rel.type] || rel.type` with `configInvLabels?.[rel.type] ?? INVERSE_MAP[rel.type] ?? rel.type`
3. `examples/traceability.yml` — add `inverseLabels` section

No preset changes needed — users can add inverseLabels to their own config.
