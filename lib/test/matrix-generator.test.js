"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const index_1 = require("../src/index");
describe('Matrix Generator Enhancement', function () {
    let extension;
    beforeEach(function () {
        extension = new index_1.RequirementsTraceabilityExtension();
        // Setup test data
        extension.graph.addRequirement({
            id: 'REQ-001',
            title: 'Requirement 1',
            content: 'First requirement',
            status: 'approved',
            attributes: {},
            sourceFile: 'test.adoc',
            sourceLine: 1,
        });
        extension.graph.addRequirement({
            id: 'REQ-002',
            title: 'Requirement 2',
            content: 'Second requirement',
            status: 'draft',
            attributes: {},
            sourceFile: 'test.adoc',
            sourceLine: 2,
        });
        extension.addImplementation({
            id: 'IMP-001',
            title: 'Implementation 1',
            content: 'First implementation',
            status: 'done',
            attributes: {},
            sourceFile: 'impl.adoc',
            sourceLine: 1,
        });
        extension.addTest({
            id: 'TEST-001',
            title: 'Test 1',
            content: 'First test',
            status: 'passed',
            attributes: {},
            sourceFile: 'test.adoc',
            sourceLine: 1,
        });
        // Create relationships
        extension.addRelationship('IMP-001', 'REQ-001', 'implements');
        extension.addRelationship('TEST-001', 'REQ-001', 'tests');
    });
    afterEach(function () {
        extension.clear();
    });
    describe('CSV Export', function () {
        it('should export matrix to CSV format', function () {
            const csv = extension.exportMatrixToCSV('req-impl');
            (0, chai_1.expect)(csv).to.include('Requirement ID,Requirement Title,Implementations,Tests,Status');
            (0, chai_1.expect)(csv).to.include('REQ-001');
            (0, chai_1.expect)(csv).to.include('REQ-002');
            (0, chai_1.expect)(csv).to.include('IMP-001');
            (0, chai_1.expect)(csv).to.include('TEST-001');
            (0, chai_1.expect)(csv).to.include('Total Requirements');
            (0, chai_1.expect)(csv).to.include('Implementation Coverage');
            (0, chai_1.expect)(csv).to.include('Test Coverage');
        });
        it('should handle empty implementations and tests', function () {
            const csv = extension.exportMatrixToCSV('req-impl');
            // REQ-002 has no implementations or tests
            (0, chai_1.expect)(csv).to.include('REQ-002');
        });
        it('should show correct status for each requirement', function () {
            const csv = extension.exportMatrixToCSV('req-impl');
            // REQ-001 has implementation and test
            (0, chai_1.expect)(csv).to.include('✓ Complete');
            // REQ-002 has neither
            (0, chai_1.expect)(csv).to.include('✗ Missing');
        });
    });
    describe('HTML Export', function () {
        it('should export matrix to HTML format', function () {
            const html = extension.exportMatrixToHTML('req-impl');
            (0, chai_1.expect)(html).to.include('<!DOCTYPE html>');
            (0, chai_1.expect)(html).to.include('<html lang="en">');
            (0, chai_1.expect)(html).to.include('Traceability Matrix');
            (0, chai_1.expect)(html).to.include('REQ-001');
            (0, chai_1.expect)(html).to.include('REQ-002');
            (0, chai_1.expect)(html).to.include('IMP-001');
            (0, chai_1.expect)(html).to.include('TEST-001');
        });
        it('should include CSS styling', function () {
            const html = extension.exportMatrixToHTML('req-impl');
            (0, chai_1.expect)(html).to.include('<style>');
            (0, chai_1.expect)(html).to.include('font-family:');
            (0, chai_1.expect)(html).to.include('.status-complete');
            (0, chai_1.expect)(html).to.include('.status-partial');
            (0, chai_1.expect)(html).to.include('.status-missing');
            (0, chai_1.expect)(html).to.include('.status-badge');
        });
        it('should include coverage summary', function () {
            const html = extension.exportMatrixToHTML('req-impl');
            (0, chai_1.expect)(html).to.include('Coverage Summary');
            (0, chai_1.expect)(html).to.include('Total Requirements');
            (0, chai_1.expect)(html).to.include('Implementation Coverage');
            (0, chai_1.expect)(html).to.include('Test Coverage');
        });
        it('should include matrix table', function () {
            const html = extension.exportMatrixToHTML('req-impl');
            (0, chai_1.expect)(html).to.include('<table>');
            (0, chai_1.expect)(html).to.include('Requirement ID');
            (0, chai_1.expect)(html).to.include('Title');
            (0, chai_1.expect)(html).to.include('Implementations');
            (0, chai_1.expect)(html).to.include('Tests');
            (0, chai_1.expect)(html).to.include('Status');
        });
        it('should escape HTML special characters', function () {
            // Add a requirement with special characters in title
            extension.graph.addRequirement({
                id: 'REQ-003',
                title: 'Requirement with <script> & ampersand',
                content: 'Content',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 3,
            });
            const html = extension.exportMatrixToHTML('req-impl');
            (0, chai_1.expect)(html).to.include('&lt;script&gt;');
            (0, chai_1.expect)(html).to.include('&amp;');
            (0, chai_1.expect)(html).not.to.include('<script>');
        });
        it('should show status with CSS classes', function () {
            const html = extension.exportMatrixToHTML('req-impl');
            // REQ-001 has implementation and test
            (0, chai_1.expect)(html).to.include('status-complete');
            (0, chai_1.expect)(html).to.include('✓ Complete');
            // REQ-002 has neither
            (0, chai_1.expect)(html).to.include('status-missing');
            (0, chai_1.expect)(html).to.include('✗ Missing');
        });
    });
    describe('Test Matrix', function () {
        it('should generate requirements-to-test matrix', function () {
            const matrix = extension.generateTestMatrix();
            (0, chai_1.expect)(matrix.type).to.equal('req-test');
            (0, chai_1.expect)(matrix.requirements).to.have.lengthOf(2);
            (0, chai_1.expect)(matrix.coverage).to.be.an('object');
            const req001 = matrix.requirements.find(r => r.id === 'REQ-001');
            (0, chai_1.expect)(req001).to.not.be.undefined;
            (0, chai_1.expect)(req001.tests).to.include('TEST-001');
        });
        it('should export test matrix to CSV', function () {
            const csv = extension.exportMatrixToCSV('req-test');
            (0, chai_1.expect)(csv).to.include('REQ-001');
            (0, chai_1.expect)(csv).to.include('TEST-001');
            (0, chai_1.expect)(csv).to.include('Test Coverage');
        });
        it('should export test matrix to HTML', function () {
            const html = extension.exportMatrixToHTML('req-test');
            (0, chai_1.expect)(html).to.include('REQ-001');
            (0, chai_1.expect)(html).to.include('TEST-001');
            (0, chai_1.expect)(html).to.include('Traceability Matrix: req-test');
        });
    });
    describe('Detailed Matrix', function () {
        it('should generate detailed matrix with all entities', function () {
            const matrix = extension.generateDetailedMatrix('full');
            (0, chai_1.expect)(matrix.type).to.equal('full');
            (0, chai_1.expect)(matrix.requirements).to.have.lengthOf(2);
            (0, chai_1.expect)(matrix.implementations).to.have.lengthOf(1);
            (0, chai_1.expect)(matrix.tests).to.have.lengthOf(1);
            (0, chai_1.expect)(matrix.coverage).to.be.an('object');
        });
        it('should include uncovered requirements', function () {
            const matrix = extension.generateDetailedMatrix('full');
            // REQ-002 has no implementation or test
            (0, chai_1.expect)(matrix.uncoveredRequirements).to.include('REQ-002');
        });
    });
    describe('Coverage Report', function () {
        it('should provide coverage metrics', function () {
            const coverage = extension.getCoverageReport();
            (0, chai_1.expect)(coverage.totalRequirements).to.equal(2);
            (0, chai_1.expect)(coverage.requirementsWithImplementation).to.equal(1);
            (0, chai_1.expect)(coverage.requirementsWithTests).to.equal(1);
            (0, chai_1.expect)(coverage.implementationCoverage).to.equal(50);
            (0, chai_1.expect)(coverage.testCoverage).to.equal(50);
        });
    });
});
