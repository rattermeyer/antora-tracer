#!/usr/bin/env node

import { program } from 'commander';
import { createWriteStream, writeFileSync, mkdirSync } from 'fs';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';

// Import both v1 and v2 extensions
import { RequirementsTraceabilityExtension } from './index.js';
import {
  RequirementsTraceabilityExtensionV2,
  ConfigLoader,
  BUILT_IN_PRESETS,
} from './index-v2.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, '../package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));

// Global options
program
  .name('antora-req-trace')
  .description('Antora Requirements Traceability Extension - Trace requirements, designs, implementations, and tests')
  .version(packageJson.version)
  .option('--v2', 'Use v2.0 unified item architecture')
  .option('--config <path>', 'Path to traceability configuration file (v2 only)')
  .option('--preset <name>', 'Use a built-in preset: ' + BUILT_IN_PRESETS.join(', '), 'requirements-engineering');

// Helper to create the appropriate extension based on options
async function createExtension(options: any) {
  const globalOpts = program.opts();
  const mergedOptions = { ...options, ...globalOpts };

  if (mergedOptions.v2 || mergedOptions.config || mergedOptions.preset) {
    try {
      if (mergedOptions.preset) {
        return await RequirementsTraceabilityExtensionV2.createWithPreset(mergedOptions.preset);
      } else if (mergedOptions.config) {
        const configLoader = new ConfigLoader();
        configLoader.load(mergedOptions.config);
        return new RequirementsTraceabilityExtensionV2(configLoader);
      } else {
        return new RequirementsTraceabilityExtensionV2();
      }
    } catch (error: any) {
      console.error(chalk.red('Error creating v2 extension:', error.message));
      console.error(chalk.yellow('Falling back to v1...'));
      return new RequirementsTraceabilityExtension();
    }
  }
  return new RequirementsTraceabilityExtension();
}

function ensureDirectory(dir: string) {
  const fullPath = resolve(process.cwd(), dir);
  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
}

program.command('process')
  .description('Process AsciiDoc files for requirements traceability')
  .option('-i, --input <path>', 'Input file or directory (required)')
  .option('-o, --output <path>', 'Output directory', './output')
  .option('-f, --format <format>', 'Output format (html, csv, json)', 'html')
  .action(async (options) => {
    console.log(chalk.blue('Processing requirements traceability...'));
    if (!options.input) {
      console.error(chalk.red('Error: Input file or directory is required'));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      const inputPath = resolve(process.cwd(), options.input);
      if (!existsSync(inputPath)) {
        console.error(chalk.red(`Error: Input file not found: ${inputPath}`));
        process.exit(1);
      }
      const content = readFileSync(inputPath, 'utf8');
      if (extension instanceof RequirementsTraceabilityExtensionV2) {
        console.log(chalk.cyan('Using v2.0 architecture...'));
        const result = extension.process(content, { sourceFile: options.input });
        console.log(chalk.green(`Processed: ${result.items.length} items, ${result.relationships.length} relationships`));
        let output: string;
        if (options.format === 'json') {
          output = JSON.stringify({ items: result.items, relationships: result.relationships, statistics: result.graph.getRoleStatistics() }, null, 2);
        } else if (options.format === 'csv') {
          const lines = ['id,role,title'];
          for (const item of result.items) {
            const escapedTitle = item.title.includes(',') ? `"${item.title}"` : item.title;
            lines.push([item.id, item.role, escapedTitle].join(','));
          }
          output = lines.join('\n');
        } else {
          output = '<!DOCTYPE html><html><head><title>Traceability Report</title></head><body><h1>Traceability Report</h1>';
          output += `<p>Items: ${result.items.length}, Relationships: ${result.relationships.length}</p><h2>Items</h2><table border="1"><tr><th>ID</th><th>Role</th><th>Title</th></tr>`;
          for (const item of result.items) {
            output += `<tr><td>${item.id}</td><td>${item.role}</td><td>${item.title}</td></tr>`;
          }
          output += '</table></body></html>';
        }
        ensureDirectory(options.output);
        const outputPath = resolve(options.output, 'traceability.' + options.format);
        const stream = createWriteStream(outputPath);
        stream.write(output);
        stream.end();
        console.log(chalk.green(`Output written to: ${outputPath}`));
      } else {
        console.log(chalk.yellow('Using v1 architecture (deprecated)...'));
        await extension.process(content, { sourceFile: options.input });
        let output: string;
        if (options.format === 'html') {
          output = extension.exportMatrixToHTML();
        } else if (options.format === 'csv') {
          output = extension.exportMatrixToCSV();
        } else {
          output = JSON.stringify({ requirements: extension.graph.getAllRequirements(), implementations: extension.graph.getAllImplementations(), tests: extension.graph.getAllTests() }, null, 2);
        }
        ensureDirectory(options.output);
        const outputPath = resolve(options.output, 'traceability.' + options.format);
        const stream = createWriteStream(outputPath);
        stream.write(output);
        stream.end();
        console.log(chalk.green(`Output written to: ${outputPath}`));
      }
    } catch (error: any) {
      console.error(chalk.red('Processing error:', error.message));
      process.exit(1);
    }
  });

