## 1. Component profiles

- [x] 1.1 Add `ext.assembler` profiles to `examples/antora.yml`

## 2. Nav files

- [x] 2.1 Create `examples/modules/ROOT/nav-requirements.adoc`
- [x] 2.2 Create `examples/modules/ROOT/nav-architecture.adoc`
- [x] 2.3 Create `examples/modules/ROOT/nav-test-plan.adoc`

## 3. Assembler config files

- [x] 3.1 Create `antora-assembler-pdf-requirements.yml`
- [x] 3.2 Create `antora-assembler-pdf-architecture.yml`
- [x] 3.3 Create `antora-assembler-pdf-test-plan.yml`

## 4. Playbook update

- [x] 4.1 Update `antora-playbook-pdf.yml` to use `configFiles`

## 5. Verify

- [x] 5.1 Three PDFs generated in separate build directories
- [ ] 5.2 Verify each PDF contains only its target document's content
- [ ] 5.3 Verify HTML site build is unaffected
- [ ] 5.4 Verify the existing single-PDF config (`antora-assembler-pdf.yml`) still works standalone
