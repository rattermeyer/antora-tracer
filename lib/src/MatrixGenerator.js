"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatrixGenerator = void 0;
class MatrixGenerator {
    constructor(graph) {
        this.graph = graph;
    }
    generateMatrix(type = 'req-impl') {
        return {
            type,
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllRequirements().map(req => ({
                id: req.id,
                title: req.title,
                implementations: this.graph.getReverseRelationships(req.id, 'implements').map(r => r.fromId),
                tests: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    generateDetailedMatrix(type = 'full') {
        return {
            type,
            coverage: this.graph.getCoverage(),
            uncoveredRequirements: this.graph.getUncoveredRequirements().map(r => r.id),
            requirements: this.getRequirementsWithDetails(),
            implementations: this.getImplementationsWithDetails(),
            tests: this.getTestsWithDetails(),
            generatedAt: new Date().toISOString(),
        };
    }
    getCoverageReport() {
        return this.graph.getCoverage();
    }
    getRequirementsWithDetails() {
        return this.graph.getAllRequirements().map(req => ({
            id: req.id,
            title: req.title,
            status: req.status,
            satisfiedBy: this.graph.getReverseRelationships(req.id, 'satisfies').map(r => r.fromId),
            implementedBy: this.graph.getReverseRelationships(req.id, 'implements').map(r => r.fromId),
            testedBy: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
            verifiedBy: this.graph.getReverseRelationships(req.id, 'verifies').map(r => r.fromId),
            documentedBy: this.graph.getReverseRelationships(req.id, 'documents').map(r => r.fromId),
        }));
    }
    getImplementationsWithDetails() {
        return this.graph.getAllImplementations().map(imp => ({
            id: imp.id,
            title: imp.title,
            satisfies: this.graph.getRelationships(imp.id, 'satisfies').map(r => r.targetId),
            testedBy: this.graph.getReverseRelationships(imp.id, 'tests').map(r => r.fromId),
        }));
    }
    getTestsWithDetails() {
        return this.graph.getAllTests().map(test => ({
            id: test.id,
            title: test.title,
            verifies: this.graph.getRelationships(test.id, 'verifies').map(r => r.targetId),
            tests: this.graph.getRelationships(test.id, 'tests').map(r => r.targetId),
        }));
    }
}
exports.MatrixGenerator = MatrixGenerator;
