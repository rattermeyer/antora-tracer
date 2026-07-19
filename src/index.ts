// Public API — thin orchestrator composing focused modules
import Asciidoctor from '@asciidoctor/core';
import { TraceabilityGraph } from './TraceabilityGraph.js';
import { DocumentParser } from './DocumentParser.js';
import { MatrixGenerator } from './MatrixGenerator.js';
import { AsciidoctorExtension } from './AsciidoctorExtension.js';
import type {
  Requirement,
  Implementation,
  Test,
  Document,
  Design,
  RelationshipType,
  PrimaryRelationshipType,
  InverseRelationshipType,
  CoverageReport,
  RequirementDetail,
  ImplementationDetail,
  TestDetail,
  TraceabilityMatrix,
  DesignTraceabilityMatrix,
  DetailedTraceabilityMatrix,
} from './types.js';
import {
  INVERSE_MAP,
  PRIMARY_MAP,
  isPrimaryRelationshipType,
  isInverseRelationshipType,
} from './types.js';

class RequirementsTraceabilityExtension {
  public readonly graph: TraceabilityGraph;

  private readonly parser: DocumentParser;
  private readonly generator: MatrixGenerator;
  private readonly extension: AsciidoctorExtension;
  public currentFile: string | null = null;

  constructor() {
    this.graph = new TraceabilityGraph();
    this.parser = new DocumentParser();
    this.generator = new MatrixGenerator(this.graph);
    this.extension = new AsciidoctorExtension(Asciidoctor);
    this.extension.register(req => this.graph.addRequirement(req));
  }

  // ── Processing ──────────────────────────────────────────────────────────────

  async process(content: string, options: { sourceFile?: string } = {}): Promise<string> {
    this.currentFile = options.sourceFile || 'input';
    console.log(`🔄 Processing: ${this.currentFile}`);
    try {
      // Parse all traceability elements from the content
      const parsed = this.parser.parse(content, this.currentFile);

      // Add all parsed nodes to the graph
      for (const req of parsed.requirements) {
        this.graph.addRequirement(req);
        console.log(`📝 Requirement registered: ${req.id} - ${req.title}`);
      }
      for (const imp of parsed.implementations) {
        this.graph.addImplementation(imp);
        console.log(`📝 Implementation registered: ${imp.id} - ${imp.title}`);
      }
      for (const test of parsed.tests) {
        this.graph.addTest(test);
        console.log(`📝 Test registered: ${test.id} - ${test.title}`);
      }
      for (const doc of parsed.documents) {
        this.graph.addDocument(doc);
        console.log(`📝 Document registered: ${doc.id} - ${doc.title}`);
      }
      for (const design of parsed.designs) {
        this.graph.addDesign(design);
        console.log(`📝 Design registered: ${design.id} - ${design.title}`);
      }

      // Add all parsed relationships to the graph
      for (const rel of parsed.relationships) {
        this.graph.addRelationship(rel);
        console.log(`🔗 Relationship added: ${rel.fromId} ${rel.type} ${rel.targetId}`);
      }

      const result = await this.extension.convert(content, this.currentFile);
      console.log(`✅ Processing complete: ${parsed.requirements.length} requirements, ${parsed.implementations.length} implementations, ${parsed.tests.length} tests found`);
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

  addDesign(design: Design): void {
    this.graph.addDesign(design);
    console.log(`📝 Design registered: ${design.id} - ${design.title}`);
  }

  addRelationship(fromId: string, toId: string, type: RelationshipType = 'satisfies'): void {
    this.graph.addRelationship({ id: `${fromId}-${type}-${toId}`, fromId, targetId: toId, type });
    console.log(`🔗 Relationship added: ${fromId} ${type} ${toId}`);
  }

  // ── Matrix generation (delegated to MatrixGenerator) ────────────────────────

  generateMatrix(type?: string): TraceabilityMatrix | DesignTraceabilityMatrix {
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

  // ── Matrix Export ──────────────────────────────────────────────────────────

  exportMatrixToCSV(type?: string): string {
    return this.generator.exportToCSV(type);
  }

  exportMatrixToHTML(type?: string): string {
    return this.generator.exportToHTML(type);
  }

  generateTestMatrix(): any {
    return this.generator.generateTestMatrix();
  }

  // ── Analysis (delegated to TraceabilityGraph) ───────────────────────────────

  getCoverageReport(): CoverageReport {
    return this.graph.getCoverage();
  }

  getImpactAnalysis(id: string): string[] {
    return this.graph.getImpactAnalysis(id);
  }

  findPath(fromId: string, toId: string, maxDepth?: number): string[] | null {
    return this.graph.findPath(fromId, toId, maxDepth);
  }

  getUncoveredRequirements(): Requirement[] {
    return this.graph.getUncoveredRequirements();
  }

  // ── Validation ─────────────────────────────────────────────────────────────

  /**
   * Validate the entire graph for errors.
   * Returns array of validation error messages, or empty array if valid.
   */
  validate(): string[] {
    return this.graph.validate();
  }

  /**
   * Check if a specific ID is valid (follows the pattern).
   */
  static isValidId(id: string): boolean {
    return /^[A-Z]{2,4}-[0-9]+$/.test(id);
  }

  /**
   * Check if a relationship type is valid.
   */
  static isValidRelationshipType(type: string): type is RelationshipType {
    return isPrimaryRelationshipType(type) || isInverseRelationshipType(type);
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
  Design,
  RelationshipType,
  PrimaryRelationshipType,
  InverseRelationshipType,
  CoverageReport,
  TraceabilityMatrix,
  DesignTraceabilityMatrix,
  DetailedTraceabilityMatrix,
};
export {
  INVERSE_MAP,
  PRIMARY_MAP,
  isPrimaryRelationshipType,
  isInverseRelationshipType,
};
