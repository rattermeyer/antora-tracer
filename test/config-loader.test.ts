/**
 * Tests for ConfigLoader - Configuration loading and validation
 */

import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { expect } from "chai";
import { ConfigLoader, loadConfig } from "../src/config/TraceabilityConfig.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe("ConfigLoader", () => {
  let configLoader: ConfigLoader;

  beforeEach(() => {
    configLoader = new ConfigLoader();
  });

  describe("Initialization", () => {
    it("should create a new ConfigLoader instance", () => {
      expect(configLoader).to.exist;
    });
  });

  describe("Built-in Presets", () => {
    it("should list available presets", () => {
      const presets = configLoader.listPresets();
      expect(presets).to.be.an("array");
      expect(presets.length).to.be.at.least(1);

      // Check that known presets are included
      const presetNames = presets.map((p) => p.name);
      expect(presetNames).to.include("requirements-engineering");
      expect(presetNames).to.include("agile");
      expect(presetNames).to.include("medical-iec62304");
      expect(presetNames).to.include("minimal");
    });

    it("should load a specific preset by name", () => {
      const preset = configLoader.loadPreset("requirements-engineering");
      expect(preset).to.exist;
      expect(preset.name).to.equal("requirements-engineering");
      expect(preset.traceability).to.exist;
      expect(preset.traceability.roles).to.be.an("array");
      expect(preset.traceability.roles.length).to.be.at.least(1);
    });

    it("should load preset with correct structure", () => {
      const preset = configLoader.loadPreset("requirements-engineering");

      // Check preset metadata
      expect(preset).to.have.property("name");
      expect(preset).to.have.property("description");
      expect(preset).to.have.property("version");

      // Check traceability config
      expect(preset.traceability).to.have.property("roles");
      expect(preset.traceability).to.have.property("relations");
      expect(preset.traceability).to.have.property("matrices");

      // Check roles
      expect(preset.traceability.roles).to.be.an("array");
      expect(preset.traceability.roles).to.include("requirement");

      // Check relations
      expect(preset.traceability.relations).to.be.an("object");
    });

    it("should get preset details via loadPreset", () => {
      const preset = configLoader.loadPreset("requirements-engineering");
      expect(preset).to.exist;
      expect(preset.name).to.equal("requirements-engineering");
    });
  });

  describe("Configuration Loading", () => {
    it("should load configuration from a file", () => {
      // Create a temporary config file
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "test-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
  - test

relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
    test:
      tests:
        reverse: tested_by

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
        expect(config.roles).to.be.an("array");
        expect(config.roles).to.include("requirement");
        expect(config.roles).to.include("implementation");
        expect(config.roles).to.include("test");

        expect(config.relations).to.exist;
        expect(config.matrices).to.be.an("array");
      } finally {
        // Cleanup
        fs.unlinkSync(configPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should handle missing configuration file gracefully", () => {
      expect(() => {
        configLoader.load("/nonexistent/path/to/config.yml");
      }).to.throw;
    });

    it("should handle invalid YAML gracefully", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "invalid-config.yml");
      const configContent = "this is not valid yaml: [unclosed bracket";

      fs.writeFileSync(configPath, configContent);

      try {
        expect(() => {
          configLoader.load(configPath);
        }).to.throw;
      } finally {
        // Cleanup
        fs.unlinkSync(configPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Configuration Validation", () => {
    it("should validate roles configuration", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "valid-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
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
        expect(config.roles).to.be.an("array");
      } finally {
        fs.unlinkSync(configPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should validate relations configuration", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "relations-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
  - test
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
      satisfies:
        reverse: satisfied_by
    test:
      verifies:
        reverse: verified_by
      tests:
        reverse: tested_by
`;

      fs.writeFileSync(configPath, configContent);

      try {
        configLoader.load(configPath);
        const config = configLoader.getConfig();
        expect(config.relations).to.exist;
        expect(config.relations?.requirement).to.exist;
      } finally {
        fs.unlinkSync(configPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should validate matrices configuration", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "matrices-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
  - test
  - design
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
    test:
      tests:
        reverse: tested_by
    design:
      addresses:
        reverse: addressed_by
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
        expect(config.matrices).to.be.an("array");
        expect(config.matrices?.length).to.be.at.least(1);
      } finally {
        fs.unlinkSync(configPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Role Validation", () => {
    it("should check if a role is known after loading config", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "roles-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
  - test
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
    test:
      tests:
        reverse: tested_by
`;

      fs.writeFileSync(configPath, configContent);

      try {
        configLoader.load(configPath);
        const isKnown = configLoader.isKnownRole("requirement");
        expect(isKnown).to.be.true;

        const isUnknown = configLoader.isKnownRole("nonexistent");
        expect(isUnknown).to.be.false;
      } finally {
        fs.rmSync(configPath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should check if relation is allowed between roles after loading config", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "relations-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
`;

      fs.writeFileSync(configPath, configContent);

      try {
        configLoader.load(configPath);
        const isAllowed = configLoader.isRelationAllowed(
          "requirement",
          "implementation",
          "implements",
        );
        expect(isAllowed).to.be.true;

        const isNotAllowed = configLoader.isRelationAllowed(
          "requirement",
          "implementation",
          "unknown-relation",
        );
        expect(isNotAllowed).to.be.false;
      } finally {
        fs.rmSync(configPath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should get allowed relations between roles after loading config", () => {
      const tempDir = path.join(__dirname, "temp");
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      const configPath = path.join(tempDir, "relations2-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
      satisfies:
        reverse: satisfied_by
`;

      fs.writeFileSync(configPath, configContent);

      try {
        configLoader.load(configPath);
        const allowed = configLoader.getAllowedRelations(
          "requirement",
          "implementation",
        );
        expect(allowed).to.be.an("array");
        expect(allowed).to.include("implements");
        expect(allowed).to.include("satisfies");
      } finally {
        fs.rmSync(configPath, { force: true });
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });
  });

  describe("Matrix Definitions", () => {
    it("should get matrix definitions from configuration after loading", () => {
      const tempDir = path.join(__dirname, "temp-matrix-defs");
      fs.mkdirSync(tempDir, { recursive: true });

      const configPath = path.join(tempDir, "matrices-config.yml");
      const configContent = `
roles:
  - requirement
  - implementation
  - test
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
    test:
      tests:
        reverse: tested_by
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
        expect(matrices).to.be.an("array");
        expect(matrices.length).to.be.at.least(1);
        expect(matrices[0].name).to.be.oneOf(["req-impl", "req-test"]);
      } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should throw error when getting matrices without loading config", () => {
      // Create a new loader without config
      const newLoader = new ConfigLoader();
      expect(() => newLoader.getMatrices()).to.throw(
        /Configuration not loaded/,
      );
    });
  });

  describe("Configuration Merging", () => {
    it("should merge preset with custom configuration", () => {
      const preset = configLoader.loadPreset("requirements-engineering");
      expect(preset.traceability.roles).to.be.an("array");

      // The preset should have a complete traceability config
      expect(preset.traceability).to.have.property("roles");
      expect(preset.traceability).to.have.property("relations");
      expect(preset.traceability).to.have.property("matrices");
    });
  });

  describe("Error Handling", () => {
    it("should provide clear error messages for invalid configurations", () => {
      const tempDir = path.join(__dirname, "temp-invalid");
      fs.mkdirSync(tempDir, { recursive: true });

      const configPath = path.join(tempDir, "empty-config.yml");
      const configContent = "";

      fs.writeFileSync(configPath, configContent);

      try {
        // Empty config should fail validation
        expect(() => configLoader.load(configPath)).to.throw(
          /Configuration must define at least one role/,
        );
      } finally {
        fs.unlinkSync(configPath);
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("should handle invalid preset names", () => {
      expect(() => {
        configLoader.loadPreset("nonexistent-preset");
      }).to.throw;
    });
  });
});

describe("Preset Inheritance", () => {
  let loader: ConfigLoader;
  let tempDir: string;
  const originalCwd = process.cwd();

  function writePreset(name: string, body: string): void {
    const presetsDir = path.join(tempDir, "presets");
    fs.mkdirSync(presetsDir, { recursive: true });
    fs.writeFileSync(path.join(presetsDir, `${name}.yml`), body);
  }

  beforeEach(() => {
    loader = new ConfigLoader();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "preset-inheritance-"));
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it("inherits roles and relations from a built-in parent preset", () => {
    writePreset(
      "inherit-child",
      `name: inherit-child
version: 1.0.0
description: child
extends: requirements-engineering
traceability:
  roles:
    - custom_role
`,
    );

    const preset = loader.loadPreset("inherit-child");

    expect(preset.traceability.roles).to.include("requirement");
    expect(preset.traceability.roles).to.include("design");
    expect(preset.traceability.roles).to.include("custom_role");
    expect(preset.traceability.relations).to.have.property("design");
    expect(preset.traceability.relations!.design).to.have.property(
      "requirement",
    );
  });

  it("lets the child override relation reverses and labels", () => {
    writePreset(
      "parent",
      `name: parent
version: 1.0.0
description: parent
traceability:
  roles:
    - a
    - b
  relations:
    a:
      b:
        relates:
          reverse: related_by
  matrices:
    - name: ab
      rows: a
      columns:
        - b
  labels:
    relates: Related to
`,
    );
    writePreset(
      "child",
      `name: child
version: 1.0.0
description: child
extends: parent
traceability:
  roles:
    - c
  relations:
    a:
      b:
        relates:
          reverse: refined_by
  matrices:
    - name: ab
      rows: a
      columns:
        - c
  labels:
    relates: Refined
`,
    );

    const preset = loader.loadPreset("child");

    expect(preset.traceability.roles).to.include.members(["a", "b", "c"]);
    expect(preset.traceability.relations!.a.b.relates).to.deep.equal({
      reverse: "refined_by",
    });
    expect(preset.traceability.labels!.relates).to.equal("Refined");

    const abMatrix = preset.traceability.matrices!.find((m) => m.name === "ab");
    expect(abMatrix).to.exist;
    expect(abMatrix!.columns).to.deep.equal(["c"]);
  });

  it("adds new matrices alongside inherited ones and replaces same-name matrices", () => {
    writePreset(
      "parent",
      `name: parent
version: 1.0.0
description: parent
traceability:
  roles:
    - a
    - b
  matrices:
    - name: ab
      description: parent matrix
      rows: a
      columns:
        - b
`,
    );
    writePreset(
      "child",
      `name: child
version: 1.0.0
description: child
extends: parent
traceability:
  matrices:
    - name: ab
      description: child matrix
      rows: a
      columns:
        - b
    - name: ba
      description: new matrix
      rows: b
      columns:
        - a
`,
    );

    const preset = loader.loadPreset("child");
    const names = preset.traceability.matrices!.map((m) => m.name);

    expect(names).to.have.members(["ab", "ba"]);
    expect(names).to.have.lengthOf(2);

    const abMatrix = preset.traceability.matrices!.find((m) => m.name === "ab");
    expect(abMatrix!.description).to.equal("child matrix");
  });

  it("resolves transitive inheritance chains", () => {
    writePreset(
      "c",
      `name: c
version: 1.0.0
description: c
traceability:
  roles:
    - c_role
`,
    );
    writePreset(
      "b",
      `name: b
version: 1.0.0
description: b
extends: c
traceability:
  roles:
    - b_role
`,
    );
    writePreset(
      "a",
      `name: a
version: 1.0.0
description: a
extends: b
traceability:
  roles:
    - a_role
`,
    );

    const preset = loader.loadPreset("a");

    expect(preset.traceability.roles).to.include.members([
      "a_role",
      "b_role",
      "c_role",
    ]);
  });

  it("throws when the parent preset does not exist", () => {
    writePreset(
      "orphan",
      `name: orphan
version: 1.0.0
description: orphan
extends: does-not-exist
traceability:
  roles:
    - x
`,
    );

    expect(() => loader.loadPreset("orphan")).to.throw(/not found/);
  });

  it("throws on self-extension", () => {
    writePreset(
      "self",
      `name: self
version: 1.0.0
description: self
extends: self
traceability:
  roles:
    - x
`,
    );

    expect(() => loader.loadPreset("self")).to.throw(
      /Circular preset inheritance/,
    );
  });

  it("throws on mutual extension", () => {
    writePreset(
      "m1",
      `name: m1
version: 1.0.0
description: m1
extends: m2
traceability:
  roles:
    - x
`,
    );
    writePreset(
      "m2",
      `name: m2
version: 1.0.0
description: m2
extends: m1
traceability:
  roles:
    - y
`,
    );

    expect(() => loader.loadPreset("m1")).to.throw(
      /Circular preset inheritance/,
    );
  });
});

describe("loadConfig function", () => {
  it("should load configuration from a path", () => {
    const tempDir = path.join(__dirname, "temp");
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const configPath = path.join(tempDir, "test-load-config.yml");
    const configContent = `
roles:
  - requirement
  - implementation
relations:
  requirement:
    implementation:
      implements:
        reverse: implemented_by
`;

    fs.writeFileSync(configPath, configContent);

    try {
      const config = loadConfig(configPath);
      expect(config).to.exist;
      expect(config.roles).to.include("requirement");
    } finally {
      fs.unlinkSync(configPath);
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