program.command('matrix')
  .description('Generate traceability matrices')
  .option('-t, --type <type>', 'Matrix type or name')
  .option('-f, --format <format>', 'Output format (csv, html, json)', 'csv')
  .option('-o, --output <path>', 'Output file (defaults to stdout)')
  .action(async (options) => {
    console.log(chalk.blue('Generating traceability matrix...'));
    const extension = await createExtension(options);
    try {
      let output: string;
      if (extension instanceof RequirementsTraceabilityExtensionV2) {
        if (!extension.graph.size()) {
          console.error(chalk.red('Error: No data in graph. Process files first with: antora-req-trace process -i <file>'));
          process.exit(1);
        }
        const matrixName = options.type || 'default';
        const { MatrixGeneratorV2 } = await import('./MatrixGeneratorV2.js');
        const generator = new MatrixGeneratorV2(extension.graph, extension.configLoader);
        const matrix = generator.generateMatrix(matrixName);
        if (options.format === 'html') {
          output = generator.exportToHTML(matrix);
        } else if (options.format === 'json') {
          output = JSON.stringify(matrix, null, 2);
        } else {
          output = generator.exportToCSV(matrix);
        }
      } else {
        if (options.format === 'html') {
          output = extension.exportMatrixToHTML(options.type);
        } else if (options.format === 'json') {
          output = JSON.stringify(extension.generateDetailedMatrix(options.type), null, 2);
        } else {
          output = extension.exportMatrixToCSV(options.type);
        }
      }
      if (options.output) {
        ensureDirectory(dirname(options.output));
        const stream = createWriteStream(options.output);
        stream.write(output);
        stream.end();
        console.log(chalk.green(`Matrix written to: ${options.output}`));
      } else {
        console.log(output);
      }
    } catch (error: any) {
      console.error(chalk.red('Matrix generation error:', error.message));
      process.exit(1);
    }
  });

program.command('validate')
  .description('Validate requirements traceability')
  .option('-i, --input <path>', 'Input file or directory to validate')
  .action(async (options) => {
    console.log(chalk.blue('Validating requirements traceability...'));
    const extension = await createExtension(options);
    try {
      if (options.input) {
        const inputPath = resolve(process.cwd(), options.input);
        if (!existsSync(inputPath)) {
          console.error(chalk.red(`Error: Input file not found: ${inputPath}`));
          process.exit(1);
        }
        const content = readFileSync(inputPath, 'utf8');
        if (extension instanceof RequirementsTraceabilityExtensionV2) {
          const result = extension.process(content, { sourceFile: options.input });
          const validation = extension.graph.validate();
          if (validation.errors.length > 0) {
            console.log(chalk.red(`Validation Errors (${validation.errors.length}):`));
            for (const error of validation.errors) {
              console.log(chalk.red(`  - ${error}`));
            }
            process.exit(1);
          } else {
            console.log(chalk.green('No validation errors found'));
          }
          if (validation.warnings.length > 0) {
            console.log(chalk.yellow(`Warnings (${validation.warnings.length}):`));
            for (const warning of validation.warnings) {
              console.log(chalk.yellow(`  - ${warning.message}`));
            }
          }
          console.log(chalk.green(`Summary: ${result.items.length} items, ${result.relationships.length} relationships`));
        } else {
          await extension.process(content, { sourceFile: options.input });
          const errors = extension.validate();
          if (errors.length > 0) {
            console.log(chalk.red(`Validation Errors (${errors.length}):`));
            for (const error of errors) {
              console.log(chalk.red(`  - ${error}`));
            }
            process.exit(1);
          } else {
            console.log(chalk.green('No validation errors found'));
          }
        }
      } else {
        console.log(chalk.yellow('No input specified, validating current graph...'));
        console.log(chalk.yellow('Note: Graph is empty without processing files first'));
      }
    } catch (error: any) {
      console.error(chalk.red('Validation error:', error.message));
      process.exit(1);
    }
  });

