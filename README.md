# Antora Requirements Traceability Extension

[![npm version](https://img.shields.io/npm/v/antora-requirements-traceability.svg)](https://www.npmjs.com/package/antora-requirements-traceability)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-7.x-blue.svg)](https://www.typescriptlang.org/)
[![ESM](https://img.shields.io/badge/Module-ESM-red.svg)](https://nodejs.org/api/esm.html)

The **Antora Requirements Traceability Extension** enables requirements traceability in your Antora documentation. Define requirements, implementations, tests, and documents using custom AsciiDoc macros, establish relationships between them, and generate traceability matrices and coverage reports.

## Features

**Note**: This package uses ESM (ECMAScript Modules). Ensure your Node.js version is 14+ and your project is configured for ESM.

* ✅ **Requirement Definition**: Define requirements with `[req]` block macros
* ✅ **Implementation Tracking**: Track implementations with `[imp]` block macros
* ✅ **Test Management**: Manage tests with `[test]` block macros
* ✅ **Document Linking**: Link documentation with `[doc]` block macros
* ✅ **Relationship Mapping**: Establish relationships with inline macros (satisfies, implements, tests, verifies, documents, depends, requires)
* ✅ **Matrix Generation**: Generate traceability matrices in CSV and HTML formats
* ✅ **Coverage Reporting**: View implementation and test coverage metrics
* ✅ **Antora Integration**: Seamless integration with Antora documentation pipeline
* ✅ **CLI Support**: Command-line interface for processing files

## Quick Start

### Installation

```bash
npm install antora-requirements-traceability --save-dev
```

### Configure Antora

Add the extension to your `antora.yml` playbook:

```yaml
antora:
  extensions:
    - require: antora-requirements-traceability
```

### Define Requirements

Add requirements to your AsciiDoc files:

```asciidoc
[req, id=REQ-001, title="User Authentication"]
====
The system shall require user authentication for all protected endpoints.
====

[imp, id=IMP-001, title="Authentication Service"]
====
Implementation of user authentication.

implements:REQ-001[]
====

[test, id=TEST-001, title="Authentication Tests"]
====
Unit tests for authentication functionality.

tests:REQ-001[]
verifies:REQ-001[]
====
```

### Build and View

Run your Antora build:

```bash
npx antora --fetch antora-playbook.yml
```

The extension will generate traceability artifacts in the `traceability/` directory of your site output.

## Documentation

* [User Guide](docs/user-guide.adoc) - Complete guide to using the extension
* [Developer Guide](docs/developer-guide.adoc) - API documentation and development information

## CLI Usage

The extension provides a command-line interface for processing files outside of Antora:

### Commands

```bash
# Process AsciiDoc files
npx antora-req-trace process -i docs/ -o output/ -f html

# Generate traceability matrix
npx antora-req-trace matrix -t req-impl -f html -o matrix.html

# Validate traceability
npx antora-req-trace validate
```

### Options

**Process Command:**

* `-i, --input <path>`: Input file or directory
* `-o, --output <path>`: Output directory
* `-f, --format <format>`: Output format (html, csv, json)

**Matrix Command:**

* `-t, --type <type>`: Matrix type (req-impl, req-test, full)
* `-f, --format <format>`: Output format (csv, html)
* `-o, --output <path>`: Output file (defaults to stdout)

## Configuration

Configure the extension in your Antora playbook:

```yaml
antora:
  extensions:
    - require: antora-requirements-traceability
      config:
        enabled: true                    # Enable/disable extension
        outputDir: traceability          # Output directory for artifacts
        generateMatrices: true           # Generate traceability matrices
        matrixFormats:                   # Output formats
          - html
          - csv
        includeInNavigation: true        # Add traceability to navigation
```

## Generated Artifacts

The extension generates the following in the configured output directory:

* `index.html` - Traceability index page with links to all artifacts
* `matrix-req-impl.html/csv` - Requirements-to-Implementation matrix
* `matrix-req-test.html/csv` - Requirements-to-Test matrix
* `matrix-full.html/csv` - Full traceability matrix
* `coverage.html` - Coverage report with visual metrics

## Relationship Types

| Macro | Description |
|-------|-------------|
| `satisfies:TARGET[]` | This element satisfies the target |
| `implements:TARGET[]` | This element implements the target |
| `tests:TARGET[]` | This element tests the target |
| `verifies:TARGET[]` | This element verifies the target |
| `documents:TARGET[]` | This element documents the target |
| `depends:TARGET[]` | This element depends on the target |
| `requires:TARGET[]` | This element requires the target |

## Matrix Types

### Requirements-to-Implementation (req-impl)

Shows which requirements have implementations.

**Columns:** Requirement ID, Title, Implementations, Tests, Status

### Requirements-to-Test (req-test)

Shows which requirements have tests.

**Columns:** Requirement ID, Title, Implementations, Tests, Status

### Full Traceability (full)

Comprehensive matrix with all details.

**Includes:** Requirements, Implementations, Tests, Documents, Relationships, Coverage

## Coverage Metrics

The extension tracks:

* **Total Requirements**: Total number of defined requirements
* **Requirements with Implementation**: Requirements with at least one implementation
* **Requirements with Tests**: Requirements with at least one test
* **Implementation Coverage**: Percentage of requirements with implementations
* **Test Coverage**: Percentage of requirements with tests

## Project Status

This extension is currently in **beta** development. The following features are implemented:

* ✅ Core parsing and graph functionality
* ✅ All block macros (req, imp, test, doc)
* ✅ All relationship types
* ✅ CSV and HTML matrix output
* ✅ Coverage reporting
* ✅ Antora integration
* ✅ CLI interface
* ✅ Comprehensive test suite (155 tests)

### Known Issues

* Asciidoctor.js v4 API compatibility issues (4 tests failing due to library changes)
* These are pre-existing issues in the Asciidoctor.js library, not in this extension

### Roadmap

* JSON output format
* XML output (XUnit, JUnit)
* Web-based traceability viewer
* Graph visualization
* Export to requirements management tools

## Contributing

Contributions are welcome! See the [Developer Guide](docs/developer-guide.adoc) for:

* Setting up the development environment
* Code style guidelines
* Testing requirements
* Contribution workflow

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

* **Documentation**: See the [User Guide](docs/user-guide.adoc)
* **Issues**: Report issues on GitHub
* **Questions**: Open a discussion on GitHub

## Acknowledgment

This extension is inspired by [Sphinx Needs](https://sphinx-needs.readthedocs.io/) and aims to provide similar functionality for the Antora/AsciiDoc ecosystem.
