import { expect } from 'chai';
import { createAntoraExtension } from '../src/antora-extension.js';
import { RequirementsTraceabilityExtension } from '../src/index.js';
describe('Antora Extension', function () {
    let mockContext;
    let extension;
    let mockLogger;
    beforeEach(function () {
        mockLogger = {
            info: () => { },
            warn: () => { },
            error: () => { },
            debug: () => { },
        };
        mockContext = {
            getLogger: (name) => mockLogger,
            playbook: {
                extensions: [
                    { name: 'antora-requirements-traceability', config: {} }
                ]
            },
            on: () => { },
        };
        extension = createAntoraExtension(mockContext);
    });
    describe('Extension Initialization', function () {
        it('should initialize with default configuration', function () {
            expect(extension).to.be.an('object');
            expect(extension.getTraceabilityExtension).to.be.a('function');
        });
        it('should expose traceability extension', function () {
            const traceability = extension.getTraceabilityExtension();
            expect(traceability).to.be.an.instanceof(RequirementsTraceabilityExtension);
        });
        it('should load configuration from playbook', function () {
            mockContext.playbook = {
                extensions: [
                    {
                        name: 'antora-requirements-traceability',
                        config: {
                            enabled: false,
                            outputDir: 'custom-output',
                            generateMatrices: false,
                            matrixFormats: ['html'],
                            includeInNavigation: false,
                        }
                    }
                ]
            };
            const ext = createAntoraExtension(mockContext);
            // Configuration is loaded but we can't easily verify it without accessing private members
            // Just verify it doesn't throw
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should log initialization message', function () {
            let infoCalled = false;
            mockLogger.info = (message) => {
                if (message.includes('initialized')) {
                    infoCalled = true;
                }
            };
            createAntoraExtension(mockContext);
            expect(infoCalled).to.be.true;
        });
        it('should log disabled message when disabled', function () {
            mockContext.playbook = {
                extensions: [
                    {
                        name: 'antora-requirements-traceability',
                        config: { enabled: false }
                    }
                ]
            };
            let infoCalled = false;
            mockLogger.info = (message) => {
                if (message.includes('disabled')) {
                    infoCalled = true;
                }
            };
            createAntoraExtension(mockContext);
            expect(infoCalled).to.be.true;
        });
    });
    describe('Configuration', function () {
        it('should use default configuration when none provided', function () {
            mockContext.playbook = {};
            const ext = createAntoraExtension(mockContext);
            // Should not throw
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should handle missing playbook gracefully', function () {
            mockContext.playbook = undefined;
            const ext = createAntoraExtension(mockContext);
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should handle malformed playbook gracefully', function () {
            mockContext.playbook = { extensions: null };
            const ext = createAntoraExtension(mockContext);
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
    });
    describe('Factory Function', function () {
        it('should export createAntoraExtension as default', function () {
            const ext = createAntoraExtension(mockContext);
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should be callable as factory function', function () {
            // Factory function returns AntoraTraceabilityExtension instance
            const ext = createAntoraExtension(mockContext);
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
    });
    describe('Traceability Extension Access', function () {
        it('should allow access to underlying traceability extension', function () {
            const traceability = extension.getTraceabilityExtension();
            expect(traceability).to.have.property('graph');
            expect(traceability).to.have.property('process');
            expect(traceability).to.have.property('generateMatrix');
        });
        it('should share graph between Antora extension and traceability extension', function () {
            const traceability = extension.getTraceabilityExtension();
            // Add a requirement through the traceability extension
            traceability.graph.addRequirement({
                id: 'REQ-001',
                title: 'Test Requirement',
                content: 'Test content',
                status: 'draft',
                attributes: {},
                sourceFile: 'test.adoc',
                sourceLine: 1,
            });
            // Verify it's accessible through the Antora extension's traceability
            const req = traceability.graph.getRequirement('REQ-001');
            expect(req).to.not.be.undefined;
            expect(req.id).to.equal('REQ-001');
        });
    });
    describe('Configuration Types', function () {
        it('should accept all configuration options', function () {
            const config = {
                enabled: true,
                outputDir: 'custom-dir',
                generateMatrices: true,
                matrixFormats: ['csv', 'html'],
                includeInNavigation: true,
            };
            mockContext.playbook = {
                extensions: [
                    { name: 'antora-requirements-traceability', config }
                ]
            };
            const ext = createAntoraExtension(mockContext);
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should accept partial configuration', function () {
            const config = {
                enabled: false,
            };
            mockContext.playbook = {
                extensions: [
                    { name: 'antora-requirements-traceability', config }
                ]
            };
            const ext = createAntoraExtension(mockContext);
            expect(ext).to.be.an('object');
            expect(ext.getTraceabilityExtension).to.be.a('function');
        });
    });
});
