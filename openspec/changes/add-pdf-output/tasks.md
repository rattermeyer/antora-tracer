## 1. Devbox shell with Ruby

- [x] 1.1 Update `devbox.json` — add `nodejs`, `ruby`, `bundler` packages
- [x] 1.2 Add init hook: `npm install && bundle install`
- [x] 1.3 Verify `devbox shell` provides `ruby --version`, `bundle --version`, `node --version`

## 2. Ruby Gemfile

- [x] 2.1 Create `Gemfile` with `gem 'asciidoctor-pdf'` and `gem 'asciidoctor-kroki'`
- [x] 2.2 Run `bundle install` to generate `Gemfile.lock`

## 3. NPM dependency

- [x] 3.1 Install `@antora/pdf-extension` as dev dependency
- [x] 3.2 Verify `npm ls @antora/pdf-extension` shows installed version

## 4. PDF playbook

- [x] 4.1 Create `antora-playbook-pdf.yml` with same content sources as `antora-playbook.yml`
- [x] 4.2 Configure `@antora/pdf-extension` in the antora extensions list
- [x] 4.3 Set output dir to `./public/pdf`
- [x] 4.4 Add PDF-specific asciidoc attributes (pdf-theme, kroki-server-url if needed)

## 5. Verify PDF output

- [x] 5.1 Run `npx antora antora-playbook-pdf.yml` and confirm PDF is generated in `public/pdf/`
- [x] 5.2 Verify PDF contains requirements, architecture, and test plan content
- [x] 5.3 Verify PlantUML diagrams render (uses kroki.io)
- [x] 5.4 Verify HTML site build still works unchanged via `npx antora antora-playbook.yml`

## 6. Documentation

- [x] 6.1 Add PDF build instructions to AGENTS.md
