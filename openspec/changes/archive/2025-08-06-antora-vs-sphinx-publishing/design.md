## Context

The new page compares Antora and Sphinx as publishing platforms — a broader perspective than the traceability-focused sphinx-comparison page. It's explicitly subjective and draws from experience with both tools.

## Goals / Non-Goals

**Goals:**
- Clear, honest comparison of publishing capabilities
- Subjective ratings table for quick reference
- Links to official documentation for verification
- Separate from the traceability tool comparison

**Non-Goals:**
- Objective/quantitative benchmarks
- Replacing the existing sphinx-comparison page
- Comparing traceability features (already covered)

## Content Structure

```
= Antora vs Sphinx — Publishing Pipeline Comparison

[NOTE — subjective framing]

== Summary
[ratings table]

== HTML Publishing
Antora's multi-repo, multi-version architecture vs Sphinx's single-project roots

== PDF Generation
Asciidoctor PDF maturity vs Sphinx LaTeX/HTML-to-PDF routes

== Multiple Versions
First-class versioning in Antora vs external tooling in Sphinx

== Large Documentation Collections
Components, modules, partials vs toctree and includes

== Navigation
Explicit nav.adoc vs distributed toctree

== Ecosystem
Python/Scientific (Sphinx) vs Documentation/Product (Antora)

== For Enterprise Documentation
Scoring breakdown for 500–5,000 page, multi-product, multi-version projects
```

## External References

| URL | Verified |
|---|---|
| https://antora.org/ | ✓ 200 |
| https://docs.antora.org/assembler/latest/ | ✓ 200 |
| https://docs.asciidoctor.org/pdf-converter/latest/features/ | ✓ 200 |
