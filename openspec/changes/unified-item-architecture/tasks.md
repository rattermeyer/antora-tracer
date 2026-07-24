## 1. Configuration System

- [x] 1.1 Create TraceabilityConfig interface for configuration structure
- [x] 1.2 Implement configuration loader from YAML files
- [x] 1.3 Add configuration validation (roles, relations, matrices)
- [x] 1.4 Implement preset loading and merging logic
- [x] 1.5 Add error handling for invalid configurations
- [x] 1.6 Create default configuration paths resolver

## 2. Unified Item Macro

- [x] 2.1 Update parser to recognize [item] macro
- [x] 2.2 Add role attribute parsing from [item] macro
- [x] 2.3 Maintain backward compatibility with existing attributes (id, title, status)
- [x] 2.4 Update Item interface to include role property
- [x] 2.5 Add validation for required attributes
- [x] 2.6 Generate clear errors for old macro syntax ([req], [imp], [test], [doc])

## 3. Role-Based Validation

- [x] 3.1 Update TraceabilityGraph to store role information
- [x] 3.2 Implement relation validation between roles
- [x] 3.3 Add validation at graph building time
- [x] 3.4 Generate clear error messages for invalid relations
- [x] 3.5 Add warning system for unknown roles
- [x] 3.6 Implement graceful degradation for items with unknown roles

## 4. Matrix Generation Updates

- [x] 4.1 Update MatrixGenerator to use configuration for matrix definitions
- [x] 4.2 Replace hardcoded matrix types with configurable matrices
- [x] 4.3 Update matrix data preparation for role-based filtering
- [x] 4.4 Integrate TemplateRenderer with role-aware templates
- [x] 4.5 Add role-specific styling options to templates

## 5. Preset System

- [x] 5.1 Create built-in preset files (requirements-engineering, agile, medical-iec62304, minimal)
- [x] 5.2 Add preset documentation to each preset file
- [x] 5.3 Include example AsciiDoc snippets in each preset
- [x] 5.4 Add example Neo4j Cypher queries to each preset
- [x] 5.5 Implement preset versioning system
- [x] 5.6 Add CLI command to list available presets
- [x] 5.7 Add CLI command to show preset details
- [x] 5.8 Add CLI command to initialize from preset

## 6. Neo4j Export

- [x] 6.1 Create Neo4jExporter class (v1)
- [x] 6.2 Implement CSV export (nodes.csv, relationships.csv) (v1)
- [x] 6.3 Implement Cypher export (import.cypher) (v1)
- [x] 6.4 Add proper escaping for special characters in CSV (v1)
- [x] 6.5 Add proper escaping for special characters in Cypher (v1)
- [x] 6.6 Include all item attributes in export (v1)
- [x] 6.7 Add CLI command for Neo4j export
- [x] 6.8 Add format option (csv/cypher) to export command
- [x] 6.9 Add input/output directory options to export command
- [x] 6.10 Implement Neo4j export for v2 architecture

## 7. Integration & Refactoring

- [x] 7.1 Update processor to use new configuration system
- [x] 7.2 Update graph builder to validate relations
- [x] 7.3 Integrate new parser with existing processing pipeline
- [x] 7.4 Ensure Mustache templates work with new item structure
- [x] 7.5 Update existing tests to work with new architecture
- [x] 7.6 Add tests for new configuration system
- [x] 7.7 Add tests for role-based validation
- [x] 7.8 Add tests for Neo4j export

## 8. CLI Updates

- [x] 8.1 Add --config option to all commands
- [x] 8.2 Update process command to use new configuration
- [x] 8.3 Add preset management commands
- [x] 8.4 Add Neo4j export command
- [x] 8.5 Update help text and documentation

## 9. Documentation

- [ ] 9.1 Update README with new [item] syntax
- [ ] 9.2 Document configuration file format
- [ ] 9.3 Add migration guide from v1.x to v2.0
- [ ] 9.4 Document preset system and available presets
- [ ] 9.5 Add examples for common use cases
- [ ] 9.6 Document Neo4j export and usage
- [ ] 9.7 Update user guide with new features
- [ ] 9.8 Update developer guide with new APIs

## 10. Testing

- [ ] 10.1 Add unit tests for configuration loader
- [ ] 10.2 Add unit tests for preset system
- [ ] 10.3 Add unit tests for role-based validation
- [ ] 10.4 Add unit tests for Neo4j exporter
- [ ] 10.5 Add integration tests for full workflow
- [ ] 10.6 Verify all existing tests still pass
- [ ] 10.7 Test with multiple presets
- [ ] 10.8 Test with custom configurations

## 11. Build & Release

- [ ] 11.1 Update package.json version to 2.0.0
- [ ] 11.2 Update dependencies if needed
- [ ] 11.3 Run full build and verify no errors
- [ ] 11.4 Update RELEASE-NOTES.md with v2.0.0 changes
- [ ] 11.5 Update CHANGELOG.md with breaking changes
- [ ] 11.6 Test installation and basic usage
- [ ] 11.7 Test with example projects

## 12. Extended Testing

- [ ] 12.1 Add comprehensive unit tests for DocumentParser (content parsing edge cases)
- [ ] 12.2 Add comprehensive unit tests for TraceabilityGraph (validation, path finding, cycles)
- [ ] 12.3 Add unit tests for MatrixGenerator (matrix generation, CSV/HTML/JSON export)
- [ ] 12.4 Add unit tests for Neo4jExporter (CSV export, Cypher export)
- [ ] 12.5 Add unit tests for ConfigLoader (YAML loading, validation)
- [ ] 12.6 Add unit tests for AntoraExtension (content classification, events)
- [ ] 12.7 Add unit tests for all CLI commands (process, matrix, validate, export, stats, preset)
- [ ] 12.8 Add unit tests for preset system (loading, listing, initialization)
- [ ] 12.9 Add code coverage reporting (nyc/Istanbul integration)

## 13. Dogfood - Self-Hosted Traceability

- [ ] 13.1 Create requirements document (requirements.adoc) for the tracer itself
- [ ] 13.2 Annotate all tests with requirement IDs using [item] macros
- [ ] 13.3 Generate test→requirement traceability matrix
- [ ] 13.4 Add validation that all requirements have at least one test
- [ ] 13.5 Add CLI command to generate self-coverage report
