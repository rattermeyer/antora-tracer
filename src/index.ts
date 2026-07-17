// Public API — thin orchestrator composing focused modules
import Asciidoctor from '@asciidoctor/core';
import { TraceabilityGraph } from './TraceabilityGraph.js';
import { RequirementParser } from './RequirementParser.js';
import { MatrixGenerator } from './MatrixGenerator.js';
import { AsciidoctorExtension } from './AsciidoctorExtension.js';
import type {
  Requirement,
  Implementation,
  Test,
  Document,
  RelationshipType,
  CoverageReport,
  RequirementDetail,
  ImplementationDetail,
  TestDetail,
  TraceabilityMatrix,
  DetailedTraceabilityMatrix,
} from './types.js';

class RequirementsTraceabilityExtension {
  public readonly graph: TraceabilityGraph;
  private readonly parser: RequirementParser;
  private readonly generator: MatrixGenerator;
  private readonly extension: AsciidoctorExtension;
  public currentFile: string | null = null;

  constructor() {
    this.graph = new TraceabilityGraph();
    this.parser = new RequirementParser();
    this.generator = new MatrixGenerator(this.graph);
    this.extension = new AsciidoctorExtension(Asciidoctor);
    this.extension.register(req => this.graph.addRequirement(req));
  }

  // ── Processing ──────────────────────────────────────────────────────────────

  async process(content: string, options: { sourceFile?: string } = {}): Promise<string> {
    this.currentFile = options.sourceFile || 'input';
    console.log(`🔄 Processing: ${this.currentFile}`);
    try {
      const requirements = this.parser.parse(content, this.currentFile);
      for (const req of requirements) {
        this.graph.addRequirement(req);
        console.log(`📝 Requirement registered: ${req.id} - ${req.title}`);
      }
      const result = await this.extension.convert(content, this.currentFile);
      console.log(`✅ Processing complete: ${this.graph.getAllRequirements().length} requirements found`);
      return result;
    } catch (error: any) {
      console.error('❌ Processing error:', error.message);
      throw error;
    }
  }

  // ── Graph mutation helpers (public for test convenience) ────────────────────

  addImplementation(imp: Implementation): void {
    this.graph.addImplementation(imp);
    console.log(`📝 Implementation registered: ${imp.id} - ${imp.title}`);
  }

  addTest(test: Test): void {
    this.graph.addTest(test);
    console.log(`📝 Test registered: ${test.id} - ${test.title}`);
  }

  addDocument(doc: Document): void {
    this.graph.addDocument(doc);
    console.log(`📝 Document registered: ${doc.id} - ${doc.title}`);
  }

  addRelationship(fromId: string, toId: string, type: RelationshipType = 'satisfies'): void {
    this.graph.addRelationship({ fromId, targetId: toId, type });
    console.log(`🔗 Relationship added: ${fromId} ${type} ${toId}`);
  }

  // ── Matrix generation (delegated to MatrixGenerator) ────────────────────────

  generateMatrix(type?: string): TraceabilityMatrix {
    console.log(`📊 Generating ${type ?? 'req-impl'} matrix`);
    return this.generator.generateMatrix(type);
  }

  generateDetailedMatrix(type?: string): DetailedTraceabilityMatrix {
    console.log(`📊 Generating detailed ${type ?? 'full'} matrix`);
    return this.generator.generateDetailedMatrix(type);
  }

  getRequirementsWithDetails(): RequirementDetail[] {
    return this.generator.getRequirementsWithDetails();
  }

  getImplementationsWithDetails(): ImplementationDetail[] {
    return this.generator.getImplementationsWithDetails();
  }

  getTestsWithDetails(): TestDetail[] {
    return this.generator.getTestsWithDetails();
  }

  // ── Analysis (delegated to TraceabilityGraph) ───────────────────────────────

  getCoverageReport(): CoverageReport {
    return this.graph.getCoverage();
  }

  getImpactAnalysis(id: string): string[] {
    return this.graph.getImpactAnalysis(id);
  }

  findPath(fromId: string, toId: string): string[] | null {
    return this.graph.findPath(fromId, toId);
  }

  getUncoveredRequirements(): Requirement[] {
    return this.graph.getUncoveredRequirements();
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  clear(): void {
    this.graph.clear();
    this.currentFile = null;
  }
}

export { RequirementsTraceabilityExtension };
export type {
  Requirement,
  Implementation,
  Test,
  Document,
  RelationshipType,
  CoverageReport,
  TraceabilityMatrix,
  DetailedTraceabilityMatrix,
};
