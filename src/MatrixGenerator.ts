import type { TraceabilityGraph } from './TraceabilityGraph.js';
import type {
  CoverageReport,
  RequirementDetail,
  ImplementationDetail,
  TestDetail,
  TraceabilityMatrix,
  DetailedTraceabilityMatrix,
} from './types.js';

export class MatrixGenerator {
  constructor(private readonly graph: TraceabilityGraph) {}

  generateMatrix(type: string = 'req-impl'): TraceabilityMatrix {
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

  generateDetailedMatrix(type: string = 'full'): DetailedTraceabilityMatrix {
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

  getCoverageReport(): CoverageReport {
    return this.graph.getCoverage();
  }

  getRequirementsWithDetails(): RequirementDetail[] {
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

  getImplementationsWithDetails(): ImplementationDetail[] {
    return this.graph.getAllImplementations().map(imp => ({
      id: imp.id,
      title: imp.title,
      satisfies: this.graph.getRelationships(imp.id, 'satisfies').map(r => r.targetId),
      testedBy: this.graph.getReverseRelationships(imp.id, 'tests').map(r => r.fromId),
    }));
  }

  getTestsWithDetails(): TestDetail[] {
    return this.graph.getAllTests().map(test => ({
      id: test.id,
      title: test.title,
      verifies: this.graph.getRelationships(test.id, 'verifies').map(r => r.targetId),
      tests: this.graph.getRelationships(test.id, 'tests').map(r => r.targetId),
    }));
  }
}
