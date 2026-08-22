/**
 * Graph diff — derive a delta between two graph snapshots by stable item ID.
 * Config-agnostic: the diff keys off IDs only and never hardcodes a role name.
 */

import type { TraceabilityGraph } from "./TraceabilityGraph.js";
import type { Item, ItemRelationship } from "./types.js";
import { HISTORY_RELATION_TYPES } from "./types.js";

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
 * Compare two graphs and return the delta between them.
 *
 * Items are matched by stable ID: present only in `next` are added, present
 * only in `prev` are removed, and surviving items are compared field-by-field
 * for modification. Relationship changes are reported only when both
 * endpoints survive the diff.
 */
export function diffGraphs(
  prev: TraceabilityGraph,
  next: TraceabilityGraph,
): GraphDiff {
  const oldById = new Map(prev.getAllItems().map((i) => [i.id, i]));
  const newById = new Map(next.getAllItems().map((i) => [i.id, i]));

  const items: ItemDelta[] = [];

  for (const item of next.getAllItems()) {
    if (!oldById.has(item.id)) {
      items.push({
        id: item.id,
        kind: "added",
        role: item.role,
        new: item,
        changedFields: [],
      });
    }
  }

  for (const item of prev.getAllItems()) {
    if (!newById.has(item.id)) {
      items.push({
        id: item.id,
        kind: "removed",
        role: item.role,
        old: item,
        changedFields: [],
      });
    }
  }

  for (const [id, oldItem] of oldById) {
    const newItem = newById.get(id);
    if (!newItem) continue;
    const changed = fieldsChanged(oldItem, newItem);
    if (changed.length > 0) {
      items.push({
        id,
        kind: "modified",
        role: newItem.role,
        old: oldItem,
        new: newItem,
        changedFields: changed,
      });
    }
  }

  // Relationship deltas: functional links are reported only when their
  // source survives the diff; history links (`supersedes`) are always
  // reported so a superseded predecessor's removal is explained.
  const surviving = new Set(
    [...oldById.keys()].filter((id) => newById.has(id)),
  );
  const oldRels = new Set(prev.getAllRelationships().map(relKey));
  const newRels = new Set(next.getAllRelationships().map(relKey));

  const relationships: RelationshipDelta[] = [];
  for (const rel of next.getAllRelationships()) {
    const isHistory = HISTORY_RELATION_TYPES.has(rel.type);
    if (!oldRels.has(relKey(rel)) && (surviving.has(rel.fromId) || isHistory)) {
      relationships.push({ kind: "added", rel });
    }
  }
  for (const rel of prev.getAllRelationships()) {
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
