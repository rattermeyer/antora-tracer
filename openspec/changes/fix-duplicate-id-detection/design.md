## Context

See proposal.md — Why. Two duplicate-ID paths already exist: the parser's per-file `seen` set emits a `duplicate_id` error and drops the repeat, while the graph's identity map emits a `duplicate_node` warning that `validate` and the Antora extension already turn into a failure naming both locations. Only cross-file duplicates reach the graph, because the parser drops same-file repeats first.

## Goals / Non-Goals

**Goals:** A same-file duplicate fails `validate` and the Antora build with both locations named, exactly like a cross-file duplicate.

**Non-Goals:** Merging the two detection paths into one; changing which definition wins; changing cross-file behaviour.

## Decisions

**Decision 1 — keep the parser's drop, report both locations from it.**

The parser must keep dropping the repeated block. Removing the drop (letting the graph be the sole authority) was tried and rejected: both blocks then share the `bodyAbsoluteStarts` key, so the surviving item's relationship line numbers come out wrong and the dropped block's relationships are added. The parser is the only place that knows the first definition's line within one file, so it names both locations in its error.

*Alternative rejected*: delete the parser guard and rely on the graph. Corrupts relationship offsets (measured) and adds the duplicate's relationships.

**Decision 2 — `validate` and the extension surface parser errors; detection logic is unchanged.**

`validate` reads `processFiles(...).result.errors` and prints them alongside graph validation errors. The extension collects `duplicate_id` parser errors per version and folds them into its existing duplicate-ID build failure. Neither adds a new detection mechanism; both reuse the message the parser already produces.

## Risks / Trade-offs

- **A test asserted the old parser message text** → Checked: no test pins "An item with this ID already exists"; the message change is safe.
- **Parser errors other than `duplicate_id` now surface in `validate`** → Accepted: `validate` is a validation command, and the parser's only other error kinds are syntax and relation errors that belong in its output.
