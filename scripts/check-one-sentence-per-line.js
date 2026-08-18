#!/usr/bin/env node
// Check that AsciiDoc prose follows the "one sentence per line" rule.
// Reports file:line for any prose line containing more than one sentence.
//
// Usage:
//   node scripts/check-one-sentence-per-line.js [dir]
//
// dir is resolved relative to the repo root when relative, or taken as-is
// when absolute. Defaults to examples/tracer/modules.
//
// Exit code: 0 = clean, 1 = violations found.
//
// This is a heuristic checker: it skips code/source blocks, tables, and
// structural lines, and guards against abbreviations, initials, and inline
// code spans. It never modifies files.

import { readdirSync, readFileSync } from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const arg = process.argv[2];
const target = arg
  ? isAbsolute(arg)
    ? arg
    : join(ROOT, arg)
  : join(ROOT, "examples", "tracer", "modules");

// A sentence-ending period must not follow a known abbreviation.
const ABBREVIATIONS = new Set([
  "e.g",
  "i.e",
  "etc",
  "vs",
  "fig",
  "no",
  "vol",
  "pp",
  "approx",
  "dept",
  "est",
  "min",
  "max",
  "dr",
  "mr",
  "ms",
  "mrs",
  "prof",
  "st",
  "ref",
  "cf",
  "al",
  "inc",
  "corp",
  "ca",
  "op",
  "a.m",
  "p.m",
  "w.r.t",
  "ibid",
  "n.d",
]);

function isSentenceBoundary(line, pos) {
  // Period inside an inline code span (odd backtick count before it).
  let backticks = 0;
  for (let i = 0; i < pos; i++) if (line[i] === "`") backticks++;
  if (backticks % 2 === 1) return false;
  // Single capital initial, e.g. "J. Smith".
  if (
    pos >= 1 &&
    /[A-Z]/.test(line[pos - 1]) &&
    (pos === 1 || /\s/.test(line[pos - 2]))
  )
    return false;
  // Known abbreviation as a complete token immediately before the period.
  let j = pos - 1;
  while (j >= 0 && /[A-Za-z.]/.test(line[j])) j--;
  if (ABBREVIATIONS.has(line.slice(j + 1, pos).toLowerCase())) return false;
  return true;
}

function isProseLine(trimmed) {
  return !(
    trimmed.startsWith("=") ||
    trimmed.startsWith(":") ||
    trimmed.startsWith("//") ||
    trimmed.startsWith("|") ||
    trimmed.startsWith("[") ||
    trimmed.startsWith("* ") ||
    trimmed.startsWith("- ") ||
    trimmed.startsWith(". ") ||
    /^\.\w/.test(trimmed) ||
    trimmed.startsWith("+") ||
    /^<[0-9]+>/.test(trimmed) ||
    trimmed.startsWith("include::") ||
    trimmed.startsWith("image::") ||
    trimmed.startsWith("xref:") ||
    trimmed.startsWith("link:")
  );
}

function checkFile(file) {
  const lines = readFileSync(file, "utf8").split("\n");
  const violations = [];
  let inBlock = false;
  let inTable = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (/^(----|\.\.\.\.)$/.test(trimmed)) {
      inBlock = !inBlock;
      continue;
    }
    if (trimmed.startsWith("|===")) {
      inTable = !inTable;
      continue;
    }
    if (inBlock || inTable) continue;
    if (!trimmed || /^\s/.test(line) || !isProseLine(trimmed)) continue;
    for (const m of line.matchAll(/[.!?]\s+(?=[A-Z])/g)) {
      if (isSentenceBoundary(line, m.index)) {
        violations.push({ line: i + 1, text: trimmed });
        break;
      }
    }
  }
  return violations;
}

function* walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p);
    else if (entry.name.endsWith(".adoc")) yield p;
  }
}

let total = 0;
for (const file of walk(target)) {
  for (const v of checkFile(file)) {
    total++;
    console.log(`${file}:${v.line}: ${v.text.slice(0, 100)}`);
  }
}

if (total > 0) {
  console.log(`\n${total} line(s) with more than one sentence.`);
  process.exitCode = 1;
} else {
  console.log("All prose lines follow one-sentence-per-line.");
}
