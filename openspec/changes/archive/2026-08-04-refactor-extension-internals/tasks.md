## 1. Consolidate macro expansion (DONE in ecdcbb7)

- [x] 1.1 Replace `expandOutgoingMacros`/`expandIncomingMacros`/`expandLinksMacros` with a single `expandRelationMacros(file, macroName)` plus shared `buildRelationMacroOutput()`/`buildRelationGroups()` helpers
- [x] 1.2 Remove dead `itemsWithOutgoingMacro`/`itemsWithIncomingMacro` Set fields and their `clear()` calls
- [x] 1.3 Update `registerContentClassifier` to call the consolidated method for `"outgoing"`, `"incoming"`, and `"links"`

## 2. Synchronous initialization (DONE in ecdcbb7)

- [x] 2.1 Make `RequirementsTraceabilityExtension.createWithPreset` and `createExtensionWithPreset` synchronous (signatures no longer return a Promise)
- [x] 2.2 Replace async `initializeAsync()`/`createTraceabilityExtension()` with a synchronous init that runs before event-handler registration
- [x] 2.3 Update CLI caller in `src/cli.ts` to drop the redundant `await`

## 3. Injectable logger (DONE in ecdcbb7)

- [x] 3.1 Add and export `TracerLogger` interface with a no-op default
- [x] 3.2 Add optional logger constructor arg to `RequirementsTraceabilityExtension` and route per-item/file `console.log` output through it
- [x] 3.3 Thread the Antora extension's real logger into the extension instance

## 4. Old-macro detection bug fix (regex done in ecdcbb7)

- [x] 4.1 Replace the character-class regex in `DocumentParser.checkForOldMacros` with the alternation `` `\\[${macro}(?:,|\\s|\\])` ``
- [x] 4.2 Add parser tests covering each scenario in the `old-macro-detection` spec (comma/space/bare forms, verbatim-block skipping, ordinary-prose non-matches)
- [x] 4.3 Verify tests pass (`npm test`) and strict builds are clean

## 5. Spec sync & example-site consistency

- [x] 5.1 Sync the `old-macro-detection` delta spec to main specs (`openspec/specs/old-macro-detection/spec.md`) via `/opsx-sync`
- [x] 5.2 Verify the example site requirements/architecture/user-guide docs still accurately describe the macro-expansion and logger behavior after this refactor
- [x] 5.3 Rebuild the example site (`npx antora antora-playbook.yml`) and confirm traceability output still renders
