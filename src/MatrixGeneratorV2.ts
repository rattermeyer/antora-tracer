/**
 * MatrixGeneratorV2 - Role-based matrix generation for v2.0 architecture
 *
 * This replaces the old MatrixGenerator with:
 * - Configurable matrix types based on configuration
 * - Role-based row and column filtering
 * - Support for user-defined relation types
 * - Template-based HTML output
 */

import type { TraceabilityGraphV2 } from './TraceabilityGraphV2.js';
import type { ConfigLoader } from './config/TraceabilityConfig.js';
import type { Item, ItemRelationship } from './types-v2.js';
import { TemplateRenderer } from './TemplateRenderer.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_TEMPLATE_DIR = path.join(__dirname, 'templates');

/**
 * Matrix cell data
 */
export interface MatrixCell {
  itemId: string;
  itemTitle: string;
  role: string;
  sourceFile?: string;
}

/**
 * Matrix row data
 */
export interface MatrixRow {
  rowId: string;
  rowTitle: string;
  rowRole: string;
  cells: MatrixCell[];
  coverage: number; // 0-100 percentage
  status: 'complete' | 'partial' | 'missing';
}

/**
 * Matrix definition for v2
 */
export interface MatrixConfig {
  name: string;
  description?: string;
  rows: string; // Role name for rows
  columns: string[]; // Role names for columns
  coverageRelations?: Record<string, string[]>; // Which relations count for coverage per column
}

/**
 * Generated matrix
 */
export interface GeneratedMatrix {
  name: string;
  type: string;
  rows: MatrixRow[];
  columns: { name: string; role: string }[];
  coverage: Record<string, number>;
  generatedAt: string;
}

/**
 * MatrixGeneratorV2 - Generates matrices based on role configuration
 */
export class MatrixGeneratorV2 {
  private readonly graph: TraceabilityGraphV2;
  private readonly configLoader?: ConfigLoader;
  private readonly templateRenderer: TemplateRenderer;

