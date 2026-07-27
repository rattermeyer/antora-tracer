/**
 * MatrixGenerator - Role-based matrix generation
 *
 * This replaces the old MatrixGenerator with:
 * - Configurable matrix types based on configuration
 * - Role-based row and column filtering
 * - Support for user-defined relation types
 * - Template-based HTML output
 */
import { TemplateRenderer } from './TemplateRenderer.js';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TEMPLATE_DIR = path.join(__dirname, 'templates');
/**
 * MatrixGenerator - Generates matrices based on role configuration
 */
export class MatrixGenerator {
    graph;
    configLoader;
    templateRenderer;
    constructor(graph, configLoader, options = {}) {
        this.graph = graph;
        this.configLoader = configLoader;
        const templateDir = options.templateDir || DEFAULT_TEMPLATE_DIR;
        this.templateRenderer = new TemplateRenderer(templateDir);
    }
    // ========================================================================
    // Matrix Generation
    // ========================================================================
    /**
     * Generate a matrix by name from configuration
     */
    generateMatrix(matrixName) {
        if (!this.configLoader) {
            // Fallback: generate a default matrix if no config
            return this.generateDefaultMatrix(matrixName);
        }
        const matrices = this.configLoader.getMatrices();
        if (!matrixName && matrices.length > 0) {
            // Use the first matrix as default
            return this.generateMatrixFromConfig(matrices[0]);
        }
        const matrixConfig = matrices.find(m => m.name === matrixName);
        if (!matrixConfig) {
            throw new Error(`Matrix '${matrixName}' not found in configuration`);
        }
        return this.generateMatrixFromConfig(matrixConfig);
    }
    /**
     * Generate matrix from configuration
     */
    generateMatrixFromConfig(config) {
        const rowRole = config.rows;
        const columnRoles = config.columns;
        // Get all items with the row role
        const rowItems = this.graph.getItemsByRole(rowRole);
        if (rowItems.length === 0) {
            return {
                name: config.name,
                type: `${rowRole}-matrix`,
                rows: [],
                columns: columnRoles.map(role => ({ name: role, role })),
                coverage: {},
                generatedAt: new Date().toISOString(),
            };
        }
        // Pre-compute: role -> Set of item IDs for fast lookup
        const roleItemIds = new Map();
        for (const role of [rowRole, ...columnRoles]) {
            const items = this.graph.getItemsByRole(role);
            roleItemIds.set(role, new Set(items.map(i => i.id)));
        }
        // Pre-compute: item ID -> item for fast lookup
        const itemById = new Map();
        for (const item of this.graph.getAllItems()) {
            itemById.set(item.id, item);
        }
        // Pre-compute coverage relations per column
        const coverageRelsByColumn = new Map();
        for (const colRole of columnRoles) {
            coverageRelsByColumn.set(colRole, config.coverageRelations?.[colRole] || []);
        }
        const rows = [];
        // Build rows
        for (const rowItem of rowItems) {
            const cells = [];
            let coveredCount = 0;
            const totalColumns = columnRoles.length;
            for (const colRole of columnRoles) {
                // Use pre-computed data for faster lookup
                const colItemIds = roleItemIds.get(colRole) || new Set();
                const coverageRels = coverageRelsByColumn.get(colRole) || [];
                const hasCoverageFilter = coverageRels.length > 0;
                // Collect all related items for this column
                const relatedItems = this.findRelatedItemsWithCache(rowItem.id, colItemIds, coverageRels, hasCoverageFilter, itemById);
                const cellItems = relatedItems.map(rel => ({
                    itemId: rel.id,
                    itemTitle: rel.title,
                    role: rel.role,
                    sourceFile: rel.sourceFile,
                }));
                if (cellItems.length > 0) {
                    coveredCount++;
                }
                cells.push({
                    items: cellItems,
                    role: colRole,
                });
            }
            const coverage = (coveredCount / totalColumns) * 100;
            const status = coverage === 100 ? 'complete' :
                coverage > 0 ? 'partial' : 'missing';
            rows.push({
                rowId: rowItem.id,
                rowTitle: rowItem.title,
                rowRole: rowItem.role,
                cells,
                coverage,
                status,
            });
        }
        // Calculate overall coverage
        const coveredRows = rows.filter(r => r.status === 'complete').length;
        const overallCoverage = (coveredRows / rows.length) * 100;
        return {
            name: config.name,
            type: `${rowRole}-${columnRoles.join('-')}`,
            rows,
            columns: columnRoles.map(role => ({ name: role, role })),
            coverage: {
                overall: overallCoverage,
                complete: coveredRows,
                partial: rows.filter(r => r.status === 'partial').length,
                missing: rows.filter(r => r.status === 'missing').length,
                total: rows.length,
            },
            generatedAt: new Date().toISOString(),
        };
    }
    /**
     * Find items related to a row item in a specific column role using pre-computed caches.
     * This is an optimized version that avoids repeated calls to getItemsByRole() and getItem().
     */
    findRelatedItemsWithCache(rowId, colItemIds, coverageRels, hasCoverageFilter, itemById) {
        const result = [];
        const seen = new Set();
        // Forward direction: row item → column item
        const forwardRels = this.graph.getRelationships(rowId);
        for (const rel of forwardRels) {
            if (colItemIds.has(rel.targetId)) {
                if (hasCoverageFilter && !coverageRels.includes(rel.type)) {
                    continue;
                }
                const target = itemById.get(rel.targetId);
                if (target && !seen.has(target.id)) {
                    seen.add(target.id);
                    result.push(target);
                }
            }
        }
        // Reverse direction: column item → row item
        const reverseRels = this.graph.getReverseRelationships(rowId);
        for (const rel of reverseRels) {
            if (colItemIds.has(rel.fromId)) {
                if (hasCoverageFilter && !coverageRels.includes(rel.type)) {
                    continue;
                }
                const source = itemById.get(rel.fromId);
                if (source && !seen.has(source.id)) {
                    seen.add(source.id);
                    result.push(source);
                }
            }
        }
        return result;
    }
    /**
     * Generate a default matrix when no configuration is available
     */
    generateDefaultMatrix(matrixName) {
        // Try to find items with common roles
        const allRoles = this.graph.getAllRoles();
        let rowRole = 'requirement';
        let columnRoles = ['implementation', 'test', 'design'];
        // If we have the role in our graph, use it
        if (!this.graph.hasRole(rowRole)) {
            rowRole = allRoles[0] || 'item';
            columnRoles = allRoles.slice(1, 4);
        }
        const rowItems = this.graph.getItemsByRole(rowRole);
        const rows = [];
        const columnItems = new Map();
        // Group items by column role
        for (const colRole of columnRoles) {
            columnItems.set(colRole, this.graph.getItemsByRole(colRole));
        }
        // Build rows
        for (const rowItem of rowItems) {
            const cells = [];
            let coveredCount = 0;
            const totalColumns = columnRoles.length;
            for (const colRole of columnRoles) {
                const colItems = columnItems.get(colRole) || [];
                const colItemIds = new Set(colItems.map(i => i.id));
                const relatedItems = [];
                const seenIds = new Set();
                // Forward: row item → column item
                for (const rel of this.graph.getRelationships(rowItem.id)) {
                    if (colItemIds.has(rel.targetId)) {
                        const target = this.graph.getItem(rel.targetId);
                        if (target && !seenIds.has(target.id)) {
                            seenIds.add(target.id);
                            relatedItems.push({
                                itemId: target.id,
                                itemTitle: target.title,
                                role: target.role,
                                sourceFile: target.sourceFile,
                            });
                        }
                    }
                }
                // Reverse: column item → row item
                for (const rel of this.graph.getReverseRelationships(rowItem.id)) {
                    if (colItemIds.has(rel.fromId)) {
                        const source = this.graph.getItem(rel.fromId);
                        if (source && !seenIds.has(source.id)) {
                            seenIds.add(source.id);
                            relatedItems.push({
                                itemId: source.id,
                                itemTitle: source.title,
                                role: source.role,
                                sourceFile: source.sourceFile,
                            });
                        }
                    }
                }
                if (relatedItems.length > 0) {
                    coveredCount++;
                }
                cells.push({
                    items: relatedItems,
                    role: colRole,
                });
            }
            const coverage = (coveredCount / totalColumns) * 100;
            const status = coverage === 100 ? 'complete' :
                coverage > 0 ? 'partial' : 'missing';
            rows.push({
                rowId: rowItem.id,
                rowTitle: rowItem.title,
                rowRole: rowItem.role,
                cells,
                coverage,
                status,
            });
        }
        const coveredRows = rows.filter(r => r.status === 'complete').length;
        const overallCoverage = (coveredRows / rows.length) * 100 || 0;
        return {
            name: matrixName || `${rowRole}-matrix`,
            type: `${rowRole}-${columnRoles.join('-')}`,
            rows,
            columns: columnRoles.map(role => ({ name: role, role })),
            coverage: {
                overall: overallCoverage,
                complete: coveredRows,
                partial: rows.filter(r => r.status === 'partial').length,
                missing: rows.filter(r => r.status === 'missing').length,
                total: rows.length,
            },
            generatedAt: new Date().toISOString(),
        };
    }
    // ========================================================================
    // Specific Matrix Types
    // ========================================================================
    /**
     * Generate a requirements traceability matrix
     */
    generateRequirementsMatrix() {
        if (this.configLoader) {
            const matrices = this.configLoader.getMatrices();
            const reqMatrix = matrices.find(m => m.rows === 'requirement' ||
                m.name.toLowerCase().includes('requirement'));
            if (reqMatrix) {
                return this.generateMatrixFromConfig(reqMatrix);
            }
        }
        // Fallback to default
        return this.generateDefaultMatrix('requirements-traceability');
    }
    /**
     * Generate a design traceability matrix
     */
    generateDesignMatrix() {
        if (this.configLoader) {
            const matrices = this.configLoader.getMatrices();
            const designMatrix = matrices.find(m => m.rows === 'design' ||
                m.name.toLowerCase().includes('design'));
            if (designMatrix) {
                return this.generateMatrixFromConfig(designMatrix);
            }
        }
        return this.generateDefaultMatrix('design-traceability');
    }
    /**
     * Generate all matrices from configuration
     */
    generateAllMatrices() {
        if (!this.configLoader) {
            return [this.generateDefaultMatrix()];
        }
        const matrices = this.configLoader.getMatrices();
        return matrices.map(config => this.generateMatrixFromConfig(config));
    }
    // ========================================================================
    // Export Methods
    // ========================================================================
    /**
     * Export a matrix to CSV format
     */
    exportToCSV(matrix) {
        const lines = [];
        // Header
        const header = ['Row ID', 'Row Title', ...matrix.columns.map(c => c.name)];
        lines.push(header.join(','));
        // Data rows
        for (const row of matrix.rows) {
            const rowValues = [
                row.rowId,
                this.escapeCSV(row.rowTitle),
            ];
            // Add cell values
            const cellValues = row.cells.map(cell => {
                if (cell.items.length === 0)
                    return '';
                return cell.items.map(item => `${item.itemId}: ${item.itemTitle}`).join('; ');
            });
            for (const val of cellValues) {
                rowValues.push(val);
            }
            lines.push(rowValues.map(v => this.escapeCSV(v)).join(','));
        }
        // Summary
        lines.push('');
        lines.push(`Total ${matrix.rows.length} rows`);
        lines.push(`Coverage: ${matrix.coverage.overall.toFixed(1)}%`);
        return lines.join('\n');
    }
    /**
     * Export a matrix to HTML format
     */
    exportToHTML(matrix) {
        const rows = matrix.rows.map(row => this.prepareRowForTemplate(row));
        const templateData = {
            name: matrix.name,
            type: matrix.type,
            rows,
            columns: matrix.columns,
            coverage: {
                ...matrix.coverage,
                overallFormatted: matrix.coverage.overall.toFixed(1),
            },
            generatedAt: matrix.generatedAt,
        };
        return this.templateRenderer.render('matrix', templateData);
    }
    /**
     * Prepare a row for template rendering
     */
    prepareRowForTemplate(row) {
        return {
            rowId: this.escapeHtml(row.rowId),
            rowTitle: this.escapeHtml(row.rowTitle),
            rowRole: this.escapeHtml(row.rowRole),
            cells: row.cells.map(cell => ({
                hasItems: cell.items.length > 0,
                items: cell.items.map(item => ({
                    itemId: this.escapeHtml(item.itemId),
                    itemTitle: this.escapeHtml(item.itemTitle),
                    role: this.escapeHtml(item.role),
                })),
                role: this.escapeHtml(cell.role),
            })),
            coverage: row.coverage,
            coverageFormatted: row.coverage.toFixed(1),
            status: row.status,
            statusClass: `status-${row.status}`,
        };
    }
    /**
     * Escape HTML special characters
     */
    escapeHtml(text) {
        if (!text)
            return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }
    /**
     * Escape CSV special characters
     */
    escapeCSV(text) {
        if (!text)
            return '';
        if (text.includes(',') || text.includes('"') || text.includes('\n')) {
            const escaped = text.replace(/"/g, '""');
            return `"${escaped}"`;
        }
        return text;
    }
    // ========================================================================
    // Coverage Analysis
    // ========================================================================
    /**
     * Get coverage statistics for a specific role
     */
    getRoleCoverage(role) {
        const items = this.graph.getItemsByRole(role);
        const total = items.length;
        if (total === 0) {
            return { total: 0, covered: 0, coverage: 0 };
        }
        // Count items that have at least one outgoing relationship
        let covered = 0;
        for (const item of items) {
            const rels = this.graph.getRelationships(item.id);
            if (rels.length > 0) {
                covered++;
            }
        }
        const coverage = (covered / total) * 100;
        return { total, covered, coverage };
    }
    /**
     * Get overall coverage statistics
     */
    getCoverageReport() {
        const roles = this.graph.getAllRoles();
        const report = {};
        for (const role of roles) {
            const coverage = this.getRoleCoverage(role);
            report[`${role}_coverage`] = coverage;
        }
        // Overall statistics
        const allItems = this.graph.getAllItems();
        const allRels = this.graph.getAllRelationships();
        report.total_items = allItems.length;
        report.total_relationships = allRels.length;
        report.roles = roles;
        return report;
    }
    // ========================================================================
    // Detailed Matrix Generation
    // ========================================================================
    /**
     * Generate a detailed matrix with full item information
     */
    generateDetailedMatrix(matrixName) {
        const matrix = this.generateMatrix(matrixName);
        return {
            ...matrix,
            items: this.graph.getAllItems().map(item => ({
                id: item.id,
                title: item.title,
                role: item.role,
                status: item.status,
                sourceFile: item.sourceFile,
                sourceLine: item.sourceLine,
                relationships: this.graph.getRelationships(item.id).map(rel => ({
                    type: rel.type,
                    targetId: rel.targetId,
                    target: this.graph.getItem(rel.targetId),
                })),
            })),
        };
    }
    // ========================================================================
    // Relationship Analysis
    // ========================================================================
    /**
     * Get all relationships between two roles
     */
    getRelationshipsBetweenRoles(sourceRole, targetRole) {
        return this.graph.getRelationshipsByRoles(sourceRole, targetRole);
    }
    /**
     * Get relationship statistics by type
     */
    getRelationshipStatistics() {
        const stats = {};
        const allRels = this.graph.getAllRelationships();
        for (const rel of allRels) {
            stats[rel.type] = (stats[rel.type] || 0) + 1;
        }
        return stats;
    }
}
