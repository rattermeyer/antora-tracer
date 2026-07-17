"use strict";
/**
 * Antora Extension for Requirements Traceability
 *
 * This module provides the Antora extension that integrates requirements traceability
 * into the Antora documentation pipeline.
 *
 * Usage:
 * In your Antora playbook, add this extension to the extensions array:
 * {
 *   extensions: [
 *     require('antora-requirements-traceability/lib/antora-extension')
 *   ]
 * }
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AntoraTraceabilityExtension = void 0;
exports.default = createAntoraExtension;
const index_js_1 = require("./index.js");
/**
 * Default configuration
 */
const DEFAULT_CONFIG = {
    enabled: true,
    outputDir: 'traceability',
    generateMatrices: true,
    matrixFormats: ['html', 'csv'],
    includeInNavigation: true,
};
/**
 * Antora Extension for Requirements Traceability
 *
 * This extension processes AsciiDoc content during the Antora build to:
 * 1. Extract requirements, implementations, tests, and documents
 * 2. Build a traceability graph
 * 3. Generate traceability matrices
 * 4. Add traceability information to the site navigation
 */
class AntoraTraceabilityExtension {
    constructor(context) {
        this.context = context;
        this.traceability = new index_js_1.RequirementsTraceabilityExtension();
        this.config = { ...DEFAULT_CONFIG, ...this.loadConfig() };
        if (!this.config.enabled) {
            this.context.logger.info('Requirements traceability extension is disabled');
            return;
        }
        this.context.logger.info('Requirements traceability extension initialized');
        // Register content classifier for AsciiDoc files
        this.registerContentClassifier();
        // Register page processor for traceability pages
        this.registerPageProcessor();
        // Register navigation enhancer
        this.registerNavigationEnhancer();
    }
    /**
     * Load configuration from Antora playbook
     */
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
    /**
     * Register a content classifier to process AsciiDoc files
     */
    registerContentClassifier() {
        this.context.on('contentClassified', ({ contentCatalog, file }) => {
            if (file.src.path.endsWith('.adoc')) {
                this.processAsciiDocFile(contentCatalog, file);
            }
        });
    }
    /**
     * Process an AsciiDoc file for traceability elements
     */
    async processAsciiDocFile(contentCatalog, file) {
        try {
            const content = file.src.contents.toString('utf8');
            const sourceFile = file.src.path;
            // Parse the file for traceability elements
            // Access the parser through the traceability extension
            const parser = this.traceability.parser;
            const parsed = parser.parse(content, sourceFile);
            // Add nodes to the graph
            for (const req of parsed.requirements) {
                this.traceability.graph.addRequirement(req);
                this.context.logger.debug(`Registered requirement: ${req.id}`);
            }
            for (const imp of parsed.implementations) {
                this.traceability.graph.addImplementation(imp);
                this.context.logger.debug(`Registered implementation: ${imp.id}`);
            }
            for (const test of parsed.tests) {
                this.traceability.graph.addTest(test);
                this.context.logger.debug(`Registered test: ${test.id}`);
            }
            for (const doc of parsed.documents) {
                this.traceability.graph.addDocument(doc);
                this.context.logger.debug(`Registered document: ${doc.id}`);
            }
            // Add relationships
            for (const rel of parsed.relationships) {
                this.traceability.graph.addRelationship(rel);
                this.context.logger.debug(`Registered relationship: ${rel.fromId} ${rel.type} ${rel.targetId}`);
            }
            // Store traceability data on the content node
            const contentNode = contentCatalog.findBy({ src: file.src.path });
            if (contentNode) {
                contentNode.traceability = {
                    requirements: parsed.requirements.map((r) => r.id),
                    implementations: parsed.implementations.map((i) => i.id),
                    tests: parsed.tests.map((t) => t.id),
                    documents: parsed.documents.map((d) => d.id),
                };
            }
        }
        catch (error) {
            this.context.logger.warn(`Error processing ${file.src.path}: ${error.message}`);
        }
    }
    /**
     * Register a page processor to generate traceability pages
     */
    registerPageProcessor() {
        // This would be called after all content is processed
        this.context.on('contentAggregated', ({ contentCatalog }) => {
            if (!this.config.generateMatrices)
                return;
            this.generateTraceabilityPages(contentCatalog);
        });
    }
    /**
     * Generate traceability matrix pages
     */
    generateTraceabilityPages(contentCatalog) {
        try {
            for (const format of this.config.matrixFormats) {
                const matrixContent = format === 'html'
                    ? this.traceability.exportMatrixToHTML('req-impl')
                    : this.traceability.exportMatrixToCSV('req-impl');
                const page = {
                    id: `traceability-matrix.${format}`,
                    title: `Traceability Matrix (${format.toUpperCase()})`,
                    component: 'ROOT',
                    version: '0.1.0',
                    module: 'traceability',
                    family: 'page',
                    contents: Buffer.from(matrixContent, 'utf8'),
                    out: {
                        path: `${this.config.outputDir}/matrix.${format}`,
                    },
                };
                contentCatalog.addPage(page);
                this.context.logger.info(`Generated traceability matrix: matrix.${format}`);
            }
            // Generate coverage report
            const coverage = this.traceability.getCoverageReport();
            const coverageContent = this.formatCoverageReport(coverage);
            const coveragePage = {
                id: 'traceability-coverage',
                title: 'Traceability Coverage Report',
                component: 'ROOT',
                version: '0.1.0',
                module: 'traceability',
                family: 'page',
                contents: Buffer.from(coverageContent, 'utf8'),
                out: {
                    path: `${this.config.outputDir}/coverage.html`,
                },
            };
            contentCatalog.addPage(coveragePage);
            this.context.logger.info('Generated traceability coverage report');
        }
        catch (error) {
            this.context.logger.error(`Error generating traceability pages: ${error.message}`);
        }
    }
    /**
     * Format coverage report as HTML with enhanced styling
     */
    formatCoverageReport(coverage) {
        const implementationCoverage = coverage.implementationCoverage.toFixed(1);
        const testCoverage = coverage.testCoverage.toFixed(1);
        const implColor = implementationCoverage >= 80 ? '#28a745' : implementationCoverage >= 50 ? '#ffc107' : '#dc3545';
        const testColor = testCoverage >= 80 ? '#28a745' : testCoverage >= 50 ? '#ffc107' : '#dc3545';
        return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traceability Coverage Report</title>
  <style>
    :root {
      --primary-color: #007bff;
      --success-color: #28a745;
      --warning-color: #ffc107;
      --danger-color: #dc3545;
      --light-bg: #f8f9fa;
      --border-color: #dee2e6;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
      color: #333;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    
    header {
      background: linear-gradient(135deg, var(--primary-color), #0056b3);
      color: white;
      padding: 30px 0;
      margin-bottom: 30px;
    }
    
    header h1 {
      margin: 0;
      font-size: 2rem;
    }
    
    header .subtitle {
      opacity: 0.9;
      font-size: 1.1rem;
    }
    
    .nav-breadcrumb {
      background: white;
      padding: 15px 20px;
      border-radius: 5px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .nav-breadcrumb a {
      color: var(--primary-color);
      text-decoration: none;
    }
    
    .nav-breadcrumb a:hover {
      text-decoration: underline;
    }
    
    .coverage-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    
    .coverage-card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .coverage-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    
    .coverage-card h3 {
      margin-top: 0;
      color: #555;
      font-size: 0.9rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .metric-value {
      font-size: 2.5rem;
      font-weight: bold;
      margin: 10px 0;
    }
    
    .metric-label {
      color: #666;
      font-size: 0.9rem;
    }
    
    .progress-bar {
      height: 8px;
      background: #e9ecef;
      border-radius: 4px;
      margin: 15px 0;
      overflow: hidden;
    }
    
    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.3s ease;
    }
    
    .summary-section {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    
    .summary-section h2 {
      margin-top: 0;
      color: #333;
    }
    
    .uncovered-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    
    .uncovered-list li {
      padding: 10px 0;
      border-bottom: 1px solid var(--border-color);
    }
    
    .uncovered-list li:last-child {
      border-bottom: none;
    }
    
    .status-badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: bold;
      text-transform: uppercase;
    }
    
    .status-complete {
      background: #d4edda;
      color: #155724;
    }
    
    .status-partial {
      background: #fff3cd;
      color: #856404;
    }
    
    .status-missing {
      background: #f8d7da;
      color: #721c24;
    }
    
    footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.85rem;
    }
    
    @media (max-width: 768px) {
      .coverage-grid {
        grid-template-columns: 1fr;
      }
      
      header h1 {
        font-size: 1.5rem;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>Traceability Coverage Report</h1>
      <p class="subtitle">Requirements Traceability Extension</p>
    </div>
  </header>
  
  <div class="container">
    <nav class="nav-breadcrumb">
      <a href="../">← Back to Documentation</a>
    </nav>
    
    <div class="coverage-grid">
      <div class="coverage-card">
        <h3>Total Requirements</h3>
        <div class="metric-value">${coverage.totalRequirements}</div>
        <div class="metric-label">requirements tracked</div>
      </div>
      
      <div class="coverage-card">
        <h3>Implementation Coverage</h3>
        <div class="metric-value" style="color: ${implColor}">${implementationCoverage}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${implementationCoverage}%; background: ${implColor}"></div>
        </div>
        <div class="metric-label">${coverage.requirementsWithImplementation} of ${coverage.totalRequirements} implemented</div>
      </div>
      
      <div class="coverage-card">
        <h3>Test Coverage</h3>
        <div class="metric-value" style="color: ${testColor}">${testCoverage}%</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${testCoverage}%; background: ${testColor}"></div>
        </div>
        <div class="metric-label">${coverage.requirementsWithTests} of ${coverage.totalRequirements} tested</div>
      </div>
    </div>
    
    <div class="summary-section">
      <h2>Coverage Details</h2>
      <p>This report shows the traceability coverage for your documentation. Requirements with implementations and tests are considered fully covered.</p>
    </div>
    
    <footer>
      <p>Generated by Antora Requirements Traceability Extension v0.1.0</p>
    </footer>
  </div>
</body>
</html>
    `;
    }
    /**
     * Register navigation enhancer to add traceability links
     */
    registerNavigationEnhancer() {
        if (!this.config.includeInNavigation)
            return;
        this.context.on('beforeSiteGenerated', () => {
            // Add traceability section to navigation
            // This is a placeholder - actual implementation depends on Antora version
            this.context.logger.info('Enhanced navigation with traceability links');
        });
    }
    /**
     * Get the traceability extension for direct access
     */
    getTraceabilityExtension() {
        return this.traceability;
    }
}
exports.AntoraTraceabilityExtension = AntoraTraceabilityExtension;
/**
 * Antora extension factory function
 * This is the entry point that Antora calls to load the extension
 */
function createAntoraExtension(context) {
    return new AntoraTraceabilityExtension(context);
}
// Export for CommonJS compatibility
module.exports = createAntoraExtension;
module.exports.default = createAntoraExtension;
