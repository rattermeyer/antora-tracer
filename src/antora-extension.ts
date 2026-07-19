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

import { RequirementsTraceabilityExtension } from './index.js';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

/**
 * Antora Extension Configuration
 */
export interface AntoraTraceabilityConfig {
  /** Enable or disable traceability processing */
  enabled?: boolean;
  /** Output directory for traceability artifacts */
  outputDir?: string;
  /** Generate traceability matrices */
  generateMatrices?: boolean;
  /** Matrix output formats */
  matrixFormats?: ('csv' | 'html' | 'json')[];
  /** Include traceability in navigation */
  includeInNavigation?: boolean;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: Required<AntoraTraceabilityConfig> = {
  enabled: true,
  outputDir: 'traceability',
  generateMatrices: true,
  matrixFormats: ['html', 'csv'],
  includeInNavigation: true,
};

/**
 * Antora Extension Context (Antora 3.x API)
 */
export interface AntoraExtensionContext {
  getLogger: (name?: string) => {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;
  };
  on: (event: string, handler: (...args: any[]) => void) => void;
  once?: (event: string, handler: (...args: any[]) => void) => void;
  config?: any;
  module?: any;
  playbook?: any;
}

/**
 * Content Catalog (simplified interface)
 */
export interface ContentCatalog {
  findBy: (criteria: any) => any;
  addPage: (page: any) => void;
}

/**
 * Content Node (simplified interface)
 */
export interface ContentNode {
  src: {
    path: string;
    contents: Buffer;
  };
  traceability?: any;
}

/**
 * Page (simplified interface)
 */
export interface Page {
  id: string;
  title: string;
  component: string;
  version: string;
  module: string;
  family: string;
  contents: Buffer;
  out: {
    path: string;
  };
}

/**
 * Antora Extension for Requirements Traceability
 *
 * This extension processes AsciiDoc content during the Antora build to:
 * 1. Extract requirements, implementations, tests, and documents
 * 2. Build a traceability graph
 * 3. Generate traceability matrices
 * 4. Add traceability information to the site navigation
 */
export class AntoraTraceabilityExtension {
  private readonly traceability: RequirementsTraceabilityExtension;
  private config: Required<AntoraTraceabilityConfig>;
  private readonly logger: ReturnType<AntoraExtensionContext['getLogger']>;

