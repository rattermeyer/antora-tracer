## Context

The extension generates and registers matrices as content-catalog attachments during `contentClassified` (replacing any committed copy) and writes them to the output directory at `sitePublished`. The committed matrices and `run-example.js`'s matrix generation are now redundant.

## Goals / Non-Goals

**Goals:**
- One matrix-generation path: the extension.
- Keep the Neo4j CSV export (the extension does not generate it).

**Non-Goals:**
- No change to the `export neo4j` CLI command.
- No change to matrix rendering behaviour.

## Decisions

1. **Retire only the matrix half of `run-example.js`** — it remains the example-site runner that processes files, prints the validation summary, and exports Neo4j CSV.
2. **Delete the 12 committed matrix files** — the extension's `registerMatricesInCatalog` registers them per component version, so `xref:attachment$traceability/matrix-*.html[]` still resolves.
3. **Keep `nodes.csv` / `relationships.csv`** — Neo4j output remains script-generated.

## Risks / Trade-offs

- [xref breakage] → mitigated by `registerMatricesInCatalog` already replacing committed copies at build; verified by building the site after deletion.
- [Offline matrix review] → matrices are now only present in the build output, not the repo; acceptable since they are generated artifacts.
