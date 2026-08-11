## 1. Wrapper Script

- [x] 1.1 Create `adoc-to-docx` shell script that reads AsciiDoc from stdin, runs `asciidoctor -b docbook` with Kroki, pipes to `pandoc -f docbook -t docx`, and writes to the `-o` path
- [x] 1.2 Make the script executable (`chmod +x adoc-to-docx`)
- [x] 1.3 Verify the script handles extra arguments from Assembler gracefully (ignores non-`-o` args)

## 2. Assembler Configs

- [x] 2.1 Create `antora-assembler-docx.yml` (full document profile) with `build.command: ./adoc-to-docx`
- [x] 2.2 Create `antora-assembler-docx-architecture.yml`
- [x] 2.3 Create `antora-assembler-docx-requirements.yml`
- [x] 2.4 Create `antora-assembler-docx-use-cases.yml`
- [x] 2.5 Create `antora-assembler-docx-test-plan.yml`

## 3. Build Environment

- [x] 3.1 Add `pandoc` to `devbox.json` packages
- [ ] 3.2 Run `devbox shell` and verify `pandoc --version` works
- [x] 3.3 Update `Gemfile` if additional ruby gems are needed (likely none — `asciidoctor` gem is installed alongside `asciidoctor-pdf`)

## 4. Playbook Integration

- [x] 4.1 Register DOCX assembler configs in `antora-playbook-pdf.yml` (add extension instances for each `antora-assembler-docx*.yml` file)
- [x] 4.2 Run `npx antora antora-playbook-pdf.yml` and verify both PDF and DOCX files are produced

## 5. Documentation

- [x] 5.1 Create `examples/modules/ROOT/pages/how-to/generate-docx.adoc` how-to guide
- [x] 5.2 Update `examples/modules/ROOT/pages/developer-guide.adoc` reference to list DOCX assembler configs
- [x] 5.3 Update `examples/modules/ROOT/pages/reference/cli.adoc` if relevant
- [x] 5.4 Update project README build prerequisites to mention pandoc

## 6. Verification

- [ ] 6.1 Open generated DOCX in Word/LibreOffice and verify TOC, headings, images, and cross-references render correctly
- [ ] 6.2 Verify existing PDF output is unchanged (no regression)
- [x] 6.3 Run `npm test` and ensure all 288+ tests pass
