"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TraceabilityGraph = void 0;
class TraceabilityGraph {
    constructor() {
        this._requirements = new Map();
        this._implementations = new Map();
        this._tests = new Map();
        this._documents = new Map();
        this._relationships = new Map();
    }
    // ── Node management ────────────────────────────────────────────────────────
    addRequirement(req) {
        this._requirements.set(req.id, req);
    }
    addImplementation(imp) {
        this._implementations.set(imp.id, imp);
    }
    addTest(test) {
        this._tests.set(test.id, test);
    }
    addDocument(doc) {
        this._documents.set(doc.id, doc);
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
            this._documents.get(id));
    }
    getAllRequirements() {
        return Array.from(this._requirements.values());
    }
    getAllImplementations() {
        return Array.from(this._implementations.values());
    }
    getAllTests() {
        return Array.from(this._tests.values());
    }
    getAllDocuments() {
        return Array.from(this._documents.values());
    }
    // ── Relationship management ─────────────────────────────────────────────────
    addRelationship(relationship) {
        const key = `${relationship.fromId}-${relationship.targetId}-${relationship.type}`;
        this._relationships.set(key, relationship);
    }
    /** Returns all relationships where fromId matches (optionally filtered by type). */
    getRelationships(fromId, type) {
        const result = [];
        for (const rel of this._relationships.values()) {
            if (rel.fromId === fromId && (!type || rel.type === type)) {
                result.push(rel);
            }
        }
        return result;
    }
    /** Returns all relationships where targetId matches (optionally filtered by type). */
    getReverseRelationships(targetId, type) {
        const result = [];
        for (const rel of this._relationships.values()) {
            if (rel.targetId === targetId && (!type || rel.type === type)) {
                result.push(rel);
            }
        }
        return result;
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
        return {
            totalRequirements: total,
            requirementsWithImplementation: withImpl,
            requirementsWithTests: withTests,
            implementationCoverage: total > 0 ? (withImpl / total) * 100 : 0,
            testCoverage: total > 0 ? (withTests / total) * 100 : 0,
        };
    }
    getUncoveredRequirements() {
        const covered = new Set([
            ...this.getRequirementsWithImplementations(),
            ...this.getRequirementsWithTests(),
        ]);
        return this.getAllRequirements().filter(req => !covered.has(req.id));
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
        this._relationships.clear();
    }
}
exports.TraceabilityGraph = TraceabilityGraph;
