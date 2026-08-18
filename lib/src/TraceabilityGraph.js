/**
 * TraceabilityGraph - Role-based traceability graph
 *
 * This replaces the old TraceabilityGraph with:
 * - Single Item type with role property instead of separate types
 * - Role-based relation validation
 * - Configurable relation types
 * - Warning system for unknown roles
 */
import { INVERSE_MAP, PRIMARY_MAP } from "./types.js";
/**
 * TraceabilityGraph - Role-based traceability graph
 *
 * Features:
 * - Stores all items with their roles
 * - Validates relations based on role configuration
 * - Maintains indexes for fast queries
 * - Generates warnings for unknown roles
 */
export class TraceabilityGraph {
    _items = new Map();
    // Role-based indexes
    _itemsByRole = new Map();
    _relationships = new Map();
    // Index for fast relationship queries: fromId -> { type -> [Relationships] }
    _relationshipIndex = new Map();
    // Reverse relationship index: targetId -> { type -> [Relationships] }
    _reverseRelationshipIndex = new Map();
    _configLoader;
    _warnings = [];
    /** Exposed for test access */
    get configLoader() {
        return this._configLoader;
    }
    // Cache for frequently accessed data
    _allItemsCache = null;
    _allRelationshipsCache = null;
    constructor(configLoader) {
        this._configLoader = configLoader;
    }
    /**
     * Set the configuration loader for relation validation
     */
    setConfigLoader(configLoader) {
        this._configLoader = configLoader;
    }
    // ========================================================================
    // Node Management
    // ========================================================================
    /**
     * Add an item to the graph
     */
    addItem(item) {
        // Check for duplicate ID
        if (this._items.has(item.id)) {
            const existing = this._items.get(item.id);
            const warning = {
                type: "duplicate_node",
                message: `Duplicate item ID: ${item.id}. First defined as ${existing.role} at ${existing.sourceFile}:${existing.sourceLine}. Skipping second definition at ${item.sourceFile}:${item.sourceLine}. Items must be unique within a component version. To reference this item from another page, don't redefine it — use an inline relationship macro (e.g., addresses:${item.id}[]) for traceability, or an xref:${existing.sourceFile}.adoc#${item.id}[${item.id}] for a plain link.`,
                file: item.sourceFile,
                line: item.sourceLine,
            };
            this._warnings.push(warning);
            return;
        }
        // Store the item
        this._items.set(item.id, item);
        // Index by role
        if (!this._itemsByRole.has(item.role)) {
            this._itemsByRole.set(item.role, new Map());
        }
        this._itemsByRole.get(item.role)?.set(item.id, item);
        // Invalidate caches
        this._allItemsCache = null;
    }
    /**
     * Get an item by ID
     */
    getItem(id) {
        return this._items.get(id);
    }
    /**
     * Get all items
     */
    getAllItems() {
        if (this._allItemsCache === null) {
            this._allItemsCache = Array.from(this._items.values());
        }
        return this._allItemsCache;
    }
    /**
     * Get all items with a specific role
     */
    getItemsByRole(role) {
        const roleMap = this._itemsByRole.get(role);
        if (!roleMap)
            return [];
        return Array.from(roleMap.values());
    }
    /**
     * Get all known roles
     */
    getAllRoles() {
        return Array.from(this._itemsByRole.keys());
    }
    /**
     * Check if an item with the given ID exists
     */
    hasItem(id) {
        return this._items.has(id);
    }
    /**
     * Check if a role has any items
     */
    hasRole(role) {
        return (this._itemsByRole.has(role) &&
            (this._itemsByRole.get(role)?.size ?? 0) > 0);
    }
    // ========================================================================
    // Relationship Management
    // ========================================================================
    /**
     * Add a relationship to the graph
     */
    addRelationship(relationship) {
        // Validate that source node exists
        const sourceNode = this.getItem(relationship.fromId);
        if (!sourceNode) {
            const warning = {
                type: "unknown_role",
                message: `Source item not found: ${relationship.fromId}. Relationship '${relationship.type}' will be stored anyway.`,
                file: relationship.sourceFile,
                line: relationship.line,
            };
            this._warnings.push(warning);
            // Continue — don't block; target may be added later
        }
        // Validate that target node exists (warn but don't block — cross-file ordering is normal)
        const targetNode = this.getItem(relationship.targetId);
        if (!targetNode) {
            const warning = {
                type: "unknown_role",
                message: `Target item not found: ${relationship.targetId}. Relationship ${relationship.fromId} ${relationship.type} ${relationship.targetId} stored pending target.`,
                file: relationship.sourceFile,
                line: relationship.line,
            };
            this._warnings.push(warning);
            // Continue — target exists in another file that hasn't been processed yet
        }
        // Check for bidirectional merge: if a complementary inverse relationship
        // already exists (B invType A), merge instead of storing two directed edges.
        // First-writer-wins: the existing relationship is the canonical entry.
        const invType = this._resolveInverseType(relationship.type);
        if (invType && invType !== relationship.type) {
            const invKey = `${relationship.targetId}-${invType}-${relationship.fromId}`;
            if (this._relationships.has(invKey)) {
                const invRel = this._relationships.get(invKey);
                const newIsPrimary = this._isPrimaryType(relationship.type);
                const existingIsPrimary = this._isPrimaryType(invRel.type);
                if (!existingIsPrimary && newIsPrimary) {
                    // Existing is the inverse, new is primary — swap:
                    // delete the inverse, store the new primary as canonical
                    this._relationships.delete(invKey);
                    this._removeFromIndex(invRel);
                    relationship.bidirectional = true;
                    relationship.inverseOf = invRel.id;
                    // Fall through to normal storage below
                }
                else {
                    // Existing is primary (or both equal) — keep existing, drop new
                    invRel.bidirectional = true;
                    invRel.inverseOf = relationship.id;
                    return;
                }
            }
        }
        // Check for duplicate relationship
        const key = `${relationship.fromId}-${relationship.type}-${relationship.targetId}`;
        if (this._relationships.has(key)) {
            const warning = {
                type: "duplicate_node",
                message: `Duplicate relationship: ${relationship.fromId} ${relationship.type} ${relationship.targetId}`,
                file: relationship.sourceFile,
                line: relationship.line,
            };
            this._warnings.push(warning);
            return;
        }
        // Validate relation based on roles (if config loader is available and both nodes exist)
        if (this._configLoader && sourceNode && targetNode) {
            const isValid = this._configLoader.isRelationAllowed(sourceNode.role, targetNode.role, relationship.type);
            if (!isValid) {
                // Check if either role is unknown
                const sourceKnown = this._configLoader
                    .getConfig()
                    .roles.includes(sourceNode.role);
                const targetKnown = this._configLoader
                    .getConfig()
                    .roles.includes(targetNode.role);
                if (!sourceKnown || !targetKnown) {
                    // If roles are unknown, just warn
                    const warning = {
                        type: "unknown_role",
                        message: `Relation '${relationship.type}' from '${sourceNode.id}' (role: ${sourceNode.role}) to '${targetNode.id}' (role: ${targetNode.role}) involves unknown role(s). Skipping validation.`,
                        file: relationship.sourceFile,
                        line: relationship.line,
                    };
                    this._warnings.push(warning);
                }
                else {
                    // Both roles are known but relation is not allowed
                    const allowed = this._configLoader.getAllowedRelations(sourceNode.role, targetNode.role);
                    const warning = {
                        type: "invalid_relation",
                        message: `Relation '${relationship.type}' not allowed: '${sourceNode.id}' (${sourceNode.role}) -> '${targetNode.id}' (${targetNode.role}). Allowed: [${allowed.join(", ")}]`,
                        file: relationship.sourceFile,
                        line: relationship.line,
                    };
                    this._warnings.push(warning);
                    // Store the relationship anyway for graceful degradation
                    // but mark it as invalid
                    relationship.autoGenerated = false;
                    this._relationships.set(key, relationship);
                    this._updateRelationshipIndex(relationship);
                    // Don't auto-generate inverse for invalid relations
                    return;
                }
            }
        }
        // Store the relationship
        const stored = {
            ...relationship,
            autoGenerated: relationship.autoGenerated !== undefined
                ? relationship.autoGenerated
                : false,
        };
        this._relationships.set(key, stored);
        // Update relationship indexes
        this._updateRelationshipIndex(stored);
        // Invalidate caches
        this._allRelationshipsCache = null;
    }
    /**
     * Get a relationship by ID
     */
    getRelationship(id) {
        return this._relationships.get(id);
    }
    /**
     * Get all relationships
     */
    getAllRelationships() {
        if (this._allRelationshipsCache === null) {
            this._allRelationshipsCache = Array.from(this._relationships.values());
        }
        return this._allRelationshipsCache;
    }
    /**
     * Get relationships from a specific item
     */
    getRelationships(fromId, type) {
        const fromIndex = this._relationshipIndex.get(fromId);
        if (fromIndex) {
            if (type) {
                return fromIndex.get(type) || [];
            }
            return Array.from(fromIndex.values()).flat();
        }
        return [];
    }
    /**
     * Get relationships to a specific item (reverse)
     */
    getReverseRelationships(targetId, type) {
        const targetIndex = this._reverseRelationshipIndex.get(targetId);
        if (targetIndex) {
            if (type) {
                return targetIndex.get(type) || [];
            }
            return Array.from(targetIndex.values()).flat();
        }
        return [];
    }
    /**
     * Get relationships by type
     */
    getRelationshipsByType(type) {
        const result = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === type) {
                result.push(rel);
            }
        }
        return result;
    }
    /**
     * Get relationships filtered by source role and target role
     */
    getRelationshipsByRoles(sourceRole, targetRole) {
        const result = [];
        const sourceItems = this.getItemsByRole(sourceRole);
        for (const sourceItem of sourceItems) {
            const targetItems = this.getItemsByRole(targetRole);
            const targetIds = new Set(targetItems.map((i) => i.id));
            for (const rel of this.getRelationships(sourceItem.id)) {
                if (targetIds.has(rel.targetId)) {
                    result.push(rel);
                }
            }
        }
        return result;
    }
    // ========================================================================
    // Query Methods
    // ========================================================================
    /**
     * Get all items that have a specific relation to a given item
     */
    getRelatedItems(itemId, relationType) {
        const result = [];
        const rels = this.getRelationships(itemId, relationType);
        for (const rel of rels) {
            const target = this.getItem(rel.targetId);
            if (target) {
                result.push(target);
            }
        }
        return result;
    }
    /**
     * Get all items that have a specific relation from a given item (reverse)
     */
    getItemsWithRelationTo(itemId, relationType) {
        const result = [];
        const rels = this.getReverseRelationships(itemId, relationType);
        for (const rel of rels) {
            const source = this.getItem(rel.fromId);
            if (source) {
                result.push(source);
            }
        }
        return result;
    }
    /**
     * Get all items related to a given item (both directions)
     */
    getAllRelatedItems(itemId) {
        const result = new Map();
        // Get forward relationships
        for (const rel of this.getRelationships(itemId)) {
            const target = this.getItem(rel.targetId);
            if (target) {
                result.set(target.id, target);
            }
        }
        // Get reverse relationships
        for (const rel of this.getReverseRelationships(itemId)) {
            const source = this.getItem(rel.fromId);
            if (source) {
                result.set(source.id, source);
            }
        }
        return Array.from(result.values());
    }
    /**
     * Get items by role that are related to a given item
     */
    getRelatedItemsByRole(itemId, role, relationType) {
        const items = this.getRelatedItems(itemId, relationType);
        return items.filter((item) => item.role === role);
    }
    // ========================================================================
    // Coverage and Statistics
    // ========================================================================
    /**
     * Get statistics about items by role
     */
    getRoleStatistics() {
        const stats = {};
        for (const role of this.getAllRoles()) {
            stats[role] = this.getItemsByRole(role).length;
        }
        return stats;
    }
    /**
     * Get total item count
     */
    size() {
        return this._items.size;
    }
    /**
     * Get total relationship count
     */
    relationshipCount() {
        return this._relationships.size;
    }
    // ========================================================================
    // Validation
    // ========================================================================
    /**
     * Duplicate item IDs detected during graph population.
     * Each warning names both definitions with their file:line locations.
     */
    getDuplicateWarnings() {
        return this._warnings.filter((w) => w.type === "duplicate_node");
    }
    /**
     * Validate all items and relationships in the graph
     */
    validate() {
        const errors = [];
        // Duplicate item IDs are merge-time conflicts: promote them to errors so
        // `validate` fails rather than silently dropping the second definition.
        for (const w of this._warnings) {
            if (w.type === "duplicate_node")
                errors.push(w.message);
        }
        // Filter out stale "pending target/source" warnings that have since been resolved
        const warnings = this._warnings.filter((w) => {
            if (w.type === "duplicate_node")
                return false;
            if (w.type !== "unknown_role")
                return true;
            // Keep only if the item in the message still doesn't exist
            const targetMatch = w.message.match(/^Target item not found: ([A-Z0-9_-]+)/);
            if (targetMatch)
                return !this.getItem(targetMatch[1]);
            const sourceMatch = w.message.match(/^Source item not found: ([A-Z0-9_-]+)/);
            if (sourceMatch)
                return !this.getItem(sourceMatch[1]);
            return true;
        });
        // Check for orphaned relationships
        for (const rel of this._relationships.values()) {
            const location = rel.sourceFile
                ? ` at ${rel.sourceFile}${rel.line !== undefined ? `:${rel.line}` : ""}`
                : "";
            if (!this.getItem(rel.fromId)) {
                const targetItem = this.getItem(rel.targetId);
                const targetDetail = targetItem ? ` (role: ${targetItem.role})` : "";
                errors.push(`Orphaned relationship${location}: '${rel.fromId}' declares ${rel.type} -> '${rel.targetId}'${targetDetail} but source '${rel.fromId}' does not exist.`);
            }
            if (!this.getItem(rel.targetId)) {
                // Build expected target role hint from config
                let expectedRole = "";
                const sourceItem = this.getItem(rel.fromId);
                if (sourceItem && this._configLoader) {
                    const config = this._configLoader.getConfig();
                    const relType = rel.type.toLowerCase();
                    const relations = config.relations || {};
                    const sourceRelations = relations[sourceItem.role];
                    if (sourceRelations) {
                        const matchingTargets = [];
                        for (const [targetRole, relationTypes] of Object.entries(sourceRelations)) {
                            if (relationTypes.includes(relType)) {
                                matchingTargets.push(targetRole);
                            }
                        }
                        if (matchingTargets.length > 0) {
                            expectedRole = ` (expected target role: ${matchingTargets.join(" or ")})`;
                        }
                    }
                }
                const sourceRole = sourceItem ? ` (role: ${sourceItem.role})` : "";
                errors.push(`Orphaned relationship${location}: '${rel.fromId}'${sourceRole} declares ${rel.type} -> '${rel.targetId}' but target '${rel.targetId}' does not exist${expectedRole}.`);
            }
        }
        // Check for invalid relation types (re-check at validate time in case
        // targets were added later from other files, bypassing addRelationship check)
        if (this._configLoader) {
            for (const rel of this._relationships.values()) {
                const sourceNode = this.getItem(rel.fromId);
                const targetNode = this.getItem(rel.targetId);
                if (!sourceNode || !targetNode)
                    continue;
                const isValid = this._configLoader.isRelationAllowed(sourceNode.role, targetNode.role, rel.type);
                if (!isValid) {
                    const sourceKnown = this._configLoader
                        .getConfig()
                        .roles.includes(sourceNode.role);
                    const targetKnown = this._configLoader
                        .getConfig()
                        .roles.includes(targetNode.role);
                    if (sourceKnown && targetKnown) {
                        const location = rel.sourceFile
                            ? ` at ${rel.sourceFile}${rel.line !== undefined ? `:${rel.line}` : ""}`
                            : "";
                        const allowed = this._configLoader.getAllowedRelations(sourceNode.role, targetNode.role);
                        const hint = allowed.length > 0
                            ? ` Allowed: [${allowed.join(", ")}]`
                            : ` No relations allowed from '${sourceNode.role}' to '${targetNode.role}'.`;
                        errors.push(`Invalid relation${location}: '${rel.fromId}' (${sourceNode.role}) declares ${rel.type} -> '${rel.targetId}' (${targetNode.role}).${hint}`);
                    }
                }
            }
        }
        // Check for circular references
        const circularErrors = this.findCircularReferences();
        errors.push(...circularErrors);
        // Check for items with unknown roles
        if (this._configLoader) {
            const knownRoles = this._configLoader.getConfig().roles;
            for (const item of this._items.values()) {
                if (!knownRoles.includes(item.role)) {
                    warnings.push({
                        type: "unknown_role",
                        message: `Item '${item.id}' has unknown role '${item.role}'.`,
                        file: item.sourceFile,
                        line: item.sourceLine,
                    });
                }
            }
        }
        return { errors, warnings };
    }
    /**
     * Find all circular references in the graph
     */
    findCircularReferences() {
        const errors = [];
        const visited = new Set();
        const recursionStack = new Set();
        const checkNode = (nodeId, path) => {
            if (recursionStack.has(nodeId)) {
                const cycleStartIndex = path.indexOf(nodeId);
                const cycle = path.slice(cycleStartIndex);
                errors.push(`Circular reference detected: ${cycle.join(" -> ")} -> ${nodeId}`);
                return;
            }
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            // Follow all forward relationships
            for (const rel of this.getRelationships(nodeId)) {
                // Skip auto-generated inverse relationships and bidirectional pairs
                if (rel.autoGenerated || rel.bidirectional)
                    continue;
                checkNode(rel.targetId, [...path]);
            }
            path.pop();
            recursionStack.delete(nodeId);
        };
        // Check all items
        for (const item of this._items.values()) {
            checkNode(item.id, []);
        }
        return errors;
    }
    // ========================================================================
    // Path Finding
    // ========================================================================
    /**
     * Finds a path between two item IDs using depth-limited DFS (iterative)
     * Uses iterative approach with explicit stack to avoid recursion limits
     */
    findPath(fromId, toId, maxDepth = 5) {
        if (fromId === toId)
            return [fromId];
        if (maxDepth < 0)
            return null;
        // Stack entries: { currentId, path, depth }
        const stack = [
            { currentId: fromId, path: [fromId], depth: 0 },
        ];
        const visited = new Set([fromId]);
        while (stack.length > 0) {
            const { currentId, path, depth } = stack.pop();
            if (depth > maxDepth)
                continue;
            if (currentId === toId)
                return path;
            // Push neighbors in reverse order to maintain DFS order (last relationship first)
            const relationships = this.getRelationships(currentId);
            for (let i = relationships.length - 1; i >= 0; i--) {
                const rel = relationships[i];
                if (!visited.has(rel.targetId)) {
                    visited.add(rel.targetId);
                    stack.push({
                        currentId: rel.targetId,
                        path: [...path, rel.targetId],
                        depth: depth + 1,
                    });
                }
            }
        }
        return null;
    }
    /**
     * Returns all item IDs reachable from the given ID in either direction (BFS)
     */
    getImpactAnalysis(itemId) {
        const impacted = new Set();
        const queue = [itemId];
        while (queue.length > 0) {
            const current = queue.shift();
            for (const rel of this.getRelationships(current)) {
                if (!impacted.has(rel.targetId)) {
                    impacted.add(rel.targetId);
                    queue.push(rel.targetId);
                }
            }
            for (const rel of this.getReverseRelationships(current)) {
                if (!impacted.has(rel.fromId)) {
                    impacted.add(rel.fromId);
                    queue.push(rel.fromId);
                }
            }
        }
        return Array.from(impacted).filter((id) => id !== itemId);
    }
    // ========================================================================
    // Lifecycle
    // ========================================================================
    /**
     * Clear all items and relationships
     */
    clear() {
        this._items.clear();
        this._itemsByRole.clear();
        this._relationships.clear();
        this._relationshipIndex.clear();
        this._reverseRelationshipIndex.clear();
        this._warnings = [];
        this._allItemsCache = null;
        this._allRelationshipsCache = null;
    }
    /**
     * Merge another graph into this one
     */
    merge(other) {
        this._allItemsCache = null;
        this._allRelationshipsCache = null;
        for (const item of other.getAllItems()) {
            this.addItem({ ...item });
        }
        for (const rel of other.getAllRelationships()) {
            this.addRelationship({ ...rel });
        }
    }
    // ========================================================================
    // Visualization
    // ========================================================================
    /** Role → GraphViz color mapping */
    static ROLE_COLORS = {
        requirement: "#4A90D9",
        design: "#50B86C",
        architecture: "#50B86C",
        implementation: "#E8A838",
        test: "#D94A4A",
        document: "#8E6ECF",
    };
    /**
     * Generate a GraphViz DOT representation of the subgraph around an item.
     * @param fromId The starting item ID
     * @param depth Maximum hops from the starting item (default 1)
     */
    toDot(fromId, depth = 1) {
        const item = this.getItem(fromId);
        if (!item)
            return "";
        const visited = new Set();
        const seenEdges = new Set();
        const edges = [];
        const queue = [
            { id: fromId, dist: 0 },
        ];
        visited.add(fromId);
        while (queue.length > 0) {
            const current = queue.shift();
            if (current.dist >= depth)
                continue;
            // Outgoing relationships
            const rels = this._relationshipIndex.get(current.id);
            if (rels) {
                for (const [type, typeRels] of rels) {
                    for (const rel of typeRels) {
                        const edgeKey = `${current.id}|${rel.targetId}|${type}`;
                        if (!seenEdges.has(edgeKey)) {
                            edges.push({ from: current.id, to: rel.targetId, label: type });
                            seenEdges.add(edgeKey);
                        }
                        if (!visited.has(rel.targetId)) {
                            visited.add(rel.targetId);
                            queue.push({ id: rel.targetId, dist: current.dist + 1 });
                        }
                    }
                }
            }
            // Incoming relationships (reverse direction)
            const reverseRels = this._reverseRelationshipIndex.get(current.id);
            if (reverseRels) {
                for (const [type, typeRels] of reverseRels) {
                    for (const rel of typeRels) {
                        const edgeKey = `${rel.fromId}|${current.id}|${type}`;
                        if (!seenEdges.has(edgeKey)) {
                            edges.push({ from: rel.fromId, to: current.id, label: type });
                            seenEdges.add(edgeKey);
                        }
                        if (!visited.has(rel.fromId)) {
                            visited.add(rel.fromId);
                            queue.push({ id: rel.fromId, dist: current.dist + 1 });
                        }
                    }
                }
            }
        }
        // Build DOT output
        const lines = [
            "digraph Traceability {",
            "  rankdir=LR;",
            '  node [shape=box, style="rounded,filled", fontname="Helvetica"];',
            '  edge [fontname="Helvetica", fontsize=10];',
        ];
        for (const id of visited) {
            const nodeItem = this.getItem(id);
            if (!nodeItem)
                continue;
            const color = TraceabilityGraph.ROLE_COLORS[nodeItem.role] || "#AAAAAA";
            const label = `${nodeItem.id}\\n${(nodeItem.title || "").substring(0, 40)}`;
            lines.push(`  "${id}" [fillcolor="${color}", fontcolor=white, label="${label}"];`);
        }
        for (const e of edges) {
            if (visited.has(e.from) && visited.has(e.to)) {
                const relKey = `${e.from}-${e.label}-${e.to}`;
                const bidir = this._relationships.get(relKey)?.bidirectional;
                const attrs = bidir
                    ? `label="${e.label}", dir=both, style=dashed`
                    : `label="${e.label}"`;
                lines.push(`  "${e.from}" -> "${e.to}" [${attrs}];`);
            }
        }
        lines.push("}");
        return lines.join("\n");
    }
    /**
     * Generate a Vega-Lite JSON spec for a coverage bar chart.
     * @param itemId If provided, shows per-relationship-type coverage for that item.
     *               If omitted, shows global coverage by role.
     */
    toVegaLite(itemId) {
        if (itemId) {
            return this._perItemVegaLite(itemId);
        }
        return this._globalVegaLite();
    }
    _perItemVegaLite(itemId) {
        const item = this.getItem(itemId);
        if (!item)
            return "";
        const rels = this._relationshipIndex.get(itemId);
        const satisfiedTypes = new Set();
        if (rels) {
            for (const type of rels.keys()) {
                satisfiedTypes.add(type);
            }
        }
        // Determine expected relation types for this item's role
        const expectedTypes = [];
        if (this._configLoader) {
            const config = this._configLoader.getConfig();
            const roleRelations = config.relations?.[item.role] || {};
            for (const [, types] of Object.entries(roleRelations)) {
                for (const t of types) {
                    if (!expectedTypes.includes(t))
                        expectedTypes.push(t);
                }
            }
        }
        const allTypes = expectedTypes.length > 0 ? expectedTypes : [...satisfiedTypes];
        const values = allTypes.map((t) => ({
            "Relation Type": t,
            Status: satisfiedTypes.has(t) ? "Satisfied" : "Missing",
        }));
        return JSON.stringify({
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            title: `Coverage: ${itemId}`,
            data: { values },
            mark: "bar",
            encoding: {
                x: { field: "Relation Type", type: "nominal" },
                y: { aggregate: "count", type: "quantitative" },
                color: {
                    field: "Status",
                    type: "nominal",
                    scale: {
                        domain: ["Satisfied", "Missing"],
                        range: ["#50B86C", "#D94A4A"],
                    },
                },
            },
        }, null, 2);
    }
    _globalVegaLite() {
        const stats = this.getRoleStatistics();
        const values = [];
        for (const [role, count] of Object.entries(stats)) {
            if (typeof count === "number") {
                values.push({ Role: role, Count: count });
            }
        }
        return JSON.stringify({
            $schema: "https://vega.github.io/schema/vega-lite/v5.json",
            title: "Items by Role",
            data: { values },
            mark: "bar",
            encoding: {
                x: { field: "Role", type: "nominal" },
                y: { field: "Count", type: "quantitative" },
                color: { field: "Role", type: "nominal" },
            },
        }, null, 2);
    }
    /**
     * Get the next available ID for a given prefix.
     * Scans existing IDs matching `<prefix>-NNN`, finds the highest numeric suffix,
     * and returns `<prefix>-<max+1>` with padding matching the existing convention.
     * Defaults to 3-digit padding when no existing IDs are found.
     */
    getNextId(prefix) {
        const regex = new RegExp(`^${prefix}-(\\d+)$`);
        let maxNum = 0;
        let padWidth = 3;
        for (const id of this._items.keys()) {
            const m = regex.exec(id);
            if (m) {
                const num = parseInt(m[1], 10);
                if (num > maxNum)
                    maxNum = num;
                padWidth = m[1].length;
            }
        }
        const next = maxNum + 1;
        return `${prefix}-${String(next).padStart(padWidth, "0")}`;
    }
    // ========================================================================
    // Private Index Management
    // ========================================================================
    /**
     * Check if a relationship type is a primary type (maps TO an inverse),
     * as opposed to being itself an inverse type (mapped FROM a primary).
     * Primary types are keys in inverseLabels or INVERSE_MAP.
     */
    _isPrimaryType(type) {
        const inverseLabels = this._configLoader?.getConfig().inverseLabels;
        if (inverseLabels && type in inverseLabels)
            return true;
        return type in INVERSE_MAP;
    }
    /**
     * Remove a relationship from both forward and reverse indexes.
     */
    _removeFromIndex(relationship) {
        const fromIdx = this._relationshipIndex.get(relationship.fromId);
        if (fromIdx) {
            const typeRels = fromIdx.get(relationship.type);
            if (typeRels) {
                const idx = typeRels.indexOf(relationship);
                if (idx !== -1)
                    typeRels.splice(idx, 1);
                if (typeRels.length === 0)
                    fromIdx.delete(relationship.type);
            }
            if (fromIdx.size === 0)
                this._relationshipIndex.delete(relationship.fromId);
        }
        const targetIdx = this._reverseRelationshipIndex.get(relationship.targetId);
        if (targetIdx) {
            const typeRels = targetIdx.get(relationship.type);
            if (typeRels) {
                const idx = typeRels.indexOf(relationship);
                if (idx !== -1)
                    typeRels.splice(idx, 1);
                if (typeRels.length === 0)
                    targetIdx.delete(relationship.type);
            }
            if (targetIdx.size === 0)
                this._reverseRelationshipIndex.delete(relationship.targetId);
        }
    }
    /**
     * Resolve the inverse type for a given relationship type.
     * Checks config inverseLabels first, falls back to compile-time INVERSE_MAP.
     */
    _resolveInverseType(type) {
        const inverseLabels = this._configLoader?.getConfig().inverseLabels;
        // Forward lookup: type is the primary, return its inverse
        if (inverseLabels?.[type])
            return inverseLabels[type];
        // Reverse lookup: type is the inverse, find its primary
        if (inverseLabels) {
            for (const [primary, inverse] of Object.entries(inverseLabels)) {
                if (inverse === type)
                    return primary;
            }
        }
        const inv = INVERSE_MAP[type];
        if (inv)
            return inv;
        // Also check reverse direction: if type is itself an inverse type,
        // return the primary type (important when the second relationship
        // uses the inverse type, e.g., "addressed-by" → "addresses")
        return PRIMARY_MAP[type];
    }
    /**
     * Update the relationship index for fast queries
     */
    _updateRelationshipIndex(relationship) {
        // Update forward index: fromId -> type -> [Relationships]
        if (!this._relationshipIndex.has(relationship.fromId)) {
            this._relationshipIndex.set(relationship.fromId, new Map());
        }
        const fromIndex = this._relationshipIndex.get(relationship.fromId);
        if (!fromIndex.has(relationship.type)) {
            fromIndex.set(relationship.type, []);
        }
        fromIndex.get(relationship.type)?.push(relationship);
        // Update reverse index: targetId -> type -> [Relationships]
        if (!this._reverseRelationshipIndex.has(relationship.targetId)) {
            this._reverseRelationshipIndex.set(relationship.targetId, new Map());
        }
        const targetIndex = this._reverseRelationshipIndex.get(relationship.targetId);
        if (!targetIndex.has(relationship.type)) {
            targetIndex.set(relationship.type, []);
        }
        targetIndex.get(relationship.type)?.push(relationship);
    }
}
