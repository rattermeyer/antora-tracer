/**
 * Graph diff — derive a delta between two graph snapshots by stable item ID.
 * Config-agnostic: the diff keys off IDs only and never hardcodes a role name.
 *
 * Items are matched by component-qualified identity (component + version, when
 * present, then ID); items without a component fall back to bare ID so the
 * single-repo CLI `diff` path is unchanged.
 */

import type { TraceabilityGraph } from "./TraceabilityGraph.js";
import type { Item, ItemRelationship } from "./types.js";
import { HISTORY_RELATION_TYPES } from "./types.js";
import type { GraphSnapshot } from "./GraphSnapshot.js";

export type ItemChangeKind = "added" | "removed" | "modified";

/**
 * A single item-level change.
 */
export interface ItemDelta {
  id: string;
  kind: ItemChangeKind;
  role: string;
  /** Present for removed and modified items. */
  old?: Item;
  /** Present for added and modified items. */
  new?: Item;
  /** Field names that differ, for modified items. */
  changedFields: string[];
}

/**
 * A single relationship-level change, reported only for surviving items.
 */
export interface RelationshipDelta {
  kind: "added" | "removed";
  rel: ItemRelationship;
}

/**
 * The result of diffing two graph snapshots.
 */
export interface GraphDiff {
  items: ItemDelta[];
  relationships: RelationshipDelta[];
}

const COMPARED_FIELDS = [
  "title",
  "content",
  "role",
  "status",
  "attributes",
] as const;

// NUL cannot appear in an item ID or component/version name, so it is a safe
// separator for a composite identity key.
const KEY_SEP = "\u0000";

/**
 * Component-qualified identity. Items without a component (the single-repo CLI
 * path) keep their bare ID as the key.
 */
function identityKey(item: Item): string {
  if (item.component == null) return item.id;
  return [item.component, item.version ?? "", item.id].join(KEY_SEP);
}

function canonicalAttributes(attributes?: Record<string, string>): string {
  return JSON.stringify(Object.entries(attributes ?? {}).sort());
}

function fieldsChanged(oldItem: Item, newItem: Item): string[] {
  const changed: string[] = [];
  for (const field of COMPARED_FIELDS) {
    if (field === "attributes") {
      if (
        canonicalAttributes(oldItem.attributes) !==
        canonicalAttributes(newItem.attributes)
      ) {
        changed.push(field);
      }
    } else if (oldItem[field] !== newItem[field]) {
      changed.push(field);
    }
  }
  return changed;
}

function relKey(rel: ItemRelationship): string {
  return `${rel.fromId}|${rel.type}|${rel.targetId}`;
}

/**
 * Core diff over raw item/relationship lists.
 */
function diffData(
  prevItems: Item[],
  prevRels: ItemRelationship[],
  nextItems: Item[],
  nextRels: ItemRelationship[],
): GraphDiff {
  const oldById = new Map(prevItems.map((i) => [identityKey(i), i]));
  const newById = new Map(nextItems.map((i) => [identityKey(i), i]));

  const items: ItemDelta[] = [];

  for (const item of nextItems) {
    if (!oldById.has(identityKey(item))) {
      items.push({
        id: item.id,
        kind: "added",
        role: item.role,
        new: item,
        changedFields: [],
      });
    }
  }

  for (const item of prevItems) {
    if (!newById.has(identityKey(item))) {
      items.push({
        id: item.id,
        kind: "removed",
        role: item.role,
        old: item,
        changedFields: [],
      });
    }
  }

  for (const [key, oldItem] of oldById) {
    const newItem = newById.get(key);
    if (!newItem) continue;
    const changed = fieldsChanged(oldItem, newItem);
    if (changed.length > 0) {
      items.push({
        id: oldItem.id,
        kind: "modified",
        role: newItem.role,
        old: oldItem,
        new: newItem,
        changedFields: changed,
      });
    }
  }

  // Relationship deltas: functional links are reported only when their
  // endpoints survive; history links (`supersedes`) are always reported so a
  // superseded predecessor's removal is explained.
  // ponytail: relationships carry bare fromId/targetId, so survival and dedup
  // key off bare IDs. Same-ID items across components with identical links
  // collapse here — qualify relKey from the source item's component if that
  // ceiling ever matters.
  const oldBareIds = new Set(prevItems.map((i) => i.id));
  const newBareIds = new Set(nextItems.map((i) => i.id));
  const surviving = new Set([...oldBareIds].filter((id) => newBareIds.has(id)));
  const oldRels = new Set(prevRels.map(relKey));
  const newRels = new Set(nextRels.map(relKey));

  const relationships: RelationshipDelta[] = [];
  for (const rel of nextRels) {
    const isHistory = HISTORY_RELATION_TYPES.has(rel.type);
    if (!oldRels.has(relKey(rel)) && (surviving.has(rel.fromId) || isHistory)) {
      relationships.push({ kind: "added", rel });
    }
  }
  for (const rel of prevRels) {
    if (
      !newRels.has(relKey(rel)) &&
      surviving.has(rel.fromId) &&
      surviving.has(rel.targetId)
    ) {
      relationships.push({ kind: "removed", rel });
    }
  }

  return { items, relationships };
}

/**
 * Compare two graphs and return the delta between them.
 */
export function diffGraphs(
  prev: TraceabilityGraph,
  next: TraceabilityGraph,
): GraphDiff {
  return diffData(
    prev.getAllItems(),
    prev.getAllRelationships(),
    next.getAllItems(),
    next.getAllRelationships(),
  );
}

/**
 * Compare two JSON snapshots (already loaded) and return the delta between
 * them, without reconstructing a `TraceabilityGraph`.
 */
export function diffSnapshots(
  prev: GraphSnapshot,
  next: GraphSnapshot,
): GraphDiff {
  return diffData(
    prev.items,
    prev.relationships,
    next.items,
    next.relationships,
  );
}
