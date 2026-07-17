#!/usr/bin/env node
import { program } from 'commander';
import { createWriteStream } from 'fs';
import { RequirementsTraceabilityExtension } from './index.js';
import chalk from 'chalk';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../package.json'), 'utf8'));
program
    .name('antora-req-trace')
    .description('Antora Requirements Traceability Extension')
    .version(packageJson.version);
program.command('process')
    .description('Process AsciiDoc files for requirements traceability')
    .option('-i, --input <path>', 'Input file or directory')
    .option('-o, --output <path>', 'Output directory')
    .option('-f, --format <format>', 'Output format (html, csv, json)', 'html')
    .action(async (options) => {
    console.log(chalk.blue('Processing requirements traceability...'));
    console.log(chalk.green('Input:', options.input));
    console.log(chalk.green('Output:', options.output));
    console.log(chalk.green('Format:', options.format));
    console.log(chalk.yellow('⚠️  Implementation pending - this is a skeleton'));
});
program.command('matrix')
    .description('Generate traceability matrices')
    .option('-t, --type <type>', 'Matrix type (req-impl, req-test, full)', 'req-impl')
    .option('-f, --format <format>', 'Output format (csv, html)', 'csv')
    .option('-o, --output <path>', 'Output file (defaults to stdout)')
    .action(async (options) => {
    console.log(chalk.blue('Generating traceability matrix...'));
    console.log(chalk.green('Type:', options.type));
    console.log(chalk.green('Format:', options.format));
    const extension = new RequirementsTraceabilityExtension();
    // For now, generate a sample matrix from any existing data
    // In real usage, this would process files first
    let output;
    if (options.format === 'html') {
        output = extension.exportMatrixToHTML(options.type);
    }
    else {
        output = extension.exportMatrixToCSV(options.type);
    }
    if (options.output) {
        const stream = createWriteStream(options.output);
        stream.write(output);
        stream.end();
        console.log(chalk.green(`Matrix written to: ${options.output}`));
    }
    else {
        console.log(output);
    }
});
program.command('validate')
    .description('Validate requirements traceability')
    .action(() => {
    console.log(chalk.blue('Validating requirements...'));
    console.log(chalk.yellow('⚠️  Implementation pending - this is a skeleton'));
});
// Handle no command case
if (process.argv.length <= 2) {
    program.help();
}
program.parse(process.argv);
