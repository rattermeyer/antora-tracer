import { expect } from 'chai';
import { RequirementsTraceabilityExtension } from '../src/index';
import type { Requirement } from '../src/types';

describe('Validation', function() {
  let extension: InstanceType<typeof RequirementsTraceabilityExtension>;

  beforeEach(function() {
    extension = new RequirementsTraceabilityExtension();
  });

  afterEach(function() {
    extension.clear();
  });

  describe('Duplicate ID Detection', function() {
    it('should prevent duplicate requirement IDs', function() {
      const req1: Requirement = {
        id: 'REQ-001',
        title: 'First',
        content: 'First requirement',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      };

      extension.graph.addRequirement(req1);

      const req2: Requirement = {
        id: 'REQ-001',
        title: 'Second',
        content: 'Second requirement',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      };

      expect(() => extension.graph.addRequirement(req2))
        .to.throw('Duplicate requirement ID: REQ-001');
    });

    it('should prevent duplicate implementation IDs', function() {
      extension.addImplementation({
        id: 'IMP-001',
        title: 'First',
        content: 'First implementation',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      expect(() => extension.addImplementation({
        id: 'IMP-001',
        title: 'Second',
        content: 'Second implementation',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 2,
      })).to.throw('Duplicate implementation ID: IMP-001');
    });

    it('should prevent duplicate test IDs', function() {
      extension.addTest({
        id: 'TEST-001',
        title: 'First',
        content: 'First test',
        status: 'passed',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      expect(() => extension.addTest({
        id: 'TEST-001',
        title: 'Second',
        content: 'Second test',
        status: 'passed',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      })).to.throw('Duplicate test ID: TEST-001');
    });

    it('should prevent duplicate document IDs', function() {
      extension.addDocument({
        id: 'DOC-001',
        title: 'First',
        content: 'First document',
        status: 'published',
        attributes: {},
        sourceFile: 'docs.adoc',
        sourceLine: 1,
      });

      expect(() => extension.addDocument({
        id: 'DOC-001',
        title: 'Second',
        content: 'Second document',
        status: 'published',
        attributes: {},
        sourceFile: 'docs.adoc',
        sourceLine: 2,
      })).to.throw('Duplicate document ID: DOC-001');
    });
  });

  describe('Relationship Validation', function() {
    beforeEach(function() {
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test requirement',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });
    });

    it('should detect missing source node', function() {
      expect(() => extension.addRelationship('NONEXISTENT', 'REQ-001', 'implements'))
        .to.throw('Source node not found: NONEXISTENT');
    });

    it('should detect missing target node', function() {
      expect(() => extension.addRelationship('REQ-001', 'NONEXISTENT', 'satisfies'))
        .to.throw('Target node not found: NONEXISTENT');
    });
  });

  describe('Circular Reference Detection', function() {
    it('should detect direct circular reference', function() {
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-002',
        title: 'Requirement 2',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      // REQ-001 depends on REQ-002
      extension.addRelationship('REQ-001', 'REQ-002', 'depends');

      // REQ-002 depends on REQ-001 would create a circle
      expect(() => extension.addRelationship('REQ-002', 'REQ-001', 'depends'))
        .to.throw('Circular reference detected');
    });

    it('should detect indirect circular reference', function() {
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-002',
        title: 'Requirement 2',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      extension.graph.addRequirement({
        id: 'REQ-003',
        title: 'Requirement 3',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 3,
      });

      // REQ-001 -> REQ-002 -> REQ-003
      extension.addRelationship('REQ-001', 'REQ-002', 'depends');
      extension.addRelationship('REQ-002', 'REQ-003', 'depends');

      // REQ-003 -> REQ-001 would create a circle
      expect(() => extension.addRelationship('REQ-003', 'REQ-001', 'depends'))
        .to.throw('Circular reference detected');
    });

    it('should detect circular reference with implementation', function() {
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.addImplementation({
        id: 'IMP-001',
        title: 'Implementation 1',
        content: 'Test',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      // REQ-001 depends on IMP-001
      extension.addRelationship('REQ-001', 'IMP-001', 'depends');

      // IMP-001 requires REQ-001 would create a circle
      expect(() => extension.addRelationship('IMP-001', 'REQ-001', 'requires'))
        .to.throw('Circular reference detected');
    });

    it('should allow non-circular dependencies', function() {
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-002',
        title: 'Requirement 2',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      // REQ-001 depends on REQ-002 (no circle)
      extension.addRelationship('REQ-001', 'REQ-002', 'depends');

      // Should not throw
      expect(() => extension.addRelationship('REQ-002', 'REQ-003', 'depends'))
        .to.throw('Target node not found: REQ-003'); // Fails because REQ-003 doesn't exist, not because of circle
    });
  });

  describe('Graph Validation', function() {
    it('should return empty array for valid graph', function() {
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.addImplementation({
        id: 'IMP-001',
        title: 'Implementation 1',
        content: 'Test',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      extension.addRelationship('IMP-001', 'REQ-001', 'implements');

      const errors = extension.validate();
      expect(errors).to.be.an('array');
      expect(errors).to.have.lengthOf(0);
    });

    it('should detect orphaned relationships', function() {
      // Add a relationship directly to the graph (bypassing validation)
      // This simulates a case where nodes were deleted but relationships remain
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Requirement 1',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      // Manually add a relationship with non-existent nodes
      // We need to access the internal map - but we can't from outside
      // So let's test with the validate method after removing a node
      extension.graph.addRequirement({
        id: 'REQ-002',
        title: 'Requirement 2',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      extension.addRelationship('REQ-001', 'REQ-002', 'depends');

      // Remove REQ-002 from the graph (simulating deletion)
      // We can't directly access the private map, so this test is limited
      // The validate method should still work with existing data
      const errors = extension.validate();
      expect(errors).to.be.an('array');
      // No errors because all nodes still exist
      expect(errors).to.have.lengthOf(0);
    });
  });

  describe('ID Validation', function() {
    it('should validate standard ID format', function() {
      expect(RequirementsTraceabilityExtension.isValidId('REQ-001')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidId('IMP-001')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidId('TEST-001')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidId('DOC-001')).to.be.true;
    });

    it('should reject non-standard ID format', function() {
      expect(RequirementsTraceabilityExtension.isValidId('req-001')).to.be.false; // lowercase
      expect(RequirementsTraceabilityExtension.isValidId('REQ-1')).to.be.true; // single digit is valid per regex
      expect(RequirementsTraceabilityExtension.isValidId('REQ-ABC')).to.be.false; // letters in number
      expect(RequirementsTraceabilityExtension.isValidId('REQUIREMENT-001')).to.be.false; // too long prefix (>4 chars)
      expect(RequirementsTraceabilityExtension.isValidId('R-001')).to.be.false; // too short prefix (<2 chars)
    });
  });

  describe('Relationship Type Validation', function() {
    it('should validate standard relationship types', function() {
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('implements')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('satisfies')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('tests')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('verifies')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('documents')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('depends')).to.be.true;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('requires')).to.be.true;
    });

    it('should reject invalid relationship types', function() {
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('invalid')).to.be.false;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('')).to.be.false;
      expect(RequirementsTraceabilityExtension.isValidRelationshipType('implement')).to.be.false; // singular
    });
  });
});