const presetProgram = program.command('preset')
  .description('Manage traceability presets (v2 only)');

presetProgram.command('list')
  .description('List available built-in presets')
  .action(() => {
    console.log(chalk.blue('Available Presets:'));
    console.log('');
    const configLoader = new ConfigLoader();
    const presets = configLoader.listPresets();
    if (presets.length === 0) {
      console.log(chalk.yellow('No presets found'));
      process.exit(0);
    }
    for (const preset of presets) {
      console.log(chalk.green(`${preset.name}`));
      console.log(`  ${preset.description || 'No description'}`);
      console.log(`  v${preset.version}`);
      console.log('');
    }
    console.log(chalk.cyan('Usage: antora-req-trace process --preset <name> -i <file>'));
    console.log(chalk.cyan('       antora-req-trace preset show <name>'));
    console.log(chalk.cyan('       antora-req-trace preset init <name>'));
  });

presetProgram.command('show')
  .description('Show details of a preset')
  .arguments('<name>')
  .action((name: string) => {
    console.log(chalk.blue(`Preset: ${name}`));
    console.log('');
    try {
      const configLoader = new ConfigLoader();
      const preset = configLoader.loadPreset(name);
      console.log(chalk.green('Metadata:'));
      console.log(`  Name: ${preset.name}`);
      console.log(`  Description: ${preset.description || 'N/A'}`);
      console.log(`  Version: ${preset.version}`);
      console.log(`  Author: ${preset.author || 'N/A'}`);
      if (preset.tags && preset.tags.length > 0) {
        console.log(`  Tags: ${preset.tags.join(', ')}`);
      }
      console.log('');
      console.log(chalk.green('Configuration:'));
      console.log(`  Roles: ${preset.traceability.roles.join(', ')}`);
      console.log('');
      console.log(chalk.green('Relations:'));
      const relations = preset.traceability.relations || {};
      for (const [sourceRole, targets] of Object.entries(relations)) {
        console.log(`  ${sourceRole}:`);
        const targetsObj = targets as Record<string, string[]>;
        for (const [targetRole, relationTypes] of Object.entries(targetsObj)) {
          console.log(`    -> ${targetRole}: [${relationTypes.join(', ')}]`);
        }
      }
      console.log('');
      if (preset.traceability.matrices && preset.traceability.matrices.length > 0) {
        console.log(chalk.green('Matrices:'));
        for (const matrix of preset.traceability.matrices) {
          console.log(`  - ${matrix.name}: ${matrix.rows} -> [${matrix.columns.join(', ')}]`);
        }
        console.log('');
      }
      if (preset.neo4j && preset.neo4j.queries && preset.neo4j.queries.length > 0) {
        console.log(chalk.green('Neo4j Queries:'));
        for (const query of preset.neo4j.queries) {
          console.log(`  - ${query.name}: ${query.description}`);
        }
        console.log('');
      }
      if (preset.documentation) {
        console.log(chalk.green('Documentation:'));
        console.log(preset.documentation.description);
        console.log('');
      }
      if (preset.documentation?.examples) {
        console.log(chalk.green('Examples:'));
        for (const example of preset.documentation.examples) {
          console.log(example);
        }
        console.log('');
      }
    } catch (error: any) {
      console.error(chalk.red(`Error: Preset '${name}' not found`));
      console.error(chalk.yellow(`Available presets: ${BUILT_IN_PRESETS.join(', ')}`));
      process.exit(1);
    }
  });

