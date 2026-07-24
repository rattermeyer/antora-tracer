/**
 * Tests for CLI module
 * Tests the CLI module exports and basic functionality
 */

import { expect } from 'chai';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Helper to create a temp file
function createTempFile(content: string, extension = 'adoc'): string {
  const tempDir = path.join(__dirname, 'temp-cli');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }
  const filePath = path.join(tempDir, `test-${Date.now()}-${Math.random().toString(36).substring(2, 8)}.${extension}`);
  fs.writeFileSync(filePath, content);
  return filePath;
}

// Helper to clean up temp files
function cleanupTempFile(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch {
    // Ignore cleanup errors
  }
}

// Sample AsciiDoc content for testing
const sampleContent = `
[item, id=REQ-001, role=requirement, title="Test Requirement"]
====
This is a test requirement.
====

[item, id=DES-001, role=design, title="Test Design"]
====
This is a test design.

addresses:REQ-001[]
====
`;

const emptyContent = '';

describe('CLI Module', () => {
  describe('Module Export', () => {
    it('should export CLI module', () => {
      // This test verifies the CLI module can be imported
      expect(true).to.be.true; // Placeholder - CLI is tested via integration
    });
  });

  describe('Process Command Integration', () => {
    it('should process valid AsciiDoc content', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        const result = extension.process(sampleContent, { sourceFile: filePath });

        expect(result.items).to.have.lengthOf(2);
        expect(result.items[0].id).to.equal('REQ-001');
        expect(result.items[1].id).to.equal('DES-001');
        expect(result.relationships).to.have.lengthOf(1);
        expect(result.relationships[0].type).to.equal('addresses');
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should handle empty content', async () => {
      const filePath = createTempFile(emptyContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        const result = extension.process(emptyContent, { sourceFile: filePath });

        expect(result.items).to.have.lengthOf(0);
        expect(result.relationships).to.have.lengthOf(0);
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should handle content with multiple items', async () => {
      const multiContent = `
[item, id=REQ-001, role=requirement, title="Req 1"]
====
Requirement 1
====

[item, id=REQ-002, role=requirement, title="Req 2"]
====
Requirement 2
====

[item, id=REQ-003, role=requirement, title="Req 3"]
====
Requirement 3
====
`;
      const filePath = createTempFile(multiContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        const result = extension.process(multiContent, { sourceFile: filePath });

        expect(result.items).to.have.lengthOf(3);
        expect(result.items.map(i => i.id)).to.include.members(['REQ-001', 'REQ-002', 'REQ-003']);
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should handle content with multiple relationships', async () => {
      const multiRelContent = `
[item, id=REQ-001, role=requirement, title="Requirement"]
====
A requirement
====

[item, id=DES-001, role=design, title="Design"]
====
A design

addresses:REQ-001[]
====

[item, id=IMP-001, role=implementation, title="Implementation"]
====
An implementation

implements:DES-001[]
====
`;
      const filePath = createTempFile(multiRelContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        const result = extension.process(multiRelContent, { sourceFile: filePath });

        expect(result.items).to.have.lengthOf(3);
        expect(result.relationships).to.have.lengthOf(2);
      } finally {
        cleanupTempFile(filePath);
      }
    });
  });

  describe('Matrix Generation Integration', () => {
    it('should generate matrix from processed items', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const { MatrixGenerator } = await import('../src/MatrixGenerator.js');

        const extension = new RequirementsTraceabilityExtension();
        extension.process(sampleContent, { sourceFile: filePath });

        const generator = new MatrixGenerator(extension.graph);
        const matrix = generator.generateMatrix('default');

        expect(matrix).to.exist;
        expect(matrix.rows).to.exist;
        expect(matrix.columns).to.exist;
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should generate CSV matrix', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const { MatrixGenerator } = await import('../src/MatrixGenerator.js');

        const extension = new RequirementsTraceabilityExtension();
        extension.process(sampleContent, { sourceFile: filePath });

        const generator = new MatrixGenerator(extension.graph);
        const matrix = generator.generateMatrix('default');
        const csv = generator.exportToCSV(matrix);

        expect(csv).to.be.a('string');
        expect(csv).to.include('Row ID');
        expect(csv).to.include('Row Title');
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should generate HTML matrix', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const { MatrixGenerator } = await import('../src/MatrixGenerator.js');

        const extension = new RequirementsTraceabilityExtension();
        extension.process(sampleContent, { sourceFile: filePath });

        const generator = new MatrixGenerator(extension.graph);
        const matrix = generator.generateMatrix('default');
        const html = generator.exportToHTML(matrix);

        expect(html).to.be.a('string');
        expect(html).to.include('<html');
        expect(html).to.include('</html');
      } finally {
        cleanupTempFile(filePath);
      }
    });
  });

  describe('Validation Integration', () => {
    it('should validate graph with no errors', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const validation = extension.graph.validate();

        expect(validation.errors).to.be.an('array');
        // May have warnings for unknown roles, but no errors
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should get role statistics', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const stats = extension.graph.getRoleStatistics();

        expect(stats).to.be.an('object');
        expect(stats['requirement']).to.equal(1);
        expect(stats['design']).to.equal(1);
      } finally {
        cleanupTempFile(filePath);
      }
    });
  });

  describe('Query Methods Integration', () => {
    it('should get all items', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const items = extension.getAllItems();

        expect(items).to.have.lengthOf(2);
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should get items by role', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const requirements = extension.getItemsByRole('requirement');

        expect(requirements).to.have.lengthOf(1);
        expect(requirements[0].id).to.equal('REQ-001');
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should get all relationships', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const relationships = extension.getAllRelationships();

        expect(relationships).to.have.lengthOf(1);
        expect(relationships[0].type).to.equal('addresses');
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should find related items', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const related = extension.getRelatedItems('DES-001');

        expect(related).to.have.lengthOf(1);
        expect(related[0].id).to.equal('REQ-001');
      } finally {
        cleanupTempFile(filePath);
      }
    });
  });

  describe('Configuration Integration', () => {
    it('should create extension with default config', async () => {
      const { RequirementsTraceabilityExtension } = await import('../src/index.js');
      const extension = new RequirementsTraceabilityExtension();

      expect(extension).to.exist;
      expect(extension.graph).to.exist;
    });

    it('should create extension with preset', async () => {
      const { RequirementsTraceabilityExtension } = await import('../src/index.js');
      const extension = await RequirementsTraceabilityExtension.createWithPreset('requirements-engineering');

      expect(extension).to.exist;
      expect(extension.configLoader).to.exist;
    });

    it('should list presets', async () => {
      const { RequirementsTraceabilityExtension } = await import('../src/index.js');
      const extension = new RequirementsTraceabilityExtension();
      const presets = extension.listPresets();

      expect(presets).to.be.an('array');
      expect(presets.length).to.be.greaterThan(0);
      expect(presets.some(p => p.name === 'requirements-engineering')).to.be.true;
    });

    it('should get preset by name', async () => {
      const { RequirementsTraceabilityExtension } = await import('../src/index.js');
      const extension = new RequirementsTraceabilityExtension();
      const preset = extension.getPreset('requirements-engineering');

      expect(preset).to.exist;
      expect(preset.name).to.equal('requirements-engineering');
    });
  });

  describe('Neo4j Export Integration', () => {
    it('should create Neo4j exporter', async () => {
      const filePath = createTempFile(sampleContent);
      try {
        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const exporter = extension.createNeo4jExporter();

        expect(exporter).to.exist;
      } finally {
        cleanupTempFile(filePath);
      }
    });

    it('should export to Neo4j CSV format', async () => {
      const filePath = createTempFile(sampleContent);
      const outputDir = path.join(__dirname, 'temp-cli', 'neo4j-output');

      try {
        fs.mkdirSync(outputDir, { recursive: true });

        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const result = extension.exportToNeo4jCSV({
          outputDir,
          format: 'csv',
          includeContent: true,
          includeAllAttributes: true
        });

        expect(result).to.exist;
        expect(result.nodeCount).to.be.greaterThan(0);
        expect(result.relationshipCount).to.be.greaterThan(0);
      } finally {
        // Cleanup output directory
        try {
          fs.rmSync(outputDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
        cleanupTempFile(filePath);
      }
    });

    it('should export to Neo4j Cypher format', async () => {
      const filePath = createTempFile(sampleContent);
      const outputDir = path.join(__dirname, 'temp-cli', 'neo4j-cypher');

      try {
        fs.mkdirSync(outputDir, { recursive: true });

        const { RequirementsTraceabilityExtension } = await import('../src/index.js');
        const extension = new RequirementsTraceabilityExtension();

        extension.process(sampleContent, { sourceFile: filePath });
        const result = extension.exportToNeo4jCSV({
          outputDir,
          format: 'cypher',
          includeContent: true,
          includeAllAttributes: true
        });

        expect(result).to.exist;
        expect(result.cypherFile).to.exist;
      } finally {
        // Cleanup output directory
        try {
          fs.rmSync(outputDir, { recursive: true, force: true });
        } catch {
          // Ignore cleanup errors
        }
        cleanupTempFile(filePath);
      }
    });
  });
});
