#!/usr/bin/env node
// Verifies that the test count declared on the landing page matches the
// actual passing test count, so the number cannot drift silently.
//
// The docs build (generate-landing-stats.js) must not run the test suite,
// so it only carries the declared value through. This checker runs the
// suite's summary instead and fails when the declared number is stale.
//
// Usage: node scripts/check-landing-stats.js
// Exit code: 0 = declared count is current, 1 = stale (prints the fix).

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const landing = readFileSync(resolve("landing/index.html"), "utf8");
const declared =
  (/data-stat="tests"[^>]*>(\d+)</.exec(landing) ?? [])[1] ?? null;

if (!declared) {
  console.error("✖ landing page has no data-stat=\"tests\" element");
  process.exit(1);
}

// Count actual passing tests from the compiled suite without running it:
// mocha's summary is the source of truth, so run it and read the count.
const res = spawnSync(
  process.execPath,
  [
    "--import=tsx/cjs",
    "node_modules/mocha/bin/mocha",
    "lib/test/**/*.test.js",
  ],
  { encoding: "utf8", cwd: process.cwd() },
);
const actual =
  (/(\d+) passing/.exec(res.stdout ?? "") ?? [])[1] ?? null;

if (!actual) {
  console.error("✖ could not determine passing test count");
  console.error(
    "  The suite is read from lib/test/**/*.test.js — compile it first:",
  );
  console.error("    pnpm exec tsc -p tsconfig.test.json");
  if (res.stderr) console.error(res.stderr.split("\n").slice(-5).join("\n"));
  process.exit(1);
}

if (declared !== actual) {
  console.error(
    `✖ landing page declares ${declared} passing tests, actual is ${actual}.` +
      `\n  Fix: update the data-stat="tests" number in landing/index.html to ${actual}.`,
  );
  process.exit(1);
}
console.log(`✓ landing test count current (${actual} passing)`);
