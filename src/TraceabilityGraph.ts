import type {
  Requirement,
  Implementation,
  Test,
  Document,
  Design,
  AnyNode,
  RelationshipType,
  Relationship,
  CoverageReport,
} from './types.js';

export class TraceabilityGraph {
  private _requirements = new Map<string, Requirement>();
  private _implementations = new Map<string, Implementation>();
  private _tests = new Map<string, Test>();
  private _documents = new Map<string, Document>();
  private _designs = new Map<string, Design>();
  private _relationships = new Map<string, Relationship>();

  // Cache for frequently accessed data
  private _allRequirementsCache: Requirement[] | null = null;
  private _allImplementationsCache: Implementation[] | null = null;
  private _allTestsCache: Test[] | null = null;
  private _allDocumentsCache: Document[] | null = null;

  // ── Node management ────────────────────────────────────────────────────────

  addRequirement(req: Requirement): void {
    if (this._requirements.has(req.id)) {
      throw new Error(`Duplicate requirement ID: ${req.id}. A requirement with this ID already exists.`);
    }
    this._requirements.set(req.id, req);
    this._allRequirementsCache = null;
  }

  addImplementation(imp: Implementation): void {
    if (this._implementations.has(imp.id)) {
      throw new Error(`Duplicate implementation ID: ${imp.id}. An implementation with this ID already exists.`);
    }
    this._implementations.set(imp.id, imp);
    this._allImplementationsCache = null;
  }

  addTest(test: Test): void {
    if (this._tests.has(test.id)) {
      throw new Error(`Duplicate test ID: ${test.id}. A test with this ID already exists.`);
    }
    this._tests.set(test.id, test);
    this._allTestsCache = null;
  }

  addDocument(doc: Document): void {
    if (this._documents.has(doc.id)) {
      throw new Error(`Duplicate document ID: ${doc.id}. A document with this ID already exists.`);
    }
    this._documents.set(doc.id, doc);
    this._allDocumentsCache = null;
  }

  addDesign(design: Design): void {
    if (this._designs.has(design.id)) {
      throw new Error(`Duplicate design ID: ${design.id}. A design with this ID already exists.`);
    }
    this._designs.set(design.id, design);
  }

  getRequirement(id: string): Requirement | undefined {
    return this._requirements.get(id);
  }

  getImplementation(id: string): Implementation | undefined {
    return this._implementations.get(id);
  }

  getTest(id: string): Test | undefined {
    return this._tests.get(id);
  }

  getDocument(id: string): Document | undefined {
    return this._documents.get(id);
  }

  getNode(id: string): AnyNode | undefined {
    return (
      this._requirements.get(id) ??
      this._implementations.get(id) ??
      this._tests.get(id) ??
      this._documents.get(id) ??
      this._designs.get(id)
    );
  }

  /** Check if a node with the given ID exists (faster than getNode for existence checks) */
  hasNode(id: string): boolean {
    return (
      this._requirements.has(id) ||
      this._implementations.has(id) ||
      this._tests.has(id) ||
      this._documents.has(id) ||
      this._designs.has(id)
    );
  }

  getAllRequirements(): Requirement[] {
    if (this._allRequirementsCache === null) {
      this._allRequirementsCache = Array.from(this._requirements.values());
    }
    return this._allRequirementsCache;
  }

  getAllImplementations(): Implementation[] {
    if (this._allImplementationsCache === null) {
      this._allImplementationsCache = Array.from(this._implementations.values());
    }
    return this._allImplementationsCache;
  }

  getAllTests(): Test[] {
    if (this._allTestsCache === null) {
      this._allTestsCache = Array.from(this._tests.values());
    }
    return this._allTestsCache;
  }

  getAllDocuments(): Document[] {
    if (this._allDocumentsCache === null) {
      this._allDocumentsCache = Array.from(this._documents.values());
    }
    return this._allDocumentsCache;
  }

  getAllDesigns(): Design[] {
    return Array.from(this._designs.values());
  }

  // ── Design-specific queries ─────────────────────────────────────────────────

