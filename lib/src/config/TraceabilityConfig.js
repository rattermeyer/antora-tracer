/**
 * Traceability configuration types and validation
 * This module provides the type definitions and loading logic for the
 * role-based traceability configuration system.
 */
import * as fs from "node:fs";
import * as path from "node:path";
import { load as yamlLoad } from "js-yaml";
import { compileRowFilter } from "../RowFilter.js";
import { ROLE_COLORS } from "../types.js";
// ============================================================================
// Configuration Loader
// ============================================================================
/**
 * Built-in preset names
 */
export const BUILT_IN_PRESETS = [
    "requirements-engineering",
    "spec-driven-development",
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
/** Interpolate `${VAR}` references against `process.env`, throwing when unset. */
function interpolateEnv(value) {
    if (typeof value !== "string")
        return value;
    return value.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)\}/g, (_match, name) => {
        const resolved = process.env[name];
        if (resolved === undefined) {
            throw new Error(`Environment variable '${name}' referenced in idAllocation is not set`);
        }
        return resolved;
    });
}
/**
 * Configuration loader with preset support
 */
export class ConfigLoader {
    config = null;
    configPath = null;
    presetCache = new Map();
    presetChain = new Set();
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
        // Normalize relations structure (keyed: type -> { reverse })
        const normalizedRelations = {};
        for (const [sourceRole, targets] of Object.entries(config.relations)) {
            const source = sourceRole.toLowerCase();
            normalizedRelations[source] = {};
            if (typeof targets === "object" && targets !== null) {
                for (const [targetRole, typeMap] of Object.entries(targets)) {
                    const target = targetRole.toLowerCase();
                    normalizedRelations[source][target] = {};
                    if (typeof typeMap === "object" && typeMap !== null) {
                        for (const [type, def] of Object.entries(typeMap)) {
                            const d = def;
                            normalizedRelations[source][target][type.toLowerCase()] = {
                                reverse: typeof d?.reverse === "string" ? d.reverse.toLowerCase() : "",
                            };
                        }
                    }
                }
            }
        }
        config.relations = normalizedRelations;
        if (typeof config.linkDisplayPolicies === "object" &&
            config.linkDisplayPolicies !== null &&
            !Array.isArray(config.linkDisplayPolicies)) {
            const normalizedPolicies = { ...config.linkDisplayPolicies };
            for (const [name, policy] of Object.entries(config.linkDisplayPolicies)) {
                if (typeof policy !== "object" ||
                    policy === null ||
                    Array.isArray(policy) ||
                    !("hide" in policy) ||
                    !Array.isArray(policy.hide)) {
                    continue;
                }
                normalizedPolicies[name] = {
                    ...policy,
                    hide: policy.hide.map((rule) => {
                        if (typeof rule !== "object" ||
                            rule === null ||
                            Array.isArray(rule)) {
                            return rule;
                        }
                        const relation = "relation" in rule ? rule.relation : undefined;
                        const currentItem = "currentItem" in rule ? rule.currentItem : undefined;
                        const relatedItem = "relatedItem" in rule ? rule.relatedItem : undefined;
                        return {
                            ...rule,
                            ...(typeof relation === "string"
                                ? { relation: relation.toLowerCase() }
                                : {}),
                            ...(typeof currentItem === "object" &&
                                currentItem !== null &&
                                !Array.isArray(currentItem)
                                ? {
                                    currentItem: {
                                        ...currentItem,
                                        ...("role" in currentItem &&
                                            typeof currentItem.role === "string"
                                            ? { role: currentItem.role.toLowerCase() }
                                            : {}),
                                    },
                                }
                                : {}),
                            ...(typeof relatedItem === "object" &&
                                relatedItem !== null &&
                                !Array.isArray(relatedItem)
                                ? {
                                    relatedItem: {
                                        ...relatedItem,
                                        ...("role" in relatedItem &&
                                            typeof relatedItem.role === "string"
                                            ? { role: relatedItem.role.toLowerCase() }
                                            : {}),
                                    },
                                }
                                : {}),
                        };
                    }),
                };
            }
            config.linkDisplayPolicies = normalizedPolicies;
        }
        // Normalize roleGuidance keys to lowercase
        if (config.roleGuidance) {
            const normalizedGuidance = {};
            for (const [role, guidance] of Object.entries(config.roleGuidance)) {
                if (guidance && typeof guidance === "object") {
                    const g = guidance;
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
        // Resolve the endpoint during config loading; token expansion is deferred
        // until a CLI command actually contacts the allocator.
        if (config.idAllocation) {
            const ida = config.idAllocation;
            const endpoint = interpolateEnv(ida.endpoint);
            config.idAllocation = {
                endpoint: endpoint,
                ...(ida.token !== undefined ? { token: ida.token } : {}),
            };
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
        const relationshipTypes = new Set();
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
                for (const [targetRole, typeMap] of Object.entries(targets)) {
                    if (!config.roles.includes(targetRole)) {
                        errors.push(`Relation target role '${targetRole}' is not defined in roles (in relations for '${sourceRole}')`);
                    }
                    if (typeof typeMap !== "object" || typeMap === null) {
                        errors.push(`Relations for '${sourceRole}' -> '${targetRole}' must be a map of type -> { reverse }`);
                        continue;
                    }
                    for (const [type, def] of Object.entries(typeMap)) {
                        relationshipTypes.add(type.toLowerCase());
                        if (def && typeof def.reverse === "string") {
                            relationshipTypes.add(def.reverse.toLowerCase());
                        }
                        if (!def ||
                            typeof def.reverse !== "string" ||
                            def.reverse.trim() === "") {
                            errors.push(`Relation type '${type}' ('${sourceRole}' -> '${targetRole}') must declare a 'reverse'`);
                        }
                    }
                }
            }
        }
        const policyNames = new Set();
        const policyDefinitions = config.linkDisplayPolicies;
        if (policyDefinitions !== undefined) {
            if (typeof policyDefinitions !== "object" ||
                policyDefinitions === null ||
                Array.isArray(policyDefinitions)) {
                errors.push("linkDisplayPolicies must be a map of named policies");
            }
            else {
                for (const [policyName, policy] of Object.entries(policyDefinitions)) {
                    if (policyName.trim() === "") {
                        errors.push("linkDisplayPolicies policy names must be non-empty");
                    }
                    if (policyName.trim().toLowerCase() === "none") {
                        errors.push("linkDisplayPolicies policy name 'none' is reserved");
                    }
                    policyNames.add(policyName);
                    if (typeof policy !== "object" ||
                        policy === null ||
                        Array.isArray(policy)) {
                        errors.push(`linkDisplayPolicies '${policyName}' must be an object`);
                        continue;
                    }
                    if (!("hide" in policy) ||
                        !Array.isArray(policy.hide) ||
                        policy.hide.length === 0) {
                        errors.push(`linkDisplayPolicies '${policyName}' must define a non-empty 'hide' array`);
                        continue;
                    }
                    const validateMatcher = (matcher, matcherPath) => {
                        if (typeof matcher !== "object" ||
                            matcher === null ||
                            Array.isArray(matcher)) {
                            errors.push(`${matcherPath} must be an object`);
                            return;
                        }
                        let hasMatcherCondition = false;
                        if ("role" in matcher) {
                            const role = matcher.role;
                            if (typeof role !== "string" || role.trim() === "") {
                                errors.push(`${matcherPath}.role must be a non-empty string`);
                            }
                            else if (!config.roles.includes(role.toLowerCase())) {
                                errors.push(`${matcherPath}.role '${role}' is not defined in roles`);
                            }
                            else {
                                hasMatcherCondition = true;
                            }
                        }
                        if ("attributes" in matcher) {
                            const attributes = matcher.attributes;
                            if (typeof attributes !== "object" ||
                                attributes === null ||
                                Array.isArray(attributes) ||
                                Object.keys(attributes).length === 0) {
                                errors.push(`${matcherPath}.attributes must be a non-empty map`);
                            }
                            else {
                                let attributesAreValid = true;
                                for (const [key, value] of Object.entries(attributes)) {
                                    if (key.trim() === "") {
                                        errors.push(`${matcherPath}.attributes keys must be non-empty`);
                                        attributesAreValid = false;
                                    }
                                    if (typeof value !== "string") {
                                        errors.push(`${matcherPath}.attributes.${key} must be a string`);
                                        attributesAreValid = false;
                                    }
                                }
                                hasMatcherCondition ||= attributesAreValid;
                            }
                        }
                        if (!hasMatcherCondition) {
                            errors.push(`${matcherPath} must specify a configured role or attributes`);
                        }
                    };
                    for (const [index, rule] of policy.hide.entries()) {
                        const rulePath = `linkDisplayPolicies '${policyName}'.hide[${index}]`;
                        if (typeof rule !== "object" ||
                            rule === null ||
                            Array.isArray(rule)) {
                            errors.push(`${rulePath} must be an object`);
                            continue;
                        }
                        if (!("relation" in rule) || typeof rule.relation !== "string") {
                            errors.push(`${rulePath}.relation must be a non-empty string`);
                        }
                        else if (rule.relation.trim() === "") {
                            errors.push(`${rulePath}.relation must be a non-empty string`);
                        }
                        else if (!relationshipTypes.has(rule.relation.toLowerCase())) {
                            errors.push(`${rulePath}.relation '${rule.relation}' is not defined in relations`);
                        }
                        validateMatcher("currentItem" in rule ? rule.currentItem : undefined, `${rulePath}.currentItem`);
                        validateMatcher("relatedItem" in rule ? rule.relatedItem : undefined, `${rulePath}.relatedItem`);
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
                if (matrix.linkDisplayPolicy !== undefined) {
                    if (typeof matrix.linkDisplayPolicy !== "string" ||
                        matrix.linkDisplayPolicy.trim() === "") {
                        errors.push(`Matrix '${matrix.name}' linkDisplayPolicy must be a non-empty policy name`);
                    }
                    else if (!policyNames.has(matrix.linkDisplayPolicy)) {
                        errors.push(`Matrix '${matrix.name}' link display policy '${matrix.linkDisplayPolicy}' is not defined`);
                    }
                }
                if (matrix.rowFilter !== undefined) {
                    if (typeof matrix.rowFilter !== "string") {
                        errors.push(`Matrix '${matrix.name}' rowFilter must be a string`);
                    }
                    else {
                        try {
                            compileRowFilter(matrix.rowFilter);
                        }
                        catch (error) {
                            errors.push(`Matrix '${matrix.name}' rowFilter: ${error instanceof Error ? error.message : String(error)}`);
                        }
                    }
                }
            }
        }
        // Validate idAllocation
        if (config.idAllocation) {
            const endpoint = config.idAllocation.endpoint;
            if (typeof endpoint !== "string" || endpoint.trim() === "") {
                errors.push("idAllocation.endpoint must be a non-empty URL");
            }
            else {
                let parsed = null;
                try {
                    parsed = new URL(endpoint);
                }
                catch {
                    errors.push(`idAllocation.endpoint is not a valid URL: '${endpoint}'`);
                }
                if (parsed &&
                    parsed.protocol !== "http:" &&
                    parsed.protocol !== "https:") {
                    errors.push(`idAllocation.endpoint must be an HTTP(S) URL, got '${parsed.protocol}'`);
                }
            }
            const token = config.idAllocation.token;
            if (token !== undefined && typeof token !== "string") {
                errors.push("idAllocation.token must be a string");
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
        // Guard against circular inheritance
        if (this.presetChain.has(presetName)) {
            throw new Error(`Circular preset inheritance detected: '${presetName}' extends itself through its parent chain.`);
        }
        this.presetChain.add(presetName);
        try {
            // Load built-in preset
            const presetPath = this.getPresetPath(presetName);
            if (!presetPath) {
                throw new Error(`Preset '${presetName}' not found. Available presets: ${BUILT_IN_PRESETS.join(", ")}`);
            }
            const presetContent = fs.readFileSync(presetPath, "utf8");
            const preset = yamlLoad(presetContent);
            // Resolve this preset's own roleGuidance page paths relative to the preset file
            if (preset.traceability) {
                this.resolveGuidancePaths(preset.traceability, path.dirname(presetPath));
            }
            // Resolve parent preset inheritance (child wins on conflict)
            if (preset.extends) {
                const parent = this.loadPreset(preset.extends);
                preset.traceability = this.mergeConfig(parent.traceability, preset.traceability);
                delete preset.extends;
            }
            // Validate the (merged) preset
            this.validatePreset(preset);
            // Cache and return
            this.presetCache.set(presetName, preset);
            return preset;
        }
        finally {
            this.presetChain.delete(presetName);
        }
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
     * Resolve relative roleGuidance page paths to absolute paths against baseDir.
     */
    resolveGuidancePaths(config, baseDir) {
        if (!config.roleGuidance)
            return;
        for (const guidance of Object.values(config.roleGuidance)) {
            if (guidance.page && !path.isAbsolute(guidance.page)) {
                guidance.page = path.resolve(baseDir, guidance.page);
            }
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
        if (base.linkDisplayPolicies || override.linkDisplayPolicies) {
            result.linkDisplayPolicies = {
                ...(base.linkDisplayPolicies || {}),
                ...(override.linkDisplayPolicies || {}),
            };
        }
        // Merge labels: user overrides preset values
        result.labels = {
            ...(base.labels || {}),
            ...(override.labels || {}),
        };
        // idAllocation: override wins; base preserved when override absent
        result.idAllocation = override.idAllocation ?? base.idAllocation;
        // Merge roleGuidance: user overrides preset values per role
        result.roleGuidance = {
            ...(base.roleGuidance || {}),
            ...(override.roleGuidance || {}),
        };
        // Merge workflow definitions and validation rules by role/status
        result.workflow = {
            ...(base.workflow || {}),
            ...(override.workflow || {}),
        };
        result.validation = {
            ...(base.validation || {}),
            ...(override.validation || {}),
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
    getAllowedRelations(sourceRole, targetRole) {
        const config = this.getConfig();
        const source = sourceRole.toLowerCase();
        const target = targetRole.toLowerCase();
        const allowed = new Set();
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
    canonicalizeRelation(sourceRole, targetRole, type) {
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
    getInverseType(type) {
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
     * Check whether a name is any configured relation type (primary or reverse),
     * regardless of the roles it connects.
     */
    isRelationType(type) {
        const relation = type.toLowerCase();
        for (const targets of Object.values(this.getConfig().relations || {})) {
            for (const typeMap of Object.values(targets)) {
                for (const [primary, def] of Object.entries(typeMap)) {
                    if (primary === relation || def.reverse === relation)
                        return true;
                }
            }
        }
        return false;
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
/**
 * Generate a GraphViz DOT representation of the traceability configuration.
 * Renders declared roles as nodes and declared relations as labeled edges.
 * Declared directions only — `labels` is not consulted, so no derived
 * reverse edges appear. Roles with no declared relations still render as
 * (isolated) nodes so orphaned roles are visible.
 */
export function toConfigDot(config) {
    const roles = config.roles || [];
    const relations = config.relations || {};
    const lines = [
        "digraph TraceabilityConfig {",
        "  rankdir=LR;",
        '  node [shape=box, style="rounded,filled", fontname="Helvetica"];',
        '  edge [fontname="Helvetica", fontsize=10];',
    ];
    for (const role of roles) {
        const color = ROLE_COLORS[role] || "#AAAAAA";
        lines.push(`  "${role}" [fillcolor="${color}", fontcolor=white, label="${role}"];`);
    }
    for (const [source, targets] of Object.entries(relations)) {
        for (const [target, typeMap] of Object.entries(targets)) {
            const types = Object.keys(typeMap);
            if (types.length === 0)
                continue;
            const label = types.join(", ");
            lines.push(`  "${source}" -> "${target}" [label="${label}"];`);
        }
    }
    lines.push("}");
    return lines.join("\n");
}
export { interpolateEnv as resolveIdAllocationToken };
// Default export
export default ConfigLoader;
