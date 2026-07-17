const { expect } = require('chai');
const RequirementsTraceabilityExtension = require('../src/index.js');

describe('Traceability Graph', function() {
  let extension;

  beforeEach(function() {
    extension = new RequirementsTraceabilityExtension();
  });

  afterEach(function() {
    extension.clear();
  });

  describe('Graph Structure', function() {
    it('should initialize with empty maps', function() {
      expect(extension.requirements).to.be.a('map');
      expect(extension.implementations).to.be.a('map');
      expect(extension.tests).to.be.a('map');
      expect(extension.documents).to.be.a('map');
      expect(extension.relationships).to.be.a('map');
      expect(extension.graph).to.be.an('object');
    });

    it('should have graph methods', function() {
      expect(extension.graph.addRequirement).to.be.a('function');
      expect(extension.graph.addImplementation).to.be.a('function');
      expect(extension.graph.addTest).to.be.a('function');
      expect(extension.graph.addRelationship).to.be.a('function');
      expect(extension.graph.getCoverage).to.be.a('function');
    });
  });

  describe('Requirement Management', function() {
    it('should add requirements to graph', function() {
      const req = { id: 'REQ-001', title: 'Test Requirement' };
      extension.graph.addRequirement(req);
      
      expect(extension.requirements.size).to.equal(1);
      expect(extension.graph.getRequirement('REQ-001')).to.equal(req);
    });

    it('should retrieve requirements by ID', function() {
      const req = { id: 'REQ-002', title: 'Another Requirement' };
      extension.graph.addRequirement(req);
      
      const retrieved = extension.graph.getRequirement('REQ-002');
      expect(retrieved).to.equal(req);
    });
  });

  describe('Implementation Management', function() {
    it('should add implementations to graph', function() {
      const imp = { id: 'IMP-001', title: 'Test Implementation' };
      extension.addImplementation(imp);
      
      expect(extension.implementations.size).to.equal(1);
      expect(extension.graph.getImplementation('IMP-001')).to.equal(imp);
    });

    it('should retrieve implementations by ID', function() {
      const imp = { id: 'IMP-002', title: 'Another Implementation' };
      extension.addImplementation(imp);
      
      const retrieved = extension.graph.getImplementation('IMP-002');
      expect(retrieved).to.equal(imp);
    });
  });

  describe('Test Management', function() {
    it('should add tests to graph', function() {
      const test = { id: 'TEST-001', title: 'Test Case' };
      extension.addTest(test);
      
      expect(extension.tests.size).to.equal(1);
      expect(extension.graph.getTest('TEST-001')).to.equal(test);
    });

    it('should retrieve tests by ID', function() {
      const test = { id: 'TEST-002', title: 'Another Test' };
      extension.addTest(test);
      
      const retrieved = extension.graph.getTest('TEST-002');
      expect(retrieved).to.equal(test);
    });
  });

  describe('Relationship Management', function() {
    beforeEach(function() {
      // Add some nodes for relationship testing
      extension.graph.addRequirement({ id: 'REQ-100', title: 'Requirement 100' });
      extension.graph.addRequirement({ id: 'REQ-101', title: 'Requirement 101' });
      extension.addImplementation({ id: 'IMP-100', title: 'Implementation 100' });
      extension.addTest({ id: 'TEST-100', title: 'Test 100' });
    });

    it('should add relationships between nodes', function() {
      extension.addRelationship('IMP-100', 'REQ-100', 'satisfies');
      
      expect(extension.relationships.size).to.equal(1);
      
      const relationships = extension.graph.getRelationships('IMP-100');
      expect(relationships.length).to.equal(1);
      expect(relationships[0].type).to.equal('satisfies');
      expect(relationships[0].targetId).to.equal('REQ-100');
    });

    it('should get relationships by type', function() {
      extension.addRelationship('IMP-100', 'REQ-100', 'satisfies');
      extension.addRelationship('IMP-100', 'REQ-101', 'implements');
      extension.addRelationship('TEST-100', 'REQ-100', 'tests');
      
      const satisfiesRels = extension.graph.getRelationships('IMP-100', 'satisfies');
      expect(satisfiesRels.length).to.equal(1);
      expect(satisfiesRels[0].targetId).to.equal('REQ-100');
    });

    it('should get reverse relationships', function() {
      extension.addRelationship('IMP-100', 'REQ-100', 'satisfies');
      extension.addRelationship('TEST-100', 'REQ-100', 'tests');
      
      const reverseRels = extension.graph.getReverseRelationships('REQ-100');
      expect(reverseRels.length).to.equal(2);
      expect(reverseRels.map(r => r.fromId)).to.include.members(['IMP-100', 'TEST-100']);
    });
  });

  describe('Coverage Analysis', function() {
    beforeEach(function() {
      // Set up a graph with requirements and relationships
      extension.graph.addRequirement({ id: 'REQ-200', title: 'Requirement 200' });
      extension.graph.addRequirement({ id: 'REQ-201', title: 'Requirement 201' });
      extension.graph.addRequirement({ id: 'REQ-202', title: 'Requirement 202' });
      
      extension.addImplementation({ id: 'IMP-200', title: 'Implementation 200' });
      extension.addTest({ id: 'TEST-200', title: 'Test 200' });
      
      // Add relationships
      extension.addRelationship('IMP-200', 'REQ-200', 'implements');
      extension.addRelationship('TEST-200', 'REQ-200', 'tests');
      extension.addRelationship('IMP-200', 'REQ-201', 'implements');
      // REQ-202 has no implementation or test
    });

    it('should calculate coverage metrics', function() {
      const coverage = extension.getCoverageReport();
      
      expect(coverage.totalRequirements).to.equal(3);
      expect(coverage.requirementsWithImplementation).to.equal(2);
      expect(coverage.requirementsWithTests).to.equal(1);
      expect(coverage.implementationCoverage).to.be.closeTo(66.67, 0.1);
      expect(coverage.testCoverage).to.be.closeTo(33.33, 0.1);
    });

    it('should identify requirements with implementations', function() {
      const reqsWithImpl = extension.graph.getRequirementsWithImplementations();
      expect(reqsWithImpl.size).to.equal(2);
      expect(Array.from(reqsWithImpl)).to.include.members(['REQ-200', 'REQ-201']);
    });

    it('should identify requirements with tests', function() {
      const reqsWithTests = extension.graph.getRequirementsWithTests();
      expect(reqsWithTests.size).to.equal(1);
      expect(Array.from(reqsWithTests)).to.include.members(['REQ-200']);
    });

    it('should find uncovered requirements', function() {
      const uncovered = extension.getUncoveredRequirements();
      expect(uncovered.length).to.equal(1);
      expect(uncovered[0].id).to.equal('REQ-202');
    });
  });

  describe('Path Finding', function() {
    beforeEach(function() {
      // Set up a graph with relationships
      extension.graph.addRequirement({ id: 'REQ-300', title: 'Requirement 300' });
      extension.graph.addRequirement({ id: 'REQ-301', title: 'Requirement 301' });
      extension.graph.addRequirement({ id: 'REQ-302', title: 'Requirement 302' });
      
      extension.addImplementation({ id: 'IMP-300', title: 'Implementation 300' });
      extension.addImplementation({ id: 'IMP-301', title: 'Implementation 301' });
      
      // Create a chain: IMP-300 -> REQ-300 -> IMP-301 -> REQ-301
      extension.addRelationship('IMP-300', 'REQ-300', 'implements');
      extension.addRelationship('REQ-300', 'IMP-301', 'requires');
      extension.addRelationship('IMP-301', 'REQ-301', 'implements');
    });

    it('should find paths between nodes', function() {
      const path = extension.findPath('IMP-300', 'REQ-301');
      expect(path).to.be.an('array');
      expect(path).to.include.members(['IMP-300', 'REQ-300', 'IMP-301', 'REQ-301']);
    });

    it('should return null for non-existent paths', function() {
      const path = extension.findPath('IMP-300', 'REQ-302');
      expect(path).to.be.null;
    });

    it('should handle circular references', function() {
      // Add a circular reference
      extension.addRelationship('REQ-301', 'IMP-300', 'depends');
      
      const path = extension.findPath('IMP-300', 'REQ-301');
      expect(path).to.be.an('array');
      expect(path.length).to.be.at.most(5); // Should not infinite loop
    });
  });

  describe('Impact Analysis', function() {
    beforeEach(function() {
      // Set up a complex graph
      extension.graph.addRequirement({ id: 'REQ-400', title: 'Requirement 400' });
      extension.graph.addRequirement({ id: 'REQ-401', title: 'Requirement 401' });
      extension.graph.addRequirement({ id: 'REQ-402', title: 'Requirement 402' });
      
      extension.addImplementation({ id: 'IMP-400', title: 'Implementation 400' });
      extension.addImplementation({ id: 'IMP-401', title: 'Implementation 401' });
      extension.addTest({ id: 'TEST-400', title: 'Test 400' });
      
      // Create relationships
      extension.addRelationship('IMP-400', 'REQ-400', 'implements');
      extension.addRelationship('IMP-400', 'REQ-401', 'implements');
      extension.addRelationship('IMP-401', 'REQ-401', 'implements');
      extension.addRelationship('TEST-400', 'REQ-400', 'tests');
      extension.addRelationship('REQ-401', 'REQ-402', 'depends');
    });

    it('should perform impact analysis', function() {
      const impacted = extension.getImpactAnalysis('REQ-400');
      
      expect(impacted).to.be.an('array');
      // Should include IMP-400 (implements REQ-400), TEST-400 (tests REQ-400)
      // And REQ-401 (no direct relation but connected through IMP-400)
      // And IMP-401 (implements REQ-401), REQ-402 (depends on REQ-401)
      expect(impacted).to.include.members(['IMP-400', 'TEST-400', 'REQ-401', 'IMP-401', 'REQ-402']);
    });

    it('should handle isolated nodes', function() {
      extension.graph.addRequirement({ id: 'REQ-403', title: 'Isolated Requirement' });
      
      const impacted = extension.getImpactAnalysis('REQ-403');
      expect(impacted).to.be.an('array');
      expect(impacted).to.be.empty;
    });
  });

  describe('Matrix Generation', function() {
    beforeEach(function() {
      // Set up a graph for matrix testing
      extension.graph.addRequirement({ id: 'REQ-500', title: 'Requirement 500' });
      extension.graph.addRequirement({ id: 'REQ-501', title: 'Requirement 501' });
      
      extension.addImplementation({ id: 'IMP-500', title: 'Implementation 500' });
      extension.addImplementation({ id: 'IMP-501', title: 'Implementation 501' });
      extension.addTest({ id: 'TEST-500', title: 'Test 500' });
      
      extension.addRelationship('IMP-500', 'REQ-500', 'implements');
      extension.addRelationship('IMP-501', 'REQ-501', 'implements');
      extension.addRelationship('TEST-500', 'REQ-500', 'tests');
    });

    it('should generate basic traceability matrix', function() {
      const matrix = extension.generateMatrix('req-impl');
      
      expect(matrix.type).to.equal('req-impl');
      expect(matrix.requirements).to.be.an('array');
      expect(matrix.requirements.length).to.equal(2);
      
      const req500 = matrix.requirements.find(r => r.id === 'REQ-500');
      expect(req500.implementations).to.include('IMP-500');
      expect(req500.tests).to.include('TEST-500');
    });

    it('should generate detailed matrix', function() {
      const matrix = extension.generateDetailedMatrix('full');
      
      expect(matrix.type).to.equal('full');
      expect(matrix.requirements).to.be.an('array');
      expect(matrix.implementations).to.be.an('array');
      expect(matrix.tests).to.be.an('array');
      expect(matrix.coverage).to.be.an('object');
      expect(matrix.uncoveredRequirements).to.be.an('array');
    });

    it('should get requirements with details', function() {
      const requirements = extension.getRequirementsWithDetails();
      
      expect(requirements).to.be.an('array');
      expect(requirements.length).to.equal(2);
      
      const req500 = requirements.find(r => r.id === 'REQ-500');
      expect(req500.implementedBy).to.include('IMP-500');
      expect(req500.testedBy).to.include('TEST-500');
    });
  });

  describe('Graph Query Methods', function() {
    beforeEach(function() {
      extension.graph.addRequirement({ id: 'REQ-600', title: 'Requirement 600' });
      extension.graph.addRequirement({ id: 'REQ-601', title: 'Requirement 601' });
      extension.addImplementation({ id: 'IMP-600', title: 'Implementation 600' });
      extension.addRelationship('IMP-600', 'REQ-600', 'implements');
    });

    it('should get nodes by ID', function() {
      const node = extension.graph.getNodeById('REQ-600');
      expect(node).to.not.be.null;
      expect(node.id).to.equal('REQ-600');
    });

    it('should return null for non-existent nodes', function() {
      const node = extension.graph.getNodeById('REQ-999');
      expect(node).to.be.null;
    });

    it('should get all relationships for a node', function() {
      extension.addRelationship('IMP-600', 'REQ-601', 'satisfies');
      
      const relationships = extension.graph.getRelationships('IMP-600');
      expect(relationships).to.be.an('array');
      expect(relationships.length).to.equal(2);
    });
  });
});