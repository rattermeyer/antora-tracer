"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../src/index");
/** Create a minimal valid Requirement for testing. */
function req(id, title) {
    return { id, title, content: '', status: 'draft', attributes: {}, sourceFile: 'test', sourceLine: 0 };
}
describe('Traceability Graph', function () {
    let extension;
    beforeEach(function () {
        extension = new index_1.RequirementsTraceabilityExtension();
    });
    afterEach(function () {
        extension.clear();
    });
    describe('Graph Structure', function () {
        it('should initialize with empty maps', function () {
            (0, chai_1.expect)(extension.graph).to.be.an('object');
            (0, chai_1.expect)(extension.graph.getAllRequirements()).to.be.an('array').with.lengthOf(0);
            (0, chai_1.expect)(extension.graph.getAllImplementations()).to.be.an('array').with.lengthOf(0);
            (0, chai_1.expect)(extension.graph.getAllTests()).to.be.an('array').with.lengthOf(0);
        });
        it('should have graph methods', function () {
            (0, chai_1.expect)(extension.graph.addRequirement).to.be.a('function');
            (0, chai_1.expect)(extension.graph.addImplementation).to.be.a('function');
            (0, chai_1.expect)(extension.graph.addTest).to.be.a('function');
            (0, chai_1.expect)(extension.graph.addRelationship).to.be.a('function');
            (0, chai_1.expect)(extension.graph.getCoverage).to.be.a('function');
        });
    });
    describe('Requirement Management', function () {
        it('should add requirements to graph', function () {
            const r = req('REQ-001', 'Test Requirement');
            extension.graph.addRequirement(r);
            (0, chai_1.expect)(extension.graph.getAllRequirements()).to.have.lengthOf(1);
            (0, chai_1.expect)(extension.graph.getRequirement('REQ-001')).to.equal(r);
        });
        it('should retrieve requirements by ID', function () {
            const r = req('REQ-002', 'Another Requirement');
            extension.graph.addRequirement(r);
            const retrieved = extension.graph.getRequirement('REQ-002');
            (0, chai_1.expect)(retrieved).to.equal(r);
        });
    });
    describe('Implementation Management', function () {
        it('should add implementations to graph', function () {
            const imp = { id: 'IMP-001', title: 'Test Implementation' };
            extension.addImplementation(imp);
            (0, chai_1.expect)(extension.graph.getAllImplementations()).to.have.lengthOf(1);
            (0, chai_1.expect)(extension.graph.getImplementation('IMP-001')).to.equal(imp);
        });
        it('should retrieve implementations by ID', function () {
            const imp = { id: 'IMP-002', title: 'Another Implementation' };
            extension.addImplementation(imp);
            const retrieved = extension.graph.getImplementation('IMP-002');
            (0, chai_1.expect)(retrieved).to.equal(imp);
        });
    });
    describe('Test Management', function () {
        it('should add tests to graph', function () {
            const test = { id: 'TEST-001', title: 'Test Case' };
            extension.addTest(test);
            (0, chai_1.expect)(extension.graph.getAllTests()).to.have.lengthOf(1);
            (0, chai_1.expect)(extension.graph.getTest('TEST-001')).to.equal(test);
        });
        it('should retrieve tests by ID', function () {
            const test = { id: 'TEST-002', title: 'Another Test' };
            extension.addTest(test);
            const retrieved = extension.graph.getTest('TEST-002');
            (0, chai_1.expect)(retrieved).to.equal(test);
        });
    });
    describe('Relationship Management', function () {
        beforeEach(function () {
            // Add some nodes for relationship testing
            extension.graph.addRequirement(req('REQ-100', 'Requirement 100'));
            extension.graph.addRequirement(req('REQ-101', 'Requirement 101'));
            extension.addImplementation({ id: 'IMP-100', title: 'Implementation 100' });
            extension.addTest({ id: 'TEST-100', title: 'Test 100' });
        });
        it('should add relationships between nodes', function () {
            extension.addRelationship('IMP-100', 'REQ-100', 'satisfies');
            const relationships = extension.graph.getRelationships('IMP-100');
            (0, chai_1.expect)(relationships.length).to.equal(1);
            (0, chai_1.expect)(relationships[0].type).to.equal('satisfies');
            (0, chai_1.expect)(relationships[0].targetId).to.equal('REQ-100');
        });
        it('should get relationships by type', function () {
            extension.addRelationship('IMP-100', 'REQ-100', 'satisfies');
            extension.addRelationship('IMP-100', 'REQ-101', 'implements');
            extension.addRelationship('TEST-100', 'REQ-100', 'tests');
            const satisfiesRels = extension.graph.getRelationships('IMP-100', 'satisfies');
            (0, chai_1.expect)(satisfiesRels.length).to.equal(1);
            (0, chai_1.expect)(satisfiesRels[0].targetId).to.equal('REQ-100');
        });
        it('should get reverse relationships', function () {
            extension.addRelationship('IMP-100', 'REQ-100', 'satisfies');
            extension.addRelationship('TEST-100', 'REQ-100', 'tests');
            const reverseRels = extension.graph.getReverseRelationships('REQ-100');
            (0, chai_1.expect)(reverseRels.length).to.equal(2);
            (0, chai_1.expect)(reverseRels.map(r => r.fromId)).to.include.members(['IMP-100', 'TEST-100']);
        });
    });
    describe('Coverage Analysis', function () {
        beforeEach(function () {
            // Set up a graph with requirements and relationships
            extension.graph.addRequirement(req('REQ-200', 'Requirement 200'));
            extension.graph.addRequirement(req('REQ-201', 'Requirement 201'));
            extension.graph.addRequirement(req('REQ-202', 'Requirement 202'));
            extension.addImplementation({ id: 'IMP-200', title: 'Implementation 200' });
            extension.addTest({ id: 'TEST-200', title: 'Test 200' });
            // Add relationships
            extension.addRelationship('IMP-200', 'REQ-200', 'implements');
            extension.addRelationship('TEST-200', 'REQ-200', 'tests');
            extension.addRelationship('IMP-200', 'REQ-201', 'implements');
            // REQ-202 has no implementation or test
        });
        it('should calculate coverage metrics', function () {
            const coverage = extension.getCoverageReport();
            (0, chai_1.expect)(coverage.totalRequirements).to.equal(3);
            (0, chai_1.expect)(coverage.requirementsWithImplementation).to.equal(2);
            (0, chai_1.expect)(coverage.requirementsWithTests).to.equal(1);
            (0, chai_1.expect)(coverage.implementationCoverage).to.be.closeTo(66.67, 0.1);
            (0, chai_1.expect)(coverage.testCoverage).to.be.closeTo(33.33, 0.1);
        });
        it('should identify requirements with implementations', function () {
            const reqsWithImpl = extension.graph.getRequirementsWithImplementations();
            (0, chai_1.expect)(reqsWithImpl.size).to.equal(2);
            (0, chai_1.expect)(Array.from(reqsWithImpl)).to.include.members(['REQ-200', 'REQ-201']);
        });
        it('should identify requirements with tests', function () {
            const reqsWithTests = extension.graph.getRequirementsWithTests();
            (0, chai_1.expect)(reqsWithTests.size).to.equal(1);
            (0, chai_1.expect)(Array.from(reqsWithTests)).to.include.members(['REQ-200']);
        });
        it('should find uncovered requirements', function () {
            const uncovered = extension.getUncoveredRequirements();
            (0, chai_1.expect)(uncovered.length).to.equal(1);
            (0, chai_1.expect)(uncovered[0].id).to.equal('REQ-202');
        });
    });
    describe('Path Finding', function () {
        beforeEach(function () {
            // Set up a graph with relationships
            extension.graph.addRequirement(req('REQ-300', 'Requirement 300'));
            extension.graph.addRequirement(req('REQ-301', 'Requirement 301'));
            extension.graph.addRequirement(req('REQ-302', 'Requirement 302'));
            extension.addImplementation({ id: 'IMP-300', title: 'Implementation 300' });
            extension.addImplementation({ id: 'IMP-301', title: 'Implementation 301' });
            // Create a chain: IMP-300 -> REQ-300 -> IMP-301 -> REQ-301
            extension.addRelationship('IMP-300', 'REQ-300', 'implements');
            extension.addRelationship('REQ-300', 'IMP-301', 'requires');
            extension.addRelationship('IMP-301', 'REQ-301', 'implements');
        });
        it('should find paths between nodes', function () {
            const path = extension.findPath('IMP-300', 'REQ-301');
            (0, chai_1.expect)(path).to.be.an('array');
            (0, chai_1.expect)(path).to.include.members(['IMP-300', 'REQ-300', 'IMP-301', 'REQ-301']);
        });
        it('should return null for non-existent paths', function () {
            const path = extension.findPath('IMP-300', 'REQ-302');
            (0, chai_1.expect)(path).to.be.null;
        });
        it('should handle circular references', function () {
            // Add a circular reference
            extension.addRelationship('REQ-301', 'IMP-300', 'depends');
            const path = extension.findPath('IMP-300', 'REQ-301');
            (0, chai_1.expect)(path).to.be.an('array');
            (0, chai_1.expect)(path.length).to.be.at.most(5); // Should not infinite loop
        });
    });
    describe('Impact Analysis', function () {
        beforeEach(function () {
            // Set up a complex graph
            extension.graph.addRequirement(req('REQ-400', 'Requirement 400'));
            extension.graph.addRequirement(req('REQ-401', 'Requirement 401'));
            extension.graph.addRequirement(req('REQ-402', 'Requirement 402'));
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
        it('should perform impact analysis', function () {
            const impacted = extension.getImpactAnalysis('REQ-400');
            (0, chai_1.expect)(impacted).to.be.an('array');
            // Should include IMP-400 (implements REQ-400), TEST-400 (tests REQ-400)
            // And REQ-401 (no direct relation but connected through IMP-400)
            // And IMP-401 (implements REQ-401), REQ-402 (depends on REQ-401)
            (0, chai_1.expect)(impacted).to.include.members(['IMP-400', 'TEST-400', 'REQ-401', 'IMP-401', 'REQ-402']);
        });
        it('should handle isolated nodes', function () {
            extension.graph.addRequirement(req('REQ-403', 'Isolated Requirement'));
            const impacted = extension.getImpactAnalysis('REQ-403');
            (0, chai_1.expect)(impacted).to.be.an('array');
            (0, chai_1.expect)(impacted).to.be.empty;
        });
    });
    describe('Matrix Generation', function () {
        beforeEach(function () {
            // Set up a graph for matrix testing
            extension.graph.addRequirement(req('REQ-500', 'Requirement 500'));
            extension.graph.addRequirement(req('REQ-501', 'Requirement 501'));
            extension.addImplementation({ id: 'IMP-500', title: 'Implementation 500' });
            extension.addImplementation({ id: 'IMP-501', title: 'Implementation 501' });
            extension.addTest({ id: 'TEST-500', title: 'Test 500' });
            extension.addRelationship('IMP-500', 'REQ-500', 'implements');
            extension.addRelationship('IMP-501', 'REQ-501', 'implements');
            extension.addRelationship('TEST-500', 'REQ-500', 'tests');
        });
        it('should generate basic traceability matrix', function () {
            const matrix = extension.generateMatrix('req-impl');
            (0, chai_1.expect)(matrix.type).to.equal('req-impl');
            (0, chai_1.expect)(matrix.requirements).to.be.an('array');
            (0, chai_1.expect)(matrix.requirements.length).to.equal(2);
            const req500 = matrix.requirements.find(r => r.id === 'REQ-500');
            (0, chai_1.expect)(req500.implementations).to.include('IMP-500');
            (0, chai_1.expect)(req500.tests).to.include('TEST-500');
        });
        it('should generate detailed matrix', function () {
            const matrix = extension.generateDetailedMatrix('full');
            (0, chai_1.expect)(matrix.type).to.equal('full');
            (0, chai_1.expect)(matrix.requirements).to.be.an('array');
            (0, chai_1.expect)(matrix.implementations).to.be.an('array');
            (0, chai_1.expect)(matrix.tests).to.be.an('array');
            (0, chai_1.expect)(matrix.coverage).to.be.an('object');
            (0, chai_1.expect)(matrix.uncoveredRequirements).to.be.an('array');
        });
        it('should get requirements with details', function () {
            const requirements = extension.getRequirementsWithDetails();
            (0, chai_1.expect)(requirements).to.be.an('array');
            (0, chai_1.expect)(requirements.length).to.equal(2);
            const req500 = requirements.find(r => r.id === 'REQ-500');
            (0, chai_1.expect)(req500.implementedBy).to.include('IMP-500');
            (0, chai_1.expect)(req500.testedBy).to.include('TEST-500');
        });
    });
    describe('Graph Query Methods', function () {
        beforeEach(function () {
            extension.graph.addRequirement(req('REQ-600', 'Requirement 600'));
            extension.graph.addRequirement(req('REQ-601', 'Requirement 601'));
            extension.addImplementation({ id: 'IMP-600', title: 'Implementation 600' });
            extension.addRelationship('IMP-600', 'REQ-600', 'implements');
        });
        it('should get nodes by ID', function () {
            const node = extension.graph.getNode('REQ-600');
            (0, chai_1.expect)(node).to.not.be.undefined;
            (0, chai_1.expect)(node.id).to.equal('REQ-600');
        });
        it('should return null for non-existent nodes', function () {
            const node = extension.graph.getNode('REQ-999');
            (0, chai_1.expect)(node).to.be.undefined;
        });
        it('should get all relationships for a node', function () {
            extension.addRelationship('IMP-600', 'REQ-601', 'satisfies');
            const relationships = extension.graph.getRelationships('IMP-600');
            (0, chai_1.expect)(relationships).to.be.an('array');
            (0, chai_1.expect)(relationships.length).to.equal(2);
        });
    });
});
