import { TemplateRenderer } from './TemplateRenderer.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TEMPLATE_DIR = path.join(__dirname, 'templates');
export class MatrixGenerator {
    graph;
    templateRenderer;
    constructor(graph, options = {}) {
        this.graph = graph;
        const templateDir = options.templateDir || DEFAULT_TEMPLATE_DIR;
        this.templateRenderer = new TemplateRenderer(templateDir);
    }
    generateMatrix(type = 'req-impl') {
        switch (type) {
            case 'req-impl':
                return this.generateRequirementsImplementationMatrix();
            case 'req-test':
                return this.generateTestMatrix();
            case 'req-design':
                return this.generateRequirementsDesignMatrix();
            case 'design-impl':
                return this.generateDesignImplementationMatrix();
            // Inverse matrices (Phase 3)
            case 'impl-req':
                return this.generateImplementationRequirementMatrix();
            case 'test-impl':
                return this.generateTestImplementationMatrix();
            case 'test-req':
                return this.generateTestRequirementMatrix();
            case 'design-req':
                return this.generateDesignRequirementMatrix();
            // Design-Design matrix (Phase 3)
            case 'design-design':
                return this.generateDesignDesignMatrix();
            default:
                return this.generateRequirementsImplementationMatrix();
        }
    }
    generateRequirementsImplementationMatrix() {
        const allImplementations = new Set(this.graph.getAllImplementations().map(imp => imp.id));
        return {
            type: 'req-impl',
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllRequirements().map(req => ({
                id: req.id,
                title: req.title,
                implementations: this.graph.getReverseRelationships(req.id, 'implements')
                    .filter(r => allImplementations.has(r.fromId))
                    .map(r => r.fromId),
                tests: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    generateRequirementsDesignMatrix() {
        // For req-design matrix, we use RequirementRow but with designs instead of implementations
        return {
            type: 'req-design',
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllRequirements().map(req => ({
                id: req.id,
                title: req.title,
                implementations: this.graph.getDesignsForRequirement(req.id).map(d => d.id),
                tests: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    generateDesignImplementationMatrix() {
        return {
            type: 'design-impl',
            coverage: this.graph.getCoverage(),
            designs: this.graph.getAllDesigns().map(design => ({
                id: design.id,
                title: design.title,
                implementations: this.graph.getImplementationsForDesign(design.id).map(impl => impl.id),
                tests: [],
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
    /**
     * Generate a Requirements-to-Test matrix specifically.
     */
    generateTestMatrix() {
        return {
            type: 'req-test',
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
    // ============================================================================
    // Template Data Preparation Methods
    // ============================================================================
    /**
     * Escapes HTML special characters in a string.
     */
    escapeHtml(text) {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    /**
     * Prepares requirement row data for template rendering.
     */
    prepareRequirementRow(row) {
        const impls = row.implementations.join(', ');
        const tests = row.tests.join(', ');
        const hasImpl = row.implementations.length > 0;
        const hasTest = row.tests.length > 0;
        const statusClass = hasImpl && hasTest
            ? 'status-complete'
            : hasImpl
                ? 'status-partial'
                : 'status-missing';
        const statusText = hasImpl && hasTest
            ? '\u2713 Complete'
            : hasImpl
                ? '\u25BC Partial'
                : '\u2717 Missing';
        return {
            id: this.escapeHtml(row.id),
            title: this.escapeHtml(row.title),
            implementations: this.escapeHtml(impls || '-'),
            tests: this.escapeHtml(tests || '-'),
            statusBadge: `<span class="status-badge ${statusClass}">${statusText}</span>`,
        };
    }
    /**
     * Prepares design row data for template rendering.
     */
    prepareDesignRow(row) {
        const impls = row.implementations.join(', ');
        const tests = row.tests.join(', ');
        const hasImpl = row.implementations.length > 0;
        const depth = row.depth || 0;
        const statusClass = hasImpl ? 'status-complete' : 'status-missing';
        const statusText = hasImpl ? '\u2713 Complete' : '\u2717 Missing';
        const hierarchyClass = `hierarchy-${Math.min(depth, 5)}`;
        // Create hierarchy indicators (visual tree lines)
        let hierarchyIndicators = '';
        if (depth > 0) {
            hierarchyIndicators = '<span class="hierarchy-indicator"></span>'.repeat(depth);
        }
        return {
            id: this.escapeHtml(row.id),
            title: this.escapeHtml(row.title),
            implementations: this.escapeHtml(impls || '-'),
            tests: this.escapeHtml(tests || '-'),
            statusBadge: `<span class="status-badge ${statusClass}">${statusText}</span>`,
            hierarchyClass,
            hierarchyIndicators,
        };
    }
    /**
     * Prepares summary data for template rendering.
     */
    prepareSummaryData(coverage, isDesignMatrix) {
        const itemType = isDesignMatrix ? 'Designs' : 'Requirements';
        const total = isDesignMatrix ? coverage.totalDesigns : coverage.totalRequirements;
        const withImplementation = isDesignMatrix
            ? coverage.designsWithImplementation
            : coverage.requirementsWithImplementation;
        const withTests = isDesignMatrix ? undefined : coverage.requirementsWithTests;
        return {
            itemType,
            total,
            withImplementation,
            withTests,
            implCoverage: coverage.implementationCoverage.toFixed(1),
            testCoverage: coverage.testCoverage.toFixed(1),
        };
    }
    // ============================================================================
    // Export Methods
    // ============================================================================
    /**
     * Export the traceability matrix as CSV format.
     * Generates a Requirements-to-Implementation matrix with coverage info.
     */
    exportToCSV(type = 'req-impl') {
        const matrix = type === 'req-test' ? this.generateTestMatrix() : this.generateMatrix(type);
        const lines = [];
        if ('designs' in matrix) {
            // Design-Implementation matrix
            const m = matrix;
            lines.push('Design ID,Design Title,Implementations,Tests,Status');
            for (const design of m.designs) {
                const impls = design.implementations.join(';');
                const tests = design.tests.join(';');
                const hasImpl = design.implementations.length > 0;
                const status = hasImpl ? '\u2713 Complete' : '\u2717 Missing';
                const escapedTitle = design.title.includes(',') ? `"${design.title}"` : design.title;
                lines.push(`${design.id},"${escapedTitle}","${impls}","${tests}",${status}`);
            }
            lines.push('');
            lines.push(`Total Designs,${m.designs.length}`);
        }
        else {
            // Requirements matrix (req-impl or req-test)
            const m = matrix;
            lines.push('Requirement ID,Requirement Title,Implementations,Tests,Status');
            for (const req of m.requirements) {
                const impls = req.implementations.join(';');
                const tests = req.tests.join(';');
                const hasImpl = req.implementations.length > 0;
                const hasTest = req.tests.length > 0;
                const status = hasImpl && hasTest ? '\u2713 Complete' : hasImpl ? '\u25BC Partial' : '\u2717 Missing';
                const escapedTitle = req.title.includes(',') ? `"${req.title}"` : req.title;
                lines.push(`${req.id},"${escapedTitle}","${impls}","${tests}",${status}`);
            }
            lines.push('');
            lines.push(`Total Requirements,${m.requirements.length}`);
            lines.push(`Requirements with Implementation,${m.coverage.requirementsWithImplementation}`);
            lines.push(`Requirements with Tests,${m.coverage.requirementsWithTests}`);
            lines.push(`Implementation Coverage,${m.coverage.implementationCoverage}%`);
            lines.push(`Test Coverage,${m.coverage.testCoverage}%`);
        }
        return lines.join('\n');
        return lines.join('\n');
    }
    /**
     * Export the traceability matrix as HTML format.
     * Generates a styled HTML table with coverage information using Mustache templates.
     */
    exportToHTML(type = 'req-impl') {
        const matrix = type === 'req-test' ? this.generateTestMatrix() : this.generateMatrix(type);
        if ('designs' in matrix) {
            return this.exportDesignMatrixToHTML(matrix, type);
        }
        // Prepare data for template
        const rows = matrix.requirements.map(row => this.prepareRequirementRow(row));
        const summary = this.prepareSummaryData(matrix.coverage, false);
        const templateData = {
            type,
            rows,
            summary,
        };
        return this.templateRenderer.render('matrix', templateData);
    }
    /**
     * Export design matrix as HTML format using Mustache templates.
     */
    exportDesignMatrixToHTML(matrix, type) {
        // Prepare data for template
        const rows = matrix.designs.map(row => this.prepareDesignRow(row));
        const summary = this.prepareSummaryData(matrix.coverage, true);
        const templateData = {
            type,
            rows,
            summary,
        };
        return this.templateRenderer.render('design-matrix', templateData);
    }
    // ============================================================================
    // Inverse Matrix Generators (Phase 3)
    // ============================================================================
    generateImplementationRequirementMatrix() {
        const allRequirements = new Set(this.graph.getAllRequirements().map(req => req.id));
        // For impl-req matrix: rows are implementations, implementations field contains satisfied requirements
        return {
            type: 'impl-req',
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllImplementations().map(impl => ({
                id: impl.id,
                title: impl.title,
                // Use satisfies relationships to find which requirements this impl satisfies
                implementations: this.graph.getRelationships(impl.id, 'satisfies')
                    .filter(r => allRequirements.has(r.targetId))
                    .map(r => r.targetId),
                tests: [], // Not used for impl-req matrix
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    generateTestImplementationMatrix() {
        const allImplementations = new Set(this.graph.getAllImplementations().map(imp => imp.id));
        // For test-impl matrix: rows are tests, implementations field contains tested implementations
        return {
            type: 'test-impl',
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllTests().map(test => ({
                id: test.id,
                title: test.title,
                // Use tests relationships to find which implementations this test tests
                implementations: this.graph.getRelationships(test.id, 'tests')
                    .filter(r => allImplementations.has(r.targetId))
                    .map(r => r.targetId),
                tests: [], // Not used for test-impl matrix
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    generateTestRequirementMatrix() {
        const allRequirements = new Set(this.graph.getAllRequirements().map(req => req.id));
        // For test-req matrix: rows are tests, implementations field contains verified requirements
        return {
            type: 'test-req',
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllTests().map(test => ({
                id: test.id,
                title: test.title,
                // Use verifies relationships to find which requirements this test verifies
                implementations: this.graph.getRelationships(test.id, 'verifies')
                    .filter(r => allRequirements.has(r.targetId))
                    .map(r => r.targetId),
                tests: [], // Not used for test-req matrix
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    generateDesignRequirementMatrix() {
        const allRequirements = new Set(this.graph.getAllRequirements().map(req => req.id));
        // For design-req matrix: rows are designs, implementations field contains addressed requirements
        return {
            type: 'design-req',
            coverage: this.graph.getCoverage(),
            requirements: this.graph.getAllDesigns().map(design => ({
                id: design.id,
                title: design.title,
                // Use addresses relationships to find which requirements this design addresses
                implementations: this.graph.getRelationships(design.id, 'addresses')
                    .filter(r => allRequirements.has(r.targetId))
                    .map(r => r.targetId),
                tests: [], // Not used for design-req matrix
            })),
            generatedAt: new Date().toISOString(),
        };
    }
    // ============================================================================
    // Design-Design Matrix (Phase 3)
    // ============================================================================
    /**
     * Calculate hierarchy depth for each design based on composed-of relationships.
     * Returns a map of design ID to depth level (0 = root, 1 = child, etc.)
     */
    calculateDesignHierarchyDepths() {
        const depths = new Map();
        const allDesigns = this.graph.getAllDesigns();
        const allDesignIds = new Set(allDesigns.map(d => d.id));
        // Find root designs (designs that are NOT composed by any other design)
        // A design is a root if no other design has it in their composed-of relationships
        const composedByOthers = new Set();
        for (const design of allDesigns) {
            const composedOfRels = this.graph.getRelationships(design.id, 'composed-of');
            for (const rel of composedOfRels) {
                if (allDesignIds.has(rel.targetId)) {
                    // design is composed of rel.targetId, so rel.targetId is a child
                    composedByOthers.add(rel.targetId);
                }
            }
        }
        // Root designs (not composed by any other design) have depth 0
        for (const design of allDesigns) {
            if (!composedByOthers.has(design.id)) {
                depths.set(design.id, 0);
            }
        }
        // Calculate depths for child designs using BFS
        // Children are designs that are composed-of by their parents
        const queue = [];
        for (const [designId, depth] of depths) {
            queue.push({ designId, depth });
        }
        while (queue.length > 0) {
            const current = queue.shift();
            // Find designs that this design is composed of (these are children)
            const composedOfRels = this.graph.getRelationships(current.designId, 'composed-of');
            for (const rel of composedOfRels) {
                if (allDesignIds.has(rel.targetId) && !depths.has(rel.targetId)) {
                    depths.set(rel.targetId, current.depth + 1);
                    queue.push({ designId: rel.targetId, depth: current.depth + 1 });
                }
            }
        }
        return depths;
    }
    generateDesignDesignMatrix() {
        const allDesigns = this.graph.getAllDesigns();
        const designIds = new Set(allDesigns.map(d => d.id));
        const depths = this.calculateDesignHierarchyDepths();
        return {
            type: 'design-design',
            coverage: this.graph.getCoverage(),
            designs: allDesigns.map(design => {
                // Get all designs that this design is composed of
                const composedOf = this.graph.getRelationships(design.id, 'composed-of')
                    .filter(r => designIds.has(r.targetId))
                    .map(r => r.targetId);
                // Get all designs that depend on this design
                const dependsOn = this.graph.getRelationships(design.id, 'depends-on')
                    .filter(r => designIds.has(r.targetId))
                    .map(r => r.targetId);
                // Combine both types of relationships
                const relatedDesigns = [...composedOf, ...dependsOn];
                return {
                    id: design.id,
                    title: design.title,
                    // Use implementations field to store related designs
                    implementations: relatedDesigns,
                    tests: [], // Not used for design-design matrix
                    // Add hierarchy depth for visual indentation
                    depth: depths.get(design.id) || 0,
                };
            }),
            generatedAt: new Date().toISOString(),
        };
    }
}
