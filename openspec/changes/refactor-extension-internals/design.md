## Context

The extension grew three near-identical macro-expansion methods (`expandOutgoingMacros`, `expandIncomingMacros`, `expandLinksMacros`) totaling ~300 lines, ~90% of which was shared scan/filter/replace pipeline logic. A code review also identified:

- An async-init race: `initializeAsync()` set `this.traceability` asynchronously while event handlers were registered synchronously, so an early `contentClassified` event could fire before the graph existed (silently skipping processing).
- Production `console.log` noise emitted per item/relationship/file from `RequirementsTraceabilityExtension` (invisible when error output matters, uninformative at scale).
- A defective old-macro detection regex in `DocumentParser.checkForOldMacros` (`[${macro}(,s*|s).?]`) that functioned as a *character class*, matching stray single characters in prose instead of old macro syntax.

The first three items are maintainability fixes with no observable behavior change; the last is an observable bug fix that restores documented deprecation-detection behavior. They are batched into one change because they touch the same files and stabilization window.

## Goals / Non-Goals

**Goals:**
- Reduce duplication in macro expansion to a single pipeline with shared helpers.
- Eliminate the initialization race so event handlers always run after the graph is ready.
- Remove production output noise by introducing an injectable logger.
- Restore correct old-macro deprecation detection.

**Non-Goals:**
- No change to rendered traceability macro output or the traceability graph data model.
- No change to the item parsing rules or role mapping.
- No UI/theme changes.

## Decisions

### D1: Consolidate macro expansion into `expandRelationMacros(file, macroName)`
The three macros `outgoing`, `incoming`, `links` share the identical pipeline: scan item blocks, filter inline-code ranges, build grouped relationships (with inverse-label mapping for incoming), sort by order, render via shared style generators. The only difference is which relationship direction(s) each renders: `outgoing` renders outgoing groups, `incoming` renders incoming groups, `links` renders both.

- Introduce a `RelationMacro` union (`"outgoing" | "incoming" | "links"`) and a `RelationDirection` union (`"outgoing" | "incoming"`).
- One method handles scanning/replacing; helpers `buildRelationMacroOutput()` (dispatch on macro kind) and `buildRelationGroups()` (collect/sort/invert per direction) isolate the differences.
- The dead `itemsWithOutgoingMacro`/`itemsWithIncomingMacro` Set fields (written but never read) were removed.

**Alternatives considered:** Keeping three thin wrappers would preserve readability but retain the duplication the review flagged; a visitor/strategy pattern was heavier than needed. A single parameterized method is the minimal correct structure.

### D2: Synchronous initialization
The presumed need for async was `createWithPreset`, but it only does synchronous file reads and config assembly. Making it synchronous (along with `createTraceabilityExtension`) means `this.traceability` is fully populated in the constructor before any event handlers register.

- Event handlers are now registered *after* init completes.
- `createWithPreset` and `createExtensionWithPreset` change from `async`/`Promise` to synchronous signatures. `await`-callers still work because awaiting a non-Promise resolves immediately, but the public signatures are simplified.

**Alternatives considered:** Guarding every handler with `if (this.traceability)` checks would mask the race rather than fix it and adds per-event overhead. Deferring handler registration to a microtask reintroduces the same race with more moving parts.

### D3: Injectable `TracerLogger`
Add a minimal `TracerLogger` interface (`info`/`warn`/`error`/`debug`) exported from `index.ts`. `RequirementsTraceabilityExtension` accepts it as an optional second constructor argument, defaulting to a no-op. Per-item/per-file `console.log` calls become `this.logger.debug(...)`; `console.warn` in setup paths becomes `this.logger.warn(...)`. The Antora extension threads its existing logger in via `new RequirementsTraceabilityExtension(loader, this.logger)`.

**Alternatives considered:** Keeping `console.log` is simplest but pollutes shared stdout. Plugging in a full external logger library (winston, pino) is overkill for a library with a handful of log points; a minimal structural-typed interface keeps zero dependencies and lets hosts inject Antora's or the CLI's logger.

### D4: Fix old-macro detection regex
Replace the character-class regex with a real alternation:
`\\[${macro}(?:,|\\s|\\])` — matches `[` + keyword + (`,` or whitespace or `]`), correctly detecting `[req, ...]`, `[req ...]`, and `[req]` while not matching stray `r`/`e`/`q` characters in prose. Verbatim-block skipping (already implemented) is preserved.

**Alternatives considered:** A whitespace-aware word-boundary regex (`\\b`) was tempting but would not handle the `[req,]` comma case correctly; explicit alternation is unambiguous and testable.

## Risks / Trade-offs

- [Logger defaulting to no-op hides setup diagnostics when the extension is used without Antora] → The CLI and host applications can pass their own logger; Antora already does.
- [Making `createWithPreset` synchronous is a public signature change that could break downstream `Promise`-expecting code] → Low risk; `await` on a non-Promise is valid. Verified 263 existing tests pass unchanged.
- [Consolidating three methods into one risks subtle behavioral drift] → All 263 tests cover rendering; example site build verifies end-to-end output. The methods are behavior-identical by design (parametrized direction).
- [Regex fix could newly flag legitimate prose containing `[req ` patterns] → Old-macro detection only runs on item scanning paths and skips verbatim blocks; false positives surface as deprecation warnings, not hard failures, in non-strict mode.

## Migration Plan

No data migration. Changes are additive/internal; `lib/` compiled output is committed alongside `src/`. Rollback is a revert of the change commit.

## Open Questions

(none)
