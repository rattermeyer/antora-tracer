## Why

A full code review of the extension surfaced duplicated logic (~210 lines of nearly identical macro-expansion code across three methods), a latent async-initialization race, production `console.log` noise, and a broken regex that stopped old-macro detection from firing. These issues are internal quality/maintainability problems with one observable bug (old-macro deprecation errors/warnings no longer fire correctly).

## What Changes

- Consolidate `expandOutgoingMacros`, `expandIncomingMacros`, and `expandLinksMacros` into a single `expandRelationMacros(file, macroName)` method with shared group-building helpers. Removes ~210 net lines of duplication. **No behavior change** to macro rendering.
- Make extension initialization synchronous so event handlers are registered only after the traceability graph is ready, eliminating a race where an early `contentClassified` event could bypass processing.
- Replace per-item/per-file production `console.log` noise in `RequirementsTraceabilityExtension` with an injectable `TracerLogger` that defaults to a no-op. The Antora extension threads its real logger through. **No behavior change** to processing output.
- Fix the `checkForOldMacros` regex: the pattern `[${macro}(,s*|s).?]` was a character class matching stray single characters in prose instead of old macro syntax. It now correctly matches `[req, ...]`, `[req ...]`, and `[req]`, restoring the intended deprecation error/warning generation for non-verbatim content.

## Capabilities

### New Capabilities
- `old-macro-detection`: Documents the deprecation error/​warning behavior for legacy macro syntax (`[req]`, `[imp]`, `[test]`, `[doc]`, `[design]`). This behavior existed in the archived `unified-item-macro` spec but had no live main spec and its runtime detection had silently broken due to a regex defect. The fix formalizes the current correct behavior.

### Modified Capabilities
- (none — the target behavior correction is captured under the new `old-macro-detection` capability)

## Impact

- `src/antora-extension.ts` — macro expansion consolidated into one method; synchronous init; event registration moved after init.
- `src/index.ts` — `RequirementsTraceabilityExtension` gains an optional `TracerLogger` (new `TracerLogger` interface export); `createWithPreset` made synchronous; per-item/file logging routed through the logger.
- `src/cli.ts` — callers of `createWithPreset` updated for the synchronous signature.
- `src/DocumentParser.ts` — corrected old-macro detection regex.
- Public API: `createWithPreset` and `createExtensionWithPreset` signatures change from async/Promise to synchronous (non-breaking for `await`-callers, but a documented signature change). New `TracerLogger` type export added.
- Tests: 263 existing tests must continue to pass; add coverage for old-macro detection across syntax variants and for verbatim skipping.