presetProgram.command('init')
  .description('Initialize a traceability configuration from a preset')
  .arguments('<name>')
  .option('-o, --output <path>', 'Output directory for config file', '.')
  .action((name: string, options: any) => {
    console.log(chalk.blue(`Initializing from preset: ${name}`));
    try {
      const configLoader = new ConfigLoader();
      const preset = configLoader.loadPreset(name);
      ensureDirectory(options.output);
      const configPath = resolve(process.cwd(), options.output, 'traceability.yml');
      const configContent = `# Traceability Configuration
# Generated from preset: ${preset.name}
# Version: ${preset.version}
# ${preset.description || ''}

# Roles define the types of traceable items in your project
roles:
${preset.traceability.roles.map(r => `  - ${r}`).join('\n')}

# Relations define which relationship types are allowed between roles
# Format: sourceRole -> targetRole -> [relationTypes]
relations:
${Object.entries(preset.traceability.relations || {}).map(([source, targets]) => {
  const targetsObj = targets as unknown as Record<string, string[]>;
  return `  ${source}:
${Object.entries(targetsObj).map(([target, types]) => {
    return `    ${target}: [${(types as string[]).join(', ')}]`;
  }).join('\n')}`;
}).join('\n')}

# Matrices define which traceability matrices to generate
matrices:
${(preset.traceability.matrices || []).map(matrix => {
  return `  - name: ${matrix.name}
    description: "${matrix.description || ''}"
    rows: ${matrix.rows}
    columns: [${matrix.columns.join(', ')}]`;
}).join('\n')}
`;
      writeFileSync(configPath, configContent);
      console.log(chalk.green(`Configuration written to: ${configPath}`));
      const samplePath = resolve(process.cwd(), options.output, 'requirements.adoc');
      const sampleContent = `= Requirements Example

This file demonstrates the new v2.0 traceability syntax.

== Requirements

[item, id=REQ-001, role=requirement, title="User Authentication"]
====
The system shall authenticate users via secure credentials.

The authentication mechanism must support:
- Username/password
- Multi-factor authentication
- Session management
====

[item, id=REQ-002, role=requirement, title="Password Reset"]
====
The system shall allow users to reset their password.

Password reset must:
- Send email with secure link
- Expire after 24 hours
- Require current password confirmation
====

== Design

[item, id=DES-001, role=design, title="Authentication Service"]
====
JWT-based authentication service.

addresses:REQ-001[]
====

== Implementation

[item, id=IMP-001, role=implementation, title="AuthService Class"]
====
TypeScript implementation of authentication.

implements:DES-001[]
====

== Tests

[item, id=TEST-001, role=test, title="Authentication Tests"]
====
Unit and integration tests.

verifies:REQ-001[]
tests:IMP-001[]
====
`;
      writeFileSync(samplePath, sampleContent);
      console.log(chalk.green(`Sample file written to: ${samplePath}`));
      console.log('');
      console.log(chalk.cyan('Next steps:'));
      console.log(chalk.cyan(`  1. Process: antora-req-trace process -i ${samplePath} --config traceability.yml`));
      console.log(chalk.cyan(`  2. Generate matrix: antora-req-trace matrix --config traceability.yml -o matrix.html -f html`));
      console.log(chalk.cyan(`  3. Validate: antora-req-trace validate -i ${samplePath} --config traceability.yml`));
    } catch (error: any) {
      console.error(chalk.red(`Error: Preset '${name}' not found`));
      console.error(chalk.yellow(`Available presets: ${BUILT_IN_PRESETS.join(', ')}`));
      process.exit(1);
    }
  });

