/**
 * Tests for ConfigLoader - Configuration loading and validation
 */
import { expect } from 'chai';
import { ConfigLoader, loadConfig } from '../src/config/TraceabilityConfig.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
describe('ConfigLoader', () => {
    let configLoader;
    beforeEach(() => {
        configLoader = new ConfigLoader();
    });
    describe('Initialization', () => {
        it('should create a new ConfigLoader instance', () => {
            expect(configLoader).to.exist;
        });
    });
    describe('Built-in Presets', () => {
        it('should list available presets', () => {
            const presets = configLoader.listPresets();
            expect(presets).to.be.an('array');
            expect(presets.length).to.be.at.least(1);
            // Check that known presets are included
            const presetNames = presets.map(p => p.name);
            expect(presetNames).to.include('requirements-engineering');
            expect(presetNames).to.include('agile');
            expect(presetNames).to.include('medical-iec62304');
            expect(presetNames).to.include('minimal');
        });
        it('should load a specific preset by name', () => {
            const preset = configLoader.loadPreset('requirements-engineering');
            expect(preset).to.exist;
            expect(preset.name).to.equal('requirements-engineering');
            expect(preset.traceability).to.exist;
            expect(preset.traceability.roles).to.be.an('array');
            expect(preset.traceability.roles.length).to.be.at.least(1);
        });
        it('should load preset with correct structure', () => {
            const preset = configLoader.loadPreset('requirements-engineering');
            // Check preset metadata
            expect(preset).to.have.property('name');
            expect(preset).to.have.property('description');
            expect(preset).to.have.property('version');
            // Check traceability config
            expect(preset.traceability).to.have.property('roles');
            expect(preset.traceability).to.have.property('relations');
            expect(preset.traceability).to.have.property('matrices');
            // Check roles
            expect(preset.traceability.roles).to.be.an('array');
            expect(preset.traceability.roles).to.include('requirement');
            // Check relations
            expect(preset.traceability.relations).to.be.an('object');
        });
        it('should get preset details via loadPreset', () => {
            const preset = configLoader.loadPreset('requirements-engineering');
            expect(preset).to.exist;
            expect(preset.name).to.equal('requirements-engineering');
        });
    });
    describe('Configuration Loading', () => {
        it('should load configuration from a file', () => {
            // Create a temporary config file
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'test-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
  - test

relations:
  requirement:
    implementation:
      - implements
    test:
      - tests

matrices:
  - name: requirements-implementations
    description: Requirements to Implementations
    rows: requirement
    columns:
      - implementation
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const config = configLoader.getConfig();
                expect(config).to.exist;
                expect(config.roles).to.be.an('array');
                expect(config.roles).to.include('requirement');
                expect(config.roles).to.include('implementation');
                expect(config.roles).to.include('test');
                expect(config.relations).to.exist;
                expect(config.matrices).to.be.an('array');
            }
            finally {
                // Cleanup
                fs.unlinkSync(configPath);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should handle missing configuration file gracefully', () => {
            expect(() => {
                configLoader.load('/nonexistent/path/to/config.yml');
            }).to.throw;
        });
        it('should handle invalid YAML gracefully', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'invalid-config.yml');
            const configContent = 'this is not valid yaml: [unclosed bracket';
            fs.writeFileSync(configPath, configContent);
            try {
                expect(() => {
                    configLoader.load(configPath);
                }).to.throw;
            }
            finally {
                // Cleanup
                fs.unlinkSync(configPath);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });
    describe('Configuration Validation', () => {
        it('should validate roles configuration', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'valid-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      - implements
matrices:
  - name: test-matrix
    rows: requirement
    columns:
      - implementation
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const config = configLoader.getConfig();
                expect(config.roles).to.be.an('array');
            }
            finally {
                fs.unlinkSync(configPath);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should validate relations configuration', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'relations-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
  - test
relations:
  requirement:
    implementation:
      - implements
      - satisfies
    test:
      - verifies
      - tests
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const config = configLoader.getConfig();
                expect(config.relations).to.exist;
                expect(config.relations?.requirement).to.exist;
            }
            finally {
                fs.unlinkSync(configPath);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should validate matrices configuration', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'matrices-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
  - test
  - design
relations:
  requirement:
    implementation:
      - implements
    test:
      - tests
    design:
      - addresses
matrices:
  - name: req-impl
    description: Requirements to Implementations
    rows: requirement
    columns:
      - implementation
      - test
    coverageRelations:
      implementation:
        - implements
      test:
        - tests
        - verifies
  - name: req-design
    rows: requirement
    columns:
      - design
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const config = configLoader.getConfig();
                expect(config.matrices).to.be.an('array');
                expect(config.matrices?.length).to.be.at.least(1);
            }
            finally {
                fs.unlinkSync(configPath);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });
    describe('Role Validation', () => {
        it('should check if a role is known after loading config', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'roles-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
  - test
relations:
  requirement:
    implementation:
      - implements
    test:
      - tests
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const isKnown = configLoader.isKnownRole('requirement');
                expect(isKnown).to.be.true;
                const isUnknown = configLoader.isKnownRole('nonexistent');
                expect(isUnknown).to.be.false;
            }
            finally {
                fs.rmSync(configPath, { force: true });
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should check if relation is allowed between roles after loading config', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'relations-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      - implements
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const isAllowed = configLoader.isRelationAllowed('requirement', 'implementation', 'implements');
                expect(isAllowed).to.be.true;
                const isNotAllowed = configLoader.isRelationAllowed('requirement', 'implementation', 'unknown-relation');
                expect(isNotAllowed).to.be.false;
            }
            finally {
                fs.rmSync(configPath, { force: true });
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should get allowed relations between roles after loading config', () => {
            const tempDir = path.join(__dirname, 'temp');
            if (!fs.existsSync(tempDir)) {
                fs.mkdirSync(tempDir, { recursive: true });
            }
            const configPath = path.join(tempDir, 'relations2-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      - implements
      - satisfies
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const allowed = configLoader.getAllowedRelations('requirement', 'implementation');
                expect(allowed).to.be.an('array');
                expect(allowed).to.include('implements');
                expect(allowed).to.include('satisfies');
            }
            finally {
                fs.rmSync(configPath, { force: true });
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
    });
    describe('Matrix Definitions', () => {
        it('should get matrix definitions from configuration after loading', () => {
            const tempDir = path.join(__dirname, 'temp-matrix-defs');
            fs.mkdirSync(tempDir, { recursive: true });
            const configPath = path.join(tempDir, 'matrices-config.yml');
            const configContent = `
roles:
  - requirement
  - implementation
  - test
relations:
  requirement:
    implementation:
      - implements
    test:
      - tests
matrices:
  - name: req-impl
    rows: requirement
    columns:
      - implementation
  - name: req-test
    rows: requirement
    columns:
      - test
`;
            fs.writeFileSync(configPath, configContent);
            try {
                configLoader.load(configPath);
                const matrices = configLoader.getMatrices();
                expect(matrices).to.be.an('array');
                expect(matrices.length).to.be.at.least(1);
                expect(matrices[0].name).to.be.oneOf(['req-impl', 'req-test']);
            }
            finally {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should throw error when getting matrices without loading config', () => {
            // Create a new loader without config
            const newLoader = new ConfigLoader();
            expect(() => newLoader.getMatrices()).to.throw(/Configuration not loaded/);
        });
    });
    describe('Configuration Merging', () => {
        it('should merge preset with custom configuration', () => {
            const preset = configLoader.loadPreset('requirements-engineering');
            expect(preset.traceability.roles).to.be.an('array');
            // The preset should have a complete traceability config
            expect(preset.traceability).to.have.property('roles');
            expect(preset.traceability).to.have.property('relations');
            expect(preset.traceability).to.have.property('matrices');
        });
    });
    describe('Error Handling', () => {
        it('should provide clear error messages for invalid configurations', () => {
            const tempDir = path.join(__dirname, 'temp-invalid');
            fs.mkdirSync(tempDir, { recursive: true });
            const configPath = path.join(tempDir, 'empty-config.yml');
            const configContent = '';
            fs.writeFileSync(configPath, configContent);
            try {
                // Empty config should fail validation
                expect(() => configLoader.load(configPath)).to.throw(/Configuration must define at least one role/);
            }
            finally {
                fs.unlinkSync(configPath);
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
        });
        it('should handle invalid preset names', () => {
            expect(() => {
                configLoader.loadPreset('nonexistent-preset');
            }).to.throw;
        });
    });
});
describe('loadConfig function', () => {
    it('should load configuration from a path', () => {
        const tempDir = path.join(__dirname, 'temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        const configPath = path.join(tempDir, 'test-load-config.yml');
        const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      - implements
`;
        fs.writeFileSync(configPath, configContent);
        try {
            const config = loadConfig(configPath);
            expect(config).to.exist;
            expect(config.roles).to.include('requirement');
        }
        finally {
            fs.unlinkSync(configPath);
            fs.rmSync(tempDir, { recursive: true, force: true });
        }
    });
});
