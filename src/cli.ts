#!/usr/bin/env node

import {
  createWriteStream,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { dirname, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import chalk from "chalk";
import { program } from "commander";

// Import extension
import {
  BUILT_IN_PRESETS,
  ConfigLoader,
  RequirementsTraceabilityExtension,
} from "./index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJsonPath = resolve(__dirname, "../../package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

// Global options
program
  .name("antora-tracer")
  .description(
    "Antora Requirements Traceability Extension - Trace requirements, designs, implementations, and tests using role-based traceability",
  )
  .version(packageJson.version)
  .option("--config <path>", "Path to traceability configuration YAML file")
  .option(
    "--preset <name>",
    "Use a built-in preset configuration: " +
      BUILT_IN_PRESETS.join(", ") +
      "\n  (default: requirements-engineering)",
    "requirements-engineering",
  )
  .option(
    "--dry-run",
    "Preview actions without writing files or making changes",
  );

// Helper to create the extension
async function createExtension(options: any) {
  const globalOpts = program.opts();
  const mergedOptions = { ...options, ...globalOpts };

  try {
    // An explicit --config takes precedence over the (defaulted) --preset,
    // otherwise the preset default silently swallows the config file and its
    // inverseLabels/custom roles never load.
    if (mergedOptions.config) {
      const configLoader = new ConfigLoader();
      configLoader.load(mergedOptions.config);
      return new RequirementsTraceabilityExtension(configLoader);
    } else if (mergedOptions.preset) {
      return RequirementsTraceabilityExtension.createWithPreset(
        mergedOptions.preset,
      );
    } else {
      return new RequirementsTraceabilityExtension();
    }
  } catch (error: any) {
    console.error(chalk.red("Error creating extension:", error.message));
    process.exit(1);
  }
}

// Helper to check if dry-run mode is enabled
function isDryRun(options: any): boolean {
  const globalOpts = program.opts();
  return options.dryRun || globalOpts.dryRun || false;
}

function ensureDirectory(dir: string) {
  const fullPath = resolve(process.cwd(), dir);

  // Validate path is within project directory
  const projectRoot = process.cwd();
  const normalizedPath = resolve(fullPath);
  const normalizedProjectRoot = resolve(projectRoot);

  if (
    !normalizedPath.startsWith(normalizedProjectRoot + sep) &&
    normalizedPath !== normalizedProjectRoot
  ) {
    console.error(
      chalk.red(`Error: Output path escapes project directory: ${dir}`),
    );
    process.exit(1);
  }

  if (!existsSync(fullPath)) {
    mkdirSync(fullPath, { recursive: true });
  }
}

/**
 * Collect AsciiDoc files from a path (file or directory).
 * Returns array of { path, content } for use with processFiles().
 */
function collectAdocFiles(
  inputPath: string,
): { path: string; content: string }[] {
  const resolvedPath = resolve(process.cwd(), inputPath);

  // Validate path is within project directory to prevent path traversal
  const projectRoot = process.cwd();
  const normalizedPath = resolve(resolvedPath);
  const normalizedProjectRoot = resolve(projectRoot);

  if (
    !normalizedPath.startsWith(normalizedProjectRoot + sep) &&
    normalizedPath !== normalizedProjectRoot
  ) {
    console.error(
      chalk.red(`Error: Path escapes project directory: ${inputPath}`),
    );
    process.exit(1);
  }

  if (!existsSync(resolvedPath)) {
    console.error(chalk.red(`Error: Input not found: ${inputPath}`));
    process.exit(1);
  }

  const stat = statSync(resolvedPath);
  if (stat.isDirectory()) {
    const files: { path: string; content: string }[] = [];
    const entries = readdirSync(resolvedPath, { recursive: true }) as string[];
    for (const entry of entries) {
      const fullPath = resolve(resolvedPath, entry as string);
      if (statSync(fullPath).isFile() && (entry as string).endsWith(".adoc")) {
        files.push({
          path: entry as string,
          content: readFileSync(fullPath, "utf8"),
        });
      }
    }
    return files;
  }

  // Single file
  return [
    {
      path: inputPath,
      content: readFileSync(resolvedPath, "utf8"),
    },
  ];
}

/**
 * Format an array of rows as an aligned plain-text table.
 * An empty rows array renders the header only.
 */
function formatTable(header: string[], rows: string[][]): string {
  const widths = header.map((h, i) =>
    Math.max(h.length, ...rows.map((r) => (r[i] ?? "").length)),
  );
  const render = (cells: string[]) =>
    cells
      .map((c, i) => (c ?? "").padEnd(widths[i] ?? 0))
      .join("  ")
      .trimEnd();
  return [render(header), ...rows.map(render)].join("\n");
}

program
  .command("process")
  .description("Process AsciiDoc files for requirements traceability")
  .option("-i, --input <path>", "Input file or directory (required)")
  .option(
    "-o, --output <path>",
    "Output directory for generated files",
    "./output",
  )
  .option("-f, --format <format>", "Output format: html, csv, or json", "html")
  .action(async (options) => {
    console.log(chalk.blue("Processing requirements traceability..."));
    if (!options.input) {
      console.error(chalk.red("Error: Input file or directory is required"));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      const adocFiles = collectAdocFiles(options.input);

      // Show progress indicator
      if (adocFiles.length > 1) {
        console.log(
          chalk.cyan(`Found ${adocFiles.length} AsciiDoc files to process...`),
        );
      }

      const result = extension.processFiles(adocFiles);
      console.log(
        chalk.green(
          `Processed ${adocFiles.length} file(s): ${result.result.items.length} items, ${result.result.relationships.length} relationships`,
        ),
      );

      console.log(
        chalk.green(
          `Processed ${adocFiles.length} file(s): ${result.result.items.length} items, ${result.result.relationships.length} relationships`,
        ),
      );
      let output: string;
      if (options.format === "json") {
        output = JSON.stringify(
          {
            items: result.result.items,
            relationships: result.result.relationships,
            statistics: extension.graph.getRoleStatistics(),
          },
          null,
          2,
        );
      } else if (options.format === "csv") {
        const lines = ["id,role,title"];
        for (const item of result.result.items) {
          const escapedTitle = item.title.includes(",")
            ? `"${item.title}"`
            : item.title;
          lines.push([item.id, item.role, escapedTitle].join(","));
        }
        output = lines.join("\n");
      } else {
        output =
          "<!DOCTYPE html><html><head><title>Traceability Report</title></head><body><h1>Traceability Report</h1>";
        output += `<p>Items: ${result.result.items.length}, Relationships: ${result.result.relationships.length}</p><h2>Items</h2><table border="1"><tr><th>ID</th><th>Role</th><th>Title</th></tr>`;
        for (const item of result.result.items) {
          output += `<tr><td>${item.id}</td><td>${item.role}</td><td>${item.title}</td></tr>`;
        }
        output += "</table></body></html>";
      }
      if (isDryRun(options)) {
        console.log(
          chalk.yellow(
            `[DRY RUN] Would write output to: ${resolve(options.output, `traceability.${options.format}`)}`,
          ),
        );
      } else {
        ensureDirectory(options.output);
        const outputPath = resolve(
          options.output,
          `traceability.${options.format}`,
        );
        const stream = createWriteStream(outputPath);
        stream.write(output);
        stream.end();
        console.log(chalk.green(`Output written to: ${outputPath}`));
      }
    } catch (error: any) {
      console.error(chalk.red("Processing error:", error.message));
      process.exit(1);
    }
  });

program
  .command("matrix")
  .description("Generate traceability matrices from processed items")
  .option("-i, --input <path>", "Input file or directory to process first")
  .option(
    "-t, --type <type>",
    "Matrix type or name (uses configuration from preset/config)",
  )
  .option("-f, --format <format>", "Output format: csv, html, or json", "csv")
  .option("-o, --output <path>", "Output file path (defaults to stdout)")
  .option("--templates <path>", "Custom templates directory")
  .action(async (options) => {
    console.log(chalk.blue("Generating traceability matrix..."));
    const extension = await createExtension(options);
    try {
      let output: string;

      if (options.input) {
        const adocFiles = collectAdocFiles(options.input);
        extension.processFiles(adocFiles);
      }

      if (!extension.graph.size()) {
        console.error(
          chalk.red(
            "Error: No data in graph. Use -i option to specify input file, or process files first",
          ),
        );
        process.exit(1);
      }

      const matrixName = options.type || "default";
      const { MatrixGenerator } = await import("./MatrixGenerator.js");
      const generator = new MatrixGenerator(
        extension.graph,
        extension.configLoader,
        {
          templateDir: options.templates,
        },
      );
      const matrix = generator.generateMatrix(matrixName);
      if (options.format === "html") {
        output = generator.exportToHTML(matrix);
      } else if (options.format === "json") {
        output = JSON.stringify(matrix, null, 2);
      } else {
        output = generator.exportToCSV(matrix);
      }
      if (options.output) {
        if (isDryRun(options)) {
          console.log(
            chalk.yellow(`[DRY RUN] Would write matrix to: ${options.output}`),
          );
        } else {
          ensureDirectory(dirname(options.output));
          const stream = createWriteStream(options.output);
          stream.write(output);
          stream.end();
          console.log(chalk.green(`Matrix written to: ${options.output}`));
        }
      } else {
        if (!isDryRun(options)) {
          console.log(output);
        } else {
          console.log(chalk.yellow("[DRY RUN] Would output matrix to stdout"));
        }
      }
    } catch (error: any) {
      console.error(chalk.red("Matrix generation error:", error.message));
      process.exit(1);
    }
  });

program
  .command("validate")
  .description(
    "Validate requirements traceability (checks for orphaned items, missing coverage)",
  )
  .option("-i, --input <path>", "Input file or directory to validate")
  .action(async (options) => {
    console.log(chalk.blue("Validating requirements traceability..."));
    const extension = await createExtension(options);
    try {
      if (options.input) {
        const adocFiles = collectAdocFiles(options.input);
        extension.processFiles(adocFiles);
        const validation = extension.graph.validate();
        if (validation.errors.length > 0) {
          console.log(
            chalk.red(`Validation Errors (${validation.errors.length}):`),
          );
          for (const error of validation.errors) {
            console.log(chalk.red(`  - ${error}`));
          }
          process.exit(1);
        } else {
          console.log(chalk.green("No validation errors found"));
        }
        if (validation.warnings.length > 0) {
          console.log(
            chalk.yellow(`Warnings (${validation.warnings.length}):`),
          );
          for (const warning of validation.warnings) {
            const loc = warning.file
              ? ` (${warning.file}${warning.line !== undefined ? `:${warning.line}` : ""})`
              : "";
            console.log(chalk.yellow(`  - ${warning.message}${loc}`));
          }
        }
        console.log(
          chalk.green(
            `Summary: ${extension.getAllItems().length} items, ${extension.getAllRelationships().length} relationships`,
          ),
        );
      } else {
        console.log(
          chalk.yellow("No input specified, validating current graph..."),
        );
        console.log(
          chalk.yellow("Note: Graph is empty without processing files first"),
        );
      }
    } catch (error: any) {
      console.error(chalk.red("Validation error:", error.message));
      process.exit(1);
    }
  });

const presetProgram = program
  .command("preset")
  .description(
    "Manage traceability presets - list, show details, or initialize config from preset",
  );

presetProgram
  .command("list")
  .description("List available built-in presets")
  .action(() => {
    console.log(chalk.blue("Available Presets:"));
    console.log("");
    const configLoader = new ConfigLoader();
    const presets = configLoader.listPresets();
    if (presets.length === 0) {
      console.log(chalk.yellow("No presets found"));
      process.exit(0);
    }
    for (const preset of presets) {
      console.log(chalk.green(`${preset.name}`));
      console.log(`  ${preset.description || "No description"}`);
      console.log(`  v${preset.version}`);
      console.log("");
    }
    console.log(
      chalk.cyan("Usage: antora-tracer process --preset <name> -i <file>"),
    );
    console.log(chalk.cyan("       antora-tracer preset show <name>"));
    console.log(chalk.cyan("       antora-tracer preset init <name>"));
  });

presetProgram
  .command("show")
  .description("Show details of a preset")
  .arguments("<name>")
  .action((name: string) => {
    console.log(chalk.blue(`Preset: ${name}`));
    console.log("");
    try {
      const configLoader = new ConfigLoader();
      const preset = configLoader.loadPreset(name);
      console.log(chalk.green("Metadata:"));
      console.log(`  Name: ${preset.name}`);
      console.log(`  Description: ${preset.description || "N/A"}`);
      console.log(`  Version: ${preset.version}`);
      console.log(`  Author: ${preset.author || "N/A"}`);
      if (preset.tags && preset.tags.length > 0) {
        console.log(`  Tags: ${preset.tags.join(", ")}`);
      }
      console.log("");
      console.log(chalk.green("Configuration:"));
      console.log(`  Roles: ${preset.traceability.roles.join(", ")}`);
      console.log("");
      console.log(chalk.green("Relations:"));
      const relations = preset.traceability.relations || {};
      for (const [sourceRole, targets] of Object.entries(relations)) {
        console.log(`  ${sourceRole}:`);
        for (const [targetRole, typeMap] of Object.entries(
          targets as Record<string, Record<string, { reverse: string }>>,
        )) {
          console.log(
            `    -> ${targetRole}: [${Object.keys(typeMap).join(", ")}]`,
          );
        }
      }
      console.log("");
      if (
        preset.traceability.matrices &&
        preset.traceability.matrices.length > 0
      ) {
        console.log(chalk.green("Matrices:"));
        for (const matrix of preset.traceability.matrices) {
          console.log(
            `  - ${matrix.name}: ${matrix.rows} -> [${matrix.columns.join(", ")}]`,
          );
        }
        console.log("");
      }
      if (preset.neo4j?.queries && preset.neo4j.queries.length > 0) {
        console.log(chalk.green("Neo4j Queries:"));
        for (const query of preset.neo4j.queries) {
          console.log(`  - ${query.name}: ${query.description}`);
        }
        console.log("");
      }
      if (preset.documentation) {
        console.log(chalk.green("Documentation:"));
        console.log(preset.documentation.description);
        console.log("");
      }
      if (preset.documentation?.examples) {
        console.log(chalk.green("Examples:"));
        for (const example of preset.documentation.examples) {
          console.log(example);
        }
        console.log("");
      }
    } catch (_error: any) {
      console.error(chalk.red(`Error: Preset '${name}' not found`));
      console.error(
        chalk.yellow(`Available presets: ${BUILT_IN_PRESETS.join(", ")}`),
      );
      process.exit(1);
    }
  });

presetProgram
  .command("init")
  .description("Initialize a traceability configuration from a preset")
  .arguments("<name>")
  .option("-o, --output <path>", "Output directory for config file", ".")
  .action((name: string, options: any) => {
    console.log(chalk.blue(`Initializing from preset: ${name}`));
    try {
      const configLoader = new ConfigLoader();
      const preset = configLoader.loadPreset(name);
      if (isDryRun(options)) {
        console.log(chalk.yellow("[DRY RUN] Would initialize from preset:"));
        console.log(chalk.yellow(`  Preset: ${name}`));
        console.log(
          chalk.yellow(`  Output directory: ${options.output || "."}`),
        );
        console.log(chalk.yellow("  Files would be created:"));
        console.log(chalk.yellow(`    - traceability.yml`));
        console.log(chalk.yellow(`    - requirements.adoc`));
      } else {
        ensureDirectory(options.output);
        const configPath = resolve(
          process.cwd(),
          options.output,
          "traceability.yml",
        );
        const configContent = `# Traceability Configuration
# Generated from preset: ${preset.name}
# Version: ${preset.version}
# ${preset.description || ""}

# Roles define the types of traceable items in your project
roles:
${preset.traceability.roles.map((r) => `  - ${r}`).join("\n")}

# Relations define which relationship types are allowed between roles
# Format: sourceRole -> targetRole -> [relationTypes]
relations:
${Object.entries(preset.traceability.relations || {})
  .map(([source, targets]) => {
    const targetsObj = targets as unknown as Record<string, string[]>;
    return `  ${source}:
${Object.entries(targetsObj)
  .map(([target, types]) => {
    return `    ${target}: [${(types as string[]).join(", ")}]`;
  })
  .join("\n")}`;
  })
  .join("\n")}

# Matrices define which traceability matrices to generate
matrices:
${(preset.traceability.matrices || [])
  .map((matrix) => {
    return `  - name: ${matrix.name}
    description: "${matrix.description || ""}"
    rows: ${matrix.rows}
    columns: [${matrix.columns.join(", ")}]`;
  })
  .join("\n")}
`;
        writeFileSync(configPath, configContent);
        console.log(chalk.green(`Configuration written to: ${configPath}`));
        const samplePath = resolve(
          process.cwd(),
          options.output,
          "requirements.adoc",
        );
        const sampleContent = `= Requirements Example

This file demonstrates the traceability syntax.

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
        console.log("");
        console.log(chalk.cyan("Next steps:"));
        console.log(
          chalk.cyan(
            `  1. Process: antora-tracer process -i ${samplePath} --config traceability.yml`,
          ),
        );
        console.log(
          chalk.cyan(
            `  2. Generate matrix: antora-tracer matrix --config traceability.yml -o matrix.html -f html`,
          ),
        );
        console.log(
          chalk.cyan(
            `  3. Validate: antora-tracer validate -i ${samplePath} --config traceability.yml`,
          ),
        );
      }
    } catch (_error: any) {
      console.error(chalk.red(`Error: Preset '${name}' not found`));
      console.error(
        chalk.yellow(`Available presets: ${BUILT_IN_PRESETS.join(", ")}`),
      );
      process.exit(1);
    }
  });

// Config validation command
program
  .command("config validate")
  .description("Validate traceability configuration file")
  .option(
    "-c, --config <path>",
    "Path to config file (default: auto-discovered)",
  )
  .action(async (options) => {
    console.log(chalk.blue("Validating traceability configuration..."));
    try {
      const configLoader = new ConfigLoader();
      const configPath = options.config || configLoader.getConfigPath();

      if (!configPath) {
        console.error(chalk.red("Error: No configuration file found"));
        console.log(
          chalk.yellow(
            "Try: antora-tracer config validate --config traceability.yml",
          ),
        );
        console.log(
          chalk.yellow(
            "Or: antora-tracer config validate -c /path/to/config.yml",
          ),
        );
        process.exit(1);
      }

      const config = configLoader.load(configPath);
      console.log(chalk.green("✓ Configuration is valid"));
      console.log("");
      console.log(chalk.cyan("Configuration Summary:"));
      console.log(chalk.cyan(`  Name: ${config.metadata?.name || "unnamed"}`));
      console.log(chalk.cyan(`  Roles: ${config.roles.length}`));
      if (config.roles.length > 0) {
        console.log(chalk.cyan(`    ${config.roles.join(", ")}`));
      }
      console.log(chalk.cyan(`  Matrices: ${config.matrices?.length || 0}`));
      if (config.matrices && config.matrices.length > 0) {
        console.log(
          chalk.cyan(`    ${config.matrices.map((m) => m.name).join(", ")}`),
        );
      }
      console.log(
        chalk.cyan(
          `  Relations: ${Object.keys(config.relations || {}).length} source roles`,
        ),
      );
    } catch (error: any) {
      console.error(chalk.red("✗ Configuration validation failed:"));
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

program
  .command("export neo4j")
  .description("Export traceability data to Neo4j graph database format")
  .option("-i, --input <path>", "Input file or directory to process first")
  .option(
    "-o, --output <path>",
    "Output directory for Neo4j import files",
    "./neo4j",
  )
  .option("-f, --format <format>", "Export format: csv or cypher", "csv")
  .action(async (_target, options) => {
    console.log(chalk.blue("Exporting to Neo4j..."));
    if (!options.input) {
      console.error(chalk.red("Error: Input file or directory is required"));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      if (options.input) {
        const adocFiles = collectAdocFiles(options.input);
        extension.processFiles(adocFiles);
      }
      if (isDryRun(options)) {
        console.log(chalk.yellow("[DRY RUN] Would export to Neo4j"));
        console.log(chalk.yellow(`  Format: ${options.format}`));
        console.log(
          chalk.yellow(
            `  Output directory: ${resolve(process.cwd(), options.output)}`,
          ),
        );
      } else {
        ensureDirectory(options.output);
        const outputDir = resolve(process.cwd(), options.output);
        const { Neo4jExporter } = await import("./Neo4jExporter.js");
        const exporter = new Neo4jExporter(extension.graph);
        const result = exporter.export({
          outputDir: outputDir,
          format: options.format as "csv" | "cypher",
          includeContent: true,
          includeAllAttributes: true,
        });
        console.log(chalk.green(`Exported to Neo4j ${options.format} format`));
        console.log(chalk.green(`  Nodes: ${result.nodeCount}`));
        console.log(
          chalk.green(`  Relationships: ${result.relationshipCount}`),
        );
        if (result.nodesFile)
          console.log(chalk.green(`  Nodes file: ${result.nodesFile}`));
        if (result.relationshipsFile)
          console.log(
            chalk.green(`  Relationships file: ${result.relationshipsFile}`),
          );
        if (result.cypherFile)
          console.log(chalk.green(`  Cypher file: ${result.cypherFile}`));
      }
    } catch (error: any) {
      console.error(chalk.red("Export error:", error.message));
      process.exit(1);
    }
  });

program
  .command("stats")
  .description(
    "Show traceability statistics (counts by role, relationship types, coverage)",
  )
  .option("-i, --input <path>", "Input file or directory")
  .action(async (options) => {
    console.log(chalk.blue("Traceability Statistics"));
    if (!options.input) {
      console.error(chalk.red("Error: Input file or directory is required"));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      if (options.input) {
        const adocFiles = collectAdocFiles(options.input);
        extension.processFiles(adocFiles);
      }
      console.log("");
      console.log(chalk.green("Items by Role:"));
      const stats = extension.graph.getRoleStatistics();
      for (const [role, count] of Object.entries(stats)) {
        console.log(`  ${role}: ${count}`);
      }
      console.log("");
      console.log(chalk.green("Relationships:"));
      const allRels = extension.graph.getAllRelationships();
      console.log(`  Total: ${allRels.length}`);
      const relStats: Record<string, number> = {};
      for (const rel of allRels) {
        relStats[rel.type] = (relStats[rel.type] || 0) + 1;
      }
      for (const [type, count] of Object.entries(relStats)) {
        console.log(`    ${type}: ${count}`);
      }
      console.log("");
      console.log(chalk.green("Coverage:"));
      const coverage = extension.graph.getRoleStatistics();
      for (const [key, value] of Object.entries(coverage)) {
        if (typeof value === "object") {
          const v = value as any;
          console.log(
            `  ${key}: ${v.total} total, ${v.covered} covered (${v.coverage.toFixed(1)}%)`,
          );
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }
    } catch (error: any) {
      console.error(chalk.red("Statistics error:", error.message));
      process.exit(1);
    }
  });

program
  .command("next-id")
  .description("Get the next available sequential ID for a given prefix")
  .requiredOption("-p, --prefix <prefix>", "ID prefix (e.g., REQ, ARC, TST)")
  .option(
    "-i, --input <path>",
    "Input file or directory to scan for existing IDs",
  )
  .action(async (options) => {
    if (!options.input) {
      console.error(chalk.red("Error: Input file or directory is required"));
      process.exit(1);
    }
    const extension = await createExtension(options);
    try {
      const adocFiles = collectAdocFiles(options.input);
      extension.processFiles(adocFiles);
      const nextId = extension.getNextId(options.prefix);
      console.log(nextId);
    } catch (error: any) {
      console.error(chalk.red("Error:", error.message));
      process.exit(1);
    }
  });

// ========================================================================
// Query command
// ========================================================================

const queryProgram = program
  .command("query")
  .description("Query the traceability graph (no Antora build required)")
  .option("-i, --input <path>", "Input file or directory to scan", ".")
  .option("--json", "Output machine-readable JSON");

/**
 * Build the traceability graph from the input path declared on the parent
 * `query` command.
 */
async function buildQueryGraph(
  cmd: any,
): Promise<RequirementsTraceabilityExtension> {
  const { input } = cmd.parent.opts();
  const extension = await createExtension({});
  const adocFiles = collectAdocFiles(input ?? ".");
  extension.processFiles(adocFiles);
  return extension;
}

queryProgram
  .command("reverse <id>")
  .description("List all items that reference the given ID")
  .action(async (id: string, _options: any, cmd: any) => {
    const { json } = cmd.parent.opts();
    const extension = await buildQueryGraph(cmd);
    const graph = extension.graph;
    if (!graph.getItem(id)) {
      console.error(chalk.red(`Item not found: ${id}`));
      process.exit(1);
    }
    const rels = graph.getReverseRelationships(id);
    if (json) {
      console.log(
        JSON.stringify(
          rels.map((rel) => ({
            item: graph.getItem(rel.fromId) ?? null,
            relationship: rel,
          })),
          null,
          2,
        ),
      );
    } else {
      const rows = rels.map((rel) => {
        const item = graph.getItem(rel.fromId);
        return [
          item?.id ?? rel.fromId,
          item?.role ?? "",
          rel.type,
          rel.sourceFile ?? "",
          rel.line !== undefined ? String(rel.line) : "",
        ];
      });
      console.log(
        formatTable(["ID", "Role", "Relation", "File", "Line"], rows),
      );
    }
  });

queryProgram
  .command("impact <id>")
  .description("List all items transitively connected to the given ID")
  .action(async (id: string, _options: any, cmd: any) => {
    const { json } = cmd.parent.opts();
    const extension = await buildQueryGraph(cmd);
    const graph = extension.graph;
    if (!graph.getItem(id)) {
      console.error(chalk.red(`Item not found: ${id}`));
      process.exit(1);
    }
    const ids = graph.getImpactAnalysis(id);
    const items = ids
      .map((iid) => graph.getItem(iid))
      .filter((i): i is NonNullable<typeof i> => i !== undefined);
    if (json) {
      console.log(JSON.stringify(items, null, 2));
    } else {
      const rows = items.map((item) => [item.id, item.role, item.title]);
      console.log(formatTable(["ID", "Role", "Title"], rows));
    }
  });

queryProgram
  .command("orphaned")
  .description("List items with no relationships")
  .option("--role <role>", "Filter by role")
  .action(async (options: any, cmd: any) => {
    const { json } = cmd.parent.opts();
    const extension = await buildQueryGraph(cmd);
    const graph = extension.graph;
    const orphans = graph
      .getAllItems()
      .filter(
        (item) =>
          graph.getRelationships(item.id).length === 0 &&
          graph.getReverseRelationships(item.id).length === 0,
      );
    const filtered = options.role
      ? orphans.filter((i) => i.role === options.role)
      : orphans;
    if (json) {
      console.log(JSON.stringify(filtered, null, 2));
    } else {
      const rows = filtered.map((item) => [
        item.id,
        item.role,
        item.title,
        item.sourceFile ?? "",
      ]);
      console.log(formatTable(["ID", "Role", "Title", "File"], rows));
    }
  });

queryProgram
  .command("path <from> <to>")
  .description("Find the shortest relationship path between two items")
  .action(async (from: string, to: string, _options: any, cmd: any) => {
    const { json } = cmd.parent.opts();
    const extension = await buildQueryGraph(cmd);
    const graph = extension.graph;
    if (!graph.getItem(from)) {
      console.error(chalk.red(`Item not found: ${from}`));
      process.exit(1);
    }
    if (!graph.getItem(to)) {
      console.error(chalk.red(`Item not found: ${to}`));
      process.exit(1);
    }
    const path = graph.findPath(from, to);
    if (path === null) {
      console.error(chalk.red("No path found"));
      process.exit(1);
    }
    const edges = [];
    for (let i = 0; i < path.length - 1; i++) {
      const rel = graph
        .getRelationships(path[i])
        .find((r) => r.targetId === path[i + 1]);
      if (rel) {
        edges.push(rel);
      }
    }
    if (json) {
      console.log(JSON.stringify(edges, null, 2));
    } else {
      let line = path[0];
      for (let i = 0; i < edges.length; i++) {
        line += ` --${edges[i].type}--> ${path[i + 1]}`;
      }
      console.log(line);
    }
  });

if (process.argv.length <= 2) {
  program.help();
}

program.parse(process.argv);
