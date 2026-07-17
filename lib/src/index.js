"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RequirementsTraceabilityExtension = void 0;
// Public API — thin orchestrator composing focused modules
const core_1 = __importDefault(require("@asciidoctor/core"));
const TraceabilityGraph_js_1 = require("./TraceabilityGraph.js");
const RequirementParser_js_1 = require("./RequirementParser.js");
const MatrixGenerator_js_1 = require("./MatrixGenerator.js");
const AsciidoctorExtension_js_1 = require("./AsciidoctorExtension.js");
class RequirementsTraceabilityExtension {
    constructor() {
        this.currentFile = null;
        this.graph = new TraceabilityGraph_js_1.TraceabilityGraph();
        this.parser = new RequirementParser_js_1.RequirementParser();
        this.generator = new MatrixGenerator_js_1.MatrixGenerator(this.graph);
        this.extension = new AsciidoctorExtension_js_1.AsciidoctorExtension(core_1.default);
        this.extension.register(req => this.graph.addRequirement(req));
    }
    // ── Processing ──────────────────────────────────────────────────────────────
    async process(content, options = {}) {
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
    // ── Analysis (delegated to TraceabilityGraph) ───────────────────────────────
    getCoverageReport() {
        return this.graph.getCoverage();
    }
    getImpactAnalysis(id) {
        return this.graph.getImpactAnalysis(id);
    }
    findPath(fromId, toId) {
        return this.graph.findPath(fromId, toId);
    }
    getUncoveredRequirements() {
        return this.graph.getUncoveredRequirements();
    }
    // ── Lifecycle ───────────────────────────────────────────────────────────────
    clear() {
        this.graph.clear();
        this.currentFile = null;
    }
}
exports.RequirementsTraceabilityExtension = RequirementsTraceabilityExtension;
