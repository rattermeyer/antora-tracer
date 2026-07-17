import type {
  Requirement,
  Implementation,
  Test,
  Document,
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
  private _relationships = new Map<string, Relationship>();

  // ── Node management ────────────────────────────────────────────────────────

  addRequirement(req: Requirement): void {
    this._requirements.set(req.id, req);
  }

  addImplementation(imp: Implementation): void {
    this._implementations.set(imp.id, imp);
  }

  addTest(test: Test): void {
    this._tests.set(test.id, test);
  }

  addDocument(doc: Document): void {
    this._documents.set(doc.id, doc);
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
      this._documents.get(id)
    );
  }

  getAllRequirements(): Requirement[] {
    return Array.from(this._requirements.values());
  }

  getAllImplementations(): Implementation[] {
    return Array.from(this._implementations.values());
  }

  getAllTests(): Test[] {
    return Array.from(this._tests.values());
  }

  getAllDocuments(): Document[] {
    return Array.from(this._documents.values());
  }

  // ── Relationship management ─────────────────────────────────────────────────

  addRelationship(relationship: Relationship): void {
    const key = `${relationship.fromId}-${relationship.targetId}-${relationship.type}`;
    this._relationships.set(key, relationship);
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
    return {
      totalRequirements: total,
      requirementsWithImplementation: withImpl,
      requirementsWithTests: withTests,
      implementationCoverage: total > 0 ? (withImpl / total) * 100 : 0,
      testCoverage: total > 0 ? (withTests / total) * 100 : 0,
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
  }
}
