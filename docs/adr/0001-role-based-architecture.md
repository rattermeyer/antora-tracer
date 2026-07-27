# ADR 0001: Role-Based Architecture

## Status
Accepted

## Context
The original Antora Tracer used separate types for different traceable artifacts:
- `Requirement`
- `Implementation`
- `Test`
- `Document`
- `Design`

This approach led to:
- Code duplication across types
- Difficulty adding new artifact types
- Complex type hierarchies
- Inflexible relationship definitions

## Decision
Adopt a **role-based architecture** where all traceable artifacts are represented by a single `Item` type with a `role` attribute.

### Key Changes
1. **Single Item Type**: Replace multiple types with `Item { id, title, role, ... }`
2. **Role Attribute**: Add `role: string` to distinguish artifact types
3. **Configurable Roles**: Roles defined in configuration, not hardcoded
4. **Role-Based Relations**: Relationship validation based on role pairs

## Consequences

### Positive
- ✅ **Extensibility**: Users can define custom roles without code changes
- ✅ **Simplicity**: Single type to understand and work with
- ✅ **Flexibility**: Easy to add new artifact types via configuration
- ✅ **Consistency**: Uniform handling of all traceable items
- ✅ **Maintainability**: Less code duplication

### Negative
- ⚠️ **Migration**: Existing code using specific types needs updating
- ⚠️ **Type Safety**: Less compile-time type checking for specific artifact types
- ⚠️ **Learning Curve**: Users need to understand role-based configuration

## Alternatives Considered

### Alternative 1: TypeScript Union Types
```typescript
type TraceableItem = Requirement | Implementation | Test | Document | Design;
```
**Rejected**: Still requires maintaining separate types, doesn't solve extensibility.

### Alternative 2: Class Hierarchy
```typescript
class TraceableItem { /* common fields */ }
class Requirement extends TraceableItem { /* specific fields */ }
```
**Rejected**: Complex, hard to extend, type checking issues.

### Alternative 3: Tagged Union with Discriminant
```typescript
type TraceableItem = { type: 'requirement'; /* fields */ } | { type: 'test'; /* fields */ };
```
**Rejected**: Verbose, doesn't scale well with many types.

## Related
- Issue: #XX (Unified item architecture)
- Spec: `openspec/changes/unified-item-architecture/specs/`
