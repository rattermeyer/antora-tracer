#!/usr/bin/env node
// Check that the release is internally consistent across package.json,
// git tags, maintenance branches, the CI playbook refs, and the changelog.
//
// Usage:
//   node scripts/release-check.js
//
// Exit code: 0 = consistent, 1 = one or more inconsistencies found.
//
// This checker only reads; it never modifies files or git refs.

import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { checkConsistency, gatherState } from "../lib/src/release-check.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const findings = checkConsistency(gatherState(ROOT));
if (findings.length > 0) {
  for (const f of findings) console.error(`\u2716 ${f}`);
  process.exit(1);
}
console.log("\u2713 release consistent");
