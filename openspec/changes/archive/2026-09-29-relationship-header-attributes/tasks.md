## 1. Relation-name detection and parsing

- [x] 1.1 Add a ConfigLoader lookup for whether a name is a configured relation type (primary or reverse); verify it returns true for both forms and false for unknown names.
- [x] 1.2 In `DocumentParser.parseItemMacros`, convert recognized relation-name header attributes into `ItemRelationship` records and exclude them from `Item.attributes`; verify comma- and whitespace-separated target lists both parse.

## 2. Integration and coverage

- [x] 2.1 Add parser tests for single, comma-separated, and whitespace-separated targets, reverse-name canonicalization, and unrecognized attributes staying metadata; verify against the new spec scenarios.
- [x] 2.2 Add a graph test that authoring the same edge via header attribute and inline macro produces a duplicate warning, and that `validate` reports it as an error.
- [x] 2.3 Update the item macro reference to document relation-name header attributes and their quoting rules; verify the example site builds.
