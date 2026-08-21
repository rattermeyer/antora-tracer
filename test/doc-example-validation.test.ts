import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import { expect } from "chai";
import { ConfigLoader } from "../src/config/TraceabilityConfig.js";
import { DocumentParser } from "../src/DocumentParser.js";

/**
 * Doc example validation
 *
 * Extracts the `[item]` examples shown in prose documentation pages
 * (tutorial, how-to, reference, explanation) and validates them against the
 * example traceability configuration. Examples using angle-bracket
 * placeholders (abstract syntax) are skipped.
 */

const REPO_ROOT = join(__dirname, "..", "..");
const PAGES_ROOT = join(
  REPO_ROOT,
  "examples",
  "tracer",
  "modules",
  "ROOT",
  "pages",
);
const PROSE_DIRS = ["tutorial", "how-to", "reference", "explanation"];
const CONFIG_PATH = join(REPO_ROOT, "examples", "traceability.yml");

/** Pages that intentionally show invalid examples (teaching the failure case). */
const EXCLUDED_FILES = new Set(["how-to/detect-duplicate-ids.adoc"]);

function collectAdocFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...collectAdocFiles(full));
    else if (entry.name.endsWith(".adoc")) out.push(full);
  }
  return out;
}

/** Extract the inner content of `[source,asciidoc]` code blocks. */
function extractSourceBlocks(content: string): string[] {
  const blocks: string[] = [];
  const regex = /\[source,asciidoc\]\s*\r?\n----\r?\n([\s\S]*?)\r?\n----/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(content)) !== null) blocks.push(m[1]);
  return blocks;
}

describe("Doc examples validate against the traceability config", () => {
  it("all [item] examples use known roles and allowed relations", () => {
    const configLoader = new ConfigLoader();
    configLoader.load(CONFIG_PATH);
    const parser = new DocumentParser({ configLoader });

    const errors: string[] = [];

    for (const dir of PROSE_DIRS) {
      for (const file of collectAdocFiles(join(PAGES_ROOT, dir))) {
        const rel = relative(PAGES_ROOT, file);
        if (EXCLUDED_FILES.has(rel)) continue;
        const content = readFileSync(file, "utf8");

        for (const block of extractSourceBlocks(content)) {
          // Skip abstract syntax examples using angle-bracket placeholders.
          if (/<[a-z_-]+>/.test(block)) continue;

          // Trailing newline so the parser finds the closing delimiter.
          const parsed = parser.parse(`${block}\n`, file);
          const itemById = new Map(parsed.items.map((it) => [it.id, it]));

          for (const w of parsed.warnings) {
            if (w.type === "unknown_role" || w.type === "missing_role") {
              errors.push(`${rel}: ${w.message}`);
            }
          }

          for (const r of parsed.relationships) {
            const from = itemById.get(r.fromId);
            const to = itemById.get(r.targetId);
            // Partial snippets (target defined elsewhere) can't be checked.
            if (!from || !to) continue;
            if (!configLoader.isRelationAllowed(from.role, to.role, r.type)) {
              errors.push(
                `${rel}: "${r.fromId}" ${r.type} "${r.targetId}" not allowed (${from.role} -> ${to.role})`,
              );
            }
          }

          for (const e of parsed.errors) {
            errors.push(`${rel}: parse error: ${e.message}`);
          }
        }
      }
    }

    expect(errors, `Doc examples are invalid:\n${errors.join("\n")}`).to.be
      .empty;
  });
});
