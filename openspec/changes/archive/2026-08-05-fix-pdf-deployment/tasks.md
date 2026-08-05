## 1. Fix PDF playbook output directory

- [x] 1.1 Change `output.dir` in `antora-playbook-pdf.yml` from `./public/pdf` to `./build/pdf-output`

## 2. Fix CI workflow to copy all 3 PDFs

- [x] 2.1 Add `cp "$build_dir/requirements.pdf" public/pdf/` to the "Copy PDFs for deployment" step in `.github/workflows/pages.yml`
