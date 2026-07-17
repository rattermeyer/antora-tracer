"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const DocumentParser_1 = require("../src/DocumentParser");
describe('DocumentParser', function () {
    let parser;
    beforeEach(function () {
        parser = new DocumentParser_1.DocumentParser();
    });
    describe('Requirement Parsing', function () {
        it('should parse requirement with explicit ID', function () {
            const content = `
[req, id=REQ-001, title="User Authentication"]
====
The system shall require user authentication.
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(1);
            (0, chai_1.expect)(result.requirements[0].id).to.equal('REQ-001');
            (0, chai_1.expect)(result.requirements[0].title).to.equal('User Authentication');
            (0, chai_1.expect)(result.requirements[0].content).to.equal('The system shall require user authentication.');
            (0, chai_1.expect)(result.requirements[0].status).to.equal('draft');
        });
        it('should parse requirement with status', function () {
            const content = `
[req, id=REQ-002, status=approved]
====
All data must be encrypted.
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(1);
            (0, chai_1.expect)(result.requirements[0].status).to.equal('approved');
        });
        it('should auto-generate ID for requirement without explicit ID', function () {
            const content = `
[req]
====
Auto-generated requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(1);
            (0, chai_1.expect)(result.requirements[0].id).to.match(/^REQ-/);
            (0, chai_1.expect)(result.requirements[0].content).to.equal('Auto-generated requirement');
            (0, chai_1.expect)(result.requirements[0].title).to.match(/^Requirement REQ-/);
        });
        it('should detect duplicate requirement IDs', function () {
            const content = `
[req, id=REQ-DUP]
====
First
====

[req, id=REQ-DUP]
====
Second
====
`;
            (0, chai_1.expect)(() => parser.parse(content, 'test.adoc')).to.throw('Duplicate requirement ID: REQ-DUP');
        });
    });
    describe('Implementation Parsing', function () {
        it('should parse implementation with explicit ID', function () {
            const content = `
[imp, id=IMP-001, title="User Auth Implementation"]
====
Implementation of user authentication.
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.implementations).to.have.lengthOf(1);
            (0, chai_1.expect)(result.implementations[0].id).to.equal('IMP-001');
            (0, chai_1.expect)(result.implementations[0].title).to.equal('User Auth Implementation');
            (0, chai_1.expect)(result.implementations[0].content).to.equal('Implementation of user authentication.');
        });
        it('should auto-generate ID for implementation without explicit ID', function () {
            const content = `
[imp]
====
Auto-generated implementation
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.implementations).to.have.lengthOf(1);
            (0, chai_1.expect)(result.implementations[0].id).to.match(/^IMP-/);
            (0, chai_1.expect)(result.implementations[0].content).to.equal('Auto-generated implementation');
            (0, chai_1.expect)(result.implementations[0].title).to.match(/^Implementation IMP-/);
        });
        it('should detect duplicate implementation IDs', function () {
            const content = `
[imp, id=IMP-DUP]
====
First
====

[imp, id=IMP-DUP]
====
Second
====
`;
            (0, chai_1.expect)(() => parser.parse(content, 'test.adoc')).to.throw('Duplicate implementation ID: IMP-DUP');
        });
    });
    describe('Test Parsing', function () {
        it('should parse test with explicit ID', function () {
            const content = `
[test, id=TEST-001, title="Authentication Test"]
====
Test that user authentication works.
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.tests).to.have.lengthOf(1);
            (0, chai_1.expect)(result.tests[0].id).to.equal('TEST-001');
            (0, chai_1.expect)(result.tests[0].title).to.equal('Authentication Test');
            (0, chai_1.expect)(result.tests[0].content).to.equal('Test that user authentication works.');
        });
        it('should auto-generate ID for test without explicit ID', function () {
            const content = `
[test]
====
Auto-generated test
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.tests).to.have.lengthOf(1);
            (0, chai_1.expect)(result.tests[0].id).to.match(/^TEST-/);
            (0, chai_1.expect)(result.tests[0].content).to.equal('Auto-generated test');
            (0, chai_1.expect)(result.tests[0].title).to.match(/^Test TEST-/);
        });
        it('should detect duplicate test IDs', function () {
            const content = `
[test, id=TEST-DUP]
====
First
====

[test, id=TEST-DUP]
====
Second
====
`;
            (0, chai_1.expect)(() => parser.parse(content, 'test.adoc')).to.throw('Duplicate test ID: TEST-DUP');
        });
    });
    describe('Document Parsing', function () {
        it('should parse document with explicit ID', function () {
            const content = `
[doc, id=DOC-001, title="Architecture Document"]
====
System architecture documentation.
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.documents).to.have.lengthOf(1);
            (0, chai_1.expect)(result.documents[0].id).to.equal('DOC-001');
            (0, chai_1.expect)(result.documents[0].title).to.equal('Architecture Document');
            (0, chai_1.expect)(result.documents[0].content).to.equal('System architecture documentation.');
        });
        it('should auto-generate ID for document without explicit ID', function () {
            const content = `
[doc]
====
Auto-generated document
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.documents).to.have.lengthOf(1);
            (0, chai_1.expect)(result.documents[0].id).to.match(/^DOC-/);
            (0, chai_1.expect)(result.documents[0].content).to.equal('Auto-generated document');
            (0, chai_1.expect)(result.documents[0].title).to.match(/^Document DOC-/);
        });
    });
    describe('Inline Relationship Macros', function () {
        it('should parse satisfies inline macro', function () {
            const content = `
[req, id=REQ-001]
====
This requirement satisfies:REQ-002[]
====

[req, id=REQ-002]
====
Base requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(2);
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].fromId).to.equal('REQ-001');
            (0, chai_1.expect)(result.relationships[0].targetId).to.equal('REQ-002');
            (0, chai_1.expect)(result.relationships[0].type).to.equal('satisfies');
        });
        it('should parse implements inline macro', function () {
            const content = `
[imp, id=IMP-001]
====
This implementation implements:REQ-001[]
====

[req, id=REQ-001]
====
Requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.implementations).to.have.lengthOf(1);
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].fromId).to.equal('IMP-001');
            (0, chai_1.expect)(result.relationships[0].targetId).to.equal('REQ-001');
            (0, chai_1.expect)(result.relationships[0].type).to.equal('implements');
        });
        it('should parse tests inline macro', function () {
            const content = `
[test, id=TEST-001]
====
This test tests:REQ-001[]
====

[req, id=REQ-001]
====
Requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.tests).to.have.lengthOf(1);
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].fromId).to.equal('TEST-001');
            (0, chai_1.expect)(result.relationships[0].targetId).to.equal('REQ-001');
            (0, chai_1.expect)(result.relationships[0].type).to.equal('tests');
        });
        it('should parse verifies inline macro', function () {
            const content = `
[test, id=TEST-001]
====
This test verifies:REQ-001[]
====

[req, id=REQ-001]
====
Requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].type).to.equal('verifies');
        });
        it('should parse documents inline macro', function () {
            const content = `
[doc, id=DOC-001]
====
This document documents:REQ-001[]
====

[req, id=REQ-001]
====
Requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.documents).to.have.lengthOf(1);
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].fromId).to.equal('DOC-001');
            (0, chai_1.expect)(result.relationships[0].targetId).to.equal('REQ-001');
            (0, chai_1.expect)(result.relationships[0].type).to.equal('documents');
        });
        it('should parse depends inline macro', function () {
            const content = `
[req, id=REQ-001]
====
This requirement depends:REQ-002[]
====

[req, id=REQ-002]
====
Dependency
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].type).to.equal('depends');
        });
        it('should parse requires inline macro', function () {
            const content = `
[req, id=REQ-001]
====
This requirement requires:REQ-002[]
====

[req, id=REQ-002]
====
Requirement
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(1);
            (0, chai_1.expect)(result.relationships[0].type).to.equal('requires');
        });
        it('should parse multiple inline macros in one document', function () {
            const content = `
[req, id=REQ-001]
====
This requirement depends:REQ-002[] and requires:REQ-003[]
====

[req, id=REQ-002]
====
Dependency 1
====

[req, id=REQ-003]
====
Dependency 2
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(3);
            (0, chai_1.expect)(result.relationships).to.have.lengthOf(2);
        });
    });
    describe('Mixed Content Parsing', function () {
        it('should parse a document with all node types and relationships', function () {
            const content = `
[req, id=REQ-001, title="Main Requirement"]
====
This is the main requirement.
It depends:REQ-002[] and requires:REQ-003[].
====

[req, id=REQ-002, title="Dependency"]
====
A dependency requirement.
====

[req, id=REQ-003, title="Another Dependency"]
====
Another dependency.
====

[imp, id=IMP-001, title="Main Implementation"]
====
Implementation of main requirement.
Implements:REQ-001[].
====

[test, id=TEST-001, title="Main Test"]
====
Test for main requirement.
Tests:REQ-001[] and verifies:REQ-001[].
====

[doc, id=DOC-001, title="Documentation"]
====
Documentation for main requirement.
Documents:REQ-001[].
====
`;
            const result = parser.parse(content, 'test.adoc');
            (0, chai_1.expect)(result.requirements).to.have.lengthOf(3);
            (0, chai_1.expect)(result.implementations).to.have.lengthOf(1);
            (0, chai_1.expect)(result.tests).to.have.lengthOf(1);
            (0, chai_1.expect)(result.documents).to.have.lengthOf(1);
            // Should have relationships from inline macros
            (0, chai_1.expect)(result.relationships.length).to.be.at.least(4);
        });
        it('should track source file for all nodes', function () {
            const content = `
[req, id=REQ-001]
====
Test
====
`;
            const result = parser.parse(content, 'my-document.adoc');
            (0, chai_1.expect)(result.requirements[0].sourceFile).to.equal('my-document.adoc');
        });
        it('should track source line for all nodes', function () {
            const content = `
Line 1
Line 2
[req, id=REQ-001]
====
Test
====
`;
            const result = parser.parse(content, 'test.adoc');
            // Line 3 (0-indexed would be 2, but we count from 1)
            (0, chai_1.expect)(result.requirements[0].sourceLine).to.be.a('number');
            (0, chai_1.expect)(result.requirements[0].sourceLine).to.be.greaterThan(0);
        });
    });
});
