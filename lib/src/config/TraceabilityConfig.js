/**
 * Traceability configuration types and validation
 * This module provides the type definitions and loading logic for the
 * role-based traceability configuration system.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { load as yamlLoad } from "js-yaml";
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
];
/**
 * Default configuration file names to search for
 */
export const DEFAULT_CONFIG_FILES = [
    "traceability.yml",
    "traceability.yaml",
];
/**
 * Configuration loader with preset support
 */
export class ConfigLoader {
    config = null;
    configPath = null;
    presetCache = new Map();
    /**
     * Load configuration from a file path
     */
    load(configPath) {
        let resolvedPath = configPath || null;
        // If no path provided, try default locations
        if (!resolvedPath) {
            const found = this.findConfigFile();
            resolvedPath = found || null;
        }
        if (!resolvedPath) {
            throw new Error(`Traceability configuration file not found. ` +
                `Please provide a path using --config option, or create one of: ${DEFAULT_CONFIG_FILES.join(", ")}`);
        }
        this.configPath = resolvedPath;
        // Load and parse the YAML file
        const fileContent = fs.readFileSync(resolvedPath, "utf8");
        const rawConfig = yamlLoad(fileContent);
        // Validate and normalize the configuration
        this.config = this.normalizeConfig(rawConfig, resolvedPath);
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
    getConfig() {
        if (!this.config) {
            throw new Error("Configuration not loaded. Call load() first.");
        }
        return this.config;
    }
    /**
     * Get the path of the loaded configuration file
     */
    getConfigPath() {
        return this.configPath;
    }
    /**
     * Reload configuration
     */
    reload() {
        const savedPath = this.configPath || undefined;
        this.config = null;
        this.configPath = null;
        return this.load(savedPath);
    }
    /**
     * Find configuration file in default locations
     */
    findConfigFile() {
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
    normalizeConfig(rawConfig, _configPath) {
        const config = {
            roles: [],
            ...rawConfig,
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
        // Normalize relations structure
        const normalizedRelations = {};
        for (const [sourceRole, targets] of Object.entries(config.relations)) {
            const source = sourceRole.toLowerCase();
            normalizedRelations[source] = {};
            if (typeof targets === "object" && targets !== null) {
                for (const [targetRole, relationTypes] of Object.entries(targets)) {
                    const target = targetRole.toLowerCase();
                    if (Array.isArray(relationTypes)) {
                        normalizedRelations[source][target] = relationTypes.map((r) => r.toString().toLowerCase());
                    }
                    else if (typeof relationTypes === "string") {
                        normalizedRelations[source][target] = [relationTypes.toLowerCase()];
                    }
                }
            }
        }
        config.relations = normalizedRelations;
        // Initialize matrices if not present
        if (!config.matrices) {
            config.matrices = [];
        }
        return config;
    }
    /**
     * Validate configuration structure
     */
    validateConfig(config, context = "configuration") {
        const errors = [];
        // Must have at least one role
        if (!config.roles || config.roles.length === 0) {
            errors.push("Configuration must define at least one role");
        }
        // Validate roles are strings
        for (const role of config.roles) {
            if (typeof role !== "string" || role.trim() === "") {
                errors.push(`Invalid role: must be a non-empty string, got ${typeof role}`);
            }
        }
        // Validate relations structure
        if (config.relations) {
            for (const [sourceRole, targets] of Object.entries(config.relations)) {
                if (!config.roles.includes(sourceRole)) {
                    errors.push(`Relation source role '${sourceRole}' is not defined in roles`);
                }
                if (typeof targets !== "object" || targets === null) {
                    errors.push(`Relations for role '${sourceRole}' must be an object`);
                    continue;
                }
                for (const [targetRole, relationTypes] of Object.entries(targets)) {
                    if (!config.roles.includes(targetRole)) {
                        errors.push(`Relation target role '${targetRole}' is not defined in roles (in relations for '${sourceRole}')`);
                    }
                    if (!Array.isArray(relationTypes)) {
                        errors.push(`Relation types for '${sourceRole}' -> '${targetRole}' must be an array`);
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
                }
                else if (!config.roles.includes(matrix.rows)) {
                    errors.push(`Matrix '${matrix.name}' rows role '${matrix.rows}' is not defined`);
                }
                if (!matrix.columns || matrix.columns.length === 0) {
                    errors.push(`Matrix '${matrix.name}' must have at least one column`);
                }
                for (const column of matrix.columns) {
                    if (!config.roles.includes(column)) {
                        errors.push(`Matrix '${matrix.name}' column role '${column}' is not defined`);
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
    loadPreset(presetName) {
        // Check cache first
        if (this.presetCache.has(presetName)) {
            return this.presetCache.get(presetName);
        }
        // Load built-in preset
        const presetPath = this.getPresetPath(presetName);
        if (!presetPath) {
            throw new Error(`Preset '${presetName}' not found. Available presets: ${BUILT_IN_PRESETS.join(", ")}`);
        }
        const presetContent = fs.readFileSync(presetPath, "utf8");
        const preset = yamlLoad(presetContent);
        // Validate preset
        this.validatePreset(preset);
        // Cache and return
        this.presetCache.set(presetName, preset);
        return preset;
    }
    /**
     * Get path to a preset file
     */
    getPresetPath(presetName) {
        // First, check for built-in presets
        const builtInPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../presets", `${presetName}.yml`);
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
    validatePreset(preset) {
        if (!preset || typeof preset !== "object") {
            throw new Error("Invalid preset: must be an object");
        }
        const p = preset;
        if (!p.name || typeof p.name !== "string") {
            throw new Error("Preset must have a name");
        }
        if (!p.traceability || typeof p.traceability !== "object") {
            throw new Error("Preset must have a traceability configuration");
        }
        // Validate the traceability config within the preset
        try {
            this.validateConfig(p.traceability, `preset '${p.name}'`);
        }
        catch (error) {
            const err = error;
            throw new Error(`Invalid preset '${p.name}' configuration: ${err.message}`);
        }
    }
    /**
     * Merge two configurations (preset + override)
     */
    mergeConfig(base, override) {
        const result = {
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
        // Merge relations: deep merge
        if (override.relations) {
            result.relations = { ...base.relations };
            for (const [sourceRole, targets] of Object.entries(override.relations)) {
                if (!result.relations[sourceRole]) {
                    result.relations[sourceRole] = {};
                }
                if (targets && typeof targets === "object") {
                    const targetsObj = targets;
                    for (const [targetRole, relationTypes] of Object.entries(targetsObj)) {
                        if (Array.isArray(relationTypes)) {
                            result.relations[sourceRole][targetRole] =
                                relationTypes;
                        }
                        else if (typeof relationTypes === "string") {
                            result.relations[sourceRole][targetRole] = [relationTypes];
                        }
                    }
                }
            }
        }
        // Merge matrices: override adds new matrices, replaces existing by name
        if (override.matrices) {
            const matrixMap = new Map();
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
        // Merge inverseLabels: user overrides preset values
        result.inverseLabels = {
            ...(base.inverseLabels || {}),
            ...(override.inverseLabels || {}),
        };
        return result;
    }
    /**
     * List all available presets
     */
    listPresets() {
        const presets = [];
        for (const presetName of BUILT_IN_PRESETS) {
            try {
                const preset = this.loadPreset(presetName);
                presets.push({
                    name: preset.name,
                    description: preset.description || "",
                    version: preset.version || "1.0.0",
                });
            }
            catch {
                // Skip presets that can't be loaded
            }
        }
        return presets;
    }
    /**
     * Check if a role is known in the configuration
     */
    isKnownRole(role) {
        const config = this.getConfig();
        return config.roles.includes(role.toLowerCase());
    }
    /**
     * Check if a relation is allowed between two roles
     */
    isRelationAllowed(sourceRole, targetRole, relationType) {
        const config = this.getConfig();
        const source = sourceRole.toLowerCase();
        const target = targetRole.toLowerCase();
        const relation = relationType.toLowerCase();
        // If either role is unknown, we can't validate (return true for graceful degradation)
        if (!config.roles.includes(source) || !config.roles.includes(target)) {
            return true;
        }
        const sourceRelations = config.relations?.[source];
        if (!sourceRelations) {
            return false;
        }
        const allowedRelations = sourceRelations[target];
        if (!allowedRelations) {
            return false;
        }
        return allowedRelations.includes(relation);
    }
    /**
     * Get allowed relations from source to target role
     */
    getAllowedRelations(sourceRole, targetRole) {
        const config = this.getConfig();
        const source = sourceRole.toLowerCase();
        const target = targetRole.toLowerCase();
        const sourceRelations = config.relations?.[source];
        if (!sourceRelations) {
            return [];
        }
        return sourceRelations[target] || [];
    }
    /**
     * Get matrix definitions from configuration
     */
    getMatrices() {
        const config = this.getConfig();
        return config.matrices || [];
    }
    /**
     * Get a specific matrix definition by name
     */
    getMatrix(name) {
        const matrices = this.getMatrices();
        return matrices.find((m) => m.name === name);
    }
}
// ============================================================================
// Helper function for ES modules
// ============================================================================
import { fileURLToPath } from "node:url";
// Export the config loader factory
export function createConfigLoader(configPath) {
    const loader = new ConfigLoader();
    if (configPath) {
        loader.load(configPath);
    }
    return loader;
}
export function loadConfig(configPath) {
    return new ConfigLoader().load(configPath);
}
// Default export
export default ConfigLoader;
