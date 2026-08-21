## 1. Implement extraction

- [x] 1.1 Add a test that reads the example site prose pages and extracts `[item]` blocks, skipping `[source,asciidoc]` fences and other verbatim content

## 2. Validate

- [x] 2.1 Run extracted items and relationships through `DocumentParser` and validate roles/relations against `examples/traceability.yml`

## 3. Wire into CI

- [x] 3.1 Ensure the new test runs as part of `npm test`

## 4. Fix surfaced examples

- [x] 4.1 Exclude `detect-duplicate-ids.adoc` (intentionally shows a duplicate ID to teach the failure case)