  constructor(
    graph: TraceabilityGraphV2,
    configLoader?: ConfigLoader,
    options: { templateDir?: string } = {}
  ) {
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
  generateMatrix(matrixName?: string): GeneratedMatrix {
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
  private generateMatrixFromConfig(config: MatrixConfig): GeneratedMatrix {
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

    const rows: MatrixRow[] = [];
    const columnItems = new Map<string, Item[]>();

    // Group items by column role
    for (const colRole of columnRoles) {
      columnItems.set(colRole, this.graph.getItemsByRole(colRole));
    }

    // Build rows
    for (const rowItem of rowItems) {
      const cells: MatrixCell[] = [];
      let coveredCount = 0;
      const totalColumns = columnRoles.length;

      for (const colRole of columnRoles) {
        // Find items in this column that are related to the row item
        const relatedItems = this.findRelatedItems(rowItem.id, colRole, config);

        if (relatedItems.length > 0) {
          coveredCount++;
          for (const related of relatedItems) {
            cells.push({
              itemId: related.id,
              itemTitle: related.title,
              role: related.role,
              sourceFile: related.sourceFile,
            });
          }
        } else {
          // Empty cell
          cells.push({
            itemId: '',
            itemTitle: '',
            role: colRole,
          });
        }
      }

      const coverage = (coveredCount / totalColumns) * 100;
      const status: 'complete' | 'partial' | 'missing' =
        coverage === 100 ? 'complete' :
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
   * Find items related to a row item in a specific column role
   */
  private findRelatedItems(rowId: string, columnRole: string, config: MatrixConfig): Item[] {
    const result: Item[] = [];
    const colItems = this.graph.getItemsByRole(columnRole);
    const colItemIds = new Set(colItems.map(i => i.id));

    // Get all relationships from the row item
    const relationships = this.graph.getRelationships(rowId);

    // Check coverage relations for this column
    const coverageRels = config.coverageRelations?.[columnRole] || [];

    for (const rel of relationships) {
      // Check if the target is in the column role
      if (colItemIds.has(rel.targetId)) {
        // If coverage relations are specified, only include matching relation types
        if (coverageRels.length > 0 && !coverageRels.includes(rel.type)) {
          continue;
        }

        const target = this.graph.getItem(rel.targetId);
        if (target) {
          result.push(target);
        }
      }
    }

    return result;
  }

  /**
   * Generate a default matrix when no configuration is available
   */
  private generateDefaultMatrix(matrixName?: string): GeneratedMatrix {
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

    const rows: MatrixRow[] = [];
    const columnItems = new Map<string, Item[]>();

    // Group items by column role
    for (const colRole of columnRoles) {
      columnItems.set(colRole, this.graph.getItemsByRole(colRole));
    }

    // Build rows
    for (const rowItem of rowItems) {
      const cells: MatrixCell[] = [];
      let coveredCount = 0;
      const totalColumns = columnRoles.length;

      for (const colRole of columnRoles) {
        const colItems = columnItems.get(colRole) || [];
        const colItemIds = new Set(colItems.map(i => i.id));

        // Find relationships from row item to this column
        const relatedItems: Item[] = [];
        for (const rel of this.graph.getRelationships(rowItem.id)) {
          if (colItemIds.has(rel.targetId)) {
            const target = this.graph.getItem(rel.targetId);
            if (target) {
              relatedItems.push(target);
            }
          }
        }

        if (relatedItems.length > 0) {
          coveredCount++;
          for (const related of relatedItems) {
            cells.push({
              itemId: related.id,
              itemTitle: related.title,
              role: related.role,
              sourceFile: related.sourceFile,
            });
          }
        } else {
          cells.push({
            itemId: '',
            itemTitle: '',
            role: colRole,
          });
        }
      }

      const coverage = (coveredCount / totalColumns) * 100;
      const status: 'complete' | 'partial' | 'missing' =
        coverage === 100 ? 'complete' :
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
  generateRequirementsMatrix(): GeneratedMatrix {
    if (this.configLoader) {
      const matrices = this.configLoader.getMatrices();
      const reqMatrix = matrices.find(m =>
        m.rows === 'requirement' ||
        m.name.toLowerCase().includes('requirement')
      );

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
  generateDesignMatrix(): GeneratedMatrix {
    if (this.configLoader) {
      const matrices = this.configLoader.getMatrices();
      const designMatrix = matrices.find(m =>
        m.rows === 'design' ||
        m.name.toLowerCase().includes('design')
      );

      if (designMatrix) {
        return this.generateMatrixFromConfig(designMatrix);
      }
    }

    return this.generateDefaultMatrix('design-traceability');
  }

  /**
   * Generate all matrices from configuration
   */
  generateAllMatrices(): GeneratedMatrix[] {
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
  exportToCSV(matrix: GeneratedMatrix): string {
    const lines: string[] = [];

    // Header
    const header = ['Row ID', 'Row Title', ...matrix.columns.map(c => c.name)];
    lines.push(header.join(','));

    // Data rows
    for (const row of matrix.rows) {
      const rowValues: string[] = [
        row.rowId,
        this.escapeCSV(row.rowTitle),
      ];

      // Add cell values
      for (const cell of row.cells) {
        rowValues.push(cell.itemId ? `${cell.itemId}: ${cell.itemTitle}` : '');
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
  exportToHTML(matrix: GeneratedMatrix): string {
    const rows = matrix.rows.map(row => this.prepareRowForTemplate(row));

    const templateData = {
      name: matrix.name,
      type: matrix.type,
      rows,
      columns: matrix.columns,
      coverage: matrix.coverage,
      generatedAt: matrix.generatedAt,
    };

    return this.templateRenderer.render('matrix-v2', templateData);
  }

  /**
   * Prepare a row for template rendering
   */
  private prepareRowForTemplate(row: MatrixRow): any {
    return {
      rowId: this.escapeHtml(row.rowId),
      rowTitle: this.escapeHtml(row.rowTitle),
      rowRole: this.escapeHtml(row.rowRole),
      cells: row.cells.map(cell => ({
        itemId: this.escapeHtml(cell.itemId),
        itemTitle: this.escapeHtml(cell.itemTitle),
        role: this.escapeHtml(cell.role),
      })),
      coverage: row.coverage,
      status: row.status,
      statusClass: `status-${row.status}`,
    };
  }

  /**
   * Escape HTML special characters
   */
  private escapeHtml(text: string): string {
    if (!text) return '';
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
  private escapeCSV(text: string): string {
    if (!text) return '';

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
  getRoleCoverage(role: string): { total: number; covered: number; coverage: number } {
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
  getCoverageReport(): Record<string, any> {
    const roles = this.graph.getAllRoles();
    const report: Record<string, any> = {};

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
  generateDetailedMatrix(matrixName?: string): any {
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
  getRelationshipsBetweenRoles(sourceRole: string, targetRole: string): ItemRelationship[] {
    return this.graph.getRelationshipsByRoles(sourceRole, targetRole);
  }

  /**
   * Get relationship statistics by type
   */
  getRelationshipStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    const allRels = this.graph.getAllRelationships();

    for (const rel of allRels) {
      stats[rel.type] = (stats[rel.type] || 0) + 1;
    }

    return stats;
  }
}
