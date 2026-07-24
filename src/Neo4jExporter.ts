/**
 * Neo4j Exporter for traceability graphs
 * Exports traceability data in CSV or Cypher format for import into Neo4j
 */

import * as fs from 'fs';
import * as path from 'path';
import type { TraceabilityGraph } from './TraceabilityGraph.js';
import type { Item, ItemRelationship } from './types.js';

/**
 * Options for Neo4j export
 */
export interface Neo4jExportOptions {
  /**
   * Output directory for export files
   */
  outputDir: string;

  /**
   * Export format: 'csv' or 'cypher'
   */
  format: 'csv' | 'cypher';

  /**
   * Include item content in export (can be large)
   */
  includeContent?: boolean;

  /**
   * Include all attributes in export
   */
  includeAllAttributes?: boolean;
}

/**
 * Result of Neo4j export
 */
export interface Neo4jExportResult {
  /**
   * Path to the nodes file (CSV only)
   */
  nodesFile?: string;

  /**
   * Path to the relationships file (CSV only)
   */
  relationshipsFile?: string;

  /**
   * Path to the Cypher file (Cypher only)
   */
  cypherFile?: string;

  /**
   * Number of nodes exported
   */
  nodeCount: number;

  /**
   * Number of relationships exported
   */
  relationshipCount: number;
}

/**
 * Neo4jExporter - Exports traceability graphs to Neo4j format
 *
 * Supports both CSV and Cypher export formats.
 * CSV format produces nodes.csv and relationships.csv files.
 * Cypher format produces import.cypher file with MERGE statements.
 */
export class Neo4jExporter {
  private graph: TraceabilityGraph;

  constructor(graph: TraceabilityGraph) {
    this.graph = graph;
  }

  /**
   * Export the graph to Neo4j format
   */
  export(options: Neo4jExportOptions): Neo4jExportResult {
    const outputDir = options.outputDir;
    const format = options.format;
    const includeContent = options.includeContent ?? true;
    const includeAllAttributes = options.includeAllAttributes ?? true;

    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const items = this.graph.getAllItems();
    const relationships = this.graph.getAllRelationships();

    const result: Neo4jExportResult = {
      nodeCount: items.length,
      relationshipCount: relationships.length,
    };

    if (format === 'csv') {
      // Export to CSV format
      const nodesFile = path.resolve(outputDir, 'nodes.csv');
      const relationshipsFile = path.resolve(outputDir, 'relationships.csv');

      this.exportNodesToCSV(items, nodesFile, includeContent, includeAllAttributes);
      this.exportRelationshipsToCSV(relationships, relationshipsFile);

      result.nodesFile = nodesFile;
      result.relationshipsFile = relationshipsFile;
    } else {
      // Export to Cypher format
      const cypherFile = path.resolve(outputDir, 'import.cypher');
      this.exportToCypher(items, relationships, cypherFile, includeContent, includeAllAttributes);
      result.cypherFile = cypherFile;
    }

    return result;
  }

  /**
   * Export nodes to CSV format
   */
  private exportNodesToCSV(items: Item[], filePath: string, includeContent: boolean, includeAllAttributes: boolean): void {
    const headers = ['id', 'title', 'role', 'status', 'sourceFile'];
    const attributeKeys: string[] = [];

    // Collect all attribute keys if including all attributes
    if (includeAllAttributes) {
      for (const item of items) {
        for (const key of Object.keys(item.attributes || {})) {
          if (!attributeKeys.includes(key)) {
            attributeKeys.push(key);
          }
        }
      }
      headers.push(...attributeKeys);
    }

    if (includeContent) {
      headers.push('content');
    }

    const lines: string[] = [this.escapeCSVRow(headers)];

    for (const item of items) {
      const row = [
        item.id,
        this.escapeCSVValue(item.title || ''),
        item.role,
        item.status || '',
        item.sourceFile || '',
      ];

      if (includeAllAttributes) {
        for (const key of attributeKeys) {
          row.push(this.escapeCSVValue(item.attributes?.[key] || ''));
        }
      }

      if (includeContent) {
        row.push(this.escapeCSVValue(item.content || ''));
      }

      lines.push(this.escapeCSVRow(row));
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  /**
   * Export relationships to CSV format
   */
  private exportRelationshipsToCSV(relationships: ItemRelationship[], filePath: string): void {
    const headers = ['id', 'source', 'target', 'type', 'sourceFile'];
    const lines: string[] = [this.escapeCSVRow(headers)];

    for (const rel of relationships) {
      const row = [
        rel.id,
        rel.fromId,
        rel.targetId,
        rel.type,
        rel.sourceFile || '',
      ];
      lines.push(this.escapeCSVRow(row));
    }

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  /**
   * Export to Cypher format
   */
  private exportToCypher(
    items: Item[],
    relationships: ItemRelationship[],
    filePath: string,
    includeContent: boolean,
    includeAllAttributes: boolean
  ): void {
    const lines: string[] = [
      '// Neo4j Cypher import file',
      '// Generated by antora-requirements-traceability',
      '// Use: neo4j-admin import --nodes=import.cypher --relationships=import.cypher',
      '',
    ];

    // Add node creation statements
    for (const item of items) {
      const props: Record<string, string> = {
        id: item.id,
        title: item.title || '',
        role: item.role,
      };

      if (item.status) {
        props.status = item.status;
      }

      if (item.sourceFile) {
        props.sourceFile = item.sourceFile;
      }

      if (includeContent && item.content) {
        props.content = item.content;
      }

      if (includeAllAttributes) {
        for (const [key, value] of Object.entries(item.attributes || {})) {
          props[key] = value;
        }
      }

      const propsStr = this.formatCypherProperties(props);
      lines.push(`MERGE (n:Item ${propsStr});`);
      lines.push('');
    }

    // Add relationship creation statements
    for (const rel of relationships) {
      const props: Record<string, string> = {
        id: rel.id,
        type: rel.type,
      };

      if (rel.sourceFile) {
        props.sourceFile = rel.sourceFile;
      }

      const propsStr = this.formatCypherProperties(props);
      lines.push(
        `MATCH (source:Item {id: $sourceId}), (target:Item {id: $targetId}) ` +
        `MERGE (source)-[r:RELATIONSHIP ${propsStr}]->(target);`
      );
      lines.push('');
    }

    // Add indexes for better performance
    lines.push('// Indexes');
    lines.push('CREATE INDEX IF NOT EXISTS FOR (n:Item) ON (n.id);');
    lines.push('CREATE INDEX IF NOT EXISTS FOR (n:Item) ON (n.role);');
    lines.push('');

    fs.writeFileSync(filePath, lines.join('\n'), 'utf8');
  }

  /**
   * Escape a value for CSV
   */
  private escapeCSVValue(value: string): string {
    if (value === undefined || value === null) {
      return '';
    }
    const str = String(value);
    // If the value contains commas, quotes, or newlines, wrap in quotes and escape quotes
    if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  /**
   * Escape a row for CSV (array of values)
   */
  private escapeCSVRow(row: string[]): string {
    return row.map(v => this.escapeCSVValue(v)).join(',');
  }

  /**
   * Format properties for Cypher
   */
  private formatCypherProperties(props: Record<string, string>): string {
    const parts: string[] = [];
    for (const [key, value] of Object.entries(props)) {
      // Escape quotes in string values
      const escapedValue = value.replace(/'/g, "\\'");
      parts.push(`${key}: '${escapedValue}'`);
    }
    return `{${parts.join(', ')}}`;
  }
}
