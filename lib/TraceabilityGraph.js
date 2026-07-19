import { INVERSE_MAP, isPrimaryRelationshipType, isInverseRelationshipType, } from './types.js';
export class TraceabilityGraph {
    _requirements = new Map();
    _implementations = new Map();
    _tests = new Map();
    _documents = new Map();
    _designs = new Map();
    _relationships = new Map();
    // Inverse relationship index for fast queries
    _inverseIndex = new Map();
    // Relationship index for fast queries: fromId -> { type -> [Relationships] }
    _relationshipIndex = new Map();
    // Reverse relationship index for fast queries: targetId -> { type -> [Relationships] }
    _reverseRelationshipIndex = new Map();
    // Cache for frequently accessed data
    _allRequirementsCache = null;
    _allImplementationsCache = null;
    _allTestsCache = null;
    _allDocumentsCache = null;
    _allDesignsCache = null;
    // ── Node management ────────────────────────────────────────────────────────
    addRequirement(req) {
        if (this._requirements.has(req.id)) {
            throw new Error(`Duplicate requirement ID: ${req.id}. A requirement with this ID already exists.`);
        }
        this._requirements.set(req.id, req);
        this._allRequirementsCache = null;
    }
    addImplementation(imp) {
        if (this._implementations.has(imp.id)) {
            throw new Error(`Duplicate implementation ID: ${imp.id}. An implementation with this ID already exists.`);
        }
        this._implementations.set(imp.id, imp);
        this._allImplementationsCache = null;
    }
    addTest(test) {
        if (this._tests.has(test.id)) {
            throw new Error(`Duplicate test ID: ${test.id}. A test with this ID already exists.`);
        }
        this._tests.set(test.id, test);
        this._allTestsCache = null;
    }
    addDocument(doc) {
        if (this._documents.has(doc.id)) {
            throw new Error(`Duplicate document ID: ${doc.id}. A document with this ID already exists.`);
        }
        this._documents.set(doc.id, doc);
        this._allDocumentsCache = null;
    }
    addDesign(design) {
        if (this._designs.has(design.id)) {
            throw new Error(`Duplicate design ID: ${design.id}. A design with this ID already exists.`);
        }
        this._designs.set(design.id, design);
        this._allDesignsCache = null;
    }
    getRequirement(id) {
        return this._requirements.get(id);
    }
    getImplementation(id) {
        return this._implementations.get(id);
    }
    getTest(id) {
        return this._tests.get(id);
    }
    getDocument(id) {
        return this._documents.get(id);
    }
    getNode(id) {
        return (this._requirements.get(id) ??
            this._implementations.get(id) ??
            this._tests.get(id) ??
            this._documents.get(id) ??
            this._designs.get(id));
    }
    /** Check if a node with the given ID exists (faster than getNode for existence checks) */
    hasNode(id) {
        return (this._requirements.has(id) ||
            this._implementations.has(id) ||
            this._tests.has(id) ||
            this._documents.has(id) ||
            this._designs.has(id));
    }
    getAllRequirements() {
        if (this._allRequirementsCache === null) {
            this._allRequirementsCache = Array.from(this._requirements.values());
        }
        return this._allRequirementsCache;
    }
    getAllImplementations() {
        if (this._allImplementationsCache === null) {
            this._allImplementationsCache = Array.from(this._implementations.values());
        }
        return this._allImplementationsCache;
    }
    getAllTests() {
        if (this._allTestsCache === null) {
            this._allTestsCache = Array.from(this._tests.values());
        }
        return this._allTestsCache;
    }
    getAllDocuments() {
        if (this._allDocumentsCache === null) {
            this._allDocumentsCache = Array.from(this._documents.values());
        }
        return this._allDocumentsCache;
    }
    getAllDesigns() {
        if (this._allDesignsCache === null) {
            this._allDesignsCache = Array.from(this._designs.values());
        }
        return this._allDesignsCache;
    }
    getAllRelationships() {
        return Array.from(this._relationships.values());
    }
    // ── Design-specific queries ─────────────────────────────────────────────────
    getDesignsForRequirement(reqId) {
        const designs = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === 'addresses' && rel.targetId === reqId) {
                const design = this._designs.get(rel.fromId);
                if (design)
                    designs.push(design);
            }
        }
        return designs;
    }
    getRequirementsForDesign(designId) {
        const requirements = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === 'addresses' && rel.fromId === designId) {
                const req = this._requirements.get(rel.targetId);
                if (req)
                    requirements.push(req);
            }
        }
        return requirements;
    }
    getImplementationsForDesign(designId) {
        const implementations = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === 'implements' && rel.targetId === designId) {
                const impl = this._implementations.get(rel.fromId);
                if (impl)
                    implementations.push(impl);
            }
        }
        return implementations;
    }
    getDesignsForImplementation(implId) {
        const designs = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === 'implements' && rel.fromId === implId) {
                const design = this._designs.get(rel.targetId);
                if (design)
                    designs.push(design);
            }
        }
        return designs;
    }
    getComposedOf(designId) {
        const composed = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === 'composed-of' && rel.fromId === designId) {
                const design = this._designs.get(rel.targetId);
                if (design)
                    composed.push(design);
            }
        }
        return composed;
    }
    getDependencies(designId) {
        const dependencies = [];
        for (const rel of this._relationships.values()) {
            if (rel.type === 'depends-on' && rel.fromId === designId) {
                const design = this._designs.get(rel.targetId);
                if (design)
                    dependencies.push(design);
            }
        }
        return dependencies;
    }
    getDesignsWithImplementations() {
        const designsWithImpl = new Set();
        for (const rel of this._relationships.values()) {
            if (rel.type === 'implements') {
                designsWithImpl.add(rel.targetId);
            }
        }
        return designsWithImpl;
    }
    getRequirementsAddressedByDesigns() {
        const addressedReqs = new Set();
        for (const rel of this._relationships.values()) {
            if (rel.type === 'addresses') {
                addressedReqs.add(rel.targetId);
            }
        }
        return addressedReqs;
    }
    // ── Relationship management ─────────────────────────────────────────────────
    addRelationship(relationship) {
        // Validate that source node exists
        const sourceNode = this.getNode(relationship.fromId);
        if (!sourceNode) {
            throw new Error(`Source node not found: ${relationship.fromId}. Cannot create relationship of type '${relationship.type}'.`);
        }
        // Validate that target node exists
        const targetNode = this.getNode(relationship.targetId);
        if (!targetNode) {
            throw new Error(`Target node not found: ${relationship.targetId}. Cannot create relationship of type '${relationship.type}'.`);
        }
        // Check for circular references (skip for auto-generated inverses as they mirror primary)
        if (!relationship.autoGenerated) {
            this.checkCircularReference(relationship.fromId, relationship.targetId, relationship.type);
        }
        const key = `${relationship.fromId}-${relationship.type}-${relationship.targetId}`;
        // Check if this exact relationship already exists
        if (this._relationships.has(key)) {
            throw new Error(`Duplicate relationship: ${relationship.fromId} ${relationship.type} ${relationship.targetId}`);
        }
        // Ensure autoGenerated is set correctly for primary relationships
        const relationshipToStore = {
            ...relationship,
            autoGenerated: relationship.autoGenerated !== undefined ? relationship.autoGenerated : false,
        };
        // Store the relationship
        this._relationships.set(key, relationshipToStore);
        // Update relationship index for fast queries
        this._updateRelationshipIndex(relationshipToStore);
        // Auto-generate inverse relationship for primary types
        if (isPrimaryRelationshipType(relationship.type)) {
            const inverseType = INVERSE_MAP[relationship.type];
            const inverseKey = `${relationship.targetId}-${inverseType}-${relationship.fromId}`;
            // Check if inverse already exists (shouldn't happen with proper usage)
            if (this._relationships.has(inverseKey)) {
                // Remove existing inverse to avoid duplicates
                this._relationships.delete(inverseKey);
                this._removeFromInverseIndex(inverseKey);
            }
            // Create and store inverse relationship
            const inverseRelationship = {
                id: inverseKey,
                fromId: relationship.targetId,
                targetId: relationship.fromId,
                type: inverseType,
                sourceFile: relationship.sourceFile,
                line: relationship.line,
                autoGenerated: true,
                inverseOf: key,
            };
            this._relationships.set(inverseKey, inverseRelationship);
            this._updateInverseIndex(inverseRelationship);
        }
        else if (isInverseRelationshipType(relationship.type)) {
            // If someone tries to add an inverse relationship explicitly, warn but allow
            // This updates the inverse index
            this._updateInverseIndex(relationship);
        }
        // Invalidate caches that depend on relationships
        this._allRequirementsCache = null;
        this._allImplementationsCache = null;
        this._allTestsCache = null;
        this._allDocumentsCache = null;
    }
    /**
     * Update the relationship index for fast queries.
     * Index structure: _relationshipIndex[fromId][type] = [Relationships]
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
    /**
     * Update the inverse index with a relationship.
     * Only indexes inverse relationship types.
     */
    _updateInverseIndex(relationship) {
        if (isInverseRelationshipType(relationship.type)) {
            if (!this._inverseIndex.has(relationship.type)) {
                this._inverseIndex.set(relationship.type, new Map());
            }
            const typeIndex = this._inverseIndex.get(relationship.type);
            if (!typeIndex.has(relationship.fromId)) {
                typeIndex.set(relationship.fromId, []);
            }
            typeIndex.get(relationship.fromId).push(relationship);
        }
    }
    /**
     * Remove a relationship from the inverse index.
     */
    _removeFromInverseIndex(relationshipId) {
        // Find the relationship to get its type and fromId
        const relationship = this._relationships.get(relationshipId);
        if (!relationship || !isInverseRelationshipType(relationship.type)) {
            return;
        }
        const typeIndex = this._inverseIndex.get(relationship.type);
        if (!typeIndex)
            return;
        const rels = typeIndex.get(relationship.fromId);
        if (!rels)
            return;
        // Remove the relationship from the array
        const index = rels.findIndex(r => r.id === relationshipId);
        if (index !== -1) {
            rels.splice(index, 1);
        }
        // Clean up empty maps
        if (rels.length === 0) {
            typeIndex.delete(relationship.fromId);
        }
        if (typeIndex.size === 0) {
            this._inverseIndex.delete(relationship.type);
        }
    }
    /**
     * Check if adding a relationship would create a circular reference.
     * Throws an error if a circular dependency is detected.
     */
    checkCircularReference(fromId, targetId, type) {
        // Only check for circular dependencies for certain relationship types
        // that can create cycles (depends, requires, satisfies)
        if (!['depends', 'requires', 'satisfies'].includes(type)) {
            return;
        }
        // Use BFS to check if targetId can reach fromId
        // Only follow relationship types that can create dependency cycles
        const cycleCreatingTypes = ['depends', 'requires', 'satisfies', 'depends-on', 'implements'];
        // Skip circular check if this is an auto-generated inverse relationship
        // (bidirectional pairs like A->implements->B and B->implemented-by->A are valid)
        if (type === 'implemented-by' || type === 'satisfied-by' || type === 'tested-by' ||
            type === 'verified-by' || type === 'documented-by' || type === 'addressed-by' ||
            type === 'part-of' || type === 'depended-by' || type === 'required-by' ||
            type === 'depends-on-by') {
            return;
        }
        const visited = new Set();
        const queue = [targetId];
        while (queue.length > 0) {
            const current = queue.shift();
            if (current === fromId) {
                throw new Error(`Circular reference detected: ${fromId} -> ${targetId} (via ${type}). This would create a dependency cycle.`);
            }
            if (visited.has(current))
                continue;
            visited.add(current);
            // Follow forward relationships of cycle-creating types only
            // Exclude inverse types to avoid false positives on bidirectional pairs
            for (const rel of this.getRelationships(current)) {
                if (cycleCreatingTypes.includes(rel.type) && !visited.has(rel.targetId)) {
                    queue.push(rel.targetId);
                }
            }
        }
    }
    /** Returns all relationships where fromId matches (optionally filtered by type). */
    getRelationships(fromId, type) {
        // Use index for fast lookup
        const fromIndex = this._relationshipIndex.get(fromId);
        if (fromIndex) {
            if (type) {
                return fromIndex.get(type) || [];
            }
            // Return all relationships for this fromId
            return Array.from(fromIndex.values()).flat();
        }
        return [];
    }
    /** Returns all relationships where targetId matches (optionally filtered by type). */
    getReverseRelationships(targetId, type) {
        // Use reverse index for fast lookup
        const targetIndex = this._reverseRelationshipIndex.get(targetId);
        if (targetIndex) {
            if (type) {
                return targetIndex.get(type) || [];
            }
            // Return all relationships for this targetId
            return Array.from(targetIndex.values()).flat();
        }
        return [];
    }
    // ── Coverage analysis ───────────────────────────────────────────────────────
    getRequirementsWithImplementations() {
        const result = new Set();
        for (const rel of this._relationships.values()) {
            if (rel.type === 'implements' || rel.type === 'satisfies') {
                result.add(rel.targetId);
            }
        }
        return result;
    }
    getRequirementsWithTests() {
        const result = new Set();
        for (const rel of this._relationships.values()) {
            if (rel.type === 'tests' || rel.type === 'verifies') {
                result.add(rel.targetId);
            }
        }
        return result;
    }
    getCoverage() {
        const total = this._requirements.size;
        const withImpl = this.getRequirementsWithImplementations().size;
        const withTests = this.getRequirementsWithTests().size;
        // Design coverage metrics
        const totalDesigns = this._designs?.size || 0;
        const designsWithImpl = this.getDesignsWithImplementations().size;
        const requirementsAddressedByDesign = this.getRequirementsAddressedByDesigns().size;
        return {
            totalRequirements: total,
            requirementsWithImplementation: withImpl,
            requirementsWithTests: withTests,
            implementationCoverage: total > 0 ? (withImpl / total) * 100 : 0,
            testCoverage: total > 0 ? (withTests / total) * 100 : 0,
            // Design coverage
            totalDesigns,
            designsWithImplementation: designsWithImpl,
            designCoverage: totalDesigns > 0 ? (designsWithImpl / totalDesigns) * 100 : 0,
            requirementsAddressedByDesign,
            requirementCoverageByDesign: total > 0 ? (requirementsAddressedByDesign / total) * 100 : 0,
        };
    }
    getUncoveredRequirements() {
        const covered = new Set([
            ...this.getRequirementsWithImplementations(),
            ...this.getRequirementsWithTests(),
        ]);
        return this.getAllRequirements().filter(req => !covered.has(req.id));
    }
    // ── Transitive Coverage (Phase 3) ────────────────────────────────────────
    /**
     * Get all requirements transitively satisfied by an implementation.
     * This includes:
     * - Direct satisfies relationships
     * - Requirements addressed by designs that this implementation implements
     */
    getTransitiveSatisfaction(implId, maxDepth = 10) {
        const satisfied = new Set();
        const visited = new Set();
        this._findTransitiveSatisfaction(implId, satisfied, visited, maxDepth, 0);
        return satisfied;
    }
    _findTransitiveSatisfaction(nodeId, satisfied, visited, maxDepth, currentDepth) {
        if (currentDepth > maxDepth || visited.has(nodeId))
            return;
        visited.add(nodeId);
        // Get direct satisfies relationships
        const directSatisfies = this.getRelationships(nodeId, 'satisfies');
        for (const rel of directSatisfies) {
            satisfied.add(rel.targetId);
        }
        // Get designs that this implementation implements
        const implementedDesigns = this.getDesignsForImplementation(nodeId);
        for (const design of implementedDesigns) {
            // Get requirements addressed by each design
            const addressedReqs = this.getRequirementsForDesign(design.id);
            for (const req of addressedReqs) {
                satisfied.add(req.id);
                // Recursively find satisfaction through the design's requirements
                this._findTransitiveSatisfaction(req.id, satisfied, visited, maxDepth, currentDepth + 1);
            }
            // Recursively find satisfaction through the design
            this._findTransitiveSatisfaction(design.id, satisfied, visited, maxDepth, currentDepth + 1);
        }
        // Get implementations that this implementation depends on
        const dependencies = this.getRelationships(nodeId, 'depends');
        for (const rel of dependencies) {
            this._findTransitiveSatisfaction(rel.targetId, satisfied, visited, maxDepth, currentDepth + 1);
        }
    }
    /**
     * Get transitive coverage report including indirect relationships.
     */
    getTransitiveCoverage() {
        const baseCoverage = this.getCoverage();
        // Calculate transitive coverage
        let transitiveSatisfied = 0;
        const allImpls = this.getAllImplementations();
        const allReqs = this.getAllRequirements();
        const allReqIds = new Set(allReqs.map(r => r.id));
        for (const impl of allImpls) {
            const transitiveReqs = this.getTransitiveSatisfaction(impl.id);
            // Count unique requirements satisfied transitively
            for (const reqId of transitiveReqs) {
                if (allReqIds.has(reqId)) {
                    transitiveSatisfied++;
                }
            }
        }
        // Calculate transitive coverage percentage
        // This is the percentage of requirements that have at least one transitive path to an implementation
        const uniqueTransitive = new Set();
        for (const impl of allImpls) {
            const transitiveReqs = this.getTransitiveSatisfaction(impl.id);
            for (const reqId of transitiveReqs) {
                uniqueTransitive.add(reqId);
            }
        }
        const transitiveCoverage = allReqs.length > 0
            ? (uniqueTransitive.size / allReqs.length) * 100
            : 0;
        return {
            ...baseCoverage,
            transitiveCoverage,
        };
    }
    // ── Graph traversal ─────────────────────────────────────────────────────────
    /** Finds a path between two node IDs using depth-limited DFS. Returns null if none exists. */
    findPath(fromId, toId, maxDepth = 5) {
        return this.findPathRecursive(fromId, toId, [], maxDepth);
    }
    findPathRecursive(currentId, targetId, visited, maxDepth) {
        if (visited.length > maxDepth || visited.includes(currentId))
            return null;
        const path = [...visited, currentId];
        if (currentId === targetId)
            return path;
        for (const rel of this.getRelationships(currentId)) {
            const found = this.findPathRecursive(rel.targetId, targetId, path, maxDepth);
            if (found)
                return found;
        }
        return null;
    }
    /** Returns all node IDs reachable from the given ID in either direction (BFS). */
    getImpactAnalysis(id) {
        const impacted = new Set();
        const queue = [id];
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
        return Array.from(impacted).filter(itemId => itemId !== id);
    }
    // ── Validation ─────────────────────────────────────────────────────────────
    /**
     * Validate all nodes and relationships in the graph.
     * Returns an array of validation errors, or empty array if valid.
     */
    validate() {
        const errors = [];
        // Check for orphaned relationships (relationships referencing non-existent nodes)
        for (const rel of this._relationships.values()) {
            if (!this.getNode(rel.fromId)) {
                errors.push(`Orphaned relationship: Source node '${rel.fromId}' not found for relationship type '${rel.type}'.`);
            }
            if (!this.getNode(rel.targetId)) {
                errors.push(`Orphaned relationship: Target node '${rel.targetId}' not found for relationship type '${rel.type}'.`);
            }
        }
        // Check for circular references
        const circularErrors = this.findCircularReferences();
        errors.push(...circularErrors);
        return errors;
    }
    /**
     * Find all circular references in the graph.
     * Returns an array of error messages describing the cycles.
     */
    findCircularReferences() {
        const errors = [];
        const visited = new Set();
        const recursionStack = new Set();
        const checkNode = (nodeId, path) => {
            if (recursionStack.has(nodeId)) {
                // Found a cycle
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
            // Follow all forward relationships, but skip auto-generated inverses
            // to avoid false positives on bidirectional pairs
            for (const rel of this.getRelationships(nodeId)) {
                // Skip auto-generated inverse relationships
                if (rel.autoGenerated)
                    continue;
                checkNode(rel.targetId, [...path]);
            }
            path.pop();
            recursionStack.delete(nodeId);
        };
        // Check all nodes
        for (const req of this._requirements.values()) {
            checkNode(req.id, []);
        }
        for (const imp of this._implementations.values()) {
            checkNode(imp.id, []);
        }
        for (const test of this._tests.values()) {
            checkNode(test.id, []);
        }
        for (const doc of this._documents.values()) {
            checkNode(doc.id, []);
        }
        return errors;
    }
    // ── Lifecycle ───────────────────────────────────────────────────────────────
    size() {
        return (this._requirements.size +
            this._implementations.size +
            this._tests.size +
            this._documents.size);
    }
    clear() {
        this._requirements.clear();
        this._implementations.clear();
        this._tests.clear();
        this._documents.clear();
        this._designs.clear();
        this._relationships.clear();
        this._inverseIndex.clear();
        this._relationshipIndex.clear();
        this._reverseRelationshipIndex.clear();
        // Clear all caches
        this._allRequirementsCache = null;
        this._allImplementationsCache = null;
        this._allTestsCache = null;
        this._allDocumentsCache = null;
        this._allDesignsCache = null;
    }
}
