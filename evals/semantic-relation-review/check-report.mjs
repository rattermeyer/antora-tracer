#!/usr/bin/env node
/** Deterministic checks for report consent and plain AsciiDoc safety. */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("../..", import.meta.url)));
const cases = JSON.parse(
  readFileSync(new URL("cases.json", import.meta.url), "utf8"),
).cases;
const skill = readFileSync(
  resolve(root, "skills/semantic-relation-review/SKILL.md"),
  "utf8",
);

const runner = readFileSync(new URL("run.mjs", import.meta.url), "utf8");
assert.doesNotMatch(
  runner,
  /writeFileSync|writeFile\(/,
  "eval runner must not create the report it is evaluating",
);
assert.match(
  skill,
  /Do not offer the report until the findings have been presented and discussed/,
);
assert.match(
  skill,
  /Wait for explicit acknowledgement and destination confirmation/,
);
assert.match(
  skill,
  /If a file already exists there, ask before overwriting it/,
);
assert.match(skill, /no `\[item\]` block macros, no relationship macros/);

for (const id of [
  "report-declined",
  "report-needs-destination",
  "report-antora-destination-warning",
]) {
  const testCase = cases.find((candidate) => candidate.id === id);
  assert.ok(testCase, `missing ${id}`);
  assert.notEqual(testCase.expected_report_decision, "create");
}

const confirmed = cases.find(
  (candidate) => candidate.id === "report-confirmed-plain-adoc",
);
assert.equal(confirmed.expected_report_decision, "create");
assert.ok(confirmed.expected_report_path);

const safeReport = `= Relation Review\n\n${confirmed.expected_report_path}\n\n* HIGH — ARC-902 → addresses → REQ-902\n`;
assert.doesNotMatch(
  safeReport,
  /\[#?[^\]]*,\s*item\b|(?:^|\n)[a-z][a-z0-9_-]*:[A-Z0-9_-]+\[\]/m,
);

console.log("Report consent contract checks passed");
