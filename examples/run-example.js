#!/usr/bin/env node
/**
 * Self-traceability example runner
 * Processes all example files together and generates traceability output
 *
 * Usage: node examples/run-example.js
 */
import { RequirementsTraceabilityExtension, ConfigLoader } from '../lib/src/index.js';
import { writeFileSync, mkdirSync } from 'fs';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pagesDir = resolve(__dirname, 'modules/ROOT/pages');
const outputDir = resolve(__dirname, 'modules/ROOT/attachments/traceability');

// Load custom config
const configLoader = new ConfigLoader();
configLoader.load(resolve(__dirname, 'traceability.yml'));

// Process all example files
const extension = new RequirementsTraceabilityExtension(configLoader);
const files = ['requirements.adoc', 'architecture.adoc', 'test-plan.adoc'];
const results = extension.processFiles(
  files.map(f => ({
    path: f,
    content: readFileSync(resolve(pagesDir, f), 'utf8'),
  }))
);

// Print summary
console.log(`\nProcessed ${files.length} files:`);
for (const r of results.fileResults) {
  console.log(`  ${r.file}: ${r.items} items, ${r.relationships} relationships`);
}
console.log(`\nTotal: ${results.result.items.length} items, ${results.result.relationships.length} relationships`);

// Role statistics
const stats = extension.getRoleStatistics();
console.log('\nItems by role:');
for (const [role, count] of Object.entries(stats)) {
  console.log(`  ${role}: ${count}`);
}

// Validation
const validation = extension.validate();
console.log(`\nValidation: ${validation.errors.length} errors, ${validation.warnings.length} warnings`);

// Generate matrix and exports
const { MatrixGenerator } = await import('../lib/src/MatrixGenerator.js');
const { Neo4jExporter } = await import('../lib/src/Neo4jExporter.js');

mkdirSync(outputDir, { recursive: true });

const matrixGen = new MatrixGenerator(extension.graph, configLoader);

for (const matrixName of ['requirements-architecture', 'requirements-tests']) {
  const matrix = matrixGen.generateMatrix(matrixName);

  // CSV
  writeFileSync(resolve(outputDir, `matrix-${matrixName}.csv`), matrixGen.exportToCSV(matrix));
  console.log(`CSV:  output/matrix-${matrixName}.csv`);

  // HTML
  const html = matrixGen.exportToHTML(matrix);
  writeFileSync(resolve(outputDir, `matrix-${matrixName}.html`), html);
  console.log(`HTML:  output/matrix-${matrixName}.html`);

  // Coverage
  const cov = matrix.coverage;
  console.log(`${matrixName}: ${cov.overall.toFixed(1)}% overall (${cov.complete} complete, ${cov.partial} partial, ${cov.missing} missing)`);
}

// Neo4j
const neo4j = new Neo4jExporter(extension.graph);
const neo4jResult = neo4j.export({ outputDir, format: 'csv', includeContent: true, includeAllAttributes: true });
console.log(`Neo4j CSV: ${neo4jResult.nodeCount} nodes, ${neo4jResult.relationshipCount} relationships`);
