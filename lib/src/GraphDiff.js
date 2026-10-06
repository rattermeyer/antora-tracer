/**
 * Graph diff — derive a delta between two graph snapshots by stable item ID.
 * Config-agnostic: the diff keys off IDs only and never hardcodes a role name.
 *
 * Items are matched by component-qualified identity (component + version, when
 * present, then ID); items without a component fall back to bare ID so the
 * single-repo CLI `diff` path is unchanged.
 */
import { HISTORY_RELATION_TYPES, itemIdentity } from "./types.js";
const COMPARED_FIELDS = [
    "title",
    "content",
    "role",
    "status",
    "tags",
    "attributes",
];
// NUL cannot appear in an item ID or component/version name, so it is a safe
// separator for a composite identity key.
/**
 * Component-qualified identity. Items without a component (the single-repo CLI
 * path) keep their bare ID as the key.
 */
function identityKey(item) {
    return itemIdentity(item);
}
function canonicalAttributes(attributes) {
    return JSON.stringify(Object.entries(attributes ?? {}).sort());
}
function fieldsChanged(oldItem, newItem) {
    const changed = [];
    for (const field of COMPARED_FIELDS) {
        if (field === "attributes") {
            if (canonicalAttributes(oldItem.attributes) !==
                canonicalAttributes(newItem.attributes)) {
                changed.push(field);
            }
        }
        else if (field === "tags") {
            if (JSON.stringify(oldItem.tags ?? []) !==
                JSON.stringify(newItem.tags ?? [])) {
                changed.push(field);
            }
        }
        else if (oldItem[field] !== newItem[field]) {
            changed.push(field);
        }
    }
    return changed;
}
function relKey(rel) {
    return `${rel.fromIdentity ?? rel.fromId}|${rel.type}|${rel.targetIdentity ?? rel.targetId}`;
}
/**
 * Core diff over raw item/relationship lists.
 */
function diffData(prevItems, prevRels, nextItems, nextRels) {
    const oldById = new Map(prevItems.map((i) => [identityKey(i), i]));
    const newById = new Map(nextItems.map((i) => [identityKey(i), i]));
    const items = [];
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
        if (!newItem)
            continue;
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
    // Relationship deltas use canonical endpoints when a graph has resolved scope.
    const oldItemIdentities = new Set(prevItems.map(identityKey));
    const newItemIdentities = new Set(nextItems.map(identityKey));
    const surviving = new Set([...oldItemIdentities].filter((id) => newItemIdentities.has(id)));
    const oldRels = new Set(prevRels.map(relKey));
    const newRels = new Set(nextRels.map(relKey));
    const relationships = [];
    for (const rel of nextRels) {
        const isHistory = HISTORY_RELATION_TYPES.has(rel.type);
        if (!oldRels.has(relKey(rel)) && (surviving.has(rel.fromIdentity ?? rel.fromId) || isHistory)) {
            relationships.push({ kind: "added", rel });
        }
    }
    for (const rel of prevRels) {
        if (!newRels.has(relKey(rel)) &&
            surviving.has(rel.fromIdentity ?? rel.fromId) &&
            surviving.has(rel.targetIdentity ?? rel.targetId)) {
            relationships.push({ kind: "removed", rel });
        }
    }
    return { items, relationships };
}
/**
 * Compare two graphs and return the delta between them.
 */
export function diffGraphs(prev, next) {
    return diffData(prev.getAllItems(), prev.getAllRelationships(), next.getAllItems(), next.getAllRelationships());
}
/**
 * Compare two JSON snapshots (already loaded) and return the delta between
 * them, without reconstructing a `TraceabilityGraph`.
 */
export function diffSnapshots(prev, next) {
    return diffData(prev.items, prev.relationships, next.items, next.relationships);
}
