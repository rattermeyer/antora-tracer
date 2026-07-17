const { expect } = require('chai');
const RequirementsTraceabilityExtension = require('../src/index.js');

describe('AsciiDoc Processor Plugin', function() {
  let extension;

  beforeEach(function() {
    extension = new RequirementsTraceabilityExtension();
    extension.register();
  });

  afterEach(function() {
    extension.clear();
  });

  describe('Requirement Registration', function() {
    it('should register requirements with valid IDs', function() {
      const content = `
[req, id=REQ-001, title="Test Requirement"]
====
This is a test requirement.
====
`;

      const result = extension.process(content);
      expect(extension.requirements.size).to.equal(1);
      
      const req = extension.getRequirement('REQ-001');
      expect(req).to.exist;
      expect(req.id).to.equal('REQ-001');
      expect(req.title).to.equal('Test Requirement');
      expect(req.content).to.contain('This is a test requirement');
    });

    it('should generate auto IDs when no ID provided', function() {
      const content = `
[req, title="Auto ID Test"]
====
This requirement has no explicit ID.
====
`;

      const result = extension.process(content);
      expect(extension.requirements.size).to.equal(1);
      
      const req = Array.from(extension.requirements.values())[0];
      expect(req.id).to.match(/REQ-\d+-\d+/);
      expect(req.title).to.equal('Auto ID Test');
    });

    it('should store source file and line information', function() {
      const content = `
[req, id=REQ-002]
====
Test with source info.
====
`;

      const result = extension.process(content, { sourceFile: 'test.adoc' });
      const req = extension.getRequirement('REQ-002');
      expect(req.sourceFile).to.equal('test.adoc');
      expect(req.sourceLine).to.be.a('number');
    });
  });

  describe('Requirement Validation', function() {
    it('should validate requirement ID format', function() {
      expect(() => extension.validateRequirementId('')).to.throw('Invalid requirement ID');
      expect(() => extension.validateRequirementId(123)).to.throw('Invalid requirement ID');
    });

    it('should detect duplicate requirement IDs', function() {
      // Register first requirement
      const content1 = '[req, id=REQ-003]\n====\nFirst\n====';
      extension.process(content1);
      
      // Try to register duplicate
      const content2 = '[req, id=REQ-003]\n====\nDuplicate\n====';
      expect(() => extension.process(content2)).to.throw('Duplicate requirement ID: REQ-003');
    });

    it('should warn about non-standard ID formats', function() {
      const content = '[req, id=INVALID-ID]\n====\nTest\n====';
      const consoleWarn = console.warn;
      let warningCaptured = null;
      
      console.warn = (msg) => { warningCaptured = msg; };
      extension.process(content);
      console.warn = consoleWarn;
      
      expect(warningCaptured).to.contain('Non-standard requirement ID format');
    });
  });

  describe('Relationship Management', function() {
    beforeEach(function() {
      // Register two requirements for relationship testing
      const content = `
[req, id=REQ-100]
====
First requirement
====

[req, id=REQ-101]
====
Second requirement
====
`;
      extension.process(content);
    });

    it('should add relationships between requirements', function() {
      extension.addRelationship('REQ-100', 'REQ-101', 'satisfies');
      
      expect(extension.relationships.size).to.equal(1);
      
      const req100 = extension.getRequirement('REQ-100');
      expect(req100.relationships.length).to.equal(1);
      expect(req100.relationships[0].type).to.equal('satisfies');
    });

    it('should validate relationship endpoints', function() {
      expect(() => extension.addRelationship('REQ-999', 'REQ-101')).to.throw('Source requirement not found');
      expect(() => extension.addRelationship('REQ-100', 'REQ-999')).to.throw('Target requirement not found');
    });
  });

  describe('Matrix Generation', function() {
    beforeEach(function() {
      const content = `
[req, id=REQ-200]
====
Requirement 200
====

[req, id=REQ-201]
====
Requirement 201
====
`;
      extension.process(content);
      extension.addRelationship('REQ-200', 'REQ-201', 'satisfies');
    });

    it('should generate traceability matrices', function() {
      const matrix = extension.generateMatrix('req-impl');
      
      expect(matrix.type).to.equal('req-impl');
      expect(matrix.requirements).to.have.lengthOf(2);
      expect(matrix.relationships).to.have.lengthOf(1);
      expect(matrix.generatedAt).to.be.a('string');
    });
  });

  describe('Content Processing', function() {
    it('should process AsciiDoc content and return HTML', async function() {
      const content = `
= Test Document

[req, id=REQ-300]
====
Sample requirement
====
`;

      const result = await extension.process(content);
      expect(result).to.be.a('string');
      expect(result).to.contain('Test Document');
      expect(result).to.contain('REQ-300');
    });

    it('should handle multiple requirements in one document', function() {
      const content = `
[req, id=REQ-400]
====
First
====

[req, id=REQ-401]
====
Second
====

[req, id=REQ-402]
====
Third
====
`;

      const result = extension.process(content);
      expect(extension.requirements.size).to.equal(3);
    });
  });
});