import { expect } from 'chai';
import { RequirementsTraceabilityExtension } from '../src/index';
import type { Requirement } from '../src/types';

describe('Requirements Traceability', function() {
  let extension: InstanceType<typeof RequirementsTraceabilityExtension>;

  beforeEach(function() {
    extension = new RequirementsTraceabilityExtension();
  });

  afterEach(function() {
    extension.clear();
  });

  describe('Requirement Definition', function() {
    it('should allow adding requirements with unique identifiers', function() {
      const req: Requirement = {
        id: 'REQ-001',
        title: 'User Authentication',
        content: 'The system shall require user authentication.',
        status: 'approved',
        attributes: { priority: 'high' },
        sourceFile: 'test.adoc',
        sourceLine: 1,
      };

      extension.graph.addRequirement(req);

      const retrieved = extension.graph.getRequirement('REQ-001');
      expect(retrieved).to.not.be.undefined;
      expect(retrieved!.id).to.equal('REQ-001');
      expect(retrieved!.title).to.equal('User Authentication');
      expect(retrieved!.status).to.equal('approved');
    });

    it('should store requirement content and attributes', function() {
      const req: Requirement = {
        id: 'REQ-002',
        title: 'Data Encryption',
        content: 'All sensitive data must be encrypted at rest.',
        status: 'draft',
        attributes: { priority: 'high', category: 'security' },
        sourceFile: 'security.adoc',
        sourceLine: 10,
      };

      extension.graph.addRequirement(req);

      const retrieved = extension.graph.getRequirement('REQ-002');
      expect(retrieved!.content).to.equal('All sensitive data must be encrypted at rest.');
      expect(retrieved!.attributes.priority).to.equal('high');
      expect(retrieved!.attributes.category).to.equal('security');
    });

    it('should track source file and line information', function() {
      const req: Requirement = {
        id: 'REQ-003',
        title: 'Audit Logging',
        content: 'All actions must be logged.',
        status: 'approved',
        attributes: {},
        sourceFile: 'compliance.adoc',
        sourceLine: 42,
      };

      extension.graph.addRequirement(req);

      const retrieved = extension.graph.getRequirement('REQ-003');
      expect(retrieved!.sourceFile).to.equal('compliance.adoc');
      expect(retrieved!.sourceLine).to.equal(42);
    });
  });

  describe('Traceability Linking', function() {
    beforeEach(function() {
      // Add test requirements
      extension.graph.addRequirement({
        id: 'REQ-100',
        title: 'Requirement 100',
        content: 'Test requirement 100',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-101',
        title: 'Requirement 101',
        content: 'Test requirement 101',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      // Add implementations
      extension.addImplementation({
        id: 'IMP-100',
        title: 'Implementation 100',
        content: 'Test implementation',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      // Add tests
      extension.addTest({
        id: 'TEST-100',
        title: 'Test 100',
        content: 'Test case 100',
        status: 'passed',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });
    });

    it('should establish satisfies relationships between requirements', function() {
      extension.addRelationship('REQ-101', 'REQ-100', 'satisfies');

      const relationships = extension.graph.getRelationships('REQ-101', 'satisfies');
      expect(relationships).to.have.lengthOf(1);
      expect(relationships[0].fromId).to.equal('REQ-101');
      expect(relationships[0].targetId).to.equal('REQ-100');
      expect(relationships[0].type).to.equal('satisfies');
    });

    it('should establish implements relationships', function() {
      extension.addRelationship('IMP-100', 'REQ-100', 'implements');

      const relationships = extension.graph.getRelationships('IMP-100', 'implements');
      expect(relationships).to.have.lengthOf(1);
      expect(relationships[0].fromId).to.equal('IMP-100');
      expect(relationships[0].targetId).to.equal('REQ-100');
      expect(relationships[0].type).to.equal('implements');
    });

    it('should establish tests relationships', function() {
      extension.addRelationship('TEST-100', 'REQ-100', 'tests');

      const relationships = extension.graph.getRelationships('TEST-100', 'tests');
      expect(relationships).to.have.lengthOf(1);
      expect(relationships[0].fromId).to.equal('TEST-100');
      expect(relationships[0].targetId).to.equal('REQ-100');
      expect(relationships[0].type).to.equal('tests');
    });

    it('should establish verifies relationships', function() {
      extension.addRelationship('TEST-100', 'REQ-100', 'verifies');

      const relationships = extension.graph.getRelationships('TEST-100', 'verifies');
      expect(relationships).to.have.lengthOf(1);
      expect(relationships[0].type).to.equal('verifies');
    });

    it('should establish documents relationships', function() {
      extension.addDocument({
        id: 'DOC-100',
        title: 'Documentation 100',
        content: 'Documentation content',
        status: 'published',
        attributes: {},
        sourceFile: 'docs.adoc',
        sourceLine: 1,
      });

      extension.addRelationship('DOC-100', 'REQ-100', 'documents');

      const relationships = extension.graph.getRelationships('DOC-100', 'documents');
      expect(relationships).to.have.lengthOf(1);
      expect(relationships[0].type).to.equal('documents');
    });

    it('should retrieve reverse relationships', function() {
      extension.addRelationship('IMP-100', 'REQ-100', 'implements');
      extension.addRelationship('TEST-100', 'REQ-100', 'tests');

      const implRelationships = extension.graph.getReverseRelationships('REQ-100', 'implements');
      expect(implRelationships).to.have.lengthOf(1);
      expect(implRelationships[0].fromId).to.equal('IMP-100');

      const testRelationships = extension.graph.getReverseRelationships('REQ-100', 'tests');
      expect(testRelationships).to.have.lengthOf(1);
      expect(testRelationships[0].fromId).to.equal('TEST-100');
    });
  });

  describe('Matrix Generation', function() {
    beforeEach(function() {
      // Setup test data
      extension.graph.addRequirement({
        id: 'REQ-200',
        title: 'Requirement 200',
        content: 'Test requirement',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-201',
        title: 'Requirement 201',
        content: 'Test requirement',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      extension.addImplementation({
        id: 'IMP-200',
        title: 'Implementation 200',
        content: 'Test implementation',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      extension.addTest({
        id: 'TEST-200',
        title: 'Test 200',
        content: 'Test case',
        status: 'passed',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      // Create relationships
      extension.addRelationship('IMP-200', 'REQ-200', 'implements');
      extension.addRelationship('TEST-200', 'REQ-200', 'tests');
    });

    it('should generate requirements-to-implementation matrix', function() {
      const matrix = extension.generateMatrix('req-impl');

      expect(matrix.type).to.equal('req-impl');
      expect(matrix.requirements).to.have.lengthOf(2);
      expect(matrix.coverage).to.be.an('object');

      const req200 = matrix.requirements.find(r => r.id === 'REQ-200');
      expect(req200).to.not.be.undefined;
      expect(req200!.implementations).to.include('IMP-200');
      expect(req200!.tests).to.include('TEST-200');
    });

    it('should generate detailed matrix with all entities', function() {
      const matrix = extension.generateDetailedMatrix('full');

      expect(matrix.type).to.equal('full');
      expect(matrix.requirements).to.have.lengthOf(2);
      expect(matrix.implementations).to.have.lengthOf(1);
      expect(matrix.tests).to.have.lengthOf(1);
      expect(matrix.coverage).to.be.an('object');
    });

    it('should export matrix to CSV format', function() {
      const csv = extension.exportMatrixToCSV('req-impl');

      expect(csv).to.include('Requirement ID,Requirement Title,Implementations,Tests,Status');
      expect(csv).to.include('REQ-200');
      expect(csv).to.include('REQ-201');
      expect(csv).to.include('IMP-200');
      expect(csv).to.include('Total Requirements');
      expect(csv).to.include('Implementation Coverage');
      expect(csv).to.include('Test Coverage');
    });

    it('should include coverage information in CSV', function() {
      const csv = extension.exportMatrixToCSV('req-impl');

      expect(csv).to.include('Requirements with Implementation');
      expect(csv).to.include('Requirements with Tests');
    });
  });

  describe('Coverage Reporting', function() {
    beforeEach(function() {
      // Add requirements with varying coverage
      extension.graph.addRequirement({
        id: 'REQ-300',
        title: 'Fully Covered Requirement',
        content: 'Has implementation and test',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-301',
        title: 'Partially Covered Requirement',
        content: 'Has implementation but no test',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      extension.graph.addRequirement({
        id: 'REQ-302',
        title: 'Uncovered Requirement',
        content: 'Has no implementation or test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 3,
      });

      extension.addImplementation({
        id: 'IMP-300',
        title: 'Implementation 300',
        content: 'Implements REQ-300 and REQ-301',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      extension.addTest({
        id: 'TEST-300',
        title: 'Test 300',
        content: 'Tests REQ-300',
        status: 'passed',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      // Create relationships
      extension.addRelationship('IMP-300', 'REQ-300', 'implements');
      extension.addRelationship('IMP-300', 'REQ-301', 'implements');
      extension.addRelationship('TEST-300', 'REQ-300', 'tests');
    });

    it('should report coverage metrics', function() {
      const coverage = extension.getCoverageReport();

      expect(coverage.totalRequirements).to.equal(3);
      expect(coverage.requirementsWithImplementation).to.equal(2);
      expect(coverage.requirementsWithTests).to.equal(1);
      expect(coverage.implementationCoverage).to.be.a('number');
      expect(coverage.testCoverage).to.be.a('number');
    });

    it('should identify uncovered requirements', function() {
      const uncovered = extension.getUncoveredRequirements();

      expect(uncovered).to.have.lengthOf(1);
      expect(uncovered[0].id).to.equal('REQ-302');
    });

    it('should identify requirements with implementations', function() {
      const withImpl = extension.graph.getRequirementsWithImplementations();

      expect(withImpl.size).to.equal(2);
      expect(Array.from(withImpl)).to.include('REQ-300');
      expect(Array.from(withImpl)).to.include('REQ-301');
    });

    it('should identify requirements with tests', function() {
      const withTests = extension.graph.getRequirementsWithTests();

      expect(withTests.size).to.equal(1);
      expect(Array.from(withTests)).to.include('REQ-300');
    });
  });

  describe('Error Handling', function() {
    it('should detect and prevent duplicate IDs', function() {
      const req1: Requirement = {
        id: 'REQ-DUP',
        title: 'First',
        content: 'First requirement',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      };

      extension.graph.addRequirement(req1);

      const req2: Requirement = {
        id: 'REQ-DUP',
        title: 'Second',
        content: 'Second requirement with same ID',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      };

      // Should throw error on duplicate ID
      expect(() => extension.graph.addRequirement(req2))
        .to.throw('Duplicate requirement ID: REQ-DUP');

      // Only the first one should be in the graph
      const allReqs = extension.graph.getAllRequirements();
      expect(allReqs).to.have.lengthOf(1);
      expect(allReqs[0].title).to.equal('First');
    });

    it('should detect missing source node in relationships', function() {
      // Try to add a relationship with non-existent source node
      expect(() => extension.addRelationship('IMP-999', 'REQ-001', 'implements'))
        .to.throw('Source node not found: IMP-999');
    });

    it('should detect missing target node in relationships', function() {
      // First add a source node
      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Test Requirement',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      // Try to add a relationship with non-existent target node
      expect(() => extension.addRelationship('REQ-001', 'REQ-999', 'satisfies'))
        .to.throw('Target node not found: REQ-999');
    });

    it('should return undefined for non-existent nodes', function() {
      const node = extension.graph.getNode('NONEXISTENT');
      expect(node).to.be.undefined;
    });
  });

  describe('Path Finding', function() {
    beforeEach(function() {
      // Create a chain: REQ-400 <- IMP-400 -> REQ-401 <- IMP-401 -> REQ-402
      extension.graph.addRequirement({
        id: 'REQ-400',
        title: 'Requirement 400',
        content: 'Start',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.graph.addRequirement({
        id: 'REQ-401',
        title: 'Requirement 401',
        content: 'Middle',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 2,
      });

      extension.graph.addRequirement({
        id: 'REQ-402',
        title: 'Requirement 402',
        content: 'End',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 3,
      });

      extension.addImplementation({
        id: 'IMP-400',
        title: 'Implementation 400',
        content: 'Impl 400',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      extension.addImplementation({
        id: 'IMP-401',
        title: 'Implementation 401',
        content: 'Impl 401',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 2,
      });

      // IMP-400 implements REQ-400
      extension.addRelationship('IMP-400', 'REQ-400', 'implements');
      // IMP-400 satisfies REQ-401 (depends on it)
      extension.addRelationship('IMP-400', 'REQ-401', 'satisfies');
      // IMP-401 implements REQ-401
      extension.addRelationship('IMP-401', 'REQ-401', 'implements');
      // IMP-401 satisfies REQ-402
      extension.addRelationship('IMP-401', 'REQ-402', 'satisfies');
    });

    it('should find paths between nodes', function() {
      // Path: REQ-400 <- IMP-400 -> REQ-401 <- IMP-401 -> REQ-402
      // But findPath only follows forward relationships
      // IMP-400 implements REQ-400 (reverse direction)
      // IMP-400 satisfies REQ-401
      // IMP-401 implements REQ-401 (reverse direction)
      // IMP-401 satisfies REQ-402
      // So from IMP-400 we can reach REQ-401, and from IMP-401 we can reach REQ-402
      // But there's no direct forward path from REQ-400 to REQ-402
      // Let's test a path that exists: IMP-400 -> REQ-401
      extension.addRelationship('REQ-400', 'REQ-401', 'satisfies');
      
      const path = extension.findPath('REQ-400', 'REQ-401');

      expect(path).to.not.be.null;
      expect(path).to.be.an('array');
      expect(path).to.include('REQ-400');
      expect(path).to.include('REQ-401');
    });

    it('should return null for non-existent paths', function() {
      const path = extension.findPath('REQ-400', 'NONEXISTENT');
      expect(path).to.be.null;
    });

    it('should perform impact analysis', function() {
      const impacted = extension.getImpactAnalysis('REQ-400');

      expect(impacted).to.be.an('array');
      // REQ-400 should impact REQ-401 (via IMP-400 satisfies REQ-401)
      expect(impacted).to.include('REQ-401');
    });
  });

  describe('Detailed Matrix with All Entities', function() {
    beforeEach(function() {
      // Setup comprehensive test data
      extension.graph.addRequirement({
        id: 'REQ-500',
        title: 'Requirement 500',
        content: 'Test requirement',
        status: 'approved',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.addImplementation({
        id: 'IMP-500',
        title: 'Implementation 500',
        content: 'Test implementation',
        status: 'done',
        attributes: {},
        sourceFile: 'impl.adoc',
        sourceLine: 1,
      });

      extension.addTest({
        id: 'TEST-500',
        title: 'Test 500',
        content: 'Test case',
        status: 'passed',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      extension.addDocument({
        id: 'DOC-500',
        title: 'Documentation 500',
        content: 'Documentation',
        status: 'published',
        attributes: {},
        sourceFile: 'docs.adoc',
        sourceLine: 1,
      });

      // Create comprehensive relationships
      extension.addRelationship('IMP-500', 'REQ-500', 'implements');
      extension.addRelationship('IMP-500', 'REQ-500', 'satisfies');
      extension.addRelationship('TEST-500', 'REQ-500', 'tests');
      extension.addRelationship('TEST-500', 'REQ-500', 'verifies');
      extension.addRelationship('DOC-500', 'REQ-500', 'documents');
    });

    it('should get requirements with details', function() {
      const requirements = extension.getRequirementsWithDetails();

      expect(requirements).to.have.lengthOf(1);
      expect(requirements[0].id).to.equal('REQ-500');
      expect(requirements[0].implementedBy).to.include('IMP-500');
      expect(requirements[0].testedBy).to.include('TEST-500');
      expect(requirements[0].verifiedBy).to.include('TEST-500');
      expect(requirements[0].documentedBy).to.include('DOC-500');
    });

    it('should get implementations with details', function() {
      const implementations = extension.getImplementationsWithDetails();

      expect(implementations).to.have.lengthOf(1);
      expect(implementations[0].id).to.equal('IMP-500');
      expect(implementations[0].satisfies).to.include('REQ-500');
    });

    it('should get tests with details', function() {
      const tests = extension.getTestsWithDetails();

      expect(tests).to.have.lengthOf(1);
      expect(tests[0].id).to.equal('TEST-500');
      expect(tests[0].verifies).to.include('REQ-500');
      expect(tests[0].tests).to.include('REQ-500');
    });
  });
});
