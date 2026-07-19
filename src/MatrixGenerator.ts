import type { TraceabilityGraph } from './TraceabilityGraph.js';
import type {
  CoverageReport,
  RequirementDetail,
  ImplementationDetail,
  TestDetail,
  TraceabilityMatrix,
  DesignTraceabilityMatrix,
  DetailedTraceabilityMatrix,
} from './types.js';

export class MatrixGenerator {
  constructor(private readonly graph: TraceabilityGraph) {}

  generateMatrix(type: string = 'req-impl'): TraceabilityMatrix | DesignTraceabilityMatrix {
    switch (type) {
      case 'req-impl':
        return this.generateRequirementsImplementationMatrix();
      case 'req-test':
        return this.generateTestMatrix();
      case 'req-design':
        return this.generateRequirementsDesignMatrix();
      case 'design-impl':
        return this.generateDesignImplementationMatrix();
      default:
        return this.generateRequirementsImplementationMatrix();
    }
  }

  private generateRequirementsImplementationMatrix(): TraceabilityMatrix {
    return {
      type: 'req-impl',
      coverage: this.graph.getCoverage(),
      requirements: this.graph.getAllRequirements().map(req => ({
        id: req.id,
        title: req.title,
        implementations: this.graph.getReverseRelationships(req.id, 'implements').map(r => r.fromId),
        tests: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  private generateRequirementsDesignMatrix(): TraceabilityMatrix {
    // For req-design matrix, we use RequirementRow but with designs instead of implementations
    return {
      type: 'req-design',
      coverage: this.graph.getCoverage(),
      requirements: this.graph.getAllRequirements().map(req => ({
        id: req.id,
        title: req.title,
        implementations: this.graph.getDesignsForRequirement(req.id).map(d => d.id),
        tests: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  private generateDesignImplementationMatrix(): DesignTraceabilityMatrix {
    return {
      type: 'design-impl',
      coverage: this.graph.getCoverage(),
      designs: this.graph.getAllDesigns().map(design => ({
        id: design.id,
        title: design.title,
        implementations: this.graph.getImplementationsForDesign(design.id).map(impl => impl.id),
        tests: [],
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  generateDetailedMatrix(type: string = 'full'): DetailedTraceabilityMatrix {
    return {
      type,
      coverage: this.graph.getCoverage(),
      uncoveredRequirements: this.graph.getUncoveredRequirements().map(r => r.id),
      requirements: this.getRequirementsWithDetails(),
      implementations: this.getImplementationsWithDetails(),
      tests: this.getTestsWithDetails(),
      generatedAt: new Date().toISOString(),
    };
  }

  getCoverageReport(): CoverageReport {
    return this.graph.getCoverage();
  }

  getRequirementsWithDetails(): RequirementDetail[] {
    return this.graph.getAllRequirements().map(req => ({
      id: req.id,
      title: req.title,
      status: req.status,
      satisfiedBy: this.graph.getReverseRelationships(req.id, 'satisfies').map(r => r.fromId),
      implementedBy: this.graph.getReverseRelationships(req.id, 'implements').map(r => r.fromId),
      testedBy: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
      verifiedBy: this.graph.getReverseRelationships(req.id, 'verifies').map(r => r.fromId),
      documentedBy: this.graph.getReverseRelationships(req.id, 'documents').map(r => r.fromId),
    }));
  }

  getImplementationsWithDetails(): ImplementationDetail[] {
    return this.graph.getAllImplementations().map(imp => ({
      id: imp.id,
      title: imp.title,
      satisfies: this.graph.getRelationships(imp.id, 'satisfies').map(r => r.targetId),
      testedBy: this.graph.getReverseRelationships(imp.id, 'tests').map(r => r.fromId),
    }));
  }

  getTestsWithDetails(): TestDetail[] {
    return this.graph.getAllTests().map(test => ({
      id: test.id,
      title: test.title,
      verifies: this.graph.getRelationships(test.id, 'verifies').map(r => r.targetId),
      tests: this.graph.getRelationships(test.id, 'tests').map(r => r.targetId),
    }));
  }

  /**
   * Generate a Requirements-to-Test matrix specifically.
   */
  generateTestMatrix(): TraceabilityMatrix {
    return {
      type: 'req-test',
      coverage: this.graph.getCoverage(),
      requirements: this.graph.getAllRequirements().map(req => ({
        id: req.id,
        title: req.title,
        implementations: this.graph.getReverseRelationships(req.id, 'implements').map(r => r.fromId),
        tests: this.graph.getReverseRelationships(req.id, 'tests').map(r => r.fromId),
      })),
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Export the traceability matrix as CSV format.
   * Generates a Requirements-to-Implementation matrix with coverage info.
   */
  exportToCSV(type: string = 'req-impl'): string {
    const matrix = type === 'req-test' ? this.generateTestMatrix() : this.generateMatrix(type);
    const lines: string[] = [];

    if ('designs' in matrix) {
      // Design-Implementation matrix
      const m = matrix as DesignTraceabilityMatrix;
      lines.push('Design ID,Design Title,Implementations,Tests,Status');
      for (const design of m.designs) {
        const impls = design.implementations.join(';');
        const tests = design.tests.join(';');
        const hasImpl = design.implementations.length > 0;
        const status = hasImpl ? '✓ Complete' : '✗ Missing';
        const escapedTitle = design.title.includes(',') ? `"${design.title}"` : design.title;
        lines.push(`${design.id},"${escapedTitle}","${impls}","${tests}",${status}`);
      }
      lines.push('');
      lines.push(`Total Designs,${m.designs.length}`);
    } else {
      // Requirements matrix (req-impl or req-test)
      const m = matrix as TraceabilityMatrix;
      lines.push('Requirement ID,Requirement Title,Implementations,Tests,Status');
      for (const req of m.requirements) {
        const impls = req.implementations.join(';');
        const tests = req.tests.join(';');
        const hasImpl = req.implementations.length > 0;
        const hasTest = req.tests.length > 0;
        const status = hasImpl && hasTest ? '✓ Complete' : hasImpl ? '⚠ Partial' : '✗ Missing';
        const escapedTitle = req.title.includes(',') ? `"${req.title}"` : req.title;
        lines.push(`${req.id},"${escapedTitle}","${impls}","${tests}",${status}`);
      }
      lines.push('');
      lines.push(`Total Requirements,${m.requirements.length}`);
      lines.push(`Requirements with Implementation,${m.coverage.requirementsWithImplementation}`);
      lines.push(`Requirements with Tests,${m.coverage.requirementsWithTests}`);
      lines.push(`Implementation Coverage,${m.coverage.implementationCoverage}%`);
      lines.push(`Test Coverage,${m.coverage.testCoverage}%`);
    }

    return lines.join('\n');

    return lines.join('\n');
  }

  /**
   * Export the traceability matrix as HTML format.
   * Generates a styled HTML table with coverage information.
   */
  exportToHTML(type: string = 'req-impl'): string {
    const matrix = type === 'req-test' ? this.generateTestMatrix() : this.generateMatrix(type);
    const html: string[] = [];

    if ('designs' in matrix) {
      return this.exportDesignMatrixToHTML(matrix as DesignTraceabilityMatrix, type);
    }

    // Start HTML document
    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push(`  <title>Traceability Matrix: ${type}</title>`);
    html.push('  <style>');
    html.push('    :root {');
    html.push('      --primary-color: #007bff;');
    html.push('      --success-color: #28a745;');
    html.push('      --warning-color: #ffc107;');
    html.push('      --danger-color: #dc3545;');
    html.push('      --light-bg: #f8f9fa;');
    html.push('    }');
    html.push('    body {');
    html.push('      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;');
    html.push('      margin: 0;');
    html.push('      padding: 20px;');
    html.push('      background-color: #f5f5f5;');
    html.push('    }');
    html.push('    .container { max-width: 1200px; margin: 0 auto; }');
    html.push('    header {');
    html.push('      background: linear-gradient(135deg, var(--primary-color), #0056b3);');
    html.push('      color: white;');
    html.push('      padding: 30px 0;');
    html.push('      margin-bottom: 30px;');
    html.push('    }');
    html.push('    header h1 { margin: 0; font-size: 2rem; }');
    html.push('    header .subtitle { opacity: 0.9; font-size: 1.1rem; }');
    html.push('    .nav-breadcrumb {');
    html.push('      background: white;');
    html.push('      padding: 15px 20px;');
    html.push('      border-radius: 5px;');
    html.push('      margin-bottom: 20px;');
    html.push('      box-shadow: 0 2px 4px rgba(0,0,0,0.1);');
    html.push('    }');
    html.push('    .nav-breadcrumb a { color: var(--primary-color); text-decoration: none; }');
    html.push('    table {');
    html.push('      border-collapse: collapse;');
    html.push('      width: 100%;');
    html.push('      margin: 20px 0;');
    html.push('      background: white;');
    html.push('      border-radius: 8px;');
    html.push('      overflow: hidden;');
    html.push('      box-shadow: 0 2px 8px rgba(0,0,0,0.1);');
    html.push('    }');
    html.push('    th, td {');
    html.push('      border: 1px solid #dee2e6;');
    html.push('      padding: 12px 15px;');
    html.push('      text-align: left;');
    html.push('    }');
    html.push('    th {');
    html.push('      background-color: var(--primary-color);');
    html.push('      color: white;');
    html.push('      font-weight: 600;');
    html.push('      text-transform: uppercase;');
    html.push('      font-size: 0.85rem;');
    html.push('      letter-spacing: 0.5px;');
    html.push('    }');
    html.push('    tr:nth-child(even) { background-color: #f8f9fa; }');
    html.push('    tr:hover { background-color: #e9ecef; }');
    html.push('    .status-badge {');
    html.push('      display: inline-block;');
    html.push('      padding: 4px 10px;');
    html.push('      border-radius: 12px;');
    html.push('      font-size: 0.75rem;');
    html.push('      font-weight: bold;');
    html.push('      text-transform: uppercase;');
    html.push('    }');
    html.push('    .status-complete { background: #d4edda; color: #155724; }');
    html.push('    .status-partial { background: #fff3cd; color: #856404; }');
    html.push('    .status-missing { background: #f8d7da; color: #721c24; }');
    html.push('    .summary {');
    html.push('      background: white;');
    html.push('      padding: 25px;');
    html.push('      margin: 20px 0;');
    html.push('      border-radius: 8px;');
    html.push('      box-shadow: 0 2px 8px rgba(0,0,0,0.1);');
    html.push('    }');
    html.push('    .summary h2 { margin-top: 0; color: #333; }');
    html.push('    .summary table { margin: 0; }');
    html.push('    .summary th { background: var(--light-bg); color: #333; }');
    html.push('    .summary td { font-weight: 600; }');
    html.push('    footer {');
    html.push('      text-align: center;');
    html.push('      padding: 20px;');
    html.push('      color: #666;');
    html.push('      font-size: 0.85rem;');
    html.push('    }');
    html.push('    @media (max-width: 768px) {');
    html.push('      th, td { padding: 8px 10px; font-size: 0.9rem; }');
    html.push('      header h1 { font-size: 1.5rem; }');
    html.push('    }');
    html.push('  </style>');
    html.push('</head>');
    html.push('<body>');
    html.push('  <header>');
    html.push('    <div class="container">');
    html.push(`      <h1>Traceability Matrix: ${type}</h1>`);
    html.push('      <p class="subtitle">Requirements Traceability Extension</p>');
    html.push('    </div>');
    html.push('  </header>');
    html.push('  <div class="container">');
    html.push('    <nav class="nav-breadcrumb">');
    html.push('      <a href="../">← Back to Documentation</a>');
    html.push('    </nav>');

    // Matrix table
    html.push('    <table>');
    html.push('      <thead>');
    html.push('        <tr>');
    html.push('          <th>Requirement ID</th>');
    html.push('          <th>Title</th>');
    html.push('          <th>Implementations</th>');
    html.push('          <th>Tests</th>');
    html.push('          <th>Status</th>');
    html.push('        </tr>');
    html.push('      </thead>');
    html.push('      <tbody>');

    // Data rows
    for (const req of matrix.requirements) {
      const impls = req.implementations.join(', ');
      const tests = req.tests.join(', ');
      const hasImpl = req.implementations.length > 0;
      const hasTest = req.tests.length > 0;
      const statusClass = hasImpl && hasTest ? 'status-complete' : hasImpl ? 'status-partial' : 'status-missing';
      const statusText = hasImpl && hasTest ? '✓ Complete' : hasImpl ? '⚠ Partial' : '✗ Missing';

      html.push('        <tr>');
      html.push(`          <td><strong>${this.escapeHtml(req.id)}</strong></td>`);
      html.push(`          <td>${this.escapeHtml(req.title)}</td>`);
      html.push(`          <td>${this.escapeHtml(impls || '-')}</td>`);
      html.push(`          <td>${this.escapeHtml(tests || '-')}</td>`);
      html.push(`          <td><span class="status-badge ${statusClass}">${statusText}</span></td>`);
      html.push('        </tr>');
    }

    html.push('      </tbody>');
    html.push('    </table>');

    // Summary section
    html.push('    <div class="summary">');
    html.push('      <h2>Coverage Summary</h2>');
    html.push('      <table>');
    html.push(`        <tr><td>Total Requirements</td><td><strong>${matrix.requirements.length}</strong></td></tr>`);
    html.push(`        <tr><td>Requirements with Implementation</td><td><strong>${matrix.coverage.requirementsWithImplementation}</strong></td></tr>`);
    html.push(`        <tr><td>Requirements with Tests</td><td><strong>${matrix.coverage.requirementsWithTests}</strong></td></tr>`);
    html.push(`        <tr><td>Implementation Coverage</td><td><strong>${matrix.coverage.implementationCoverage.toFixed(1)}%</strong></td></tr>`);
    html.push(`        <tr><td>Test Coverage</td><td><strong>${matrix.coverage.testCoverage.toFixed(1)}%</strong></td></tr>`);
    html.push('      </table>');
    html.push('    </div>');
    html.push('    <footer>');
    html.push('      <p>Generated by Antora Requirements Traceability Extension</p>');
    html.push('    </footer>');
    html.push('  </div>');

    // End HTML document
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  private exportDesignMatrixToHTML(matrix: DesignTraceabilityMatrix, type: string): string {
    const html: string[] = [];

    // Start HTML document
    html.push('<!DOCTYPE html>');
    html.push('<html lang="en">');
    html.push('<head>');
    html.push('  <meta charset="UTF-8">');
    html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    html.push(`  <title>Traceability Matrix: ${type}</title>`);
    html.push('  <style>');
    html.push('    :root {');
    html.push('      --primary-color: #007bff;');
    html.push('      --success-color: #28a745;');
    html.push('      --warning-color: #ffc107;');
    html.push('      --danger-color: #dc3545;');
    html.push('      --light-bg: #f8f9fa;');
    html.push('    }');
    html.push('    body {');
    html.push('      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;');
    html.push('      margin: 0;');
    html.push('      padding: 20px;');
    html.push('      background-color: #f5f5f5;');
    html.push('    }');
    html.push('    .container { max-width: 1200px; margin: 0 auto; }');
    html.push('    header {');
    html.push('      background: linear-gradient(135deg, var(--primary-color), #0056b3);');
    html.push('      color: white;');
    html.push('      padding: 30px 0;');
    html.push('      margin-bottom: 30px;');
    html.push('    }');
    html.push('    header h1 { margin: 0; font-size: 2rem; }');
    html.push('    header .subtitle { opacity: 0.9; font-size: 1.1rem; }');
    html.push('    table {');
    html.push('      border-collapse: collapse;');
    html.push('      width: 100%;');
    html.push('      margin: 20px 0;');
    html.push('      background: white;');
    html.push('      border-radius: 8px;');
    html.push('      overflow: hidden;');
    html.push('      box-shadow: 0 2px 8px rgba(0,0,0,0.1);');
    html.push('    }');
    html.push('    th, td {');
    html.push('      border: 1px solid #dee2e6;');
    html.push('      padding: 12px 15px;');
    html.push('      text-align: left;');
    html.push('    }');
    html.push('    th {');
    html.push('      background-color: var(--primary-color);');
    html.push('      color: white;');
    html.push('      font-weight: 600;');
    html.push('      text-transform: uppercase;');
    html.push('      font-size: 0.85rem;');
    html.push('      letter-spacing: 0.5px;');
    html.push('    }');
    html.push('    tr:nth-child(even) { background-color: #f8f9fa; }');
    html.push('    tr:hover { background-color: #e9ecef; }');
    html.push('    .status-badge {');
    html.push('      display: inline-block;');
    html.push('      padding: 4px 10px;');
    html.push('      border-radius: 12px;');
    html.push('      font-size: 0.75rem;');
    html.push('      font-weight: bold;');
    html.push('      text-transform: uppercase;');
    html.push('    }');
    html.push('    .status-complete { background: #d4edda; color: #155724; }');
    html.push('    .status-missing { background: #f8d7da; color: #721c24; }');
    html.push('    .summary {');
    html.push('      background: white;');
    html.push('      padding: 25px;');
    html.push('      margin: 20px 0;');
    html.push('      border-radius: 8px;');
    html.push('      box-shadow: 0 2px 8px rgba(0,0,0,0.1);');
    html.push('    }');
    html.push('    .summary h2 { margin-top: 0; color: #333; }');
    html.push('    .summary table { margin: 0; }');
    html.push('    .summary th { background: var(--light-bg); color: #333; }');
    html.push('    .summary td { font-weight: 600; }');
    html.push('    footer {');
    html.push('      text-align: center;');
    html.push('      padding: 20px;');
    html.push('      color: #666;');
    html.push('      font-size: 0.85rem;');
    html.push('    }');
    html.push('  </style>');
    html.push('</head>');
    html.push('<body>');
    html.push('  <header>');
    html.push('    <div class="container">');
    html.push(`      <h1>Traceability Matrix: ${type}</h1>`);
    html.push('      <p class="subtitle">Requirements Traceability Extension</p>');
    html.push('    </div>');
    html.push('  </header>');
    html.push('  <div class="container">');
    html.push('    <nav class="nav-breadcrumb">');
    html.push('      <a href="../">← Back to Documentation</a>');
    html.push('    </nav>');

    // Matrix table
    html.push('    <table>');
    html.push('      <thead>');
    html.push('        <tr>');
    html.push('          <th>Design ID</th>');
    html.push('          <th>Title</th>');
    html.push('          <th>Implementations</th>');
    html.push('          <th>Tests</th>');
    html.push('          <th>Status</th>');
    html.push('        </tr>');
    html.push('      </thead>');
    html.push('      <tbody>');

    // Data rows
    for (const design of matrix.designs) {
      const impls = design.implementations.join(', ');
      const tests = design.tests.join(', ');
      const hasImpl = design.implementations.length > 0;
      const statusClass = hasImpl ? 'status-complete' : 'status-missing';
      const statusText = hasImpl ? '✓ Complete' : '✗ Missing';

      html.push('        <tr>');
      html.push(`          <td><strong>${this.escapeHtml(design.id)}</strong></td>`);
      html.push(`          <td>${this.escapeHtml(design.title)}</td>`);
      html.push(`          <td>${this.escapeHtml(impls || '-')}</td>`);
      html.push(`          <td>${this.escapeHtml(tests || '-')}</td>`);
      html.push(`          <td><span class="status-badge ${statusClass}">${statusText}</span></td>`);
      html.push('        </tr>');
    }

    html.push('      </tbody>');
    html.push('    </table>');

    // Summary section
    html.push('    <div class="summary">');
    html.push('      <h2>Coverage Summary</h2>');
    html.push('      <table>');
    html.push(`        <tr><td>Total Designs</td><td><strong>${matrix.designs.length}</strong></td></tr>`);
    html.push('      </table>');
    html.push('    </div>');

    // Footer
    html.push('    <footer>');
    html.push('      Generated by Antora Requirements Traceability Extension');
    html.push('    </footer>');
    html.push('  </div>');

    // End HTML document
    html.push('</body>');
    html.push('</html>');

    return html.join('\n');
  }

  /** Escape HTML special characters */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
}
