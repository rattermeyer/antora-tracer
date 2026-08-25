/**
 * Traceability configuration types and validation
 * This module provides the type definitions and loading logic for the
 * role-based traceability configuration system.
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { load as yamlLoad } from "js-yaml";
import { ROLE_COLORS } from "../types.js";

// ============================================================================
// Configuration Interfaces
// ============================================================================

/**
 * Matrix column definition
 */
export interface MatrixColumn {
  role: string;
  relationTypes?: string[]; // Relations that count for coverage
}

/**
 * Matrix definition for configurable matrix generation
 */
export interface MatrixDefinition {
  name: string;
  description?: string;
  rows: string; // Role name for rows
  columns: string[]; // Role names for columns
  coverageRelations?: Record<string, string[]>; // Which relations count for coverage per column
}

/**
 * Neo4j query definition for presets
 */
export interface Neo4jQuery {
  name: string;
  description: string;
  cypher: string;
}

/**
 * Preset metadata
 */
export interface PresetMetadata {
  name: string;
  description: string;
  version: string;
  author?: string;
  tags?: string[];
  extends?: string; // Parent preset name
  compatibility?: {
    minExtensionVersion?: string;
  };
}

/**
 * Complete preset definition (metadata + configuration)
 */
export interface Preset extends PresetMetadata {
  traceability: TraceabilityConfig;
  neo4j?: {
    queries: Neo4jQuery[];
  };
  documentation?: {
    description: string;
    examples?: string[];
  };
}

/**
 * A single relation declaration: a primary type and its mandatory reverse.
 */
export interface RelationDef {
  /** The authorable relation type in the reverse direction. */
  reverse: string;
}

/**
 * Per-role authoring guidance: an AsciiDoc page describing how to write
 * items of this role, plus an optional ID prefix fallback.
 */
export interface RoleGuidance {
  /** Path to an AsciiDoc page with the role's authoring guidance. */
  page: string;
  /** ID prefix fallback (e.g. REQ). Advisory, not authoritative. */
  idPrefix?: string;
}

/**
 * Main traceability configuration
 */
export interface TraceabilityConfig {
  /**
   * List of valid roles for traceable items
   */
  roles: string[];

  /**
   * Relationship definitions: sourceRole -> { targetRole -> { type -> { reverse } } }
   */
  relations?: Record<string, Record<string, Record<string, RelationDef>>>;

  /**
   * Matrix definitions for generation
   */
  matrices?: MatrixDefinition[];

  /**
   * Display names for relation types (display-only, never affects the graph).
   * Maps a relation type to a human-readable name. Falls back to humanize(type).
   */
  labels?: Record<string, string>;

  /**
   * Per-role authoring guidance: role name -> { page, idPrefix }.
   * The page is an AsciiDoc page describing how to write items of that role.
   */
  roleGuidance?: Record<string, RoleGuidance>;

  /**
   * Extend from a preset
   */
  extends?: string;
}

/**
 * Complete configuration with metadata
 */
export interface CompleteConfig extends TraceabilityConfig {
  /**
   * Metadata about this configuration
   */
  metadata?: {
    name?: string;
    version?: string;
    description?: string;
  };
}

// ============================================================================
// Configuration Loader
// ============================================================================

/**
 * Built-in preset names
 */
export const BUILT_IN_PRESETS = [
  "requirements-engineering",
  "agile",
  "medical-iec62304",
  "minimal",
] as const;

export type BuiltInPresetName = (typeof BUILT_IN_PRESETS)[number];

/**
 * Default configuration file names to search for
 */
export const DEFAULT_CONFIG_FILES = [
  "traceability.yml",
  "traceability.yaml",
] as const;

/**
 * Configuration loader with preset support
 */
export class ConfigLoader {
  private config: CompleteConfig | null = null;
  private configPath: string | null = null;
  private presetCache: Map<string, Preset> = new Map();
  private presetChain: Set<string> = new Set();

