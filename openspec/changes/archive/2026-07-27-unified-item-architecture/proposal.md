## Why

The current extension uses fixed macro types (`[req]`, `[imp]`, `[test]`, `[doc]`) with hardcoded relationships. This limits flexibility - users cannot define their own traceability model (e.g., medical device requirements, agile user stories, systems engineering). The fixed approach also makes the codebase rigid and prevents domain-specific customization.

A unified, role-based architecture enables users to define their own traceability domain model while keeping the extension simple and maintainable. This addresses the need for flexibility across different industries and use cases.

## What Changes

- **BREAKING**: Replace `[req]`, `[imp]`, `[test]`, `[doc]` macros with a single `[item]` macro
- **BREAKING**: Replace fixed relationship types with user-defined relations from configuration
- **BREAKING**: Replace hardcoded matrix types with user-defined matrices from configuration
- **New**: Add configuration file support for defining roles, relations, and matrices
- **New**: Add `role` attribute to `[item]` macro to specify the item's role
- **New**: Add validation that relations are allowed between specific roles
- **New**: Add preset configurations for common domains (requirements-engineering, agile, medical, etc.)
- **New**: Add Neo4j export functionality (CSV and Cypher formats) for graph queries
- **Modified**: Update parser to handle single macro type with role attribute
- **Modified**: Update graph builder to store and validate role information

## Capabilities

### New Capabilities
- `unified-item-macro`: Single [item] macro with role attribute replaces all existing block macros
- `role-based-validation`: Validate that relations are allowed between specific roles based on configuration
- `configuration-system`: Configuration file for defining roles, relations, matrices, and presets
- `preset-system`: Built-in preset configurations for different domains
- `neo4j-export`: Export traceability graph to Neo4j CSV and Cypher formats for graph queries

### Modified Capabilities
<!-- No existing specs to modify - this is a major architectural change -->

## Impact

- **Code**: Major refactoring of parser, graph builder, and validation logic
- **API**: Breaking changes to macro syntax and configuration
- **Dependencies**: No new runtime dependencies (Neo4j export is optional)
- **Files**: New configuration files, modified parser, new exporter classes
- **Backward Compatibility**: **BREAKING** - No backward compatibility with existing [req]/[imp]/[test]/[doc] macros
- **User Impact**: Users must migrate to new [item] syntax and define configuration
