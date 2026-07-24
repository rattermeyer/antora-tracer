/**
 * Neo4j Exporter for traceability graphs
 * Exports traceability data in CSV or Cypher format for import into Neo4j
 */
import * as fs from 'fs';
import * as path from 'path';
/**
 * Exports traceability graph to Neo4j-compatible formats
 */
export class Neo4jExporter {
    graph;
    constructor(graph) {
        this.graph = graph;
    }
    /**
     * Export the graph to Neo4j format
     */
    export(options) {
        // Ensure output directory exists
        if (!fs.existsSync(options.outputDir)) {
            fs.mkdirSync(options.outputDir, { recursive: true });
        }
        const includeContent = options.includeContent ?? true;
        const includeAllAttributes = options.includeAllAttributes ?? true;
        if (options.format === 'csv') {
            return this.exportAsCSV(options.outputDir, includeContent, includeAllAttributes);
        }
        else {
            return this.exportAsCypher(options.outputDir, includeContent, includeAllAttributes);
        }
    }
    /**
     * Export as CSV files (nodes.csv and relationships.csv)
     */
    exportAsCSV(outputDir, includeContent, includeAllAttributes) {
        const nodesFile = path.join(outputDir, 'nodes.csv');
        const relationshipsFile = path.join(outputDir, 'relationships.csv');
        const nodes = this.getAllItems();
        const relationships = this.graph.getAllRelationships();
        // Write nodes CSV
        const nodeHeaders = this.getNodeHeaders(includeContent, includeAllAttributes);
        const nodeRows = nodes.map(node => this.nodeToCSVRow(node, nodeHeaders, includeContent, includeAllAttributes));
        const nodesCSV = [
            nodeHeaders.join(','),
            ...nodeRows
        ].join('\n');
        fs.writeFileSync(nodesFile, nodesCSV);
        // Write relationships CSV
        const relHeaders = ['source', 'target', 'type'];
        const relRows = relationships.map(rel => this.relationshipToCSVRow(rel));
        const relationshipsCSV = [
            relHeaders.join(','),
            ...relRows
        ].join('\n');
        fs.writeFileSync(relationshipsFile, relationshipsCSV);
        return {
            nodesFile,
            relationshipsFile,
            nodeCount: nodes.length,
            relationshipCount: relationships.length,
        };
    }
    /**
     * Export as Cypher file
     */
    exportAsCypher(outputDir, includeContent, includeAllAttributes) {
        const cypherFile = path.join(outputDir, 'import.cypher');
        const nodes = this.getAllItems();
        const relationships = this.graph.getAllRelationships();
        const lines = [];
        // Add comments and indexes
        lines.push('// Neo4j Cypher import file');
        lines.push(`// Generated: ${new Date().toISOString()}`);
        lines.push(`// Nodes: ${nodes.length}, Relationships: ${relationships.length}`);
        lines.push('');
        // Create indexes for faster queries
        lines.push('// Create indexes for performance');
        lines.push('CREATE INDEX FOR (n:Item) ON (n.id);');
        lines.push('CREATE INDEX FOR (n:Item) ON (n.role);');
        lines.push('');
        // Create nodes
        lines.push('// Create nodes');
        for (const node of nodes) {
            lines.push(this.nodeToCypher(node, includeContent, includeAllAttributes));
        }
        lines.push('');
        // Create relationships
        lines.push('// Create relationships');
        for (const rel of relationships) {
            lines.push(this.relationshipToCypher(rel));
        }
        fs.writeFileSync(cypherFile, lines.join('\n'));
        return {
            cypherFile,
            nodeCount: nodes.length,
            relationshipCount: relationships.length,
        };
    }
    /**
     * Get all items from the graph
     */
    getAllItems() {
        return [
            ...this.graph.getAllRequirements(),
            ...this.graph.getAllImplementations(),
            ...this.graph.getAllTests(),
            ...this.graph.getAllDocuments(),
            ...this.graph.getAllDesigns(),
        ];
    }
    /**
     * Get CSV headers for nodes
     */
    getNodeHeaders(includeContent, includeAllAttributes) {
        const headers = ['id', 'role', 'title'];
        if (includeContent) {
            headers.push('content');
        }
        // Add common attributes
        headers.push('status');
        if (includeAllAttributes) {
            headers.push('attributes');
        }
        headers.push('sourceFile');
        headers.push('sourceLine');
        return headers;
    }
    /**
     * Convert a node to CSV row
     */
    nodeToCSVRow(node, headers, includeContent, includeAllAttributes) {
        const values = [];
        for (const header of headers) {
            switch (header) {
                case 'id':
                    values.push(this.escapeCSV(node.id));
                    break;
                case 'role':
                    // For now, we'll use the type as role (will be updated when we have proper roles)
                    values.push(this.escapeCSV(this.getNodeRole(node)));
                    break;
                case 'title':
                    values.push(this.escapeCSV(node.title));
                    break;
                case 'content':
                    values.push(includeContent ? this.escapeCSV(node.content || '') : '');
                    break;
                case 'status':
                    values.push(this.escapeCSV(node.status || ''));
                    break;
                case 'attributes':
                    if (includeAllAttributes && node.attributes) {
                        values.push(this.escapeCSV(JSON.stringify(node.attributes)));
                    }
                    else {
                        values.push('');
                    }
                    break;
                case 'sourceFile':
                    values.push(this.escapeCSV(node.sourceFile || ''));
                    break;
                case 'sourceLine':
                    values.push(String(node.sourceLine || ''));
                    break;
                default:
                    values.push('');
            }
        }
        return values.join(',');
    }
    /**
     * Get the role for a node based on its type
     */
    getNodeRole(node) {
        // This is a temporary mapping until we have proper role support
        // In the new architecture, nodes will have a role property
        if ('satisfiedBy' in node || 'implementedBy' in node) {
            return 'requirement';
        }
        if ('satisfies' in node) {
            return 'implementation';
        }
        if ('verifies' in node || 'tests' in node) {
            return 'test';
        }
        if ('documentedBy' in node || 'documents' in node) {
            return 'document';
        }
        return 'unknown';
    }
    /**
     * Convert a relationship to CSV row
     */
    relationshipToCSVRow(rel) {
        return [
            this.escapeCSV(rel.fromId),
            this.escapeCSV(rel.targetId),
            this.escapeCSV(rel.type),
        ].join(',');
    }
    /**
     * Convert a node to Cypher CREATE statement
     */
    nodeToCypher(node, includeContent, includeAllAttributes) {
        const role = this.sanitizeCypherLabel(this.getNodeRole(node));
        const properties = {
            id: node.id,
            role: this.getNodeRole(node),
            title: node.title,
        };
        if (includeContent && node.content) {
            properties.content = node.content;
        }
        if (node.status) {
            properties.status = node.status;
        }
        if (includeAllAttributes && node.attributes) {
            // Add all attributes as properties
            for (const [key, value] of Object.entries(node.attributes)) {
                // Skip standard properties that are already included
                if (!['id', 'title', 'content', 'status', 'role'].includes(key)) {
                    properties[key] = value;
                }
            }
        }
        if (node.sourceFile) {
            properties.sourceFile = node.sourceFile;
        }
        if (node.sourceLine) {
            properties.sourceLine = node.sourceLine;
        }
        const propsString = this.propertiesToCypher(properties);
        return `CREATE (:Item:${role} {${propsString}});`;
    }
    /**
     * Convert a relationship to Cypher CREATE statement
     */
    relationshipToCypher(rel) {
        const relationType = this.sanitizeCypherLabel(rel.type);
        return `MATCH (source:Item {id: ${this.escapeCypherString(rel.fromId)}}), ` +
            `(target:Item {id: ${this.escapeCypherString(rel.targetId)}}) ` +
            `CREATE (source)-[:${relationType}]->(target);`;
    }
    /**
     * Convert properties object to Cypher parameter string
     */
    propertiesToCypher(properties) {
        const parts = [];
        for (const [key, value] of Object.entries(properties)) {
            const safeKey = this.sanitizeCypherProperty(key);
            const safeValue = this.escapeCypherValue(value);
            parts.push(`${safeKey}: ${safeValue}`);
        }
        return parts.join(', ');
    }
    /**
     * Escape a value for Cypher
     */
    escapeCypherValue(value) {
        if (value === null || value === undefined) {
            return 'null';
        }
        if (typeof value === 'string') {
            return this.escapeCypherString(value);
        }
        if (typeof value === 'number') {
            return String(value);
        }
        if (typeof value === 'boolean') {
            return value ? 'true' : 'false';
        }
        // For objects/arrays, use JSON string
        return this.escapeCypherString(JSON.stringify(value));
    }
    /**
     * Escape a string for Cypher
     */
    escapeCypherString(value) {
        // Escape backslashes first
        let result = value.replace(/\\/g, '\\\\');
        // Escape single quotes by doubling them
        result = result.replace(/'/g, "''");
        // Wrap in single quotes
        return `'${result}'`;
    }
    /**
     * Escape a value for CSV
     */
    escapeCSV(value) {
        if (value === null || value === undefined) {
            return '';
        }
        // If value contains quotes, commas, or newlines, wrap in quotes and escape quotes
        if (value.includes('"') || value.includes(',') || value.includes('\n') || value.includes('\r')) {
            const escaped = value.replace(/"/g, '""');
            return `"${escaped}"`;
        }
        return value;
    }
    /**
     * Sanitize a label for Cypher (must be alphanumeric with underscores)
     */
    sanitizeCypherLabel(label) {
        // Neo4j labels: must start with A-Za-z, can contain A-Za-z0-9_ and $
        // Replace invalid characters with underscore
        return label
            .replace(/[^a-zA-Z0-9_$]/g, '_')
            .replace(/^\d/, '_'); // Can't start with number
    }
    /**
     * Sanitize a property name for Cypher
     */
    sanitizeCypherProperty(name) {
        // Neo4j property names: must be valid identifiers
        // Start with letter or underscore, then letters, digits, or underscores
        let result = name
            .replace(/[^a-zA-Z0-9_]/g, '_')
            .replace(/^\d/, '_');
        // Ensure it doesn't start with a reserved word
        const reservedWords = ['id', 'role', 'title', 'content', 'status', 'sourceFile', 'sourceLine'];
        if (reservedWords.includes(result.toLowerCase())) {
            result = `_${result}`;
        }
        return result;
    }
    /**
     * Get export statistics
     */
    getStats() {
        const nodes = this.getAllItems();
        const relationships = this.graph.getAllRelationships();
        const roleCount = {};
        for (const node of nodes) {
            const role = this.getNodeRole(node);
            roleCount[role] = (roleCount[role] || 0) + 1;
        }
        return {
            nodeCount: nodes.length,
            relationshipCount: relationships.length,
            roleCount,
        };
    }
}
/**
 * Create a Neo4j exporter for a graph
 */
export function createNeo4jExporter(graph) {
    return new Neo4jExporter(graph);
}
export default Neo4jExporter;
