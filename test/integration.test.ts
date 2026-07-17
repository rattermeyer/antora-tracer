import { expect } from 'chai';
import { RequirementsTraceabilityExtension } from '../src/index';
import { DocumentParser } from '../src/DocumentParser';
import type { Requirement } from '../src/types';

describe('Integration Tests', function() {
  let extension: InstanceType<typeof RequirementsTraceabilityExtension>;
  let parser: DocumentParser;

  beforeEach(function() {
    extension = new RequirementsTraceabilityExtension();
    parser = new DocumentParser();
  });

  afterEach(function() {
    extension.clear();
  });

  describe('End-to-End Workflow', function() {
    it('should process complete documentation with all element types', function() {
      const content = `
= My Project Documentation

== Requirements

[req, id=REQ-001, title="User Authentication", status=approved]
====
The system shall require user authentication.
====

[req, id=REQ-002, title="Data Encryption", status=approved]
====
All sensitive data must be encrypted.

depends:REQ-001[]
====

== Implementation

[imp, id=IMP-001, title="Authentication Service", status=done]
====
Implementation of user authentication.

implements:REQ-001[]
satisfies:REQ-001[]
====

[imp, id=IMP-002, title="Encryption Service", status=done]
====
Implementation of data encryption.

implements:REQ-002[]
satisfies:REQ-002[]
====

== Tests

[test, id=TEST-001, title="Authentication Tests", status=passed]
====
Unit tests for authentication.

tests:REQ-001[]
verifies:REQ-001[]
====

[test, id=TEST-002, title="Encryption Tests", status=passed]
====
Unit tests for encryption.

tests:REQ-002[]
verifies:REQ-002[]
====

== Documentation

[doc, id=DOC-001, title="API Documentation", status=published]
====
API documentation.

documents:REQ-001[]
documents:REQ-002[]
====
`;

      // Parse the content
      const parsed = parser.parse(content, 'test.adoc');

      // Verify all elements were parsed
      expect(parsed.requirements).to.have.lengthOf(2);
      expect(parsed.implementations).to.have.lengthOf(2);
      expect(parsed.tests).to.have.lengthOf(2);
      expect(parsed.documents).to.have.lengthOf(1);

      // Verify relationships were parsed
      expect(parsed.relationships.length).to.be.at.least(6);

      // Add all parsed elements to the extension
      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const test of parsed.tests) {
        extension.graph.addTest(test);
      }
      for (const doc of parsed.documents) {
        extension.graph.addDocument(doc);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Verify graph state
      const allRequirements = extension.graph.getAllRequirements();
      expect(allRequirements).to.have.lengthOf(2);

      const allImplementations = extension.graph.getAllImplementations();
      expect(allImplementations).to.have.lengthOf(2);

      const allTests = extension.graph.getAllTests();
      expect(allTests).to.have.lengthOf(2);

      const allDocuments = extension.graph.getAllDocuments();
      expect(allDocuments).to.have.lengthOf(1);

      // Verify coverage
      const coverage = extension.getCoverageReport();
      expect(coverage.totalRequirements).to.equal(2);
      expect(coverage.requirementsWithImplementation).to.equal(2);
      expect(coverage.requirementsWithTests).to.equal(2);
      expect(coverage.implementationCoverage).to.equal(100);
      expect(coverage.testCoverage).to.equal(100);

      // Verify matrix generation
      const matrix = extension.generateMatrix('req-impl');
      expect(matrix.requirements).to.have.lengthOf(2);
      expect(matrix.type).to.equal('req-impl');

      // Verify detailed matrix
      const detailedMatrix = extension.generateDetailedMatrix('full');
      expect(detailedMatrix.requirements).to.have.lengthOf(2);
      expect(detailedMatrix.implementations).to.have.lengthOf(2);
      expect(detailedMatrix.tests).to.have.lengthOf(2);

      // Verify CSV export
      const csv = extension.exportMatrixToCSV('req-impl');
      expect(csv).to.include('REQ-001');
      expect(csv).to.include('REQ-002');
      expect(csv).to.include('✓ Complete');

      // Verify HTML export
      const html = extension.exportMatrixToHTML('req-impl');
      expect(html).to.include('REQ-001');
      expect(html).to.include('REQ-002');
      expect(html).to.include('status-complete');

      // Verify validation
      const errors = extension.validate();
      expect(errors).to.be.an('array');
      expect(errors).to.have.lengthOf(0);
    });

    it('should handle multiple files with cross-references', function() {
      // File 1: Defines requirements
      const file1 = `
[req, id=REQ-001, title="Requirement 1"]
====
First requirement
====

[req, id=REQ-002, title="Requirement 2"]
====
Second requirement
====
`;

      // File 2: Defines implementations that reference requirements from file 1
      const file2 = `
[imp, id=IMP-001, title="Implementation 1"]
====
Implements requirement 1

implements:REQ-001[]
====

[imp, id=IMP-002, title="Implementation 2"]
====
Implements requirement 2

implements:REQ-002[]
====
`;

      // Parse both files
      const parsed1 = parser.parse(file1, 'file1.adoc');
      const parsed2 = parser.parse(file2, 'file2.adoc');

      // Add elements from both files
      for (const req of parsed1.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed2.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const rel of parsed2.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Verify cross-file relationships work
      const allRequirements = extension.graph.getAllRequirements();
      expect(allRequirements).to.have.lengthOf(2);

      const allImplementations = extension.graph.getAllImplementations();
      expect(allImplementations).to.have.lengthOf(2);

      // Verify relationships
      const impl1 = extension.graph.getImplementation('IMP-001');
      expect(impl1).to.not.be.undefined;

      const relationships = extension.graph.getRelationships('IMP-001');
      expect(relationships).to.have.lengthOf(1);
      expect(relationships[0].targetId).to.equal('REQ-001');

      // Verify coverage
      const coverage = extension.getCoverageReport();
      expect(coverage.totalRequirements).to.equal(2);
      expect(coverage.requirementsWithImplementation).to.equal(2);
    });

    it('should handle complex dependency chains', function() {
      const content = `
[req, id=REQ-001]
====
Base requirement
====

[req, id=REQ-002]
====
Depends on REQ-001

depends:REQ-001[]
====

[req, id=REQ-003]
====
Depends on REQ-002

depends:REQ-002[]
====

[req, id=REQ-004]
====
Depends on REQ-003

depends:REQ-003[]
====

[imp, id=IMP-001]
====
Implements REQ-004

implements:REQ-004[]
====
`;

      const parsed = parser.parse(content, 'test.adoc');

      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Verify dependency chain (following forward relationships)
      // REQ-002 depends REQ-001, REQ-003 depends REQ-002, REQ-004 depends REQ-003
      // So forward path is REQ-004 -> REQ-003 -> REQ-002 -> REQ-001
      const path = extension.findPath('REQ-004', 'REQ-001', 10);
      expect(path).to.not.be.null;
      expect(path!.length).to.equal(4);
      expect(path).to.include('REQ-001');
      expect(path).to.include('REQ-004');

      // Verify impact analysis (follows both directions)
      const impacted = extension.getImpactAnalysis('REQ-001');
      expect(impacted).to.include('REQ-002');
      expect(impacted).to.include('REQ-003');
      expect(impacted).to.include('REQ-004');
    });
  });

  describe('Different Documentation Structures', function() {
    it('should handle flat documentation structure', function() {
      // All elements in one file
      const content = `
[req, id=REQ-001]
====
Requirement
====

[imp, id=IMP-001]
====
Implementation

implements:REQ-001[]
====

[test, id=TEST-001]
====
Test

tests:REQ-001[]
====
`;

      const parsed = parser.parse(content, 'single-file.adoc');
      expect(parsed.requirements).to.have.lengthOf(1);
      expect(parsed.implementations).to.have.lengthOf(1);
      expect(parsed.tests).to.have.lengthOf(1);
      expect(parsed.relationships).to.have.lengthOf(2);
    });

    it('should handle hierarchical documentation structure', function() {
      // Simulate multiple files in a hierarchy
      const rootContent = `
[req, id=REQ-001]
====
Root requirement
====
`;

      const moduleContent = `
[imp, id=IMP-001]
====
Module implementation

implements:REQ-001[]
====
`;

      const pageContent = `
[test, id=TEST-001]
====
Page test

tests:REQ-001[]
====
`;

      const rootParsed = parser.parse(rootContent, 'root.adoc');
      const moduleParsed = parser.parse(moduleContent, 'module/page.adoc');
      const pageParsed = parser.parse(pageContent, 'module/page/test.adoc');

      // Add all elements
      for (const req of rootParsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of moduleParsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const test of pageParsed.tests) {
        extension.graph.addTest(test);
      }
      for (const rel of moduleParsed.relationships) {
        extension.graph.addRelationship(rel);
      }
      for (const rel of pageParsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Verify all elements are tracked with correct source files
      const req = extension.graph.getRequirement('REQ-001');
      expect(req).to.not.be.undefined;
      expect(req!.sourceFile).to.equal('root.adoc');

      const imp = extension.graph.getImplementation('IMP-001');
      expect(imp).to.not.be.undefined;
      expect(imp!.sourceFile).to.equal('module/page.adoc');

      const test = extension.graph.getTest('TEST-001');
      expect(test).to.not.be.undefined;
      expect(test!.sourceFile).to.equal('module/page/test.adoc');

      // Verify relationships work across files
      const coverage = extension.getCoverageReport();
      expect(coverage.totalRequirements).to.equal(1);
      expect(coverage.requirementsWithImplementation).to.equal(1);
      expect(coverage.requirementsWithTests).to.equal(1);
    });

    it('should handle modular documentation with shared requirements', function() {
      // Module 1
      const module1Content = `
[req, id=SHARED-001]
====
Shared requirement
====

[imp, id=M1-IMP-001]
====
Module 1 implementation
====

implements:SHARED-001[]
`;

      // Module 2
      const module2Content = `
[req, id=SHARED-001]
====
Same shared requirement (should cause duplicate error)
====

[imp, id=M2-IMP-001]
====
Module 2 implementation
====

implements:SHARED-001[]
`;

      const module1Parsed = parser.parse(module1Content, 'module1.adoc');
      
      // Add module 1 elements
      for (const req of module1Parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of module1Parsed.implementations) {
        extension.graph.addImplementation(imp);
      }

      // Try to add module 2 elements - should fail on duplicate
      const module2Parsed = parser.parse(module2Content, 'module2.adoc');
      
      expect(() => {
        for (const req of module2Parsed.requirements) {
          extension.graph.addRequirement(req);
        }
      }).to.throw('Duplicate requirement ID: SHARED-001');
    });
  });

  describe('Performance with Different Structures', function() {
    this.timeout(10000);

    it('should handle wide dependency graphs efficiently', function() {
      // Create a star topology: one central requirement with many dependencies
      const contentParts = ['[req, id=REQ-CENTER]\n====\nCentral requirement\n'];

      for (let i = 1; i <= 50; i++) {
        contentParts.push(`depends:REQ-${i}[\n`);
      }

      contentParts.push('====\n');

      for (let i = 1; i <= 50; i++) {
        contentParts.push(`\n[req, id=REQ-${i}]\n====\nDependency ${i}\n====\n`);
      }

      // Add implementations
      for (let i = 1; i <= 50; i++) {
        contentParts.push(`\n[imp, id=IMP-${i}]\n====\nImpl ${i}\n\nimplements:REQ-${i}[\n====\n`);
      }

      const content = contentParts.join('');
      const parsed = parser.parse(content, 'wide.adoc');

      // Add all elements
      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Verify performance
      const start = Date.now();
      const coverage = extension.getCoverageReport();
      const coverageTime = Date.now() - start;

      expect(coverageTime).to.be.lessThan(100);
      expect(coverage.totalRequirements).to.equal(51);

      // Verify impact analysis on center node
      const startImpact = Date.now();
      const impacted = extension.getImpactAnalysis('REQ-CENTER');
      const impactTime = Date.now() - startImpact;

      expect(impactTime).to.be.lessThan(100);
      // Should find all 50 dependencies + 50 implementations = 100
      expect(impacted.length).to.equal(100);
    });

    it('should handle deep dependency chains efficiently', function() {
      // Create a chain of 50 requirements
      const contentParts = [];

      for (let i = 1; i <= 50; i++) {
        const id = `REQ-${String(i).padStart(3, '0')}`;
        const prevId = i > 1 ? `REQ-${String(i - 1).padStart(3, '0')}` : null;
        
        let reqContent = `Requirement ${i}`;
        if (prevId) {
          reqContent += `\n\ndepends:${prevId}[`;
        }
        
        contentParts.push(`[req, id=${id}]\n====\n${reqContent}\n====\n`);
      }

      const content = contentParts.join('');
      const parsed = parser.parse(content, 'chain.adoc');

      // Add all elements
      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Verify path finding (following forward relationships)
      // The chain is: REQ-001 <- REQ-002 <- REQ-003 <- ... <- REQ-050
      // So we need to go from REQ-050 to REQ-001 (following depends relationships)
      const start = Date.now();
      const path = extension.findPath('REQ-050', 'REQ-001', 100);
      const pathTime = Date.now() - start;

      expect(pathTime).to.be.lessThan(100);
      expect(path).to.not.be.null;
      expect(path!.length).to.equal(50);
    });
  });

  describe('Error Handling in Integration', function() {
    it('should provide useful error messages for duplicate IDs', function() {
      const content1 = `
[req, id=REQ-001]
====
First
====
`;

      const content2 = `
[req, id=REQ-001]
====
Second
====
`;

      const parsed1 = parser.parse(content1, 'file1.adoc');
      const parsed2 = parser.parse(content2, 'file2.adoc');

      // Add first requirement
      for (const req of parsed1.requirements) {
        extension.graph.addRequirement(req);
      }

      // Try to add duplicate
      expect(() => {
        for (const req of parsed2.requirements) {
          extension.graph.addRequirement(req);
        }
      }).to.throw('Duplicate requirement ID: REQ-001');
    });

    it('should provide useful error messages for circular references', function() {
      const content = `
[req, id=REQ-001]
====
First
====

[req, id=REQ-002]
====
Second

depends:REQ-001[]
====
`;

      const parsed = parser.parse(content, 'test.adoc');

      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Try to create circular reference
      expect(() => {
        extension.addRelationship('REQ-001', 'REQ-002', 'depends');
      }).to.throw('Circular reference detected');
    });

    it('should provide useful error messages for missing nodes', function() {
      expect(() => {
        extension.addRelationship('NONEXISTENT', 'REQ-001', 'implements');
      }).to.throw('Source node not found: NONEXISTENT');

      extension.graph.addRequirement({
        id: 'REQ-001',
        title: 'Test',
        content: 'Test',
        status: 'draft',
        attributes: {},
        sourceFile: 'test.adoc',
        sourceLine: 1,
      });

      expect(() => {
        extension.addRelationship('REQ-001', 'NONEXISTENT', 'implements');
      }).to.throw('Target node not found: NONEXISTENT');
    });
  });

  describe('Matrix Generation Integration', function() {
    it('should generate consistent matrices across multiple runs', function() {
      const content = `
[req, id=REQ-001]
====
Requirement 1
====

[req, id=REQ-002]
====
Requirement 2
====

[imp, id=IMP-001]
====
Implementation 1
====

implements:REQ-001[]

[test, id=TEST-001]
====
Test 1
====

tests:REQ-001[]
`;

      const parsed = parser.parse(content, 'test.adoc');

      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const test of parsed.tests) {
        extension.graph.addTest(test);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      // Generate matrices multiple times
      const matrix1 = extension.generateMatrix('req-impl');
      const matrix2 = extension.generateMatrix('req-impl');

      // Should be identical
      expect(matrix1.type).to.equal(matrix2.type);
      expect(matrix1.requirements.length).to.equal(matrix2.requirements.length);
      expect(matrix1.coverage.totalRequirements).to.equal(matrix2.coverage.totalRequirements);

      // Generate different matrix types
      const reqImplMatrix = extension.generateMatrix('req-impl');
      const reqTestMatrix = extension.generateMatrix('req-test');
      const fullMatrix = extension.generateDetailedMatrix('full');

      expect(reqImplMatrix.type).to.equal('req-impl');
      expect(reqTestMatrix.type).to.equal('req-test');
      expect(fullMatrix.type).to.equal('full');
    });

    it('should generate valid CSV output', function() {
      const content = `
[req, id=REQ-001, title="Test, with comma"]
====
Content
====

[imp, id=IMP-001]
====
Impl

implements:REQ-001[]
====
`;

      const parsed = parser.parse(content, 'test.adoc');

      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      const csv = extension.exportMatrixToCSV('req-impl');

      // Should have header
      expect(csv).to.include('Requirement ID,Requirement Title,Implementations,Tests,Status');

      // Should have data
      expect(csv).to.include('REQ-001');
      expect(csv).to.include('IMP-001');

      // Should handle commas in title
      expect(csv).to.include('"Test, with comma"');

      // Should have summary
      expect(csv).to.include('Total Requirements');
      expect(csv).to.include('Implementation Coverage');
    });

    it('should generate valid HTML output', function() {
      const content = `
[req, id=REQ-001, title="Test <script> & special chars"]
====
Content
====

[imp, id=IMP-001]
====
Impl
====

implements:REQ-001[]
`;

      const parsed = parser.parse(content, 'test.adoc');

      for (const req of parsed.requirements) {
        extension.graph.addRequirement(req);
      }
      for (const imp of parsed.implementations) {
        extension.graph.addImplementation(imp);
      }
      for (const rel of parsed.relationships) {
        extension.graph.addRelationship(rel);
      }

      const html = extension.exportMatrixToHTML('req-impl');

      // Should have HTML structure
      expect(html).to.include('<!DOCTYPE html>');
      expect(html).to.include('<html lang="en">');
      expect(html).to.include('</html>');

      // Should have table
      expect(html).to.include('<table>');
      expect(html).to.include('</table>');

      // Should escape HTML special characters
      expect(html).to.include('&lt;script&gt;');
      expect(html).to.include('&amp;');
      expect(html).not.to.include('<script>');

      // Should have styling
      expect(html).to.include('<style>');
      expect(html).to.include('.status-badge');
    });
  });
});
