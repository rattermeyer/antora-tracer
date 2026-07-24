/**
 * Public API for unified item architecture
 * This file provides the APIs for requirements traceability
 */

import { DocumentParser, type ParserResult, type ParserWarning, type ParserError } from './DocumentParser.js';
import { TraceabilityGraph, type ValidationResult } from './TraceabilityGraph.js';
import { ConfigLoader, type CompleteConfig, type Preset, type BuiltInPresetName } from './config/TraceabilityConfig.js';
import { Neo4jExporter, type Neo4jExportOptions, type Neo4jExportResult } from './Neo4jExporter.js';
import type { Item, ItemRelationship } from './types.js';

/**
 * Main extension class for unified item architecture
 *
 * This class:
 * - Uses DocumentParser to parse [item] macros
 * - Uses TraceabilityGraph for role-based storage and validation
 * - Supports configuration via ConfigLoader
 * - Provides Neo4j export capabilities
 */
export class RequirementsTraceabilityExtension {
  public readonly graph: TraceabilityGraph;
  public configLoader?: ConfigLoader;
  private readonly parser: DocumentParser;
  public currentFile: string | null = null;

  /**
   * Create a new extension with optional configuration
   */
  constructor(configLoader?: ConfigLoader) {
    this.configLoader = configLoader;
    this.graph = new TraceabilityGraph(configLoader);
    this.parser = new DocumentParser({ configLoader });
  }

  /**
   * Create extension with configuration path
   */
  static async createWithConfig(configPath?: string): Promise<RequirementsTraceabilityExtension> {
    let configLoader: ConfigLoader | undefined;

    try {
      configLoader = new ConfigLoader();
      configLoader.load(configPath);
      console.log(`Configuration loaded from: ${configPath || 'default location'}`);
    } catch (error: any) {
      console.warn(`Could not load configuration: ${error.message}`);
      console.warn('Using extension without configuration. Role validation will be skipped.');
    }

    return new RequirementsTraceabilityExtension(configLoader);
  }

  /**
   * Create extension with preset
   */
  static async createWithPreset(presetName: BuiltInPresetName): Promise<RequirementsTraceabilityExtension> {
    const configLoader = new ConfigLoader();
    const preset = configLoader.loadPreset(presetName);

    // Create a ConfigLoader instance with the preset config
    // We create a new loader and manually set its internal state
    const loader = new ConfigLoader();

    // Set the config directly (accessing private field via any)
    (loader as any).config = {
      ...preset.traceability,
      metadata: {
        name: preset.name,
        description: preset.description,
        version: preset.version,
      },
    };
    (loader as any).configPath = `preset:${presetName}`;

    console.log(`Created extension with preset: ${presetName}`);
    return new RequirementsTraceabilityExtension(loader);
  }

  // ========================================================================
  // Processing
  // ========================================================================

