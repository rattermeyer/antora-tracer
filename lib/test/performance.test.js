import { expect } from 'chai';
import { RequirementsTraceabilityExtension } from '../src/index.js';
describe('Performance Optimization', function () {
    let extension;
    beforeEach(function () {
        extension = new RequirementsTraceabilityExtension();
    });
    afterEach(function () {
        extension.clear();
    });
    describe('Large Dataset Handling', function () {
        this.timeout(10000); // Increase timeout for performance tests
        it('should handle 1000 requirements efficiently', function () {
            const startTime = Date.now();
            // Add 1000 requirements
            for (let i = 1; i <= 1000; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            const addTime = Date.now() - startTime;
            expect(addTime).to.be.lessThan(1000); // Should add 1000 nodes in under 1 second
            // Verify all were added
            const allReqs = extension.graph.getAllRequirements();
            expect(allReqs).to.have.lengthOf(1000);
            // Test retrieval
            const startRetrieve = Date.now();
            for (let i = 1; i <= 1000; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                const req = extension.graph.getRequirement(id);
                expect(req).to.not.be.undefined;
            }
            const retrieveTime = Date.now() - startRetrieve;
            expect(retrieveTime).to.be.lessThan(100); // Should retrieve 1000 nodes in under 100ms
        });
        it('should handle complex relationship graph efficiently', function () {
            const startTime = Date.now();
            // Add 500 requirements
            for (let i = 1; i <= 500; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            // Add 500 implementations
            for (let i = 1; i <= 500; i++) {
                const id = `IMP-${String(i).padStart(4, '0')}`;
                extension.addImplementation({
                    id,
                    title: `Implementation ${i}`,
                    content: `Content for implementation ${i}`,
                    status: 'done',
                    attributes: {},
                    sourceFile: 'impl.adoc',
                    sourceLine: i,
                });
            }
            // Create relationships: each implementation implements one requirement
            for (let i = 1; i <= 500; i++) {
                const reqId = `REQ-${String(i).padStart(4, '0')}`;
                const impId = `IMP-${String(i).padStart(4, '0')}`;
                extension.addRelationship(impId, reqId, 'implements');
            }
            const addTime = Date.now() - startTime;
            expect(addTime).to.be.lessThan(2000); // Should add 1000 nodes and 500 relationships in under 2 seconds
            // Verify relationships
            const allRelationships = Array.from({ length: 500 }, (_, i) => {
                const reqId = `REQ-${String(i + 1).padStart(4, '0')}`;
                return extension.graph.getReverseRelationships(reqId, 'implements');
            }).flat();
            expect(allRelationships).to.have.lengthOf(500);
        });
        it('should handle path finding in large graphs efficiently', function () {
            // Create a chain of 100 nodes
            for (let i = 1; i <= 100; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            // Create a chain: REQ-0001 -> REQ-0002 -> ... -> REQ-0100
            for (let i = 1; i < 100; i++) {
                const fromId = `REQ-${String(i).padStart(4, '0')}`;
                const toId = `REQ-${String(i + 1).padStart(4, '0')}`;
                extension.addRelationship(fromId, toId, 'depends');
            }
            const startTime = Date.now();
            // Find path from start to end with sufficient depth
            const path = extension.findPath('REQ-0001', 'REQ-0100', 100);
            const findTime = Date.now() - startTime;
            expect(findTime).to.be.lessThan(100); // Should find path in under 100ms
            expect(path).to.not.be.null;
            expect(path.length).to.equal(100);
        });
        it('should handle impact analysis in large graphs efficiently', function () {
            // Create a star topology: one central node connected to 100 others
            extension.graph.addRequirement({
                id: 'REQ-CENTER',
                title: 'Central Requirement',
                content: 'Central node',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 0,
            });
            for (let i = 1; i <= 100; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
                // Connect to center
                extension.addRelationship('REQ-CENTER', id, 'depends');
            }
            const startTime = Date.now();
            // Get impact analysis for center node
            const impacted = extension.getImpactAnalysis('REQ-CENTER');
            const analysisTime = Date.now() - startTime;
            expect(analysisTime).to.be.lessThan(100); // Should complete in under 100ms
            expect(impacted).to.have.lengthOf(100);
            expect(impacted).to.include('REQ-0001');
            expect(impacted).to.include('REQ-0100');
        });
        it('should handle coverage calculation in large graphs efficiently', function () {
            // Add 500 requirements
            for (let i = 1; i <= 500; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            // Add implementations for half of them
            for (let i = 1; i <= 250; i++) {
                const reqId = `REQ-${String(i).padStart(4, '0')}`;
                const impId = `IMP-${String(i).padStart(4, '0')}`;
                extension.addImplementation({
                    id: impId,
                    title: `Implementation ${i}`,
                    content: `Content for implementation ${i}`,
                    status: 'done',
                    attributes: {},
                    sourceFile: 'impl.adoc',
                    sourceLine: i,
                });
                extension.addRelationship(impId, reqId, 'implements');
            }
            // Add tests for a quarter of them
            for (let i = 1; i <= 125; i++) {
                const reqId = `REQ-${String(i).padStart(4, '0')}`;
                const testId = `TEST-${String(i).padStart(4, '0')}`;
                extension.addTest({
                    id: testId,
                    title: `Test ${i}`,
                    content: `Content for test ${i}`,
                    status: 'passed',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
                extension.addRelationship(testId, reqId, 'tests');
            }
            const startTime = Date.now();
            // Calculate coverage
            const coverage = extension.getCoverageReport();
            const coverageTime = Date.now() - startTime;
            expect(coverageTime).to.be.lessThan(100); // Should calculate in under 100ms
            expect(coverage.totalRequirements).to.equal(500);
            expect(coverage.requirementsWithImplementation).to.equal(250);
            expect(coverage.requirementsWithTests).to.equal(125);
        });
    });
    describe('Caching Performance', function () {
        it('should cache getAllRequirements results', function () {
            // Add 1000 requirements
            for (let i = 1; i <= 1000; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            const startTime = Date.now();
            // Call getAllRequirements multiple times - should use cache
            for (let i = 0; i < 100; i++) {
                const all = extension.graph.getAllRequirements();
                expect(all).to.have.lengthOf(1000);
            }
            const cacheTime = Date.now() - startTime;
            expect(cacheTime).to.be.lessThan(50); // Should be very fast with caching
        });
        it('should invalidate cache when nodes are added', function () {
            // Add 100 requirements
            for (let i = 1; i <= 100; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            // Get all requirements (will cache)
            let all = extension.graph.getAllRequirements();
            expect(all).to.have.lengthOf(100);
            // Add one more
            extension.graph.addRequirement({
                id: 'REQ-101',
                title: 'Requirement 101',
                content: 'Content for requirement 101',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 101,
            });
            // Get all again - should reflect the new node
            all = extension.graph.getAllRequirements();
            expect(all).to.have.lengthOf(101);
        });
    });
    describe('Memory Efficiency', function () {
        it('should not leak memory when clearing graph', function () {
            // Add many nodes
            for (let i = 1; i <= 1000; i++) {
                const id = `REQ-${String(i).padStart(4, '0')}`;
                extension.graph.addRequirement({
                    id,
                    title: `Requirement ${i}`,
                    content: `Content for requirement ${i}`,
                    status: 'draft',
                    attributes: {},
                    sourceFile: 'test.adoc',
                    sourceLine: i,
                });
            }
            // Clear the graph
            extension.clear();
            // Verify it's empty
            expect(extension.graph.getAllRequirements()).to.have.lengthOf(0);
            expect(extension.graph.size()).to.equal(0);
            // Add more nodes - should work fine
            extension.graph.addRequirement({
                id: 'REQ-NEW',
                title: 'New Requirement',
                content: 'New content',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            expect(extension.graph.getAllRequirements()).to.have.lengthOf(1);
        });
    });
});
