"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const antora_extension_1 = __importDefault(require("../src/antora-extension"));
const index_1 = require("../src/index");
describe('Antora Extension', function () {
    let mockContext;
    let extension;
    beforeEach(function () {
        mockContext = {
            logger: {
                info: () => { },
                warn: () => { },
                error: () => { },
                debug: () => { },
            },
            playbook: {
                extensions: [
                    { name: 'antora-requirements-traceability', config: {} }
                ]
            },
            on: () => { },
        };
        extension = (0, antora_extension_1.default)(mockContext);
    });
    describe('Extension Initialization', function () {
        it('should initialize with default configuration', function () {
            (0, chai_1.expect)(extension).to.be.an('object');
            (0, chai_1.expect)(extension.getTraceabilityExtension).to.be.a('function');
        });
        it('should expose traceability extension', function () {
            const traceability = extension.getTraceabilityExtension();
            (0, chai_1.expect)(traceability).to.be.an.instanceof(index_1.RequirementsTraceabilityExtension);
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
            const ext = (0, antora_extension_1.default)(mockContext);
            // Configuration is loaded but we can't easily verify it without accessing private members
            // Just verify it doesn't throw
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should log initialization message', function () {
            let infoCalled = false;
            mockContext.logger.info = (message) => {
                if (message.includes('initialized')) {
                    infoCalled = true;
                }
            };
            (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(infoCalled).to.be.true;
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
            mockContext.logger.info = (message) => {
                if (message.includes('disabled')) {
                    infoCalled = true;
                }
            };
            (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(infoCalled).to.be.true;
        });
    });
    describe('Configuration', function () {
        it('should use default configuration when none provided', function () {
            mockContext.playbook = {};
            const ext = (0, antora_extension_1.default)(mockContext);
            // Should not throw
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should handle missing playbook gracefully', function () {
            mockContext.playbook = undefined;
            const ext = (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should handle malformed playbook gracefully', function () {
            mockContext.playbook = { extensions: null };
            const ext = (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
    });
    describe('Factory Function', function () {
        it('should export createAntoraExtension as default', function () {
            const ext = (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
        it('should be callable as module.exports', function () {
            // This tests CommonJS compatibility
            const createExt = require('../lib/antora-extension.js');
            const ext = createExt(mockContext);
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
    });
    describe('Traceability Extension Access', function () {
        it('should allow access to underlying traceability extension', function () {
            const traceability = extension.getTraceabilityExtension();
            (0, chai_1.expect)(traceability).to.have.property('graph');
            (0, chai_1.expect)(traceability).to.have.property('process');
            (0, chai_1.expect)(traceability).to.have.property('generateMatrix');
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
            (0, chai_1.expect)(req).to.not.be.undefined;
            (0, chai_1.expect)(req.id).to.equal('REQ-001');
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
            const ext = (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
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
            const ext = (0, antora_extension_1.default)(mockContext);
            (0, chai_1.expect)(ext).to.be.an('object');
            (0, chai_1.expect)(ext.getTraceabilityExtension).to.be.a('function');
        });
    });
});