program.command('export neo4j')
  .description('Export traceability data to Neo4j format')
  .option('-i, --input <path>', 'Input file or directory to process first')
  .option('-o, --output <path>', 'Output directory for Neo4j files', './neo4j')
  .option('-f, --format <format>', 'Export format (csv, cypher)', 'csv')
  .action(async (options) => {
    console.log(chalk.blue('Exporting to Neo4j...'));
    if (!options.input) {
      console.error(chalk.red('Error: Input file or directory is required'));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      const inputPath = resolve(process.cwd(), options.input);
      if (!existsSync(inputPath)) {
        console.error(chalk.red(`Error: Input file not found: ${inputPath}`));
        process.exit(1);
      }
      const content = readFileSync(inputPath, 'utf8');
      if (extension instanceof RequirementsTraceabilityExtensionV2) {
        extension.process(content, { sourceFile: options.input });
        console.log(chalk.yellow('Neo4j export for v2 is not yet fully implemented'));
        console.log(chalk.yellow('Use v1: antora-req-trace export neo4j -i <file> (without --v2)'));
        process.exit(0);
      } else {
        await extension.process(content, { sourceFile: options.input });
        const { Neo4jExporter } = await import('./Neo4jExporter.js');
        const exporter = new Neo4jExporter(extension.graph);
        ensureDirectory(options.output);
        const result = exporter.export({
          outputDir: resolve(process.cwd(), options.output),
          format: options.format as 'csv' | 'cypher',
          includeContent: true,
          includeAllAttributes: true,
        });
        console.log(chalk.green(`Exported to Neo4j ${options.format} format`));
        console.log(chalk.green(`  Nodes: ${result.nodeCount}`));
        console.log(chalk.green(`  Relationships: ${result.relationshipCount}`));
        if (result.nodesFile) console.log(chalk.green(`  Nodes file: ${result.nodesFile}`));
        if (result.relationshipsFile) console.log(chalk.green(`  Relationships file: ${result.relationshipsFile}`));
        if (result.cypherFile) console.log(chalk.green(`  Cypher file: ${result.cypherFile}`));
      }
    } catch (error: any) {
      console.error(chalk.red('Export error:', error.message));
      process.exit(1);
    }
  });

program.command('stats')
  .description('Show traceability statistics')
  .option('-i, --input <path>', 'Input file or directory')
  .action(async (options) => {
    console.log(chalk.blue('Traceability Statistics'));
    if (!options.input) {
      console.error(chalk.red('Error: Input file or directory is required'));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      const inputPath = resolve(process.cwd(), options.input);
      if (!existsSync(inputPath)) {
        console.error(chalk.red(`Error: Input file not found: ${inputPath}`));
        process.exit(1);
      }
      const content = readFileSync(inputPath, 'utf8');
      if (extension instanceof RequirementsTraceabilityExtensionV2) {
        extension.process(content, { sourceFile: options.input });
        console.log('');
        console.log(chalk.green('Items by Role:'));
        const stats = extension.getRoleStatistics();
        for (const [role, count] of Object.entries(stats)) {
          console.log(`  ${role}: ${count}`);
        }
        console.log('');
        console.log(chalk.green('Relationships:'));
        const allRels = extension.getAllRelationships();
        console.log(`  Total: ${allRels.length}`);
        const relStats: Record<string, number> = {};
        for (const rel of allRels) {
          relStats[rel.type] = (relStats[rel.type] || 0) + 1;
        }
        for (const [type, count] of Object.entries(relStats)) {
          console.log(`    ${type}: ${count}`);
        }
        console.log('');
        console.log(chalk.green('Coverage:'));
        const coverage = extension.getCoverageReport();
        for (const [key, value] of Object.entries(coverage)) {
          if (typeof value === 'object') {
            const v = value as any;
            console.log(`  ${key}: ${v.total} total, ${v.covered} covered (${v.coverage.toFixed(1)}%)`);
          } else {
            console.log(`  ${key}: ${value}`);
          }
        }
      } else {
        await extension.process(content, { sourceFile: options.input });
        const coverage = extension.getCoverageReport();
        console.log('');
        console.log(chalk.green('Items:'));
        console.log(`  Requirements: ${extension.graph.getAllRequirements().length}`);
        console.log(`  Implementations: ${extension.graph.getAllImplementations().length}`);
        console.log(`  Tests: ${extension.graph.getAllTests().length}`);
        console.log(`  Documents: ${extension.graph.getAllDocuments().length}`);
        console.log(`  Designs: ${extension.graph.getAllDesigns().length}`);
        console.log('');
        console.log(chalk.green('Coverage:'));
        console.log(`  Requirements with Implementation: ${coverage.requirementsWithImplementation} (${coverage.implementationCoverage.toFixed(1)}%)`);
        console.log(`  Requirements with Tests: ${coverage.requirementsWithTests} (${coverage.testCoverage.toFixed(1)}%)`);
      }
    } catch (error: any) {
      console.error(chalk.red('Statistics error:', error.message));
      process.exit(1);
    }
  });

if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);