  /**
   * Load configuration from a file path
   */
  load(configPath?: string): CompleteConfig {
    let resolvedPath: string | null = configPath || null;

    // If no path provided, try default locations
    if (!resolvedPath) {
      const found = this.findConfigFile();
      resolvedPath = found || null;
    }

    if (!resolvedPath) {
      throw new Error(
        `Traceability configuration file not found. ` +
          `Please provide a path using --config option, or create one of: ${DEFAULT_CONFIG_FILES.join(", ")}`,
      );
    }

    this.configPath = resolvedPath;

    // Load and parse the YAML file
    const fileContent = fs.readFileSync(resolvedPath, "utf8");
    const rawConfig = yamlLoad(fileContent) as Record<string, unknown>;

    // Validate and normalize the configuration
    this.config = this.normalizeConfig(rawConfig, resolvedPath);

    // Resolve roleGuidance page paths relative to the config file
    this.resolveGuidancePaths(this.config, path.dirname(resolvedPath));

    // If config extends a preset, merge with preset
    if (this.config.extends) {
      const preset = this.loadPreset(this.config.extends);
      this.config = this.mergeConfig(preset.traceability, this.config);
      // Remove the extends field after merging
      delete this.config.extends;
    }

    // Validate the final configuration
    this.validateConfig(this.config, this.configPath || "configuration");

    return this.config;
  }

  /**
   * Get the loaded configuration
   */
  getConfig(): CompleteConfig {
    if (!this.config) {
      throw new Error("Configuration not loaded. Call load() first.");
    }
    return this.config;
  }

  /**
   * Get the path of the loaded configuration file
   */
  getConfigPath(): string | null {
    return this.configPath;
  }

  /**
   * Reload configuration
   */
  reload(): CompleteConfig {
    const savedPath = this.configPath || undefined;
    this.config = null;
    this.configPath = null;
    return this.load(savedPath);
  }

  /**
   * Find configuration file in default locations
   */
  private findConfigFile(): string | undefined {
    // Check current directory and parent directories
    const searchPaths = [".", "..", "../..", process.cwd()];

    for (const searchPath of searchPaths) {
      for (const configFile of DEFAULT_CONFIG_FILES) {
        const fullPath = path.resolve(searchPath, configFile);
        if (fs.existsSync(fullPath)) {
          return fullPath;
        }
      }
    }

    return undefined;
  }

  /**
   * Normalize raw configuration from YAML
   */
  private normalizeConfig(
    rawConfig: Record<string, unknown>,
    _configPath: string,
  ): CompleteConfig {
    const config: CompleteConfig = {
      roles: [],
      ...(rawConfig as Partial<CompleteConfig>),
    };

    // Ensure roles is an array
    if (!Array.isArray(config.roles)) {
      config.roles = [];
    }

    // Normalize roles to lowercase
    config.roles = config.roles.map((r) => r.toString().toLowerCase());

    // Initialize relations if not present
    if (!config.relations) {
      config.relations = {};
    }

    // Normalize relations structure (keyed: type -> { reverse })
    const normalizedRelations: Record<
      string,
      Record<string, Record<string, RelationDef>>
    > = {};
    for (const [sourceRole, targets] of Object.entries(config.relations)) {
      const source = sourceRole.toLowerCase();
      normalizedRelations[source] = {};

      if (typeof targets === "object" && targets !== null) {
        for (const [targetRole, typeMap] of Object.entries(
          targets as Record<string, unknown>,
        )) {
          const target = targetRole.toLowerCase();
          normalizedRelations[source][target] = {};
          if (typeof typeMap === "object" && typeMap !== null) {
            for (const [type, def] of Object.entries(
              typeMap as Record<string, unknown>,
            )) {
              const d = def as { reverse?: unknown };
              normalizedRelations[source][target][type.toLowerCase()] = {
                reverse:
                  typeof d?.reverse === "string" ? d.reverse.toLowerCase() : "",
              };
            }
          }
        }
      }
    }
    config.relations = normalizedRelations;

    // Normalize roleGuidance keys to lowercase
    if (config.roleGuidance) {
      const normalizedGuidance: Record<string, RoleGuidance> = {};
      for (const [role, guidance] of Object.entries(config.roleGuidance)) {
        if (guidance && typeof guidance === "object") {
          const g = guidance as Partial<RoleGuidance>;
          normalizedGuidance[role.toLowerCase()] = {
            page: typeof g.page === "string" ? g.page : "",
            ...(typeof g.idPrefix === "string" && g.idPrefix
              ? { idPrefix: g.idPrefix }
              : {}),
          };
        }
      }
      config.roleGuidance = normalizedGuidance;
    }

    // Initialize matrices if not present
    if (!config.matrices) {
      config.matrices = [];
    }

    return config;
  }

