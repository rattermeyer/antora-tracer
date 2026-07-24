/**
 * Public API for v2.0 unified item architecture
 * This file provides the new APIs that replace the old index.ts
 */
import { DocumentParserV2 } from './DocumentParserV2.js';
import { TraceabilityGraphV2 } from './TraceabilityGraphV2.js';
import { ConfigLoader } from './config/TraceabilityConfig.js';
/**
 * Main extension class for v2.0 unified item architecture
 *
 * This class:
 * - Uses DocumentParserV2 to parse [item] macros
 * - Uses TraceabilityGraphV2 for role-based storage and validation
 * - Supports configuration via ConfigLoader
 * - Provides Neo4j export capabilities
 */
export class RequirementsTraceabilityExtensionV2 {
    graph;
    configLoader;
    parser;
    currentFile = null;
    /**
     * Create a new extension with optional configuration
     */
    constructor(configLoader) {
        this.configLoader = configLoader;
        this.graph = new TraceabilityGraphV2(configLoader);
        this.parser = new DocumentParserV2({ configLoader });
    }
    /**
     * Create extension with configuration path
     */
    static async createWithConfig(configPath) {
        let configLoader;
        try {
            configLoader = new ConfigLoader();
            configLoader.load(configPath);
            console.log(`Configuration loaded from: ${configPath || 'default location'}`);
        }
        catch (error) {
            console.warn(`Could not load configuration: ${error.message}`);
            console.warn('Using extension without configuration. Role validation will be skipped.');
        }
        return new RequirementsTraceabilityExtensionV2(configLoader);
    }
    /**
     * Create extension with preset
     */
    static async createWithPreset(presetName) {
        const configLoader = new ConfigLoader();
        const preset = configLoader.loadPreset(presetName);
        // Create a ConfigLoader instance with the preset config
        // We create a new loader and manually set its internal state
        const loader = new ConfigLoader();
        // Set the config directly (accessing private field via any)
        loader.config = {
            ...preset.traceability,
            metadata: {
                name: preset.name,
                description: preset.description,
                version: preset.version,
            },
        };
        loader.configPath = `preset:${presetName}`;
        console.log(`Created extension with preset: ${presetName}`);
        return new RequirementsTraceabilityExtensionV2(loader);
    }
    // ========================================================================
    // Processing
    // ========================================================================
    /**
     * Process AsciiDoc content with the new [item] macro syntax
     */
    process(content, options = {}) {
        this.currentFile = options.sourceFile || 'input';
        console.log(`Processing: ${this.currentFile}`);
        const startTime = Date.now();
        // Parse the content
        const parsed = this.parser.parse(content, this.currentFile);
        // Add parsed items to the graph
        for (const item of parsed.items) {
            this.graph.addItem(item);
            console.log(`Item registered: ${item.id} (role: ${item.role}) - ${item.title}`);
        }
        // Add parsed relationships to the graph
        for (const rel of parsed.relationships) {
            this.graph.addRelationship(rel);
            console.log(`Relationship added: ${rel.fromId} ${rel.type} ${rel.targetId}`);
        }
        const elapsed = Date.now() - startTime;
        console.log(`Processing complete: ${parsed.items.length} items, ${parsed.relationships.length} relationships found (${elapsed}ms)`);
        // Return the parse result with warnings and errors, plus the graph
        return {
            ...parsed,
            graph: this.graph,
        };
    }
    /**
     * Process multiple files
     */
    processFiles(files) {
        const allItems = [];
        const allRelationships = [];
        const allWarnings = [];
        const allErrors = [];
        const fileResults = [];
        for (const file of files) {
            console.log(`Processing file: ${file.path}`);
            const result = this.parser.parse(file.content, file.path);
            allItems.push(...result.items);
            allRelationships.push(...result.relationships);
            allWarnings.push(...result.warnings);
            allErrors.push(...result.errors);
            fileResults.push({
                file: file.path,
                items: result.items.length,
                relationships: result.relationships.length,
                warnings: result.warnings,
                errors: result.errors,
            });
            // Add items and relationships to graph
            for (const item of result.items) {
                this.graph.addItem(item);
            }
            for (const rel of result.relationships) {
                this.graph.addRelationship(rel);
            }
        }
        return {
            result: {
                items: allItems,
                relationships: allRelationships,
                warnings: allWarnings,
                errors: allErrors,
            },
            graph: this.graph,
            fileResults,
        };
    }
    // ========================================================================
    // Graph Operations
    // ========================================================================
    /**
     * Add an item directly to the graph
     */
    addItem(item) {
        this.graph.addItem(item);
        console.log(`Item registered: ${item.id} (role: ${item.role}) - ${item.title}`);
    }
    /**
     * Add a relationship directly to the graph
     */
    addRelationship(relationship) {
        this.graph.addRelationship(relationship);
        console.log(`Relationship added: ${relationship.fromId} ${relationship.type} ${relationship.targetId}`);
    }
    /**
     * Add a simple relationship by IDs and type
     */
    addSimpleRelationship(fromId, toId, type) {
        const relationship = {
            id: `${fromId}-${type}-${toId}`,
            fromId,
            targetId: toId,
            type,
            sourceFile: this.currentFile || 'unknown',
        };
        this.addRelationship(relationship);
    }
    // ========================================================================
    // Query Methods
    // ========================================================================
    /**
     * Get all items
     */
    getAllItems() {
        return this.graph.getAllItems();
    }
    /**
     * Get items by role
     */
    getItemsByRole(role) {
        return this.graph.getItemsByRole(role);
    }
    /**
     * Get all relationships
     */
    getAllRelationships() {
        return this.graph.getAllRelationships();
    }
    /**
     * Get relationships from an item
     */
    getRelationships(fromId, type) {
        return this.graph.getRelationships(fromId, type);
    }
    /**
     * Get items related to a given item
     */
    getRelatedItems(itemId, relationType) {
        return this.graph.getRelatedItems(itemId, relationType);
    }
    /**
     * Get items with relation to a given item (reverse)
     */
    getItemsWithRelationTo(itemId, relationType) {
        return this.graph.getItemsWithRelationTo(itemId, relationType);
    }
    /**
     * Get role statistics
     */
    getRoleStatistics() {
        return this.graph.getRoleStatistics();
    }
    /**
     * Get coverage report by role (configurable based on matrix definitions)
     */
    getCoverageReport() {
        const stats = this.getRoleStatistics();
        // If we have a config with matrices, we can provide more detailed coverage
        if (this.configLoader) {
            const matrices = this.configLoader.getMatrices();
            const report = { ...stats };
            // Add matrix-specific coverage
            for (const matrix of matrices) {
                const rows = this.getItemsByRole(matrix.rows);
                report[`${matrix.name}_rows`] = rows.length;
            }
            return report;
        }
        return stats;
    }
    /**
     * Find path between two items
     */
    findPath(fromId, toId, maxDepth) {
        return this.graph.findPath(fromId, toId, maxDepth);
    }
    /**
     * Get impact analysis (all reachable items)
     */
    getImpactAnalysis(itemId) {
        return this.graph.getImpactAnalysis(itemId);
    }
    /**
     * Get relationships filtered by source and target roles
     */
    getRelationshipsByRoles(sourceRole, targetRole) {
        return this.graph.getRelationshipsByRoles(sourceRole, targetRole);
    }
    // ========================================================================
    // Validation
    // ========================================================================
    /**
     * Validate the entire graph
     */
    validate() {
        return this.graph.validate();
    }
    /**
     * Check if configuration is valid
     */
    getConfigErrors() {
        if (!this.configLoader) {
            return ['No configuration loaded. Use createWithConfig() or set a ConfigLoader.'];
        }
        try {
            this.configLoader.getConfig();
            return [];
        }
        catch (error) {
            return [error.message];
        }
    }
    // ========================================================================
    // Neo4j Export
    // ========================================================================
    /**
     * Create a Neo4j exporter for this graph
     */
    createNeo4jExporter() {
        // Note: Neo4jExporter currently expects the old TraceabilityGraph
        // We need to create a compatibility wrapper or update Neo4jExporter
        // For now, we'll return a placeholder
        throw new Error('Neo4jExporter needs to be updated to work with TraceabilityGraphV2. Use the v1 API for now.');
    }
    /**
     * Export to Neo4j CSV format directly
     */
    exportToNeo4jCSV(_options) {
        // TODO: Implement direct CSV export for v2 graph
        throw new Error('Neo4j CSV export for v2 not yet implemented. Use the v1 API for now.');
    }
    // ========================================================================
    // Configuration Access
    // ========================================================================
    /**
     * Get the current configuration
     */
    getConfig() {
        return this.configLoader?.getConfig();
    }
    /**
     * Check if a role is known
     */
    isKnownRole(role) {
        return this.configLoader?.isKnownRole(role) || false;
    }
    /**
     * Check if a relation is allowed between roles
     */
    isRelationAllowed(sourceRole, targetRole, relationType) {
        return this.configLoader?.isRelationAllowed(sourceRole, targetRole, relationType) || true;
    }
    /**
     * Get allowed relations between roles
     */
    getAllowedRelations(sourceRole, targetRole) {
        return this.configLoader?.getAllowedRelations(sourceRole, targetRole) || [];
    }
    /**
     * Get all roles from configuration
     */
    getConfiguredRoles() {
        return this.configLoader?.getConfig().roles || [];
    }
    /**
     * Get matrix definitions from configuration
     */
    getMatrixDefinitions() {
        return this.configLoader?.getMatrices() || [];
    }
    // ========================================================================
    // Preset Management
    // ========================================================================
    /**
     * List all available presets
     */
    listPresets() {
        const loader = new ConfigLoader();
        return loader.listPresets();
    }
    /**
     * Get a specific preset
     */
    getPreset(name) {
        const loader = new ConfigLoader();
        return loader.loadPreset(name);
    }
    // ========================================================================
    // Lifecycle
    // ========================================================================
    /**
     * Clear the graph
     */
    clear() {
        this.graph.clear();
        this.currentFile = null;
    }
    /**
     * Reset the extension with a new configuration
     */
    resetWithConfig(configLoader) {
        this.configLoader = configLoader;
        this.graph.setConfigLoader(configLoader);
    }
}
// ========================================================================
// Factory Functions
// ========================================================================
/**
 * Create a new v2 extension with default configuration
 */
export function createExtensionV2(_configPath) {
    return new RequirementsTraceabilityExtensionV2();
}
/**
 * Create a new v2 extension with a specific preset
 */
export async function createExtensionWithPreset(presetName) {
    return RequirementsTraceabilityExtensionV2.createWithPreset(presetName);
}
export { BUILT_IN_PRESETS } from './config/TraceabilityConfig.js';
// Exporters
export { Neo4jExporter } from './Neo4jExporter.js';
// Config loader
export { ConfigLoader, loadConfig } from './config/TraceabilityConfig.js';