  getDesignsForRequirement(reqId: string): Design[] {
    const designs: Design[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.type === 'addresses' && rel.targetId === reqId) {
        const design = this._designs.get(rel.fromId);
        if (design) designs.push(design);
      }
    }
    return designs;
  }

  getRequirementsForDesign(designId: string): Requirement[] {
    const requirements: Requirement[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.type === 'addresses' && rel.fromId === designId) {
        const req = this._requirements.get(rel.targetId);
        if (req) requirements.push(req);
      }
    }
    return requirements;
  }

  getImplementationsForDesign(designId: string): Implementation[] {
    const implementations: Implementation[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.type === 'implements' && rel.targetId === designId) {
        const impl = this._implementations.get(rel.fromId);
        if (impl) implementations.push(impl);
      }
    }
    return implementations;
  }

  getDesignsForImplementation(implId: string): Design[] {
    const designs: Design[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.type === 'implements' && rel.fromId === implId) {
        const design = this._designs.get(rel.targetId);
        if (design) designs.push(design);
      }
    }
    return designs;
  }

  getComposedOf(designId: string): Design[] {
    const composed: Design[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.type === 'composed-of' && rel.fromId === designId) {
        const design = this._designs.get(rel.targetId);
        if (design) composed.push(design);
      }
    }
    return composed;
  }

  getDependencies(designId: string): Design[] {
    const dependencies: Design[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.type === 'depends-on' && rel.fromId === designId) {
        const design = this._designs.get(rel.targetId);
        if (design) dependencies.push(design);
      }
    }
    return dependencies;
  }

  getDesignsWithImplementations(): Set<string> {
    const designsWithImpl = new Set<string>();
    for (const rel of this._relationships.values()) {
      if (rel.type === 'implements') {
        designsWithImpl.add(rel.targetId);
      }
    }
    return designsWithImpl;
  }

  getRequirementsAddressedByDesigns(): Set<string> {
    const addressedReqs = new Set<string>();
    for (const rel of this._relationships.values()) {
      if (rel.type === 'addresses') {
        addressedReqs.add(rel.targetId);
      }
    }
    return addressedReqs;
  }

  // ── Relationship management ─────────────────────────────────────────────────

  addRelationship(relationship: Relationship): void {
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

    // Check for circular references
    this.checkCircularReference(relationship.fromId, relationship.targetId, relationship.type);

    const key = `${relationship.fromId}-${relationship.targetId}-${relationship.type}`;
    this._relationships.set(key, relationship);
    // Invalidate caches that depend on relationships
    this._allRequirementsCache = null;
    this._allImplementationsCache = null;
    this._allTestsCache = null;
    this._allDocumentsCache = null;
  }

  /**
   * Check if adding a relationship would create a circular reference.
   * Throws an error if a circular dependency is detected.
   */
  private checkCircularReference(fromId: string, targetId: string, type: RelationshipType): void {
    // Only check for circular dependencies for certain relationship types
    // that can create cycles (depends, requires, satisfies)
    if (!['depends', 'requires', 'satisfies'].includes(type)) {
      return;
    }

    // Use BFS to check if targetId can reach fromId
    const visited = new Set<string>();
    const queue = [targetId];

    while (queue.length > 0) {
      const current = queue.shift()!;

      if (current === fromId) {
        throw new Error(`Circular reference detected: ${fromId} -> ${targetId} (via ${type}). This would create a dependency cycle.`);
      }

      if (visited.has(current)) continue;
      visited.add(current);

      // Follow forward relationships
      for (const rel of this.getRelationships(current)) {
        if (!visited.has(rel.targetId)) {
          queue.push(rel.targetId);
        }
      }
    }
  }

  /** Returns all relationships where fromId matches (optionally filtered by type). */
  getRelationships(fromId: string, type?: RelationshipType): Relationship[] {
    const result: Relationship[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.fromId === fromId && (!type || rel.type === type)) {
        result.push(rel);
      }
    }
    return result;
  }

  /** Returns all relationships where targetId matches (optionally filtered by type). */
  getReverseRelationships(targetId: string, type?: RelationshipType): Relationship[] {
    const result: Relationship[] = [];
    for (const rel of this._relationships.values()) {
      if (rel.targetId === targetId && (!type || rel.type === type)) {
        result.push(rel);
      }
    }
    return result;
  }

  // ── Coverage analysis ───────────────────────────────────────────────────────

  getRequirementsWithImplementations(): Set<string> {
    const result = new Set<string>();
    for (const rel of this._relationships.values()) {
      if (rel.type === 'implements' || rel.type === 'satisfies') {
        result.add(rel.targetId);
      }
    }
    return result;
  }

  getRequirementsWithTests(): Set<string> {
    const result = new Set<string>();
    for (const rel of this._relationships.values()) {
      if (rel.type === 'tests' || rel.type === 'verifies') {
        result.add(rel.targetId);
      }
    }
    return result;
  }

  getCoverage(): CoverageReport {
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

  getUncoveredRequirements(): Requirement[] {
    const covered = new Set<string>([
      ...this.getRequirementsWithImplementations(),
      ...this.getRequirementsWithTests(),
    ]);
    return this.getAllRequirements().filter(req => !covered.has(req.id));
  }

  // ── Graph traversal ─────────────────────────────────────────────────────────

  /** Finds a path between two node IDs using depth-limited DFS. Returns null if none exists. */
  findPath(fromId: string, toId: string, maxDepth: number = 5): string[] | null {
    return this.findPathRecursive(fromId, toId, [], maxDepth);
  }

  private findPathRecursive(
    currentId: string,
    targetId: string,
    visited: string[],
    maxDepth: number,
  ): string[] | null {
    if (visited.length > maxDepth || visited.includes(currentId)) return null;

    const path = [...visited, currentId];
    if (currentId === targetId) return path;

    for (const rel of this.getRelationships(currentId)) {
      const found = this.findPathRecursive(rel.targetId, targetId, path, maxDepth);
      if (found) return found;
    }
    return null;
  }

  /** Returns all node IDs reachable from the given ID in either direction (BFS). */
  getImpactAnalysis(id: string): string[] {
    const impacted = new Set<string>();
    const queue = [id];

    while (queue.length > 0) {
      const current = queue.shift()!;

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
  validate(): string[] {
    const errors: string[] = [];

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
  private findCircularReferences(): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const checkNode = (nodeId: string, path: string[]) => {
      if (recursionStack.has(nodeId)) {
        // Found a cycle
        const cycleStartIndex = path.indexOf(nodeId);
        const cycle = path.slice(cycleStartIndex);
        errors.push(`Circular reference detected: ${cycle.join(' -> ')} -> ${nodeId}`);
        return;
      }

      if (visited.has(nodeId)) return;

      visited.add(nodeId);
      recursionStack.add(nodeId);
      path.push(nodeId);

      // Follow all forward relationships
      for (const rel of this.getRelationships(nodeId)) {
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

  size(): number {
    return (
      this._requirements.size +
      this._implementations.size +
      this._tests.size +
      this._documents.size
    );
  }

  clear(): void {
    this._requirements.clear();
    this._implementations.clear();
    this._tests.clear();
    this._documents.clear();
    this._relationships.clear();
    // Clear all caches
    this._allRequirementsCache = null;
    this._allImplementationsCache = null;
    this._allTestsCache = null;
    this._allDocumentsCache = null;
  }
}