  /**
   * Validate configuration structure
   */
  private validateConfig(
    config: CompleteConfig,
    context: string = "configuration",
  ): void {
    const errors: string[] = [];

    // Must have at least one role
    if (!config.roles || config.roles.length === 0) {
      errors.push("Configuration must define at least one role");
    }

    // Validate roles are strings
    for (const role of config.roles) {
      if (typeof role !== "string" || role.trim() === "") {
        errors.push(
          `Invalid role: must be a non-empty string, got ${typeof role}`,
        );
      }
    }

    // Validate relations structure
    if (config.relations) {
      for (const [sourceRole, targets] of Object.entries(config.relations)) {
        if (!config.roles.includes(sourceRole as string)) {
          errors.push(
            `Relation source role '${sourceRole}' is not defined in roles`,
          );
        }

        if (typeof targets !== "object" || targets === null) {
          errors.push(`Relations for role '${sourceRole}' must be an object`);
          continue;
        }

        for (const [targetRole, typeMap] of Object.entries(targets)) {
          if (!config.roles.includes(targetRole)) {
            errors.push(
              `Relation target role '${targetRole}' is not defined in roles (in relations for '${sourceRole}')`,
            );
          }

          if (typeof typeMap !== "object" || typeMap === null) {
            errors.push(
              `Relations for '${sourceRole}' -> '${targetRole}' must be a map of type -> { reverse }`,
            );
            continue;
          }

          for (const [type, def] of Object.entries(typeMap)) {
            if (
              !def ||
              typeof def.reverse !== "string" ||
              def.reverse.trim() === ""
            ) {
              errors.push(
                `Relation type '${type}' ('${sourceRole}' -> '${targetRole}') must declare a 'reverse'`,
              );
            }
          }
        }
      }
    }

    // Validate matrices
    if (config.matrices) {
      for (const matrix of config.matrices) {
        if (!matrix.name) {
          errors.push("Matrix must have a name");
        }

        if (!matrix.rows) {
          errors.push(`Matrix '${matrix.name}' must have rows defined`);
        } else if (!config.roles.includes(matrix.rows)) {
          errors.push(
            `Matrix '${matrix.name}' rows role '${matrix.rows}' is not defined`,
          );
        }

        if (!matrix.columns || matrix.columns.length === 0) {
          errors.push(`Matrix '${matrix.name}' must have at least one column`);
        }

        for (const column of matrix.columns) {
          if (!config.roles.includes(column)) {
            errors.push(
              `Matrix '${matrix.name}' column role '${column}' is not defined`,
            );
          }
        }
      }
    }

    if (errors.length > 0) {
      const prefix = context ? `Configuration '${context}':` : "Configuration";
      throw new Error(`${prefix}\n${errors.map((e) => `  - ${e}`).join("\n")}`);
    }
  }

  /**
   * Load a preset by name
   */
  loadPreset(presetName: string): Preset {
    // Check cache first
    if (this.presetCache.has(presetName)) {
      return this.presetCache.get(presetName)!;
    }

    // Guard against circular inheritance
    if (this.presetChain.has(presetName)) {
      throw new Error(
        `Circular preset inheritance detected: '${presetName}' extends itself through its parent chain.`,
      );
    }
    this.presetChain.add(presetName);

    try {
      // Load built-in preset
      const presetPath = this.getPresetPath(presetName);
      if (!presetPath) {
        throw new Error(
          `Preset '${presetName}' not found. Available presets: ${BUILT_IN_PRESETS.join(", ")}`,
        );
      }

      const presetContent = fs.readFileSync(presetPath, "utf8");
      const preset = yamlLoad(presetContent) as Preset;

      // Resolve this preset's own roleGuidance page paths relative to the preset file
      if (preset.traceability) {
        this.resolveGuidancePaths(preset.traceability, path.dirname(presetPath));
      }

      // Resolve parent preset inheritance (child wins on conflict)
      if (preset.extends) {
        const parent = this.loadPreset(preset.extends);
        preset.traceability = this.mergeConfig(
          parent.traceability,
          preset.traceability,
        );
        delete preset.extends;
      }

      // Validate the (merged) preset
      this.validatePreset(preset);

      // Cache and return
      this.presetCache.set(presetName, preset);
      return preset;
    } finally {
      this.presetChain.delete(presetName);
    }
  }

  /**
   * Get path to a preset file
   */
  private getPresetPath(presetName: string): string | null {
    // First, check for built-in presets
    const builtInPath = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "../presets",
      `${presetName}.yml`,
    );

    if (fs.existsSync(builtInPath)) {
      return builtInPath;
    }

    // Check in common locations
    const searchPaths = [
      path.resolve(process.cwd(), "presets", `${presetName}.yml`),
      path.resolve(process.cwd(), "presets", `${presetName}.yaml`),
      path.resolve(process.cwd(), `${presetName}.yml`),
      path.resolve(process.cwd(), `${presetName}.yaml`),
    ];

    for (const searchPath of searchPaths) {
      if (fs.existsSync(searchPath)) {
        return searchPath;
      }
    }

