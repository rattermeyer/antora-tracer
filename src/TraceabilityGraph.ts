/**
 * TraceabilityGraph - Role-based traceability graph
 *
 * This replaces the old TraceabilityGraph with:
 * - Single Item type with role property instead of separate types
 * - Role-based relation validation
 * - Configurable relation types
 * - Warning system for unknown roles
 */

import type { ConfigLoader } from "./config/TraceabilityConfig.js";
import type { Item, ItemRelationship, SiblingInfo } from "./types.js";
import { HISTORY_RELATION_TYPES, itemIdentity, ROLE_COLORS, SUPERSEDES } from "./types.js";

/**
 * Warning type for graph operations
 */
export interface GraphWarning {
  type:
    | "unknown_role"
    | "invalid_relation"
    | "duplicate_node"
    | "stale_link"
    | "dangling_link"
    | "ambiguous_target";
  message: string;
  file?: string;
  line?: number;
}

/**
 * Validation result
 */
export interface ValidationResult {
  errors: string[];
  warnings: GraphWarning[];
}

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
  private _items = new Map<string, Item>();

  // Role-based indexes
  private _itemsByRole = new Map<string, Map<string, Item>>();

  private _itemsByBareId = new Map<string, Item[]>;

  private _relationships = new Map<string, ItemRelationship>();

  // Index for fast relationship queries: fromId -> { type -> [Relationships] }
  private _relationshipIndex = new Map<
    string,
    Map<string, ItemRelationship[]>
  >();

  // Reverse relationship index: targetId -> { type -> [Relationships] }
  private _reverseRelationshipIndex = new Map<
    string,
    Map<string, ItemRelationship[]>
  >();

  private _configLoader?: ConfigLoader;
  private _warnings: GraphWarning[] = [];

  /** Exposed for test access */
  get configLoader(): ConfigLoader | undefined {
    return this._configLoader;
  }

  // Cache for frequently accessed data
  private _allItemsCache: Item[] | null = null;
  private _allRelationshipsCache: ItemRelationship[] | null = null;

  constructor(configLoader?: ConfigLoader) {
    this._configLoader = configLoader;
  }

  /**
   * Set the configuration loader for relation validation
   */
  setConfigLoader(configLoader: ConfigLoader): void {
    this._configLoader = configLoader;
  }

  // ========================================================================
  // Node Management
  // ========================================================================

  /**
   * Add an item to the graph
   */
  addItem(item: Item): void {
    const identity = itemIdentity(item);
    const existing = this._items.get(identity);
    if (existing) {
      this._warnings.push({
        type: "duplicate_node",
        message: `Duplicate item ID: ${item.id}. First defined as ${existing.role} at ${existing.sourceFile}:${existing.sourceLine}. Skipping second definition at ${item.sourceFile}:${item.sourceLine}. Items must be unique within a component version.`,
        file: item.sourceFile,
        line: item.sourceLine,
      });
      return;
    }
    this._items.set(identity, item);
    const byId = this._itemsByBareId.get(item.id) ?? [];
    byId.push(item);
    this._itemsByBareId.set(item.id, byId);
    if (!this._itemsByRole.has(item.role)) this._itemsByRole.set(item.role, new Map());
    this._itemsByRole.get(item.role)!.set(identity, item);
    this._allItemsCache = null;
  }

  getItem(id: string, component?: string, version?: string): Item | undefined {
    if (component !== undefined) return this._items.get(itemIdentity({ id, component, version }));
    const direct = this._items.get(id);
    if (direct) return direct;
    const matches = this._itemsByBareId.get(id);
    return matches?.length === 1 ? matches[0] : undefined;
  }

  /**
   * Get all items
   */
  getAllItems(): Item[] {
    if (this._allItemsCache === null) {
      this._allItemsCache = Array.from(this._items.values());
    }
    return this._allItemsCache;
  }

  /**
   * Get all items with a specific role
   */
  getItemsByRole(role: string): Item[] {
    const roleMap = this._itemsByRole.get(role);
    if (!roleMap) return [];
    return Array.from(roleMap.values());
  }

  /**
   * Get all items with a specific role, excluding superseded items.
   */
  getCurrentItemsByRole(role: string): Item[] {
    return this.getItemsByRole(role).filter((item) => !this.isSuperseded(item.id, item.component, item.version));
  }

  /**
   * Get all known roles
   */
  getAllRoles(): string[] {
    return Array.from(this._itemsByRole.keys());
  }

  /**
   * Check if an item with the given ID exists
   */
  hasItem(id: string): boolean {
    return this.getItem(id) !== undefined;
  }

  /**
   * Check if a role has any items
   */
  hasRole(role: string): boolean {
    return (
      this._itemsByRole.has(role) &&
      (this._itemsByRole.get(role)?.size ?? 0) > 0
    );
  }

  // ========================================================================
  // Relationship Management
  // ========================================================================

  /**
   * Add a relationship to the graph
   */
  private resolveEndpoint(id: string, relationship: ItemRelationship, endpoint: "source" | "target"): Item | undefined {
    if (endpoint === "source" && relationship.fromIdentity) {
      const source = this._items.get(relationship.fromIdentity);
      if (source?.id === id) return source;
    }
    if (relationship.component != null) {
      const local = this.getItem(id, relationship.component, relationship.version);
      if (local) return local;
      if (endpoint === "source") return undefined;
    }
    const matches = this._itemsByBareId.get(id) ?? [];
    if (matches.length === 1) return matches[0];
    if (endpoint === "target" && relationship.component != null && matches.length > 1) {
      this._warnings.push({
        type: "ambiguous_target",
        message: `Ambiguous target item ID: ${id}. Relationship ${relationship.fromId} ${relationship.type} ${id} remains unresolved because multiple external targets exist.`,
        file: relationship.sourceFile,
        line: relationship.line,
      });
    }
    return undefined;
  }

  addRelationship(relationship: ItemRelationship): void {
    let sourceNode = this.resolveEndpoint(relationship.fromId, relationship, "source");
    let targetNode = this.resolveEndpoint(relationship.targetId, relationship, "target");
    if (!sourceNode) this._warnings.push({ type: "unknown_role", message: `Source item not found: ${relationship.fromId}. Relationship '${relationship.type}' will be stored anyway.`, file: relationship.sourceFile, line: relationship.line });
    if (!targetNode) this._warnings.push({ type: "unknown_role", message: `Target item not found: ${relationship.targetId}. Relationship ${relationship.fromId} ${relationship.type} ${relationship.targetId} stored pending target.`, file: relationship.sourceFile, line: relationship.line });

    let wasReverse = false;
    if (this._configLoader && sourceNode && targetNode) {
      const canonical = this._configLoader.canonicalizeRelation(sourceNode.role, targetNode.role, relationship.type);
      if (canonical && canonical.primary !== relationship.type) {
        wasReverse = true;
        [relationship.fromId, relationship.targetId] = [relationship.targetId, relationship.fromId];
        [sourceNode, targetNode] = [targetNode, sourceNode];
        relationship.type = canonical.primary;
      }
    }
    relationship.fromIdentity = sourceNode ? itemIdentity(sourceNode) : relationship.component != null ? itemIdentity({ id: relationship.fromId, component: relationship.component, version: relationship.version }) : relationship.fromId;
    relationship.targetIdentity = targetNode ? itemIdentity(targetNode) : relationship.targetId;
    const key = `${relationship.fromIdentity}\u0000${relationship.type}\u0000${relationship.targetIdentity}`;
    const existing = this._relationships.get(key);
    if (existing) {
      if (wasReverse) {
        existing.bidirectional = true;
        existing.inverseOf = relationship.id;
      } else if (!existing.bidirectional) {
        this._warnings.push({ type: "duplicate_node", message: `Duplicate relationship: ${relationship.fromId} ${relationship.type} ${relationship.targetId}`, file: relationship.sourceFile, line: relationship.line });
      }
      return;
    }

    if (this._configLoader && sourceNode && targetNode && !this._configLoader.isRelationAllowed(sourceNode.role, targetNode.role, relationship.type)) {
      const roles = this._configLoader.getConfig().roles;
      if (roles.includes(sourceNode.role) && roles.includes(targetNode.role)) {
        const allowed = this._configLoader.getAllowedRelations(sourceNode.role, targetNode.role);
        this._warnings.push({ type: "invalid_relation", message: `Relation '${relationship.type}' not allowed: '${sourceNode.id}' (${sourceNode.role}) -> '${targetNode.id}' (${targetNode.role}). Allowed: [${allowed.join(", ")}]`, file: relationship.sourceFile, line: relationship.line });
        relationship.autoGenerated = false;
        this._relationships.set(key, relationship);
        this._updateRelationshipIndex(relationship);
        this._allRelationshipsCache = null;
        return;
      }
      this._warnings.push({ type: "unknown_role", message: `Relation '${relationship.type}' from '${sourceNode.id}' (role: ${sourceNode.role}) to '${targetNode.id}' (role: ${targetNode.role}) involves unknown role(s). Skipping validation.`, file: relationship.sourceFile, line: relationship.line });
    }

    const stored = { ...relationship, autoGenerated: relationship.autoGenerated ?? false, bidirectional: wasReverse ? true : relationship.bidirectional };
    this._relationships.set(key, stored);
    this._updateRelationshipIndex(stored);
    this._allRelationshipsCache = null;
  }

  canonicalizeRelationships(): void {
    const relationships = this.getAllRelationships().map((rel) => ({ ...rel }));
    this._relationships.clear();
    this._relationshipIndex.clear();
    this._reverseRelationshipIndex.clear();
    this._allRelationshipsCache = null;
    this._warnings = this._warnings.filter((warning) => warning.type !== "ambiguous_target");
    for (const relationship of relationships) this.addRelationship(relationship);
  }

  getRelationship(id: string): ItemRelationship | undefined {
    return Array.from(this._relationships.values()).find((rel) => rel.id === id);
  }

  getAllRelationships(): ItemRelationship[] {
    if (this._allRelationshipsCache === null) this._allRelationshipsCache = Array.from(this._relationships.values());
    return this._allRelationshipsCache;
  }

  getRelationships(fromId: string, type?: string, component?: string, version?: string): ItemRelationship[] {
    const source = this.getItem(fromId, component, version);
    if (!source) return [];
    const index = this._relationshipIndex.get(itemIdentity(source));
    return !index ? [] : type ? index.get(type) ?? [] : Array.from(index.values()).flat();
  }

  getReverseRelationships(targetId: string, type?: string, component?: string, version?: string): ItemRelationship[] {
    const target = this.getItem(targetId, component, version);
    if (!target) return [];
    const index = this._reverseRelationshipIndex.get(itemIdentity(target));
    return !index ? [] : type ? index.get(type) ?? [] : Array.from(index.values()).flat();
  }

  // ========================================================================
  // Supersession
  // ========================================================================

  /**
   * Whether a relationship type records history rather than current state.
   */
  isHistoryRelation(type: string): boolean {
    return HISTORY_RELATION_TYPES.has(type);
  }

  /**
   * Whether an item has been replaced: at least one incoming `supersedes`
   * relationship targets it.
   */
  isSuperseded(itemId: string, component?: string, version?: string): boolean {
    return this.getReverseRelationships(itemId, SUPERSEDES, component, version).length > 0;
  }

  /**
   * The direct successors of an item — the items that `supersedes` it.
   */
  getSuccessors(itemId: string, component?: string, version?: string): Item[] {
    return this.getReverseRelationships(itemId, SUPERSEDES, component, version)
      .map((rel) => this._items.get(rel.fromIdentity ?? rel.fromId))
      .filter((item): item is Item => item !== undefined);
  }

  /**
   * Whether a superseded item is orphaned: superseded AND no incoming
   * functional (non-history) relationships target it.
   */
  isOrphaned(itemId: string, component?: string, version?: string): boolean {
    if (!this.isSuperseded(itemId, component, version)) return false;
    return this.getReverseRelationships(itemId, undefined, component, version).every((rel) => this.isHistoryRelation(rel.type));
  }

  /**
   * Relationships whose target item no longer exists.
   */
  getDanglingReferences(): ItemRelationship[] {
    return Array.from(this._relationships.values()).filter((rel) => !rel.targetIdentity || !this._items.has(rel.targetIdentity));
  }

  getSupersededItems(): Item[] {
    return this.getAllItems().filter((item) => this.isSuperseded(item.id, item.component, item.version));
  }

  /**
   * Get relationships by type
   */
  getRelationshipsByType(type: string): ItemRelationship[] {
    return Array.from(this._relationships.values()).filter((rel) => rel.type === type);
  }

  /**
   * Get relationships filtered by source role and target role
   */
  getRelationshipsByRoles(sourceRole: string, targetRole: string): ItemRelationship[] {
    const result: ItemRelationship[] = [];
    for (const source of this.getItemsByRole(sourceRole)) {
      for (const rel of this.getRelationships(source.id, undefined, source.component, source.version)) {
        if (this._items.get(rel.targetIdentity ?? rel.targetId)?.role === targetRole) result.push(rel);
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
  getRelatedItems(itemId: string, relationType?: string, component?: string, version?: string): Item[] {
    return this.getRelationships(itemId, relationType, component, version).map((rel) => this._items.get(rel.targetIdentity ?? rel.targetId)).filter((item): item is Item => item !== undefined);
  }

  getItemsWithRelationTo(itemId: string, relationType?: string, component?: string, version?: string): Item[] {
    return this.getReverseRelationships(itemId, relationType, component, version).map((rel) => this._items.get(rel.fromIdentity ?? rel.fromId)).filter((item): item is Item => item !== undefined);
  }

  getAllRelatedItems(itemId: string, component?: string, version?: string): Item[] {
    const result = new Map<string, Item>();
    for (const item of this.getRelatedItems(itemId, undefined, component, version)) result.set(itemIdentity(item), item);
    for (const item of this.getItemsWithRelationTo(itemId, undefined, component, version)) result.set(itemIdentity(item), item);
    return Array.from(result.values());
  }

  /**
   * Get items sharing at least one typed neighbor with the given item
   * (undirected traversal: neighbors are outgoing targets and incoming
   * sources). Each result carries the shared neighbor IDs, the relation
   * types connecting them, and the sibling's supersession status.
   */
  getSiblings(itemId: string, relationType?: string, component?: string, version?: string): Array<SiblingInfo> {
    const item = this.getItem(itemId, component, version);
    if (!item) return [];
    const identity = itemIdentity(item);
    const neighborTypes = new Map<string, Set<string>>();
    const addNeighbor = (neighbor: string, type: string) => {
      if (neighbor === identity) return;
      const types = neighborTypes.get(neighbor) ?? new Set<string>();
      types.add(type);
      neighborTypes.set(neighbor, types);
    };
    for (const rel of this.getRelationships(itemId, relationType, component, version)) addNeighbor(rel.targetIdentity ?? rel.targetId, rel.type);
    for (const rel of this.getReverseRelationships(itemId, relationType, component, version)) addNeighbor(rel.fromIdentity ?? rel.fromId, rel.type);

    const siblings = new Map<string, { sibling: Item; shared: Set<string> }>();
    const addSibling = (siblingIdentity: string, neighborIdentity: string) => {
      if (siblingIdentity === identity) return;
      const sibling = this._items.get(siblingIdentity);
      if (!sibling) return;
      const info = siblings.get(siblingIdentity) ?? { sibling, shared: new Set<string>() };
      info.shared.add(this._items.get(neighborIdentity)?.id ?? neighborIdentity);
      siblings.set(siblingIdentity, info);
    };
    for (const neighbor of neighborTypes.keys()) {
      const types = relationType ? [relationType] : this.allEdgeTypes(neighbor);
      for (const type of types) {
        for (const rel of this.getRelationships(this._items.get(neighbor)?.id ?? neighbor, type, this._items.get(neighbor)?.component, this._items.get(neighbor)?.version)) addSibling(rel.targetIdentity ?? rel.targetId, neighbor);
        for (const rel of this.getReverseRelationships(this._items.get(neighbor)?.id ?? neighbor, type, this._items.get(neighbor)?.component, this._items.get(neighbor)?.version)) addSibling(rel.fromIdentity ?? rel.fromId, neighbor);
      }
    }
    return Array.from(siblings.values()).map(({ sibling, shared }) => ({
      siblingId: sibling.id,
      sharedTargets: Array.from(shared).sort(),
      superseded: this.isSuperseded(sibling.id, sibling.component, sibling.version),
      successorIds: this.isSuperseded(sibling.id, sibling.component, sibling.version) ? this.getSuccessors(sibling.id, sibling.component, sibling.version).map((successor) => successor.id) : [],
    })).sort((a, b) => a.siblingId.localeCompare(b.siblingId));
  }

  /** All relation types on the item's edges, both directions. */
  private allEdgeTypes(identity: string): string[] {
    const types = new Set<string>();
    for (const rels of this._relationshipIndex.get(identity)?.values() ?? []) for (const rel of rels) types.add(rel.type);
    for (const rels of this._reverseRelationshipIndex.get(identity)?.values() ?? []) for (const rel of rels) types.add(rel.type);
    return Array.from(types);
  }


  /**
   * Get items by role that are related to a given item
   */
  getRelatedItemsByRole(
    itemId: string,
    role: string,
    relationType?: string,
  ): Item[] {
    const items = this.getRelatedItems(itemId, relationType);
    return items.filter((item) => item.role === role);
  }

  // ========================================================================
  // Coverage and Statistics
  // ========================================================================

  /**
   * Get statistics about items by role
   */
  getRoleStatistics(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const role of this.getAllRoles()) {
      stats[role] = this.getItemsByRole(role).length;
    }
    return stats;
  }

  /**
   * Get total item count
   */
  size(): number {
    return this._items.size;
  }

  /**
   * Get total relationship count
   */
  relationshipCount(): number {
    return this._relationships.size;
  }

  // ========================================================================
  // Validation
  // ========================================================================

  /**
   * Duplicate item IDs detected during graph population.
   * Each warning names both definitions with their file:line locations.
   */
  getDuplicateWarnings(): GraphWarning[] {
    return this._warnings.filter((w) => w.type === "duplicate_node");
  }

  /**
   * Validate all items and relationships in the graph
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: GraphWarning[] = this._warnings.filter((warning) => {
      if (warning.type === "duplicate_node") { errors.push(warning.message); return false; }
      if (warning.type === "unknown_role") {
        const targetMatch = warning.message.match(/^Target item not found: ([A-Z0-9_-]+)/);
        if (targetMatch && this.getItem(targetMatch[1])) return false;
        const sourceMatch = warning.message.match(/^Source item not found: ([A-Z0-9_-]+)/);
        if (sourceMatch && this.getItem(sourceMatch[1])) return false;
      }
      return true;
    });
    for (const rel of this._relationships.values()) {
      const source = this._items.get(rel.fromIdentity ?? rel.fromId);
      const target = this._items.get(rel.targetIdentity ?? rel.targetId);
      const location = rel.sourceFile ? ` at ${rel.sourceFile}${rel.line !== undefined ? `:${rel.line}` : ""}` : "";
      const history = HISTORY_RELATION_TYPES.has(rel.type);
      if (!source) {
        const message = `Dangling reference${location}: '${rel.fromId}' declares ${rel.type} -> '${rel.targetId}' but source '${rel.fromId}' does not exist.`;
        if (history) warnings.push({ type: "dangling_link", message, file: rel.sourceFile, line: rel.line }); else errors.push(message);
      }
      if (!target) {
        let expectedRole = "";
        if (source && this._configLoader) {
          const sourceRelations = this._configLoader.getConfig().relations?.[source.role] ?? {};
          const expected = Object.entries(sourceRelations)
            .filter(([, typeMap]) => rel.type.toLowerCase() in typeMap)
            .map(([role]) => role);
          if (expected.length) expectedRole = ` (expected target role: ${expected.join(" or ")})`;
        }
        const message = `Dangling reference${location}: '${rel.fromId}'${source ? ` (role: ${source.role})` : ""} declares ${rel.type} -> '${rel.targetId}' but target '${rel.targetId}' does not exist${expectedRole}.`;
        if (history) warnings.push({ type: "dangling_link", message, file: rel.sourceFile, line: rel.line }); else errors.push(message);
      }
      if (source && target && this._configLoader && !this._configLoader.isRelationAllowed(source.role, target.role, rel.type)) {
        const roles = this._configLoader.getConfig().roles;
        if (roles.includes(source.role) && roles.includes(target.role)) {
          const allowed = this._configLoader.getAllowedRelations(source.role, target.role);
          const hint = allowed.length ? ` Allowed: [${allowed.join(", ")}]` : ` No relations allowed from '${source.role}' to '${target.role}'.`;
          errors.push(`Invalid relation${location}: '${rel.fromId}' (${source.role}) declares ${rel.type} -> '${rel.targetId}' (${target.role}).${hint}`);
        }
      }
    }
    if (this._configLoader) {
      const roles = this._configLoader.getConfig().roles;
      for (const item of this._items.values()) if (!roles.includes(item.role)) warnings.push({ type: "unknown_role", message: `Item '${item.id}' has unknown role '${item.role}'.`, file: item.sourceFile, line: item.sourceLine });
    }
    errors.push(...this.findCircularReferences());
    const supersession = this.findSupersessionIssues();
    errors.push(...supersession.errors);
    warnings.push(...supersession.warnings);
    return { errors, warnings };
  }

  /**
   * Validate the supersession graph. Self-supersession, duplicate history
   * links, and cycles are errors; functional links to superseded items are
   * advisory warnings.
   */
  private findSupersessionIssues(): {
    errors: string[];
    warnings: GraphWarning[];
  } {
    const errors: string[] = [];
    const warnings: GraphWarning[] = [];

    const successorMap = new Map<string, Set<string>>();
    const seen = new Set<string>();

    for (const rel of this._relationships.values()) {
      if (rel.type !== SUPERSEDES) continue;

      const from = rel.fromIdentity ?? rel.fromId;
      const target = rel.targetIdentity ?? rel.targetId;
      if (from === target) {
        errors.push(`Self-supersession: '${rel.fromId}' supersedes itself.`);
        continue;
      }

      const key = `${rel.fromIdentity ?? rel.fromId}->${rel.targetIdentity ?? rel.targetId}`;
      if (seen.has(key)) {
        errors.push(
          `Duplicate supersedes: '${rel.fromId}' supersedes '${rel.targetId}' more than once.`,
        );
      }
      seen.add(key);

      if (!successorMap.has(from)) successorMap.set(from, new Set());
      successorMap.get(from)!.add(target);
    }

    errors.push(...this.findSupersessionCycles(successorMap));

    // Functional links to superseded items require review.
    for (const rel of this._relationships.values()) {
      if (HISTORY_RELATION_TYPES.has(rel.type)) continue;
      const target = rel.targetIdentity ?? rel.targetId;
      if (!this.isSuperseded(target)) continue;
      const successors = this.getSuccessors(target)
        .map((s) => s.id)
        .sort();
      warnings.push({
        type: "stale_link",
        message: `Relation '${rel.type}' from '${rel.fromId}' targets '${rel.targetId}', which is superseded by ${successors.join(", ")}.`,
        file: rel.sourceFile,
        line: rel.line,
      });
    }

    return { errors, warnings };
  }

  /**
   * Detect cycles in the supersession graph (successor → predecessor).
   */
  private findSupersessionCycles(
    successorMap: Map<string, Set<string>>,
  ): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const inStack = new Set<string>();

    const visit = (node: string, path: string[]) => {
      if (inStack.has(node)) {
        const start = path.indexOf(node);
        errors.push(
          `Supersession cycle: ${path.slice(start).join(" -> ")} -> ${node}`,
        );
        return;
      }
      if (visited.has(node)) return;
      visited.add(node);
      inStack.add(node);
      path.push(node);
      for (const next of successorMap.get(node) ?? []) {
        visit(next, path);
      }
      path.pop();
      inStack.delete(node);
    };

    for (const node of successorMap.keys()) {
      visit(node, []);
    }

    return errors;
  }

  /**
   * Find all circular references in the graph
   */
  private findCircularReferences(): string[] {
    const errors: string[] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const checkNode = (identity: string, path: string[]) => {
      if (recursionStack.has(identity)) {
        const cycleStart = path.indexOf(identity);
        errors.push(`Circular reference detected: ${path.slice(cycleStart).join(" -> ")} -> ${identity}`);
        return;
      }
      if (visited.has(identity)) return;
      visited.add(identity);
      recursionStack.add(identity);
      path.push(identity);
      for (const relationships of this._relationshipIndex.get(identity)?.values() ?? []) {
        for (const rel of relationships) if (!rel.autoGenerated && !rel.bidirectional) checkNode(rel.targetIdentity ?? rel.targetId, [...path]);
      }
      path.pop();
      recursionStack.delete(identity);
    };
    for (const identity of this._items.keys()) checkNode(identity, []);
    return errors;
  }

  // ========================================================================
  // Path Finding
  // ========================================================================

  /**
   * Finds a path between two item IDs using depth-limited DFS (iterative)
   * Uses iterative approach with explicit stack to avoid recursion limits
   */
  findPath(fromId: string, toId: string, maxDepth: number = 5, component?: string, version?: string): string[] | null {
    const from = this.getItem(fromId, component, version);
    const to = this.getItem(toId, component, version);
    if (!from || !to) return null;
    const start = itemIdentity(from);
    const destination = itemIdentity(to);
    if (start === destination) return [fromId];
    if (maxDepth < 0) return null;
    const stack: { identity: string; path: string[]; depth: number }[] = [{ identity: start, path: [fromId], depth: 0 }];
    const visited = new Set([start]);
    while (stack.length > 0) {
      const { identity, path, depth } = stack.pop()!;
      if (depth > maxDepth) continue;
      if (identity === destination) return path;
      const relationships = Array.from(this._relationshipIndex.get(identity)?.values() ?? []).flat();
      for (let index = relationships.length - 1; index >= 0; index--) {
        const rel = relationships[index];
        const target = rel.targetIdentity ?? rel.targetId;
        if (visited.has(target)) continue;
        visited.add(target);
        stack.push({ identity: target, path: [...path, rel.targetId], depth: depth + 1 });
      }
    }
    return null;
  }

  /**
   * Returns all item IDs reachable from the given ID in either direction (BFS)
   */
  getImpactAnalysis(itemId: string, component?: string, version?: string): string[] {
    const item = this.getItem(itemId, component, version);
    if (!item) return [];
    const impacted = new Set<string>();
    const queue = [itemIdentity(item)];
    while (queue.length > 0) {
      const identity = queue.shift()!;
      for (const relationships of this._relationshipIndex.get(identity)?.values() ?? []) {
        for (const rel of relationships) {
          const target = rel.targetIdentity ?? rel.targetId;
          if (!impacted.has(target)) { impacted.add(target); queue.push(target); }
        }
      }
      for (const relationships of this._reverseRelationshipIndex.get(identity)?.values() ?? []) {
        for (const rel of relationships) {
          const source = rel.fromIdentity ?? rel.fromId;
          if (!impacted.has(source)) { impacted.add(source); queue.push(source); }
        }
      }
    }
    return Array.from(impacted, (identity) => this._items.get(identity)?.id ?? identity).filter((id) => id !== itemId);
  }

  /**
   * Return distinct items reachable through outgoing relationships with the requested role.
   */
  getLinkedItems(itemId: string, role: string, component?: string, version?: string): Item[] {
    const item = this.getItem(itemId, component, version);
    if (!item) return [];
    const linked: Item[] = [];
    const visited = new Set([itemIdentity(item)]);
    const queue = [itemIdentity(item)];
    for (let index = 0; index < queue.length; index++) {
      const identity = queue[index];
      for (const relationships of this._relationshipIndex.get(identity)?.values() ?? []) {
        for (const rel of relationships) {
          const target = rel.targetIdentity ?? rel.targetId;
          if (visited.has(target)) continue;
          visited.add(target);
          const targetItem = this._items.get(target);
          if (!targetItem) continue;
          if (targetItem.role === role) linked.push(targetItem);
          queue.push(target);
        }
      }
    }
    return linked;
  }

  // ========================================================================
  // Lifecycle
  // ========================================================================

  /**
   * Clear all items and relationships
   */
  clear(): void {
    this._items.clear();
    this._itemsByRole.clear();
    this._itemsByBareId.clear();
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
  merge(other: TraceabilityGraph): void {
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

  /**
   * Generate a GraphViz DOT representation of the subgraph around an item.
   * @param fromId The starting item ID
   * @param depth Maximum hops from the starting item (default 1)
   */
  toDot(fromId: string, depth = 1, component?: string, version?: string): string {
    const startItem = this.getItem(fromId, component, version);
    if (!startItem) return "";
    const start = itemIdentity(startItem);
    const visited = new Set<string>([start]);
    const seenEdges = new Set<string>();
    const edges: Array<{ from: string; to: string; label: string; relationship: ItemRelationship }> = [];
    const queue: Array<{ identity: string; dist: number }> = [{ identity: start, dist: 0 }];
    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current.dist >= depth) continue;
      for (const relationships of this._relationshipIndex.get(current.identity)?.values() ?? []) {
        for (const rel of relationships) {
          const from = rel.fromIdentity ?? rel.fromId;
          const to = rel.targetIdentity ?? rel.targetId;
          const edgeKey = `${from}|${to}|${rel.type}`;
          if (!seenEdges.has(edgeKey)) { edges.push({ from, to, label: rel.type, relationship: rel }); seenEdges.add(edgeKey); }
          if (!visited.has(to)) { visited.add(to); queue.push({ identity: to, dist: current.dist + 1 }); }
        }
      }
      for (const relationships of this._reverseRelationshipIndex.get(current.identity)?.values() ?? []) {
        for (const rel of relationships) {
          const from = rel.fromIdentity ?? rel.fromId;
          const to = rel.targetIdentity ?? rel.targetId;
          const edgeKey = `${from}|${to}|${rel.type}`;
          if (!seenEdges.has(edgeKey)) { edges.push({ from, to, label: rel.type, relationship: rel }); seenEdges.add(edgeKey); }
          if (!visited.has(from)) { visited.add(from); queue.push({ identity: from, dist: current.dist + 1 }); }
        }
      }
    }
    const lines = ["digraph Traceability {", "  rankdir=LR;", '  node [shape=box, style="rounded,filled", fontname="Helvetica"];', '  edge [fontname="Helvetica", fontsize=10];'];
    for (const identity of visited) {
      const item = this._items.get(identity);
      if (!item) continue;
      const color = ROLE_COLORS[item.role] || "#AAAAAA";
      const label = `${item.id}\n${(item.title || "").substring(0, 40)}`;
      lines.push(`  "${identity}" [fillcolor="${color}", fontcolor=white, label="${label}"];`);
    }
    for (const edge of edges) {
      if (!visited.has(edge.from) || !visited.has(edge.to)) continue;
      const attrs = edge.relationship.bidirectional ? `label="${edge.label}", dir=both, style=dashed` : `label="${edge.label}"`;
      lines.push(`  "${edge.from}" -> "${edge.to}" [${attrs}];`);
    }
    lines.push("}");
    return lines.join("\n");
  }

  /**
   * Generate a Vega-Lite JSON spec for a coverage bar chart.
   * @param itemId If provided, shows per-relationship-type coverage for that item.
   *               If omitted, shows global coverage by role.
   */
  toVegaLite(itemId?: string): string {
    if (itemId) {
      return this._perItemVegaLite(itemId);
    }
    return this._globalVegaLite();
  }

  private _perItemVegaLite(itemId: string): string {
    const item = this.getItem(itemId);
    if (!item) return "";

    const rels = this._relationshipIndex.get(itemIdentity(item));
    const satisfiedTypes = new Set<string>();
    if (rels) {
      for (const type of rels.keys()) {
        satisfiedTypes.add(type);
      }
    }

    // Determine expected relation types for this item's role
    const expectedTypes: string[] = [];
    if (this._configLoader) {
      const config = this._configLoader.getConfig();
      const roleRelations = config.relations?.[item.role] || {};
      for (const typeMap of Object.values(roleRelations)) {
        for (const t of Object.keys(typeMap)) {
          if (!expectedTypes.includes(t)) expectedTypes.push(t);
        }
      }
    }

    const allTypes =
      expectedTypes.length > 0 ? expectedTypes : [...satisfiedTypes];
    const values = allTypes.map((t) => ({
      "Relation Type": t,
      Status: satisfiedTypes.has(t) ? "Satisfied" : "Missing",
    }));

    return JSON.stringify(
      {
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
      },
      null,
      2,
    );
  }

  private _globalVegaLite(): string {
    const stats = this.getRoleStatistics();
    const values: Array<Record<string, string | number>> = [];
    for (const [role, count] of Object.entries(stats)) {
      if (typeof count === "number") {
        values.push({ Role: role, Count: count });
      }
    }

    return JSON.stringify(
      {
        $schema: "https://vega.github.io/schema/vega-lite/v5.json",
        title: "Items by Role",
        data: { values },
        mark: "bar",
        encoding: {
          x: { field: "Role", type: "nominal" },
          y: { field: "Count", type: "quantitative" },
          color: { field: "Role", type: "nominal" },
        },
      },
      null,
      2,
    );
  }

  /**
   * Get the next available ID for a given prefix.
   * Scans existing IDs matching `<prefix>-NNN`, finds the highest numeric suffix,
   * and returns `<prefix>-<max+1>` with padding matching the existing convention.
   * Defaults to 3-digit padding when no existing IDs are found.
   */
  getNextId(prefix: string): string {
    const regex = new RegExp(`^${prefix}-(\\d+)$`);
    let maxNum = 0;
    let padWidth = 3;
    for (const id of this._items.keys()) {
      const m = regex.exec(id);
      if (m) {
        const num = parseInt(m[1], 10);
        if (num > maxNum) maxNum = num;
        padWidth = m[1].length;
      }
    }
    const next = maxNum + 1;
    return `${prefix}-${String(next).padStart(padWidth, "0")}`;
  }

  /**
   * Compute the next numeric ID (max+1) and padding width for every prefix
   * present in the graph. Returns `prefix -> { start, width }` where `start`
   * is the numeric next value — never the current maximum, never a formatted
   * ID string. Used to seed the remote ID allocation server.
   */
  getPrefixMaxima(): Map<string, { start: number; width: number }> {
    const maxima = new Map<string, { start: number; width: number }>();
    for (const { id } of this._items.values()) {
      const m = /^(.*)-(\d+)$/.exec(id);
      if (!m) continue;
      const prefix = m[1];
      const num = parseInt(m[2], 10);
      const width = m[2].length;
      const existing = maxima.get(prefix);
      if (existing) {
        if (num + 1 > existing.start) existing.start = num + 1;
        if (width > existing.width) existing.width = width;
      } else {
        maxima.set(prefix, { start: num + 1, width });
      }
    }
    return maxima;
  }

  // ========================================================================
  // Private Index Management
  // ========================================================================

  /**
   * Update the relationship index for fast queries
   */
  private _updateRelationshipIndex(relationship: ItemRelationship): void {
    const from = relationship.fromIdentity ?? relationship.fromId;
    const target = relationship.targetIdentity ?? relationship.targetId;
    if (!this._relationshipIndex.has(from)) this._relationshipIndex.set(from, new Map());
    const fromIndex = this._relationshipIndex.get(from)!;
    if (!fromIndex.has(relationship.type)) fromIndex.set(relationship.type, []);
    fromIndex.get(relationship.type)!.push(relationship);
    if (!this._reverseRelationshipIndex.has(target)) this._reverseRelationshipIndex.set(target, new Map());
    const targetIndex = this._reverseRelationshipIndex.get(target)!;
    if (!targetIndex.has(relationship.type)) targetIndex.set(relationship.type, []);
    targetIndex.get(relationship.type)!.push(relationship);
  }
}