  /**
   * Process AsciiDoc content with the new [item] macro syntax
   */
  process(content: string, options: { sourceFile?: string } = {}): ParserResult & { graph: TraceabilityGraph } {
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
  processFiles(files: { path: string; content: string }[]): {
    result: ParserResult;
    graph: TraceabilityGraph;
    fileResults: { file: string; items: number; relationships: number; warnings: ParserWarning[]; errors: ParserError[] }[];
  } {
    const allItems: Item[] = [];
    const allRelationships: ItemRelationship[] = [];
    const allWarnings: ParserWarning[] = [];
    const allErrors: ParserError[] = [];
    const fileResults: { file: string; items: number; relationships: number; warnings: ParserWarning[]; errors: ParserError[] }[] = [];

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
  addItem(item: Item): void {
    this.graph.addItem(item);
    console.log(`Item registered: ${item.id} (role: ${item.role}) - ${item.title}`);
  }

  /**
   * Add a relationship directly to the graph
   */
  addRelationship(relationship: ItemRelationship): void {
    this.graph.addRelationship(relationship);
    console.log(`Relationship added: ${relationship.fromId} ${relationship.type} ${relationship.targetId}`);
  }

  /**
   * Add a simple relationship by IDs and type
   */
  addSimpleRelationship(fromId: string, toId: string, type: string): void {
    const relationship: ItemRelationship = {
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
  getAllItems(): Item[] {
    return this.graph.getAllItems();
  }

  /**
   * Get items by role
   */
  getItemsByRole(role: string): Item[] {
    return this.graph.getItemsByRole(role);
  }

  /**
   * Get all relationships
   */
  getAllRelationships(): ItemRelationship[] {
    return this.graph.getAllRelationships();
  }

  /**
   * Get relationships from an item
   */
  getRelationships(fromId: string, type?: string): ItemRelationship[] {
    return this.graph.getRelationships(fromId, type);
  }

  /**
   * Get items related to a given item
   */
  getRelatedItems(itemId: string, relationType?: string): Item[] {
    return this.graph.getRelatedItems(itemId, relationType);
  }

  /**
   * Get items with relation to a given item (reverse)
   */
  getItemsWithRelationTo(itemId: string, relationType?: string): Item[] {
    return this.graph.getItemsWithRelationTo(itemId, relationType);
  }

  /**
   * Get role statistics
   */
  getRoleStatistics(): Record<string, number> {
    return this.graph.getRoleStatistics();
  }

  /**
   * Get coverage report by role (configurable based on matrix definitions)
   */
  getCoverageReport(): Record<string, any> {
    const stats = this.getRoleStatistics();

    // If we have a config with matrices, we can provide more detailed coverage
    if (this.configLoader) {
      const matrices = this.configLoader.getMatrices();
      const report: Record<string, any> = { ...stats };

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
  findPath(fromId: string, toId: string, maxDepth?: number): string[] | null {
    return this.graph.findPath(fromId, toId, maxDepth);
  }

  /**
   * Get impact analysis (all reachable items)
   */
  getImpactAnalysis(itemId: string): string[] {
    return this.graph.getImpactAnalysis(itemId);
  }

  /**
   * Get relationships filtered by source and target roles
   */
  getRelationshipsByRoles(sourceRole: string, targetRole: string): ItemRelationship[] {
    return this.graph.getRelationshipsByRoles(sourceRole, targetRole);
  }

  // ========================================================================
  // Validation
  // ========================================================================

  /**
   * Validate the entire graph
   */
  validate(): ValidationResult {
    return this.graph.validate();
  }

  /**
   * Check if configuration is valid
   */
  getConfigErrors(): string[] {
    if (!this.configLoader) {
      return ['No configuration loaded. Use createWithConfig() or set a ConfigLoader.'];
    }

    try {
      this.configLoader.getConfig();
      return [];
    } catch (error: any) {
      return [error.message];
    }
  }

  // ========================================================================
  // Neo4j Export
  // ========================================================================

  /**
   * Create a Neo4j exporter for this graph
   */
  createNeo4jExporter(): Neo4jExporter {
    return new Neo4jExporter(this.graph);
  }

  /**
   * Export to Neo4j CSV format directly
   */
  exportToNeo4jCSV(options: Neo4jExportOptions): Neo4jExportResult {
    const exporter = this.createNeo4jExporter();
    return exporter.export(options);
  }

  // ========================================================================
  // Configuration Access
  // ========================================================================

  /**
   * Get the current configuration
   */
  getConfig(): CompleteConfig | undefined {
    return this.configLoader?.getConfig();
  }

  /**
   * Check if a role is known
   */
  isKnownRole(role: string): boolean {
    return this.configLoader?.isKnownRole(role) || false;
  }

  /**
   * Check if a relation is allowed between roles
   */
  isRelationAllowed(sourceRole: string, targetRole: string, relationType: string): boolean {
    return this.configLoader?.isRelationAllowed(sourceRole, targetRole, relationType) || true;
  }

  /**
   * Get allowed relations between roles
   */
  getAllowedRelations(sourceRole: string, targetRole: string): string[] {
    return this.configLoader?.getAllowedRelations(sourceRole, targetRole) || [];
  }

  /**
   * Get all roles from configuration
   */
  getConfiguredRoles(): string[] {
    return this.configLoader?.getConfig().roles || [];
  }

  /**
   * Get matrix definitions from configuration
   */
  getMatrixDefinitions(): any[] {
    return this.configLoader?.getMatrices() || [];
  }

  // ========================================================================
  // Preset Management
  // ========================================================================

  /**
   * List all available presets
   */
  listPresets(): { name: string; description: string; version: string }[] {
    const loader = new ConfigLoader();
    return loader.listPresets();
  }

  /**
   * Get a specific preset
   */
  getPreset(name: BuiltInPresetName): Preset {
    const loader = new ConfigLoader();
    return loader.loadPreset(name);
  }

  // ========================================================================
  // Lifecycle
  // ========================================================================

  /**
   * Clear the graph
   */
  clear(): void {
    this.graph.clear();
    this.currentFile = null;
  }

  /**
   * Reset the extension with a new configuration
   */
  resetWithConfig(configLoader: ConfigLoader): void {
    this.configLoader = configLoader;
    this.graph.setConfigLoader(configLoader);
  }
}

// ========================================================================
// Factory Functions
// ========================================================================

/**
 * Create a new extension with default configuration
 */
export function createExtension(_configPath?: string): RequirementsTraceabilityExtension {
  return new RequirementsTraceabilityExtension();
}

/**
 * Create a new extension with a specific preset
 */
export async function createExtensionWithPreset(presetName: BuiltInPresetName): Promise<RequirementsTraceabilityExtension> {
  return RequirementsTraceabilityExtension.createWithPreset(presetName);
}

// ========================================================================
// Re-exports
// ========================================================================

// Parser types
export type { ParserWarning, ParserError, ParserOptions, ParserResult } from './DocumentParser.js';

// Graph types
export type { GraphWarning, ValidationResult } from './TraceabilityGraph.js';

// Config types
export type { TraceabilityConfig, CompleteConfig, Preset, BuiltInPresetName } from './config/TraceabilityConfig.js';
export { BUILT_IN_PRESETS } from './config/TraceabilityConfig.js';

// Core types
export type { Item, ItemRelationship } from './types.js';

// Exporters
export { Neo4jExporter, type Neo4jExportOptions, type Neo4jExportResult } from './Neo4jExporter.js';

// Config loader
export { ConfigLoader, loadConfig } from './config/TraceabilityConfig.js';