    return null;
  }

  /**
   * Validate preset structure
   */
  private validatePreset(preset: unknown): asserts preset is Preset {
    if (!preset || typeof preset !== "object") {
      throw new Error("Invalid preset: must be an object");
    }

    const p = preset as Record<string, unknown>;

    if (!p.name || typeof p.name !== "string") {
      throw new Error("Preset must have a name");
    }

    if (!p.traceability || typeof p.traceability !== "object") {
      throw new Error("Preset must have a traceability configuration");
    }

    // Validate the traceability config within the preset
    try {
      this.validateConfig(
        p.traceability as CompleteConfig,
        `preset '${p.name}'`,
      );
    } catch (error: unknown) {
      const err = error as Error;
      throw new Error(
        `Invalid preset '${p.name}' configuration: ${err.message}`,
      );
    }
  }

  /**
   * Resolve relative roleGuidance page paths to absolute paths against baseDir.
   */
  private resolveGuidancePaths(
    config: TraceabilityConfig,
    baseDir: string,
  ): void {
    if (!config.roleGuidance) return;
    for (const guidance of Object.values(config.roleGuidance)) {
      if (guidance.page && !path.isAbsolute(guidance.page)) {
        guidance.page = path.resolve(baseDir, guidance.page);
      }
    }
  }

  /**
   * Merge two configurations (preset + override)
   */
  private mergeConfig(
    base: TraceabilityConfig,
    override: CompleteConfig,
  ): CompleteConfig {
    const result: CompleteConfig = {
      ...base,
      metadata: override.metadata,
    };

    // Merge roles: add new roles from override
    if (override.roles && override.roles.length > 0) {
      const baseRoles = new Set(base.roles || []);
      for (const role of override.roles) {
        baseRoles.add(role);
      }
      result.roles = Array.from(baseRoles);
    }

    // Merge relations: deep merge (child type defs override by key)
    if (override.relations) {
      result.relations = { ...base.relations };
      for (const [sourceRole, targets] of Object.entries(override.relations)) {
        if (!result.relations[sourceRole]) {
          result.relations[sourceRole] = {};
        }
        for (const [targetRole, typeMap] of Object.entries(targets)) {
          if (!result.relations[sourceRole][targetRole]) {
            result.relations[sourceRole][targetRole] = {};
          }
          Object.assign(result.relations[sourceRole][targetRole], typeMap);
        }
      }
    }

    // Merge matrices: override adds new matrices, replaces existing by name
    if (override.matrices) {
      const matrixMap = new Map<string, MatrixDefinition>();

      // Add base matrices
      for (const matrix of base.matrices || []) {
        matrixMap.set(matrix.name, matrix);
      }

      // Override with new matrices
      for (const matrix of override.matrices) {
        matrixMap.set(matrix.name, matrix);
      }

      result.matrices = Array.from(matrixMap.values());
    }

    // Merge labels: user overrides preset values
    result.labels = {
      ...(base.labels || {}),
      ...(override.labels || {}),
    };

    // Merge roleGuidance: user overrides preset values per role
    result.roleGuidance = {
      ...(base.roleGuidance || {}),
      ...(override.roleGuidance || {}),
    };

    return result;
  }

  /**
   * List all available presets
   */
  listPresets(): { name: string; description: string; version: string }[] {
    const presets: { name: string; description: string; version: string }[] =
      [];

    for (const presetName of BUILT_IN_PRESETS) {
      try {
        const preset = this.loadPreset(presetName);
        presets.push({
          name: preset.name,
          description: preset.description || "",
          version: preset.version || "1.0.0",
        });
      } catch {
        // Skip presets that can't be loaded
      }
    }

    return presets;
  }

  /**
   * Check if a role is known in the configuration
   */
  isKnownRole(role: string): boolean {
    const config = this.getConfig();
    return config.roles.includes(role.toLowerCase());
  }

  /**
   * Check if a relation is allowed between two roles
   */
  isRelationAllowed(
    sourceRole: string,
    targetRole: string,
    relationType: string,
  ): boolean {
    const config = this.getConfig();
    const source = sourceRole.toLowerCase();
    const target = targetRole.toLowerCase();
    const relation = relationType.toLowerCase();

    // If either role is unknown, we can't validate (return true for graceful degradation)
    if (!config.roles.includes(source) || !config.roles.includes(target)) {
      return true;
    }

    // Direct primary declaration in the authored direction
    const direct = config.relations?.[source]?.[target];
    if (direct && relation in direct) {
      return true;
    }

    // Derived reverse: type is the reverse of a relation declared target -> source
    const opposite = config.relations?.[target]?.[source];
    if (opposite) {
      for (const def of Object.values(opposite)) {
        if (def.reverse === relation) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Get allowed relations from source to target role
   */
  getAllowedRelations(sourceRole: string, targetRole: string): string[] {
    const config = this.getConfig();
    const source = sourceRole.toLowerCase();
    const target = targetRole.toLowerCase();

    const allowed = new Set<string>();

    const direct = config.relations?.[source]?.[target];
    if (direct) {
      for (const type of Object.keys(direct)) {
        allowed.add(type);
      }
    }

    // Reverse types derived from declarations in the opposite direction
    const opposite = config.relations?.[target]?.[source];
    if (opposite) {
      for (const def of Object.values(opposite)) {
        allowed.add(def.reverse);
      }
    }

    return Array.from(allowed);
  }

  /**
   * If `type` authored from sourceRole -> targetRole is a reverse type,
   * return the canonical primary form (direction and type to store).
   * Returns null when the authored form is already canonical (or unknown).
   */
  canonicalizeRelation(
    sourceRole: string,
    targetRole: string,
    type: string,
  ): { primary: string; sourceRole: string; targetRole: string } | null {
    const config = this.getConfig();
    const source = sourceRole.toLowerCase();
    const target = targetRole.toLowerCase();
    const relation = type.toLowerCase();

    // Primary in the authored direction? Already canonical.
    const direct = config.relations?.[source]?.[target];
    if (direct && relation in direct) {
      return null;
    }

    // Reverse of a relation declared in the opposite direction? Flip it.
    const opposite = config.relations?.[target]?.[source];
    if (opposite) {
      for (const [primary, def] of Object.entries(opposite)) {
        if (def.reverse === relation) {
          return { primary, sourceRole: target, targetRole: source };
        }
      }
    }

    return null;
  }

  /**
   * Resolve the inverse type for a relation type, driven by `reverse` declarations.
   * Returns the reverse type for a primary, or the primary for a reverse.
   */
  getInverseType(type: string): string | undefined {
    const config = this.getConfig();
    const relation = type.toLowerCase();

    for (const targets of Object.values(config.relations || {})) {
      for (const typeMap of Object.values(targets)) {
        for (const [primary, def] of Object.entries(typeMap)) {
          if (def.reverse === relation) {
            return primary;
          }
          if (primary === relation) {
            return def.reverse;
          }
        }
      }
    }

    return undefined;
  }

  /**
   * Get matrix definitions from configuration
   */
  getMatrices(): MatrixDefinition[] {
    const config = this.getConfig();
    return config.matrices || [];
  }

  /**
   * Get a specific matrix definition by name
   */
  getMatrix(name: string): MatrixDefinition | undefined {
    const matrices = this.getMatrices();
    return matrices.find((m) => m.name === name);
  }
}

// ============================================================================
// Helper function for ES modules
// ============================================================================

import { fileURLToPath } from "node:url";

// Export the config loader factory
export function createConfigLoader(configPath?: string): ConfigLoader {
  const loader = new ConfigLoader();
  if (configPath) {
    loader.load(configPath);
  }
  return loader;
}

export function loadConfig(configPath?: string): CompleteConfig {
  return new ConfigLoader().load(configPath);
}

/**
 * Generate a GraphViz DOT representation of the traceability configuration.
 * Renders declared roles as nodes and declared relations as labeled edges.
 * Declared directions only — `labels` is not consulted, so no derived
 * reverse edges appear. Roles with no declared relations still render as
 * (isolated) nodes so orphaned roles are visible.
 */
export function toConfigDot(config: TraceabilityConfig): string {
  const roles = config.roles || [];
  const relations = config.relations || {};

  const lines: string[] = [
    "digraph TraceabilityConfig {",
    "  rankdir=LR;",
    '  node [shape=box, style="rounded,filled", fontname="Helvetica"];',
    '  edge [fontname="Helvetica", fontsize=10];',
  ];

  for (const role of roles) {
    const color = ROLE_COLORS[role] || "#AAAAAA";
    lines.push(
      `  "${role}" [fillcolor="${color}", fontcolor=white, label="${role}"];`,
    );
  }

  for (const [source, targets] of Object.entries(relations)) {
    for (const [target, typeMap] of Object.entries(targets)) {
      const types = Object.keys(typeMap);
      if (types.length === 0) continue;
      const label = types.join(", ");
      lines.push(`  "${source}" -> "${target}" [label="${label}"];`);
    }
  }

  lines.push("}");
  return lines.join("\n");
}

// Default export
export default ConfigLoader;
