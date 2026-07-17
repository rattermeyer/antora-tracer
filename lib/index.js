// Public API — thin orchestrator composing focused modules
import Asciidoctor from '@asciidoctor/core';
import { TraceabilityGraph } from './TraceabilityGraph.js';
import { DocumentParser } from './DocumentParser.js';
import { MatrixGenerator } from './MatrixGenerator.js';
import { AsciidoctorExtension } from './AsciidoctorExtension.js';
class RequirementsTraceabilityExtension {
    graph;
    parser;
    generator;
    extension;
    currentFile = null;
    constructor() {
        this.graph = new TraceabilityGraph();
        this.parser = new DocumentParser();
        this.generator = new MatrixGenerator(this.graph);
        this.extension = new AsciidoctorExtension(Asciidoctor);
        this.extension.register(req => this.graph.addRequirement(req));
    }
    // ── Processing ──────────────────────────────────────────────────────────────
    async process(content, options = {}) {
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
            // Add all parsed relationships to the graph
            for (const rel of parsed.relationships) {
                this.graph.addRelationship(rel);
                console.log(`🔗 Relationship added: ${rel.fromId} ${rel.type} ${rel.targetId}`);
            }
            const result = await this.extension.convert(content, this.currentFile);
            console.log(`✅ Processing complete: ${parsed.requirements.length} requirements, ${parsed.implementations.length} implementations, ${parsed.tests.length} tests found`);
            return result;
        }
        catch (error) {
            console.error('❌ Processing error:', error.message);
            throw error;
        }
    }
    // ── Graph mutation helpers (public for test convenience) ────────────────────
    addImplementation(imp) {
        this.graph.addImplementation(imp);
        console.log(`📝 Implementation registered: ${imp.id} - ${imp.title}`);
    }
    addTest(test) {
        this.graph.addTest(test);
        console.log(`📝 Test registered: ${test.id} - ${test.title}`);
    }
    addDocument(doc) {
        this.graph.addDocument(doc);
        console.log(`📝 Document registered: ${doc.id} - ${doc.title}`);
    }
    addRelationship(fromId, toId, type = 'satisfies') {
        this.graph.addRelationship({ fromId, targetId: toId, type });
        console.log(`🔗 Relationship added: ${fromId} ${type} ${toId}`);
    }
    // ── Matrix generation (delegated to MatrixGenerator) ────────────────────────
    generateMatrix(type) {
        console.log(`📊 Generating ${type ?? 'req-impl'} matrix`);
        return this.generator.generateMatrix(type);
    }
    generateDetailedMatrix(type) {
        console.log(`📊 Generating detailed ${type ?? 'full'} matrix`);
        return this.generator.generateDetailedMatrix(type);
    }
    getRequirementsWithDetails() {
        return this.generator.getRequirementsWithDetails();
    }
    getImplementationsWithDetails() {
        return this.generator.getImplementationsWithDetails();
    }
    getTestsWithDetails() {
        return this.generator.getTestsWithDetails();
    }
    // ── Matrix Export ──────────────────────────────────────────────────────────
    exportMatrixToCSV(type) {
        return this.generator.exportToCSV(type);
    }
    exportMatrixToHTML(type) {
        return this.generator.exportToHTML(type);
    }
    generateTestMatrix() {
        return this.generator.generateTestMatrix();
    }
    // ── Analysis (delegated to TraceabilityGraph) ───────────────────────────────
    getCoverageReport() {
        return this.graph.getCoverage();
    }
    getImpactAnalysis(id) {
        return this.graph.getImpactAnalysis(id);
    }
    findPath(fromId, toId, maxDepth) {
        return this.graph.findPath(fromId, toId, maxDepth);
    }
    getUncoveredRequirements() {
        return this.graph.getUncoveredRequirements();
    }
    // ── Validation ─────────────────────────────────────────────────────────────
    /**
     * Validate the entire graph for errors.
     * Returns array of validation error messages, or empty array if valid.
     */
    validate() {
        return this.graph.validate();
    }
    /**
     * Check if a specific ID is valid (follows the pattern).
     */
    static isValidId(id) {
        return /^[A-Z]{2,4}-[0-9]+$/.test(id);
    }
    /**
     * Check if a relationship type is valid.
     */
    static isValidRelationshipType(type) {
        const validTypes = ['implements', 'satisfies', 'tests', 'verifies', 'documents', 'depends', 'requires'];
        return validTypes.includes(type);
    }
    // ── Lifecycle ───────────────────────────────────────────────────────────────
    clear() {
        this.graph.clear();
        this.currentFile = null;
    }
}
export { RequirementsTraceabilityExtension };