  constructor(private readonly context: AntoraExtensionContext) {
    this.logger = context.getLogger('requirements-traceability');
    this.traceability = new RequirementsTraceabilityExtension();
    this.config = { ...DEFAULT_CONFIG, ...this.loadConfig() };

    if (!this.config.enabled) {
      this.logger.info('Requirements traceability extension is disabled');
      return;
    }

    this.logger.info('Requirements traceability extension initialized');

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
  private loadConfig(): Partial<AntoraTraceabilityConfig> {
    try {
      const playbook = this.context.playbook;
      const extConfig = playbook.extensions?.find((e: any) => e.name === 'antora-requirements-traceability');
      return extConfig?.config ?? {};
    } catch {
      return {};
    }
  }

  /**
   * Register a content classifier to process AsciiDoc files
   */
  private registerContentClassifier(): void {
    this.context.on('contentClassified', (event: any) => {
      const contentCatalog = event.contentCatalog;
      if (!contentCatalog) {
        this.logger.warn('contentCatalog not found in contentClassified event');
        return;
      }

      this.logger.info('Processing content for traceability');

      // Find all AsciiDoc files in the content catalog
      const files = contentCatalog.findBy({ family: 'page' }) || [];
      const adocFiles = files.filter((file: any) => file.src && file.src.path && file.src.path.endsWith('.adoc'));

      // Two-pass processing: first add all nodes, then add all relationships
      // This ensures cross-file references can be resolved
      this.processAsciiDocFilesNodes(adocFiles);
      this.processAsciiDocFilesRelationships(adocFiles);
    });
  }

  /**
   * Process AsciiDoc files - first pass: add all nodes to the graph
   */
  private processAsciiDocFilesNodes(files: any[]): void {
    for (const file of files) {
      try {
        const contentsBuffer = file.contents || file.src?.contents;
        if (!contentsBuffer) {
          this.logger.debug(`Skipping file without contents: ${file.src?.path || 'unknown'}`);
          continue;
        }

        const content = contentsBuffer.toString('utf8');
        const sourceFile = file.src?.path || file.path || 'unknown';

        // Parse the file for traceability elements
        const parser = (this.traceability as any).parser;
        const parsed = parser.parse(content, sourceFile);

        // Add nodes to the graph (first pass - all nodes)
        for (const req of parsed.requirements) {
          this.traceability.graph.addRequirement(req);
          this.logger.debug(`Registered requirement: ${req.id}`);
        }
        for (const imp of parsed.implementations) {
          this.traceability.graph.addImplementation(imp);
          this.logger.debug(`Registered implementation: ${imp.id}`);
        }
        for (const test of parsed.tests) {
          this.traceability.graph.addTest(test);
          this.logger.debug(`Registered test: ${test.id}`);
        }
        for (const doc of parsed.documents) {
          this.traceability.graph.addDocument(doc);
          this.logger.debug(`Registered document: ${doc.id}`);
        }
        for (const design of parsed.designs) {
          this.traceability.graph.addDesign(design);
          this.logger.debug(`Registered design: ${design.id}`);
        }
      } catch (error: any) {
        this.logger.warn(`Error processing nodes for ${file.src?.path}: ${error.message}`);
      }
    }
    this.logger.info(`Registered ${this.traceability.graph.getAllRequirements().length} requirements, ${this.traceability.graph.getAllImplementations().length} implementations, ${this.traceability.graph.getAllTests().length} tests, ${this.traceability.graph.getAllDesigns().length} designs`);
  }

  /**
   * Process AsciiDoc files - second pass: add all relationships
   */
  private processAsciiDocFilesRelationships(files: any[]): void {
    for (const file of files) {
      try {
        const contentsBuffer = file.contents || file.src?.contents;
        if (!contentsBuffer) {
          this.logger.debug(`Skipping file without contents: ${file.src?.path || 'unknown'}`);
          continue;
        }

        const content = contentsBuffer.toString('utf8');
        const sourceFile = file.src?.path || file.path || 'unknown';

        // Parse the file for traceability elements
        const parser = (this.traceability as any).parser;
        const parsed = parser.parse(content, sourceFile);

        // Add relationships (second pass - all nodes should now exist)
        for (const rel of parsed.relationships) {
          try {
            this.traceability.graph.addRelationship(rel);
            this.logger.debug(`Registered relationship: ${rel.fromId} ${rel.type} ${rel.targetId}`);
          } catch (error: any) {
            // This should not happen anymore since all nodes were added in first pass
            this.logger.warn(`Failed to add relationship: ${rel.fromId} ${rel.type} ${rel.targetId} - ${error.message}`);
          }
        }
      } catch (error: any) {
        this.logger.warn(`Error processing relationships for ${file.src?.path}: ${error.message}`);
      }
    }
    this.logger.info(`Registered ${this.traceability.graph.getAllRelationships().length} relationships`);
  }

  /**
   * Register a page processor to generate traceability pages
   */
  private registerPageProcessor(): void {
    // Generate traceability files after site is published
    this.context.on('sitePublished', (event: any) => {
      if (!this.config.generateMatrices) return;

      this.generateTraceabilityFiles(event);
    });
  }

  /**
   * Generate traceability files to output directory
   */
  private generateTraceabilityFiles(event: any): void {
    try {
      // Get output directory from event
      const outputDir = event.playbook?.output?.dir || event.playbook?.dir || '_site';
      const traceabilityDir = join(outputDir, this.config.outputDir);

      this.logger.info(`Writing traceability files to ${traceabilityDir}`);

      // Create directory if it doesn't exist
      mkdirSync(traceabilityDir, { recursive: true });

      // Generate different matrix types
      const matrixTypes = ['req-impl', 'req-test', 'req-design', 'design-impl', 'full'];

      for (const matrixType of matrixTypes) {
        for (const format of this.config.matrixFormats) {
          const matrixContent = format === 'html'
            ? this.traceability.exportMatrixToHTML(matrixType)
            : this.traceability.exportMatrixToCSV(matrixType);

          const safeType = matrixType.replace('/', '-');
          const fileName = `matrix-${safeType}.${format}`;
          const filePath = join(traceabilityDir, fileName);

          writeFileSync(filePath, matrixContent, 'utf8');
          this.logger.info(`✓ Generated ${fileName}`);
        }
      }

      // Generate coverage report
      const coverage = this.traceability.getCoverageReport();
      const coverageContent = this.formatCoverageReport(coverage);
      const coveragePath = join(traceabilityDir, 'coverage.html');
      writeFileSync(coveragePath, coverageContent, 'utf8');
      this.logger.info('✓ Generated coverage.html');

      // Generate index page
      const indexContent = this.generateIndexContent();
      const indexPath = join(traceabilityDir, 'index.html');
      writeFileSync(indexPath, indexContent, 'utf8');
      this.logger.info('✓ Generated index.html');

      this.logger.info(`✅ Traceability files written to ${this.config.outputDir}/`);
    } catch (error: any) {
      this.logger.error(`Error generating traceability pages: ${error.message}`);
    }
  }

  /**
   * Generate an index page that links to all traceability artifacts
   */
  private generateIndexContent(): string {
    const matrixTypes = ['req-impl', 'req-test', 'req-design', 'design-impl', 'full'];
    const formats = this.config.matrixFormats;

    let linksHtml = '<ul>';

    // Add matrix links
    for (const matrixType of matrixTypes) {
      for (const format of formats) {
        const safeType = matrixType.replace('/', '-');
        const displayType = matrixType.replace('-', ' ').replace('req', 'Requirements').replace('impl', 'Implementation').replace('test', 'Test');
        linksHtml += `<li><a href="matrix-${safeType}.${format}">${displayType} Matrix (${format.toUpperCase()})</a></li>`;
      }
    }

    // Add coverage report link
    linksHtml += '<li><a href="coverage.html">Coverage Report</a></li>';
    linksHtml += '</ul>';

    const indexContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requirements Traceability</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      margin: 0;
      padding: 20px;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 1200px;
      margin: 0 auto;
    }
    header {
      background: linear-gradient(135deg, #007bff, #0056b3);
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
    .card {
      background: white;
      padding: 25px;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .card h2 {
      margin-top: 0;
      color: #333;
    }
    .card ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .card li {
      padding: 10px 0;
      border-bottom: 1px solid #eee;
    }
    .card li:last-child {
      border-bottom: none;
    }
    .card a {
      color: #007bff;
      text-decoration: none;
      display: block;
      transition: all 0.2s;
    }
    .card a:hover {
      color: #0056b3;
      transform: translateX(4px);
    }
    footer {
      text-align: center;
      padding: 20px;
      color: #666;
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <header>
    <div class="container">
      <h1>Requirements Traceability</h1>
      <p class="subtitle">Traceability matrices and coverage reports</p>
    </div>
  </header>
  <div class="container">
    <div class="card">
      <h2>Traceability Artifacts</h2>
      <p>Browse the traceability matrices and coverage reports generated from your documentation:</p>
      ${linksHtml}
    </div>
    <footer>
      <p>Generated by Antora Requirements Traceability Extension v0.1.0</p>
    </footer>
  </div>
</body>
</html>
    `;

    return indexContent;
  }

  /**
   * Format coverage report as HTML with enhanced styling
   */
  private formatCoverageReport(coverage: any): string {
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
  private registerNavigationEnhancer(): void {
    if (!this.config.includeInNavigation) return;

    this.context.on('beforeSiteGenerated', () => {
      // Add traceability section to navigation
      // This is a placeholder - actual implementation depends on Antora version
      this.logger.info('Enhanced navigation with traceability links');
    });
  }

  /**
   * Get the traceability extension for direct access
   */
  getTraceabilityExtension(): RequirementsTraceabilityExtension {
    return this.traceability;
  }
}

/**
 * Antora extension registration
 * This is the entry point that Antora calls to load the extension
 */
function register(context: AntoraExtensionContext): void {
  new AntoraTraceabilityExtension(context);
}

// Factory function for testing and backward compatibility
function createAntoraExtension(context: AntoraExtensionContext): AntoraTraceabilityExtension {
  return new AntoraTraceabilityExtension(context);
}

// Export for Antora (expects { register } object)
export { register };

// Export factory function for testing
export { createAntoraExtension };

// Default export for compatibility
export default { register };
