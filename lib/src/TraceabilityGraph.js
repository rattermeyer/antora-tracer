/**
 * TraceabilityGraph - Role-based traceability graph
 *
 * This replaces the old TraceabilityGraph with:
 * - Single Item type with role property instead of separate types
 * - Role-based relation validation
 * - Configurable relation types
 * - Warning system for unknown roles
 */
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
    // Inverse relationship index
    _inverseIndex = new Map();
    _configLoader;
    _warnings = [];
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
                type: 'duplicate_node',
                message: `Duplicate item ID: ${item.id}. Existing: ${existing.role} at ${existing.sourceFile}:${existing.sourceLine}, New: ${item.role} at ${item.sourceFile}:${item.sourceLine}`,
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
        this._itemsByRole.get(item.role).set(item.id, item);
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
        return this._itemsByRole.has(role) && this._itemsByRole.get(role).size > 0;
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
                type: 'unknown_role',
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
                type: 'unknown_role',
                message: `Target item not found: ${relationship.targetId}. Relationship ${relationship.fromId} ${relationship.type} ${relationship.targetId} stored pending target.`,
                file: relationship.sourceFile,
                line: relationship.line,
            };
            this._warnings.push(warning);
            // Continue — target exists in another file that hasn't been processed yet
        }
        // Check for duplicate relationship
        const key = `${relationship.fromId}-${relationship.type}-${relationship.targetId}`;
        if (this._relationships.has(key)) {
            const warning = {
                type: 'duplicate_node',
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
                const sourceKnown = this._configLoader.getConfig().roles.includes(sourceNode.role);
                const targetKnown = this._configLoader.getConfig().roles.includes(targetNode.role);
                if (!sourceKnown || !targetKnown) {
                    // If roles are unknown, just warn
                    const warning = {
                        type: 'unknown_role',
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
                        type: 'invalid_relation',
                        message: `Relation '${relationship.type}' not allowed from '${sourceNode.role}' to '${targetNode.role}'. Allowed: [${allowed.join(', ')}]`,
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
        this._relationships.set(key, {
            ...relationship,
            autoGenerated: relationship.autoGenerated !== undefined ? relationship.autoGenerated : false,
        });
        // Update relationship indexes
        this._updateRelationshipIndex(relationship);
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
            const targetIds = new Set(targetItems.map(i => i.id));
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
        return items.filter(item => item.role === role);
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
     * Validate all items and relationships in the graph
     */
    validate() {
        const errors = [];
        const warnings = [...this._warnings];
        // Check for orphaned relationships
        for (const rel of this._relationships.values()) {
            if (!this.getItem(rel.fromId)) {
                errors.push(`Orphaned relationship: Source item '${rel.fromId}' not found for relationship type '${rel.type}'.`);
            }
            if (!this.getItem(rel.targetId)) {
                errors.push(`Orphaned relationship: Target item '${rel.targetId}' not found for relationship type '${rel.type}'.`);
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
                        type: 'unknown_role',
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
                errors.push(`Circular reference detected: ${cycle.join(' -> ')} -> ${nodeId}`);
                return;
            }
            if (visited.has(nodeId))
                return;
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            // Follow all forward relationships
            for (const rel of this.getRelationships(nodeId)) {
                // Skip auto-generated inverse relationships
                if (rel.autoGenerated)
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
            { currentId: fromId, path: [fromId], depth: 0 }
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
                        depth: depth + 1
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
        return Array.from(impacted).filter(id => id !== itemId);
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
        this._inverseIndex.clear();
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
    // Private Index Management
    // ========================================================================
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
        fromIndex.get(relationship.type).push(relationship);
        // Update reverse index: targetId -> type -> [Relationships]
        if (!this._reverseRelationshipIndex.has(relationship.targetId)) {
            this._reverseRelationshipIndex.set(relationship.targetId, new Map());
        }
        const targetIndex = this._reverseRelationshipIndex.get(relationship.targetId);
        if (!targetIndex.has(relationship.type)) {
            targetIndex.set(relationship.type, []);
        }
        targetIndex.get(relationship.type).push(relationship);
    }
}
