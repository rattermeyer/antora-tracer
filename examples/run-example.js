#!/usr/bin/env node
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
/**
 * Self-traceability example runner
 * Processes all example files together and generates traceability output
 *
 * Usage: node examples/run-example.js
 */
import {
  ConfigLoader,
  RequirementsTraceabilityExtension,
} from "../lib/src/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = resolve(__dirname, "modules/ROOT/pages");
const outputDir = resolve(__dirname, "modules/ROOT/attachments/traceability");

// Load custom config
const configLoader = new ConfigLoader();
configLoader.load(resolve(__dirname, "traceability.yml"));

// Process all example files
const extension = new RequirementsTraceabilityExtension(configLoader);
const files = ["requirements.adoc", "architecture.adoc", "test-plan.adoc", "quality/zero-operational-overhead.adoc", "quality/configurable-without-code.adoc", "quality/fail-fast-diagnostics.adoc", "quality/no-side-effects.adoc", "quality/testability-by-design.adoc", "quality/pdf-compatibility.adoc"];
const results = extension.processFiles(
  files.map((f) => ({
    path: f,
    content: readFileSync(resolve(pagesDir, f), "utf8"),
  })),
);

// Print summary
console.log(`\nProcessed ${files.length} files:`);
for (const r of results.fileResults) {
  console.log(
    `  ${r.file}: ${r.items} items, ${r.relationships} relationships`,
  );
}
console.log(
  `\nTotal: ${results.result.items.length} items, ${results.result.relationships.length} relationships`,
);

// Role statistics
const stats = extension.getRoleStatistics();
console.log("\nItems by role:");
for (const [role, count] of Object.entries(stats)) {
  console.log(`  ${role}: ${count}`);
}

// Validation
const validation = extension.validate();
console.log(
  `\nValidation: ${validation.errors.length} errors, ${validation.warnings.length} warnings`,
);

// Generate matrix and exports
const { MatrixGenerator } = await import("../lib/src/MatrixGenerator.js");
const { Neo4jExporter } = await import("../lib/src/Neo4jExporter.js");
const { LinkResolver } = await import("../lib/src/LinkResolver.js");

mkdirSync(outputDir, { recursive: true });

// Create LinkResolver for Antora output context (matrices in _attachments/, pages at component root)
const linkResolver = new LinkResolver({ relativePathPrefix: "../../" });
const matrixGen = new MatrixGenerator(extension.graph, configLoader, {
  linkResolver,
});

const matrixNames = configLoader.getConfig().matrices.map(m => m.name);
for (const matrixName of matrixNames) {
  const matrix = matrixGen.generateMatrix(matrixName);

  // CSV
  writeFileSync(
    resolve(outputDir, `matrix-${matrixName}.csv`),
    matrixGen.exportToCSV(matrix),
  );
  console.log(`CSV:  output/matrix-${matrixName}.csv`);

  // HTML
  const html = matrixGen.exportToHTML(matrix);
  writeFileSync(resolve(outputDir, `matrix-${matrixName}.html`), html);
  console.log(`HTML:  output/matrix-${matrixName}.html`);

  // Coverage
  const cov = matrix.coverage;
  console.log(
    `${matrixName}: ${cov.overall.toFixed(1)}% overall (${cov.complete} complete, ${cov.partial} partial, ${cov.missing} missing)`,
  );
}

// Neo4j
const neo4j = new Neo4jExporter(extension.graph);
const neo4jResult = neo4j.export({
  outputDir,
  format: "csv",
  includeContent: true,
  includeAllAttributes: true,
});
console.log(
  `Neo4j CSV: ${neo4jResult.nodeCount} nodes, ${neo4jResult.relationshipCount} relationships`,
);
