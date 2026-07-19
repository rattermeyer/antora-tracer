/**
 * Unit tests for bidirectional relationships with auto-generated inverse macros
 * Phase 3: Bidirectional Relationships
 */
import { expect } from 'chai';
import { RequirementsTraceabilityExtension } from '../src/index.js';
import { INVERSE_MAP, PRIMARY_MAP, isPrimaryRelationshipType, isInverseRelationshipType, } from '../src/types.js';
describe('Bidirectional Relationships', function () {
    let extension;
    let graph;
    beforeEach(function () {
        extension = new RequirementsTraceabilityExtension();
        graph = extension.graph;
    });
    afterEach(function () {
        extension.clear();
    });
    // ── Type System Tests ──────────────────────────────────────────────────────
    describe('Type System', function () {
        describe('INVERSE_MAP', function () {
            it('should map all primary types to inverse types', function () {
                const primaryTypes = [
                    'implements', 'satisfies', 'tests', 'verifies', 'documents',
                    'depends', 'requires', 'addresses', 'composed-of', 'depends-on',
                ];
                for (const type of primaryTypes) {
                    expect(INVERSE_MAP[type]).to.be.a('string');
                    expect(INVERSE_MAP[type].length).to.be.greaterThan(0);
                }
            });
            it('should have correct mappings', function () {
                expect(INVERSE_MAP.implements).to.equal('implemented-by');
                expect(INVERSE_MAP.satisfies).to.equal('satisfied-by');
                expect(INVERSE_MAP.tests).to.equal('tested-by');
                expect(INVERSE_MAP.verifies).to.equal('verified-by');
                expect(INVERSE_MAP.documents).to.equal('documented-by');
                expect(INVERSE_MAP.depends).to.equal('depended-by');
                expect(INVERSE_MAP.requires).to.equal('required-by');
                expect(INVERSE_MAP.addresses).to.equal('addressed-by');
                expect(INVERSE_MAP['composed-of']).to.equal('part-of');
                expect(INVERSE_MAP['depends-on']).to.equal('depends-on-by');
            });
        });
        describe('PRIMARY_MAP', function () {
            it('should map all inverse types back to primary types', function () {
                const inverseTypes = [
                    'implemented-by', 'satisfied-by', 'tested-by', 'verified-by',
                    'documented-by', 'depended-by', 'required-by', 'addressed-by',
                    'part-of', 'depends-on-by',
                ];
                for (const type of inverseTypes) {
                    expect(PRIMARY_MAP[type]).to.be.a('string');
                    expect(PRIMARY_MAP[type].length).to.be.greaterThan(0);
                }
            });
            it('should be bidirectional with INVERSE_MAP', function () {
                // For each primary type, PRIMARY_MAP[INVERSE_MAP[primary]] should equal primary
                const primaryTypes = [
                    'implements', 'satisfies', 'tests', 'verifies', 'documents',
                    'depends', 'requires', 'addresses', 'composed-of', 'depends-on',
                ];
                for (const primary of primaryTypes) {
                    const inverse = INVERSE_MAP[primary];
                    const backToPrimary = PRIMARY_MAP[inverse];
                    expect(backToPrimary).to.equal(primary);
                }
            });
        });
        describe('Type Guards', function () {
            it('should correctly identify primary relationship types', function () {
                expect(isPrimaryRelationshipType('implements')).to.be.true;
                expect(isPrimaryRelationshipType('satisfies')).to.be.true;
                expect(isPrimaryRelationshipType('addresses')).to.be.true;
                expect(isPrimaryRelationshipType('implemented-by')).to.be.false;
                expect(isPrimaryRelationshipType('satisfied-by')).to.be.false;
                expect(isPrimaryRelationshipType('addressed-by')).to.be.false;
            });
            it('should correctly identify inverse relationship types', function () {
                expect(isInverseRelationshipType('implemented-by')).to.be.true;
                expect(isInverseRelationshipType('satisfied-by')).to.be.true;
                expect(isInverseRelationshipType('addressed-by')).to.be.true;
                expect(isInverseRelationshipType('implements')).to.be.false;
                expect(isInverseRelationshipType('satisfies')).to.be.false;
                expect(isInverseRelationshipType('addresses')).to.be.false;
            });
        });
    });
    // ── Auto-Generation Tests ────────────────────────────────────────────────
    describe('Auto-Generated Inverse Relationships', function () {
        it('should auto-generate inverse for addresses relationship', function () {
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Test Requirement',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addDesign({
                id: 'DES-001',
                title: 'Test Design',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            graph.addRelationship({
                id: 'DES-001-addresses-REQ-001',
                fromId: 'DES-001',
                targetId: 'REQ-001',
                type: 'addresses',
            });
            const allRels = graph.getAllRelationships();
            expect(allRels.length).to.equal(2); // Primary + inverse
            const addressesRel = allRels.find(r => r.type === 'addresses');
            expect(addressesRel).to.exist;
            expect(addressesRel?.fromId).to.equal('DES-001');
            expect(addressesRel?.targetId).to.equal('REQ-001');
            expect(addressesRel?.autoGenerated).to.be.false;
            const addressedByRel = allRels.find(r => r.type === 'addressed-by');
            expect(addressedByRel).to.exist;
            expect(addressedByRel?.fromId).to.equal('REQ-001');
            expect(addressedByRel?.targetId).to.equal('DES-001');
            expect(addressedByRel?.autoGenerated).to.be.true;
            expect(addressedByRel?.inverseOf).to.equal('DES-001-addresses-REQ-001');
        });
        it('should auto-generate inverse for implements relationship', function () {
            graph.addImplementation({
                id: 'IMP-001',
                title: 'Test Implementation',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addDesign({
                id: 'DES-001',
                title: 'Test Design',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            graph.addRelationship({
                id: 'IMP-001-implements-DES-001',
                fromId: 'IMP-001',
                targetId: 'DES-001',
                type: 'implements',
            });
            const allRels = graph.getAllRelationships();
            expect(allRels.length).to.equal(2);
            const implementedByRel = allRels.find(r => r.type === 'implemented-by');
            expect(implementedByRel).to.exist;
            expect(implementedByRel?.fromId).to.equal('DES-001');
            expect(implementedByRel?.targetId).to.equal('IMP-001');
            expect(implementedByRel?.autoGenerated).to.be.true;
        });
        it('should auto-generate inverse for satisfies relationship', function () {
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Test Requirement',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addImplementation({
                id: 'IMP-001',
                title: 'Test Implementation',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            graph.addRelationship({
                id: 'IMP-001-satisfies-REQ-001',
                fromId: 'IMP-001',
                targetId: 'REQ-001',
                type: 'satisfies',
            });
            const allRels = graph.getAllRelationships();
            expect(allRels.length).to.equal(2);
            const satisfiedByRel = allRels.find(r => r.type === 'satisfied-by');
            expect(satisfiedByRel).to.exist;
            expect(satisfiedByRel?.fromId).to.equal('REQ-001');
            expect(satisfiedByRel?.targetId).to.equal('IMP-001');
        });
        it('should auto-generate inverse for composed-of relationship', function () {
            graph.addDesign({
                id: 'DES-001',
                title: 'Parent Design',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addDesign({
                id: 'DES-002',
                title: 'Child Design',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            graph.addRelationship({
                id: 'DES-001-composed-of-DES-002',
                fromId: 'DES-001',
                targetId: 'DES-002',
                type: 'composed-of',
            });
            const allRels = graph.getAllRelationships();
            expect(allRels.length).to.equal(2);
            const partOfRel = allRels.find(r => r.type === 'part-of');
            expect(partOfRel).to.exist;
            expect(partOfRel?.fromId).to.equal('DES-002');
            expect(partOfRel?.targetId).to.equal('DES-001');
        });
        it('should prevent duplicate relationships', function () {
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Test Requirement',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addDesign({
                id: 'DES-001',
                title: 'Test Design',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            // Add first relationship
            graph.addRelationship({
                id: 'DES-001-addresses-REQ-001',
                fromId: 'DES-001',
                targetId: 'REQ-001',
                type: 'addresses',
            });
            // Try to add the same relationship again
            expect(() => {
                graph.addRelationship({
                    id: 'DES-001-addresses-REQ-001',
                    fromId: 'DES-001',
                    targetId: 'REQ-001',
                    type: 'addresses',
                });
            }).to.throw('Duplicate relationship: DES-001 addresses REQ-001');
        });
    });
    // ── Query Method Tests ────────────────────────────────────────────────────
    describe('Bidirectional Query Methods', function () {
        beforeEach(function () {
            // Set up test data
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Requirement 1',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addRequirement({
                id: 'REQ-002',
                title: 'Requirement 2',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            graph.addImplementation({
                id: 'IMP-001',
                title: 'Implementation 1',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 3,
            });
            graph.addDesign({
                id: 'DES-001',
                title: 'Design 1',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 4,
            });
            // Add relationships
            graph.addRelationship({
                id: 'IMP-001-satisfies-REQ-001',
                fromId: 'IMP-001',
                targetId: 'REQ-001',
                type: 'satisfies',
            });
            graph.addRelationship({
                id: 'DES-001-addresses-REQ-001',
                fromId: 'DES-001',
                targetId: 'REQ-001',
                type: 'addresses',
            });
            graph.addRelationship({
                id: 'DES-001-addresses-REQ-002',
                fromId: 'DES-001',
                targetId: 'REQ-002',
                type: 'addresses',
            });
        });
        it('should query requirements with implementations', function () {
            // Note: This uses the existing method that returns a Set of requirement IDs
            const reqIds = graph.getRequirementsWithImplementations();
            expect(reqIds.has('REQ-001')).to.be.true;
        });
        it('should query implementations for requirement', function () {
            // Use getRelationships to find implementations that satisfy this requirement
            const rels = graph.getRelationships('REQ-001', 'satisfied-by');
            expect(rels).to.have.lengthOf(1);
            expect(rels[0].fromId).to.equal('REQ-001');
            expect(rels[0].targetId).to.equal('IMP-001');
        });
        it('should query requirements for design via addresses', function () {
            const reqs = graph.getRequirementsForDesign('DES-001');
            expect(reqs).to.have.lengthOf(2);
            expect(reqs.map(r => r.id)).to.include.members(['REQ-001', 'REQ-002']);
        });
        it('should query designs for requirement via addressed-by', function () {
            const designs = graph.getDesignsForRequirement('REQ-001');
            expect(designs).to.have.lengthOf(1);
            expect(designs[0].id).to.equal('DES-001');
        });
    });
    // ── Matrix Generation Tests ───────────────────────────────────────────────
    describe('Inverse Matrix Generation', function () {
        beforeEach(function () {
            // Set up test data
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Requirement 1',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addRequirement({
                id: 'REQ-002',
                title: 'Requirement 2',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            graph.addImplementation({
                id: 'IMP-001',
                title: 'Implementation 1',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 3,
            });
            graph.addImplementation({
                id: 'IMP-002',
                title: 'Implementation 2',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 4,
            });
            graph.addDesign({
                id: 'DES-001',
                title: 'Design 1',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 5,
            });
            // Add relationships
            graph.addRelationship({
                id: 'IMP-001-satisfies-REQ-001',
                fromId: 'IMP-001',
                targetId: 'REQ-001',
                type: 'satisfies',
            });
            graph.addRelationship({
                id: 'IMP-002-satisfies-REQ-002',
                fromId: 'IMP-002',
                targetId: 'REQ-002',
                type: 'satisfies',
            });
            graph.addRelationship({
                id: 'DES-001-addresses-REQ-001',
                fromId: 'DES-001',
                targetId: 'REQ-001',
                type: 'addresses',
            });
        });
        it('should generate impl-req matrix', function () {
            const matrix = extension.generateMatrix('impl-req');
            expect(matrix.type).to.equal('impl-req');
            // Type guard - impl-req returns TraceabilityMatrix
            if ('requirements' in matrix) {
                expect(matrix.requirements).to.have.lengthOf(2); // 2 implementations
                const impl1Row = matrix.requirements.find((r) => r.id === 'IMP-001');
                expect(impl1Row).to.exist;
                expect(impl1Row?.implementations).to.include('REQ-001');
                const impl2Row = matrix.requirements.find((r) => r.id === 'IMP-002');
                expect(impl2Row).to.exist;
                expect(impl2Row?.implementations).to.include('REQ-002');
            }
            else {
                throw new Error('impl-req matrix should have requirements property');
            }
        });
        it('should generate design-req matrix', function () {
            const matrix = extension.generateMatrix('design-req');
            expect(matrix.type).to.equal('design-req');
            // Type guard - design-req returns TraceabilityMatrix
            if ('requirements' in matrix) {
                expect(matrix.requirements).to.have.lengthOf(1); // 1 design
                const design1Row = matrix.requirements.find((r) => r.id === 'DES-001');
                expect(design1Row).to.exist;
                expect(design1Row?.implementations).to.include('REQ-001');
            }
            else {
                throw new Error('design-req matrix should have requirements property');
            }
        });
        it('should export impl-req matrix to CSV', function () {
            const csv = extension.exportMatrixToCSV('impl-req');
            expect(csv).to.include('IMP-001');
            expect(csv).to.include('IMP-002');
            expect(csv).to.include('REQ-001');
            expect(csv).to.include('REQ-002');
        });
        it('should export design-req matrix to CSV', function () {
            const csv = extension.exportMatrixToCSV('design-req');
            expect(csv).to.include('DES-001');
            expect(csv).to.include('REQ-001');
        });
    });
    // ── Circular Reference Tests ────────────────────────────────────────────
    describe('Circular Reference Detection', function () {
        it('should not flag bidirectional pairs as circular', function () {
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Test Requirement',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addImplementation({
                id: 'IMP-001',
                title: 'Test Implementation',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            // This creates both IMP-001->satisfies->REQ-001 and REQ-001->satisfied-by->IMP-001
            graph.addRelationship({
                id: 'IMP-001-satisfies-REQ-001',
                fromId: 'IMP-001',
                targetId: 'REQ-001',
                type: 'satisfies',
            });
            // Should not throw - bidirectional pairs are valid
            const errors = graph.validate();
            expect(errors).to.be.an('array');
            expect(errors).to.have.lengthOf(0);
        });
        it('should detect real circular dependencies', function () {
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Requirement 1',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addRequirement({
                id: 'REQ-002',
                title: 'Requirement 2',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            // REQ-001 depends on REQ-002
            graph.addRelationship({
                id: 'REQ-001-depends-REQ-002',
                fromId: 'REQ-001',
                targetId: 'REQ-002',
                type: 'depends',
            });
            // This would create a cycle: REQ-001 -> depends -> REQ-002 -> depends -> REQ-001
            expect(() => {
                graph.addRelationship({
                    id: 'REQ-002-depends-REQ-001',
                    fromId: 'REQ-002',
                    targetId: 'REQ-001',
                    type: 'depends',
                });
            }).to.throw('Circular reference detected');
        });
        it('should not detect cycles through non-dependency relationships', function () {
            graph.addRequirement({
                id: 'REQ-001',
                title: 'Requirement 1',
                content: 'Test',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            graph.addImplementation({
                id: 'IMP-001',
                title: 'Implementation 1',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 2,
            });
            // IMP-001 satisfies REQ-001 (creates REQ-001 satisfied-by IMP-001)
            graph.addRelationship({
                id: 'IMP-001-satisfies-REQ-001',
                fromId: 'IMP-001',
                targetId: 'REQ-001',
                type: 'satisfies',
            });
            // IMP-001 implements DES-001
            graph.addDesign({
                id: 'DES-001',
                title: 'Design 1',
                content: 'Test',
                sourceFile: 'test.adoc',
                sourceLine: 3,
            });
            graph.addRelationship({
                id: 'IMP-001-implements-DES-001',
                fromId: 'IMP-001',
                targetId: 'DES-001',
                type: 'implements',
            });
            // DES-001 addresses REQ-001
            graph.addRelationship({
                id: 'DES-001-addresses-REQ-001',
                fromId: 'DES-001',
                targetId: 'REQ-001',
                type: 'addresses',
            });
            // No circular dependency - these are different relationship types
            const errors = graph.validate();
            expect(errors).to.have.lengthOf(0);
        });
    });
    // ── Integration Tests ─────────────────────────────────────────────────────
    describe('Integration with DocumentParser', function () {
        it('should auto-generate inverses from parsed relationships', function () {
            const content = `
[design, id=DES-001]
====
Test Design

addresses:REQ-001[]
====

[req, id=REQ-001]
====
Test Requirement
====
`;
            extension.process(content, { sourceFile: 'test.adoc' });
            const allRels = graph.getAllRelationships();
            expect(allRels.length).to.be.at.least(2); // Primary + inverse
            const hasAddresses = allRels.some(r => r.type === 'addresses');
            const hasAddressedBy = allRels.some(r => r.type === 'addressed-by');
            expect(hasAddresses).to.be.true;
            expect(hasAddressedBy).to.be.true;
        });
        it('should support multiple inverse relationships in same document', function () {
            const content = `
[design, id=DES-001]
====
Design 1

addresses:REQ-001[]
addresses:REQ-002[]
====

[req, id=REQ-001]
====
Requirement 1
====

[req, id=REQ-002]
====
Requirement 2
====
`;
            extension.process(content, { sourceFile: 'test.adoc' });
            const designsForReq1 = graph.getDesignsForRequirement('REQ-001');
            expect(designsForReq1).to.have.lengthOf(1);
            expect(designsForReq1[0].id).to.equal('DES-001');
            const designsForReq2 = graph.getDesignsForRequirement('REQ-002');
            expect(designsForReq2).to.have.lengthOf(1);
            expect(designsForReq2[0].id).to.equal('DES-001');
            const reqsForDesign = graph.getRequirementsForDesign('DES-001');
            expect(reqsForDesign).to.have.lengthOf(2);
            expect(reqsForDesign.map(r => r.id)).to.include.members(['REQ-001', 'REQ-002']);
        });
    });
});
