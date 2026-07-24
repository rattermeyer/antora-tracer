/**
 * Tests for v2.0 unified item architecture
 * Tests DocumentParserV2, TraceabilityGraphV2, and MatrixGeneratorV2
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentParserV2, type ParserResult, type ParserWarning, type ParserError } from '../src/DocumentParserV2.js';
import { TraceabilityGraphV2, type GraphWarning, type ValidationResult } from '../src/TraceabilityGraphV2.js';
import { MatrixGeneratorV2 } from '../src/MatrixGeneratorV2.js';
import { ConfigLoader, loadConfig } from '../src/config/TraceabilityConfig.js';
import { Item, ItemRelationship } from '../src/types-v2.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ========================================================================
// DocumentParserV2 Tests
// ========================================================================

describe('DocumentParserV2', () => {
  describe('Basic parsing', () => {
    it('should parse [item] macro with role attribute', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement]
====
User Authentication

The system shall authenticate users.
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('REQ-001');
      expect(result.items[0].role).toBe('requirement');
      expect(result.items[0].title).toBe('User Authentication');
      expect(result.items[0].content).toContain('The system shall authenticate users.');
      expect(result.items[0].sourceFile).toBe('test.adoc');
    });

    it('should parse multiple [item] macros', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement]
====
Requirement 1
====

[item, id=REQ-002, role=requirement]
====
Requirement 2
====

[item, id=DES-001, role=design]
====
Design 1
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items).toHaveLength(3);
      expect(result.items.map(i => i.id)).toContain('REQ-001');
      expect(result.items.map(i => i.id)).toContain('REQ-002');
      expect(result.items.map(i => i.id)).toContain('DES-001');
    });

    it('should parse item with title attribute', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement, title="User Authentication"]
====
Content here
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items[0].title).toBe('User Authentication');
    });

    it('should parse item with status attribute', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement, status=approved]
====
Content
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items[0].status).toBe('approved');
    });

    it('should parse item with custom attributes', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement, priority=high, owner=john]
====
Content
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items[0].attributes.priority).toBe('high');
      expect(result.items[0].attributes.owner).toBe('john');
    });

    it('should parse item with quoted title containing spaces', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement, title="User Authentication System"]
====
Content
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items[0].title).toBe('User Authentication System');
    });

    it('should generate auto ID when no ID provided', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, role=requirement]
====
Content
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items[0].id).toBeDefined();
      expect(result.items[0].id).toContain('ITEM');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('invalid_attribute');
      expect(result.warnings[0].message).toContain('has no id attribute');
    });

    it('should default role to unknown when no role provided', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001]
====
Content
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.items[0].role).toBe('unknown');
      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('missing_role');
      expect(result.warnings[0].message).toContain('has no role attribute');
    });
  });

  describe('Old macro syntax detection', () => {
    it('should generate error for old [req] macro', () => {
      const parser = new DocumentParserV2({ strictMode: true });
      const content = `[req, id=REQ-001]`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('syntax_error');
      expect(result.errors[0].message).toContain('[req]');
      expect(result.errors[0].message).toContain('deprecated');
    });

    it('should generate error for old [imp] macro', () => {
      const parser = new DocumentParserV2({ strictMode: true });
      const content = `[imp, id=IMP-001]`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('[imp]');
    });

    it('should generate error for old [test] macro', () => {
      const parser = new DocumentParserV2({ strictMode: true });
      const content = `[test, id=TEST-001]`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('[test]');
    });

    it('should generate error for old [doc] macro', () => {
      const parser = new DocumentParserV2({ strictMode: true });
      const content = `[doc, id=DOC-001]`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('[doc]');
    });

    it('should generate warning for old macros in non-strict mode', () => {
      const parser = new DocumentParserV2({ strictMode: false });
      const content = `[req, id=REQ-001]`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.warnings).toHaveLength(1);
      expect(result.warnings[0].type).toBe('old_macro');
      expect(result.warnings[0].message).toContain('[req]');
    });
  });

  describe('Duplicate ID detection', () => {
    it('should generate error for duplicate IDs', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement]
====
First
====

[item, id=REQ-001, role=design]
====
Second
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].type).toBe('duplicate_id');
      expect(result.errors[0].message).toContain('Duplicate item ID: REQ-001');
    });
  });

  describe('Inline relationship parsing', () => {
    it('should parse inline relationship macros', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=REQ-001, role=requirement]
====
User Authentication

satisfies:IMP-001[]
verifies:TEST-001[]
====

[item, id=IMP-001, role=implementation]
====
Implementation
====

[item, id=TEST-001, role=test]
====
Test
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.relationships).toHaveLength(2);

      const satisfiesRel = result.relationships.find(r => r.type === 'satisfies');
      expect(satisfiesRel).toBeDefined();
      expect(satisfiesRel?.fromId).toBe('REQ-001');
      expect(satisfiesRel?.targetId).toBe('IMP-001');

      const verifiesRel = result.relationships.find(r => r.type === 'verifies');
      expect(verifiesRel).toBeDefined();
      expect(verifiesRel?.fromId).toBe('REQ-001');
      expect(verifiesRel?.targetId).toBe('TEST-001');
    });

    it('should handle multiple inline relationships to same target', () => {
      const parser = new DocumentParserV2();
      const content = `
[item, id=DES-001, role=design]
====
Design

addresses:REQ-001[]
addresses:REQ-002[]
implements:IMP-001[]
====

[item, id=REQ-001, role=requirement]
====
Req 1
====

[item, id=REQ-002, role=requirement]
====
Req 2
====

[item, id=IMP-001, role=implementation]
====
Impl 1
====
`;
      const result = parser.parse(content, 'test.adoc');

      expect(result.relationships).toHaveLength(3);
      expect(result.relationships.filter(r => r.fromId === 'DES-001')).toHaveLength(3);
    });
  });

  describe('Configuration-based validation', () => {
    it('should validate roles against configuration', () => {
      // Create a config loader with a simple configuration
      const configPath = path.resolve(__dirname, '../src/presets/minimal.yml');
      const configLoader = new ConfigLoader();

      // Load the minimal preset config
      const preset = configLoader.loadPreset('minimal');
      const config = preset.traceability;

      // Create a mock config loader
      const mockConfigLoader = {
        getConfig: () => config,
        isKnownRole: (role: string) => config.roles.includes(role),
        isRelationAllowed: () => true,
        getAllowedRelations: () => [],
        getMatrices: () => [],
      } as any;

      const parser = new DocumentParserV2({ configLoader: mockConfigLoader });

      // Parse with a known role
      const content1 = `[item, id=REQ-001, role=requirement]\n====\nContent\n====`;
      const result1 = parser.parse(content1, 'test.adoc');

      // Should have no warnings about unknown role
      const unknownRoleWarnings = result1.warnings.filter(w => w.type === 'unknown_role');
      expect(unknownRoleWarnings).toHaveLength(0);

      // Parse with unknown role
      const content2 = `[item, id=REQ-002, role=unknown_type]\n====\nContent\n====`;
      const result2 = parser.parse(content2, 'test.adoc');

      // Should have warning about unknown role
      const unknownRoleWarn = result2.warnings.find(w => w.type === 'unknown_role');
      expect(unknownRoleWarn).toBeDefined();
      expect(unknownRoleWarn?.message).toContain('unknown role');
    });

    it('should validate relations based on configuration', () => {
      // Create a config loader with requirements-engineering preset
      const configLoader = new ConfigLoader();
      const preset = configLoader.loadPreset('requirements-engineering');
      const config = preset.traceability;

      const mockConfigLoader = {
        getConfig: () => config,
        isKnownRole: (role: string) => config.roles.includes(role),
        isRelationAllowed: (sourceRole: string, targetRole: string, relType: string) => {
          const sourceRelations = config.relations?.[sourceRole];
          if (!sourceRelations) return false;
          const allowedRelations = sourceRelations[targetRole];
          if (!allowedRelations) return false;
          return allowedRelations.includes(relType);
        },
        getAllowedRelations: (sourceRole: string, targetRole: string) => {
          const sourceRelations = config.relations?.[sourceRole];
          return sourceRelations?.[targetRole] || [];
        },
        getMatrices: () => config.matrices || [],
      } as any;

      const parser = new DocumentParserV2({ configLoader: mockConfigLoader });

      const content = `
[item, id=REQ-001, role=requirement]
====
Requirement

addresses:DES-001[]
====

[item, id=DES-001, role=design]
====
Design
====
`;
      const result = parser.parse(content, 'test.adoc');

      // addresses from requirement to design should be valid in requirements-engineering preset
      expect(result.errors).toHaveLength(0);
    });
  });
});

// ========================================================================
// TraceabilityGraphV2 Tests
// ========================================================================

describe('TraceabilityGraphV2', () => {
  describe('Item management', () => {
    it('should add and retrieve items', () => {
      const graph = new TraceabilityGraphV2();

      const item: Item = {
        id: 'REQ-001',
        title: 'User Auth',
        role: 'requirement',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      };

      graph.addItem(item);

      const retrieved = graph.getItem('REQ-001');
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe('REQ-001');
      expect(retrieved?.role).toBe('requirement');
    });

    it('should return all items', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });

      const allItems = graph.getAllItems();
      expect(allItems).toHaveLength(2);
    });

    it('should return items by role', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'REQ-002', title: 'Req 2', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });

      const reqItems = graph.getItemsByRole('requirement');
      expect(reqItems).toHaveLength(2);

      const designItems = graph.getItemsByRole('design');
      expect(designItems).toHaveLength(1);
    });

    it('should warn about duplicate IDs', () => {
      const graph = new TraceabilityGraphV2();

      const item1: Item = { id: 'REQ-001', title: 'First', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 };
      const item2: Item = { id: 'REQ-001', title: 'Second', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 };

      graph.addItem(item1);
      graph.addItem(item2);

      const allItems = graph.getAllItems();
      expect(allItems).toHaveLength(1); // Only first item added

      const validation = graph.validate();
      expect(validation.warnings).toHaveLength(1);
      expect(validation.warnings[0].type).toBe('duplicate_node');
    });
  });

  describe('Relationship management', () => {
    it('should add and retrieve relationships', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });

      const rel: ItemRelationship = {
        id: 'REQ-001-addresses-DES-001',
        fromId: 'REQ-001',
        targetId: 'DES-001',
        type: 'addresses',
        sourceFile: 'test.adoc',
        line: 1,
      };

      graph.addRelationship(rel);

      const retrieved = graph.getRelationship('REQ-001-addresses-DES-001');
      expect(retrieved).toBeDefined();
      expect(retrieved?.type).toBe('addresses');
    });

    it('should return relationships from an item', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
      graph.addItem({ id: 'DES-002', title: 'Des 2', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });

      graph.addRelationship({ id: 'REQ-001-addresses-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addresses', sourceFile: 'test.adoc', line: 1 });
      graph.addRelationship({ id: 'REQ-001-addresses-DES-002', fromId: 'REQ-001', targetId: 'DES-002', type: 'addresses', sourceFile: 'test.adoc', line: 1 });

      const rels = graph.getRelationships('REQ-001');
      expect(rels).toHaveLength(2);
    });

    it('should return relationships by type', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
      graph.addItem({ id: 'IMP-001', title: 'Impl 1', role: 'implementation', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });

      graph.addRelationship({ id: 'REQ-001-addresses-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addresses', sourceFile: 'test.adoc', line: 1 });
      graph.addRelationship({ id: 'REQ-001-implements-IMP-001', fromId: 'REQ-001', targetId: 'IMP-001', type: 'implements', sourceFile: 'test.adoc', line: 1 });

      const addressesRels = graph.getRelationships('REQ-001', 'addresses');
      expect(addressesRels).toHaveLength(1);
      expect(addressesRels[0].type).toBe('addresses');
    });

    it('should return related items', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });

      graph.addRelationship({ id: 'REQ-001-addresses-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addresses', sourceFile: 'test.adoc', line: 1 });

      const related = graph.getRelatedItems('REQ-001');
      expect(related).toHaveLength(1);
      expect(related[0].id).toBe('DES-001');
    });

    it('should warn about invalid relations with configuration', () => {
      const configLoader = new ConfigLoader();
      const preset = configLoader.loadPreset('requirements-engineering');
      const config = preset.traceability;

      const mockConfigLoader = {
        getConfig: () => config,
        isKnownRole: (role: string) => config.roles.includes(role),
        isRelationAllowed: (sourceRole: string, targetRole: string, relType: string) => {
          const sourceRelations = config.relations?.[sourceRole];
          if (!sourceRelations) return false;
          const allowedRelations = sourceRelations[targetRole];
          if (!allowedRelations) return false;
          return allowedRelations.includes(relType);
        },
        getAllowedRelations: (sourceRole: string, targetRole: string) => {
          const sourceRelations = config.relations?.[sourceRole];
          return sourceRelations?.[targetRole] || [];
        },
        getMatrices: () => config.matrices || [],
      } as any;

      const graph = new TraceabilityGraphV2(mockConfigLoader);

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'REQ-002', title: 'Req 2', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });

      // In requirements-engineering preset, requirement to requirement has [refines, depends_on, conflicts_with]
      // So 'implements' should not be allowed
      graph.addRelationship({
        id: 'REQ-001-implements-REQ-002',
        fromId: 'REQ-001',
        targetId: 'REQ-002',
        type: 'implements',
        sourceFile: 'test.adoc',
        line: 1
      });

      const validation = graph.validate();
      expect(validation.warnings).toHaveLength(1);
      expect(validation.warnings[0].type).toBe('invalid_relation');
      expect(validation.warnings[0].message).toContain('not allowed');
    });
  });

  describe('Query methods', () => {
    it('should find path between items', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
      graph.addItem({ id: 'IMP-001', title: 'Impl 1', role: 'implementation', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });

      graph.addRelationship({ id: 'REQ-001-addresses-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addresses', sourceFile: 'test.adoc', line: 1 });
      graph.addRelationship({ id: 'DES-001-implements-IMP-001', fromId: 'DES-001', targetId: 'IMP-001', type: 'implements', sourceFile: 'test.adoc', line: 1 });

      const path = graph.findPath('REQ-001', 'IMP-001');
      expect(path).toEqual(['REQ-001', 'DES-001', 'IMP-001']);
    });

    it('should return null for non-existent path', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'IMP-001', title: 'Impl 1', role: 'implementation', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });

      const path = graph.findPath('REQ-001', 'IMP-001');
      expect(path).toBeNull();
    });

    it('should perform impact analysis', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
      graph.addItem({ id: 'IMP-001', title: 'Impl 1', role: 'implementation', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });

      graph.addRelationship({ id: 'REQ-001-addresses-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addresses', sourceFile: 'test.adoc', line: 1 });
      graph.addRelationship({ id: 'DES-001-implements-IMP-001', fromId: 'DES-001', targetId: 'IMP-001', type: 'implements', sourceFile: 'test.adoc', line: 1 });

      const impacted = graph.getImpactAnalysis('REQ-001');
      expect(impacted).toContain('DES-001');
      expect(impacted).toContain('IMP-001');
      expect(impacted).not.toContain('REQ-001');
    });
  });

  describe('Statistics', () => {
    it('should return role statistics', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'REQ-002', title: 'Req 2', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });

      const stats = graph.getRoleStatistics();
      expect(stats['requirement']).toBe(2);
      expect(stats['design']).toBe(1);
    });

    it('should return size', () => {
      const graph = new TraceabilityGraphV2();

      graph.addItem({ id: 'REQ-001', title: 'Req 1', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
      graph.addItem({ id: 'DES-001', title: 'Des 1', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });

      expect(graph.size()).toBe(2);
    });
  });
});

// ========================================================================
// MatrixGeneratorV2 Tests
// ========================================================================

describe('MatrixGeneratorV2', () => {
  let graph: TraceabilityGraphV2;

  beforeEach(() => {
    graph = new TraceabilityGraphV2();

    // Add some test data
    graph.addItem({ id: 'REQ-001', title: 'User Authentication', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 1 });
    graph.addItem({ id: 'REQ-002', title: 'Password Reset', role: 'requirement', attributes: {}, sourceFile: 'test.adoc', sourceLine: 2 });
    graph.addItem({ id: 'DES-001', title: 'Auth Service', role: 'design', attributes: {}, sourceFile: 'test.adoc', sourceLine: 3 });
    graph.addItem({ id: 'IMP-001', title: 'Auth Class', role: 'implementation', attributes: {}, sourceFile: 'test.adoc', sourceLine: 4 });
    graph.addItem({ id: 'TEST-001', title: 'Auth Tests', role: 'test', attributes: {}, sourceFile: 'test.adoc', sourceLine: 5 });

    // Add relationships
    graph.addRelationship({ id: 'REQ-001-addresses-DES-001', fromId: 'REQ-001', targetId: 'DES-001', type: 'addresses', sourceFile: 'test.adoc', line: 1 });
    graph.addRelationship({ id: 'DES-001-implements-IMP-001', fromId: 'DES-001', targetId: 'IMP-001', type: 'implements', sourceFile: 'test.adoc', line: 1 });
    graph.addRelationship({ id: 'IMP-001-tested-by-TEST-001', fromId: 'TEST-001', targetId: 'IMP-001', type: 'tested-by', sourceFile: 'test.adoc', line: 1 });
  });

  it('should generate default matrix', () => {
    const generator = new MatrixGeneratorV2(graph);
    const matrix = generator.generateMatrix();

    expect(matrix).toBeDefined();
    expect(matrix.rows).toBeDefined();
    expect(matrix.columns).toBeDefined();
    expect(matrix.coverage).toBeDefined();
  });

  it('should return role coverage', () => {
    const generator = new MatrixGeneratorV2(graph);
    const coverage = generator.getRoleCoverage('requirement');

    expect(coverage.total).toBe(2);
    expect(coverage.covered).toBeGreaterThanOrEqual(0);
    expect(coverage.coverage).toBeGreaterThanOrEqual(0);
  });

  it('should return coverage report', () => {
    const generator = new MatrixGeneratorV2(graph);
    const report = generator.getCoverageReport();

    expect(report.total_items).toBe(5);
    expect(report.roles).toContain('requirement');
    expect(report.roles).toContain('design');
  });

  it('should export matrix to CSV', () => {
    const generator = new MatrixGeneratorV2(graph);
    const matrix = generator.generateMatrix();
    const csv = generator.exportToCSV(matrix);

    expect(csv).toContain('Row ID');
    expect(csv).toContain('Row Title');
    expect(csv).toContain('REQ-001');
  });

  it('should export matrix to HTML', () => {
    const generator = new MatrixGeneratorV2(graph);
    const matrix = generator.generateMatrix();
    const html = generator.exportToHTML(matrix);

    expect(html).toContain('matrix');
    expect(html).toContain('REQ-001');
  });

  it('should get relationships between roles', () => {
    const generator = new MatrixGeneratorV2(graph);
    const rels = generator.getRelationshipsBetweenRoles('requirement', 'design');

    expect(rels).toHaveLength(1);
    expect(rels[0].fromId).toBe('REQ-001');
    expect(rels[0].targetId).toBe('DES-001');
  });

  it('should get relationship statistics', () => {
    const generator = new MatrixGeneratorV2(graph);
    const stats = generator.getRelationshipStatistics();

    expect(stats['addresses']).toBe(1);
    expect(stats['implements']).toBe(1);
    expect(stats['tested-by']).toBe(1);
  });
});

// ========================================================================
// Integration Tests
// ========================================================================

describe('Integration: DocumentParserV2 + TraceabilityGraphV2 + MatrixGeneratorV2', () => {
  it('should parse, store, and generate matrix for simple document', () => {
    const parser = new DocumentParserV2();
    const graph = new TraceabilityGraphV2();

    const content = `
[item, id=REQ-001, role=requirement, title="User Authentication"]
====
The system shall authenticate users via secure credentials.

satisfies:IMP-001[]
====

[item, id=IMP-001, role=implementation, title="Auth Service"]
====
Implementation of authentication service.
====

[item, id=TEST-001, role=test, title="Auth Tests"]
====
Tests for authentication.

verifies:REQ-001[]
tests:IMP-001[]
====
`;

    // Parse
    const result = parser.parse(content, 'test.adoc');
    expect(result.items).toHaveLength(3);
    expect(result.relationships).toHaveLength(3);

    // Add to graph
    for (const item of result.items) {
      graph.addItem(item);
    }
    for (const rel of result.relationships) {
      graph.addRelationship(rel);
    }

    expect(graph.size()).toBe(3);
    expect(graph.relationshipCount()).toBe(3);

    // Generate matrix
    const generator = new MatrixGeneratorV2(graph);
    const matrix = generator.generateMatrix();

    expect(matrix.rows).toHaveLength(1); // One requirement
    expect(matrix.rows[0].rowId).toBe('REQ-001');
  });

  it('should handle configuration-based validation', () => {
    const configLoader = new ConfigLoader();
    const preset = configLoader.loadPreset('requirements-engineering');
    const config = preset.traceability;

    const mockConfigLoader = {
      getConfig: () => config,
      isKnownRole: (role: string) => config.roles.includes(role),
      isRelationAllowed: (sourceRole: string, targetRole: string, relType: string) => {
        const sourceRelations = config.relations?.[sourceRole];
        if (!sourceRelations) return false;
        const allowedRelations = sourceRelations[targetRole];
        if (!allowedRelations) return false;
        return allowedRelations.includes(relType);
      },
      getAllowedRelations: (sourceRole: string, targetRole: string) => {
        const sourceRelations = config.relations?.[sourceRole];
        return sourceRelations?.[targetRole] || [];
      },
      getMatrices: () => config.matrices || [],
    } as any;

    const parser = new DocumentParserV2({ configLoader: mockConfigLoader });
    const graph = new TraceabilityGraphV2(mockConfigLoader);

    const content = `
[item, id=REQ-001, role=requirement]
====
Requirement

addresses:DES-001[]
====

[item, id=DES-001, role=design]
====
Design
====
`;

    const result = parser.parse(content, 'test.adoc');
    expect(result.items).toHaveLength(2);
    expect(result.relationships).toHaveLength(1);
    expect(result.relationships[0].type).toBe('addresses');

    // Add to graph
    for (const item of result.items) {
      graph.addItem(item);
    }
    for (const rel of result.relationships) {
      graph.addRelationship(rel);
    }

    // Validate
    const validation = graph.validate();
    expect(validation.errors).toHaveLength(0);

    // Generate matrix using configuration
    const generator = new MatrixGeneratorV2(graph, mockConfigLoader);
    const matrix = generator.generateMatrix('requirements-traceability');

    expect(matrix).toBeDefined();
    expect(matrix.name).toContain('requirements');
  });
});

describe('Edge cases and error handling', () => {
  it('should handle empty content', () => {
    const parser = new DocumentParserV2();
    const result = parser.parse('', 'test.adoc');

    expect(result.items).toHaveLength(0);
    expect(result.relationships).toHaveLength(0);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle malformed block macros', () => {
    const parser = new DocumentParserV2();
    const content = `[item, id=REQ-001, role=requirement]`; // Missing block
    const result = parser.parse(content, 'test.adoc');

    expect(result.items).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].message).toContain('no content block');
  });

  it('should handle item without block content', () => {
    const parser = new DocumentParserV2();
    const content = `
[item, id=REQ-001, role=requirement]
====
====
`;
    const result = parser.parse(content, 'test.adoc');

    expect(result.items).toHaveLength(1);
    expect(result.items[0].content).toBe('');
  });
});
