import { Buffer } from "node:buffer";

import type {
  LinkDisplayItemMatcher,
  LinkDisplayPolicy,
} from "./config/TraceabilityConfig.js";
import type { Item } from "./types.js";

/** Encodes arbitrary policy names for use in AsciiDoc selector attributes. */
export function linkDisplayPolicyKey(name: string): string {
  return Buffer.from(name, "utf8").toString("hex");
}

export function shouldHideRelationship(
  policy: LinkDisplayPolicy | undefined,
  relationType: string,
  currentItem: Item,
  relatedItem: Item,
): boolean {
  if (!policy) return false;

  for (const rule of policy.hide) {
    if (
      rule.relation === relationType &&
      matchesItem(rule.currentItem, currentItem) &&
      matchesItem(rule.relatedItem, relatedItem)
    ) {
      return true;
    }
  }

  return false;
}

function matchesItem(matcher: LinkDisplayItemMatcher, item: Item): boolean {
  if (matcher.role !== undefined && matcher.role !== item.role) return false;

  if (matcher.attributes) {
    for (const key in matcher.attributes) {
      if (
        Object.hasOwn(matcher.attributes, key) &&
        item.attributes[key] !== matcher.attributes[key]
      ) {
        return false;
      }
    }
  }

  return true;
}
