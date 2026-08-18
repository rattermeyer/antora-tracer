## Why

Antora Tracer should help authors produce high-quality technical documentation as well as traceable documentation.
A Vale extension can enforce project-specific prose rules during an Antora build while seeing the complete content catalog assembled from distributed repositories.

## What Changes

- Add a bundled Antora extension that runs Vale against AsciiDoc page and partial content during `contentClassified`.
- Make the extension configurable through the Antora playbook, including the Vale configuration path and minimum severity that fails the build.
- Fail the Antora build when Vale reports findings at or above the configured severity, while logging lower-severity findings.
- Ship a starter Vale style that encodes the machine-checkable parts of the Antora Tracer documentation style guide.
- Document the Vale and Asciidoctor prerequisites, playbook configuration, local use, CI use, and the distinction between Vale prose checks and the source-layout checker.

## Capabilities

### New Capabilities
- `vale-build-integration`: Run Vale against source AsciiDoc from the complete Antora content catalog and gate the build according to configured severity.
- `documentation-style-rules`: Provide reusable Vale rules for the machine-checkable parts of the project's documentation style guide.

### Modified Capabilities

None.

## Impact

- Adds a new bundled Antora extension entry point and compiled distribution artifact.
- Adds Vale configuration and style assets to the npm package.
- Introduces runtime prerequisites for users who enable the extension: the `vale` and `asciidoctor` executables.
- Adds extension configuration, tests, reference documentation, and a high-quality-documentation how-to.
- Does not enable Vale automatically for existing users; users opt in by registering the extension in their playbook.
