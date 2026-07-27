/**
 * Antora Extension for Requirements Traceability
 *
 * This module provides the Antora extension that integrates requirements traceability
 * into the Antora documentation pipeline using the unified item architecture.
 *
 * Usage:
 * In your Antora playbook, add this extension to the extensions array:
 * {
 *   extensions: [
 *     require('antora-requirements-traceability/lib/antora-extension')
 *   ]
 * }
 */
import { RequirementsTraceabilityExtension } from './index.js';
import { ConfigLoader } from './config/TraceabilityConfig.js';
import { MatrixGenerator } from './MatrixGenerator.js';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
const DEFAULT_CONFIG = {
    enabled: true,
    outputDir: 'traceability',
    generateMatrices: true,
    matrixFormats: ['html', 'csv'],
    includeInNavigation: true,
    preset: 'requirements-engineering',
    configPath: '',
};
export class AntoraTraceabilityExtension {
    context;
    traceability = null;
    config;
    logger;
    constructor(context) {
        this.context = context;
        this.logger = context.getLogger('requirements-traceability');
        this.config = { ...DEFAULT_CONFIG, ...this.loadConfig() };
        // Fallback: if no configPath is set, try the example site config
        if (!this.config.configPath) {
            const exampleConfig = join(process.cwd(), 'examples', 'traceability.yml');
            if (existsSync(exampleConfig)) {
                this.config.configPath = exampleConfig;
            }
        }
        if (!this.config.enabled) {
            this.logger.info('Requirements traceability extension is disabled');
            return;
        }
        this.logger.info('Requirements traceability extension initialized');
        this.initializeAsync();
    }
    async initializeAsync() {
        // Register event handlers FIRST (synchronously) before awaiting anything.
        // These handlers guard with `if (!this.traceability)` until the extension loads.
        this.registerContentClassifier();
        this.registerPageProcessor();
        this.registerNavigationEnhancer();
        // Load the traceability extension (may involve async preset loading)
        this.traceability = await this.createTraceabilityExtension();
    }
    async createTraceabilityExtension() {
        if (this.config.configPath) {
            const configLoader = new ConfigLoader();
            try {
                configLoader.load(this.config.configPath);
                this.logger.info(`Loaded configuration from: ${this.config.configPath}`);
                return new RequirementsTraceabilityExtension(configLoader);
            }
            catch (error) {
                this.logger.warn(`Could not load configuration: ${error.message}. Using default.`);
            }
        }
        if (this.config.preset) {
            try {
                return await RequirementsTraceabilityExtension.createWithPreset(this.config.preset);
            }
            catch (error) {
                this.logger.warn(`Could not load preset: ${error.message}. Using default.`);
            }
        }
        return new RequirementsTraceabilityExtension();
    }
    loadConfig() {
        try {
            const playbook = this.context.playbook;
            const extConfig = playbook.extensions?.find((e) => e.name === 'antora-requirements-traceability');
            return extConfig?.config ?? {};
        }
        catch {
            return {};
        }
    }
    registerContentClassifier() {
        this.context.on('contentClassified', (event) => {
            const contentCatalog = event.contentCatalog;
            if (!contentCatalog) {
                this.logger.warn('contentCatalog not found in contentClassified event');
                return;
            }
            this.logger.info('Processing content for traceability');
            const files = contentCatalog.findBy({ family: 'page' }) || [];
            const adocFiles = files.filter((file) => file.src && file.src.path && file.src.path.endsWith('.adoc'));
            // Pass 1: Process all files to populate the traceability graph
            for (const file of adocFiles) {
                this.processAsciiDocFile(file);
            }
            // Pass 2: Substitute relationship macros with xrefs now that the graph is complete
            for (const file of adocFiles) {
                this.substituteLinksInFile(file);
            }
        });
    }
    processAsciiDocFile(file) {
        if (!this.traceability) {
            return;
        }
        try {
            const contentsBuffer = file.contents || file.src?.contents;
            if (!contentsBuffer) {
                return;
            }
            const content = contentsBuffer.toString('utf8');
            const sourceFile = file.src?.path || file.path || 'unknown';
            this.traceability.process(content, { sourceFile });
        }
        catch (error) {
            this.logger.warn(`Error processing ${file.src?.path}: ${error.message}`);
        }
    }
    /**
     * Substitute relationship macros with Asciidoctor xrefs in the file's
     * in-memory content buffer. Must be called AFTER all files have been processed
     * so the graph contains all target items.
     */
    substituteLinksInFile(file) {
        if (!this.traceability)
            return;
        try {
            const contentsBuffer = file.contents || file.src?.contents;
            if (!contentsBuffer)
                return;
            const content = contentsBuffer.toString('utf8');
            const sourceFile = file.src?.path || file.path || 'unknown';
            // Pass 2: Substitute relationship macros with xrefs
            let modifiedContent = this.substituteRelationshipLinks(content, sourceFile);
            // Pass 2b: Prepend item IDs to title attributes for visible display
            modifiedContent = this.injectTitleIds(modifiedContent);
            if (modifiedContent !== content) {
                const buf = Buffer.from(modifiedContent, 'utf8');
                if (file.contents)
                    file.contents = buf;
                if (file.src?.contents)
                    file.src.contents = buf;
            }
        }
        catch (error) {
            this.logger.warn(`Error substituting links in ${file.src?.path}: ${error.message}`);
        }
    }
    /**
     * Prepend item IDs to title attributes so they appear in rendered block titles.
     */
    injectTitleIds(content) {
        if (!this.traceability)
            return content;
        return content.replace(/^(\[#([^,\]]+),\s*item[^\]]*title=")([^"]+)(")/gm, (_match, prefix, id, title, suffix) => {
            if (title.startsWith(`${id} \u2014 `))
                return _match;
            return `${prefix}${id} \u2014 ${title}${suffix}`;
        });
    }
    /**
     * Substitute inline relationship macros with Asciidoctor xrefs.
     * Replaces "addresses:REQ-001[]" with "addresses: xref:#REQ-001[REQ-001]"
     * (same page) or "addresses: xref:other.adoc#REQ-001[REQ-001]" (cross-page).
     *
     * The .adoc file on disk is never modified — only the in-memory content buffer.
     */
    /**
     * Substitute inline relationship macros with Asciidoctor xrefs.
     * Replaces "addresses:REQ-001[]" with "addresses: xref:#REQ-001[REQ-001]"
     * (same page) or "addresses: xref:other.adoc#REQ-001[REQ-001]" (cross-page).
     *
     * The .adoc file on disk is never modified — only the in-memory content buffer.
     */
    substituteRelationshipLinks(content, currentFile) {
        if (!this.traceability)
            return content;
        const relRegex = /\b(\w+):([\w][-.\w]*)\[\]/g;
        return content.replace(relRegex, (_match, _relType, targetId) => {
            const relType = _relType;
            const target = this.traceability.graph.getItem(targetId);
            if (!target) {
                return _match;
            }
            if (target.sourceFile === currentFile) {
                return `${relType}: xref:#${targetId}[${targetId}]`;
            }
            else if (target.sourceFile) {
                // Use just the filename (basename) for cross-page xrefs.
                // Antora resolves page-to-page xrefs within the same component
                // by the page's resource ID, which includes the filename stem.
                const targetPage = target.sourceFile.split('/').pop();
                return `${relType}: xref:${targetPage}#${targetId}[${targetId}]`;
            }
            return `${relType}: xref:#${targetId}[${targetId}]`;
        });
    }
    registerPageProcessor() {
        this.context.on('sitePublished', (event) => {
            if (!this.config.generateMatrices)
                return;
            this.generateTraceabilityFiles(event);
        });
    }
    generateTraceabilityFiles(event) {
        try {
            const outputDir = event.playbook?.output?.dir || event.playbook?.dir || '_site';
            const traceabilityDir = join(outputDir, this.config.outputDir);
            this.logger.info(`Writing traceability files to ${traceabilityDir}`);
            mkdirSync(traceabilityDir, { recursive: true });
            if (!this.traceability) {
                this.logger.warn('Traceability extension not initialized, skipping file generation');
                return;
            }
            const allItems = this.traceability.graph.getAllItems();
            if (allItems.length === 0) {
                this.logger.warn('No traceable items found. Skipping matrix generation.');
                return;
            }
            const matrices = this.traceability?.configLoader?.getConfig()?.matrices || [];
            const matrixNames = matrices.length > 0
                ? matrices.map((m) => m.name)
                : this.generateDefaultMatrixNames(this.traceability.graph.getAllRoles());
            const generator = new MatrixGenerator(this.traceability.graph, this.traceability.configLoader);
            for (const matrixName of matrixNames) {
                for (const format of this.config.matrixFormats) {
                    try {
                        const matrix = generator.generateMatrix(matrixName);
                        let matrixContent;
                        if (format === 'html') {
                            matrixContent = generator.exportToHTML(matrix);
                        }
                        else if (format === 'json') {
                            matrixContent = JSON.stringify(matrix, null, 2);
                        }
                        else {
                            matrixContent = generator.exportToCSV(matrix);
                        }
                        const safeName = matrixName.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
                        const fileName = `matrix-${safeName}.${format}`;
                        const filePath = join(traceabilityDir, fileName);
                        writeFileSync(filePath, matrixContent, 'utf8');
                        this.logger.info(`Generated ${fileName}`);
                    }
                    catch (error) {
                        this.logger.warn(`Failed to generate matrix ${matrixName} (${format}): ${error.message}`);
                    }
                }
            }
            this.generateCoverageReport(traceabilityDir);
            const indexContent = this.generateIndexContent(matrixNames);
            writeFileSync(join(traceabilityDir, 'index.html'), indexContent, 'utf8');
            this.logger.info('Generated index.html');
            this.logger.info(`Traceability files written to ${this.config.outputDir}/`);
        }
        catch (error) {
            this.logger.error(`Error generating traceability pages: ${error.message}`);
        }
    }
    generateDefaultMatrixNames(roles) {
        if (!this.traceability)
            return ['default'];
        const matrices = [];
        const roleList = Array.from(new Set(roles));
        if (roleList.includes('requirement')) {
            if (roleList.includes('implementation'))
                matrices.push('requirements-implementations');
            if (roleList.includes('test'))
                matrices.push('requirements-tests');
            if (roleList.includes('design'))
                matrices.push('requirements-design');
        }
        if (matrices.length === 0 && roleList.length > 0) {
            matrices.push('all-items');
        }
        return matrices.length > 0 ? matrices : ['default'];
    }
    generateCoverageReport(traceabilityDir) {
        if (!this.traceability) {
            this.logger.warn('Traceability extension not initialized, skipping coverage report');
            return;
        }
        try {
            const stats = this.traceability.graph.getRoleStatistics();
            const generator = new MatrixGenerator(this.traceability.graph, this.traceability.configLoader);
            const coverage = generator.getCoverageReport();
            const coverageContent = this.formatCoverageReport(stats, coverage);
            writeFileSync(join(traceabilityDir, 'coverage.html'), coverageContent, 'utf8');
            this.logger.info('Generated coverage.html');
        }
        catch (error) {
            this.logger.warn(`Failed to generate coverage report: ${error.message}`);
        }
    }
    formatCoverageReport(stats, _coverage) {
        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        const coverageCards = Object.entries(stats).map(([role, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : '0';
            const percentNum = parseFloat(percentage);
            const color = percentNum >= 80 ? '#28a745' : percentNum >= 50 ? '#ffc107' : '#dc3545';
            return `
        <div class="coverage-card">
          <h3>${role}</h3>
          <div class="metric-value" style="color: ${color}">${count}</div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%; background: ${color}"></div></div>
          <div class="metric-label">${percentage}% of ${total} items</div>
        </div>
      `;
        }).join('\n');
        const rows = Object.entries(stats).map(([role, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
            return `<tr><td>${role}</td><td>${count}</td><td>${percentage}%</td></tr>`;
        }).join('\n');
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traceability Coverage Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 0; margin-bottom: 30px; }
    header h1 { margin: 0; font-size: 2rem; }
    .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .coverage-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .metric-value { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }
    .progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; margin: 15px 0; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <header><div class="container"><h1>Traceability Coverage Report</h1></div></header>
  <div class="container">
    <h2>Items by Role</h2>
    <div class="coverage-grid">${coverageCards}</div>
    <h2>Summary</h2>
    <p>Total: <strong>${total}</strong> items</p>
    <table><thead><tr><th>Role</th><th>Count</th><th>Percentage</th></tr></thead><tbody>${rows}</tbody></table>
    <footer><p>Antora Requirements Traceability Extension</p></footer>
  </div>
</body>
</html>
    `;
    }
    generateIndexContent(matrixNames) {
        const formats = this.config.matrixFormats;
        const links = matrixNames.flatMap(name => {
            const safeName = name.replace(/[^a-zA-Z0-9-]/g, '-').toLowerCase();
            const displayName = name.replace(/-/g, ' ');
            return formats.map(f => `<li><a href="matrix-${safeName}.${f}">${displayName} (${f.toUpperCase()})</a></li>`);
        }).join('\n');
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requirements Traceability</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 0; margin-bottom: 30px; }
    header h1 { margin: 0; font-size: 2rem; }
    .card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .card ul { list-style: none; padding: 0; margin: 0; }
    .card li { padding: 10px 0; border-bottom: 1px solid #eee; }
    .card li:last-child { border-bottom: none; }
    .card a { color: #007bff; text-decoration: none; display: block; }
    footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <header><div class="container"><h1>Requirements Traceability</h1></div></header>
  <div class="container">
    <div class="card"><h2>Traceability Artifacts</h2><p>Browse traceability matrices and reports:</p><ul>${links}</ul></div>
    <footer><p>Antora Requirements Traceability Extension</p></footer>
  </div>
</body>
</html>
    `;
    }
    registerNavigationEnhancer() {
        if (!this.config.includeInNavigation)
            return;
        this.context.on('beforeSiteGenerated', () => {
            this.logger.info('Enhanced navigation with traceability links');
        });
    }
    getTraceabilityExtension() {
        if (!this.traceability) {
            throw new Error('Traceability extension not initialized');
        }
        return this.traceability;
    }
}
function register(context) {
    new AntoraTraceabilityExtension(context);
}
function createAntoraExtension(context) {
    return new AntoraTraceabilityExtension(context);
}
export { register, createAntoraExtension };
export default { register };
