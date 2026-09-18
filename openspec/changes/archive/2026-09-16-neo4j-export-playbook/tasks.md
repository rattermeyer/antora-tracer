## 1. CLI

- [x] 1.1 Add an optional `<playbook>` positional to `export neo4j` and a playbook branch that calls `harvestSiteFiles` + processes each file; verify `npm run build` compiles
- [x] 1.2 Keep `-i <dir>` working unchanged and error when neither is provided; verify the error case

## 2. Tests

- [x] 2.1 Test playbook-mode export produces nodes/relationships spanning the harvested components; verify the case passes
- [x] 2.2 Test missing-input exits non-zero; verify the case passes

## 3. Docs

- [x] 3.1 Document the playbook argument in `reference/cli.adoc` and `how-to/neo4j-export.adoc`; verify the Antora site still builds
