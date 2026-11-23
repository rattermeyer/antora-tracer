/**
 * Tests for role-based authoring guidance: config parsing, preset defaults,
 * project override, and extends-chain merging.
 */

import {
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type asciidoctorFactory from "@asciidoctor/core";
import { expect } from "chai";
import { load as yamlLoad } from "js-yaml";
import {
  BUILT_IN_PRESETS,
  ConfigLoader,
} from "../src/config/TraceabilityConfig.js";

const asciidoctor = createRequire(import.meta.url)(
  "@asciidoctor/core",
) as () => asciidoctorFactory.Asciidoctor;

// The source preset tree. The built `lib/` copy is what `ConfigLoader` resolves
// against at runtime, so a guard that only checked resolved paths would pass
// even when a referenced page exists solely in build output. These tests assert
// the pages exist in `src/`, the tree the build copies from.
const SRC_PRESETS_DIR = resolve(process.cwd(), "src", "presets");

describe("role-guidance", () => {
  it("resolves default guidance from a preset", () => {
    const loader = new ConfigLoader();
    const preset = loader.loadPreset("requirements-engineering");

    expect(preset.traceability.roleGuidance).to.exist;
    const requirement = preset.traceability.roleGuidance!.requirement;
    expect(requirement).to.exist;
    expect(requirement.idPrefix).to.equal("REQ");
    expect(requirement.page).to.match(/guidance\/requirement\.adoc$/);
  });

  it("maps every built-in preset role to a shipped guidance page", () => {
    const loader = new ConfigLoader();

    for (const name of BUILT_IN_PRESETS) {
      const traceability = loader.loadPreset(name).traceability;
      const roles = new Set(traceability.roles);
      const guidance = traceability.roleGuidance ?? {};

      expect(Object.keys(guidance), name).to.have.members([...roles]);
      for (const [role, entry] of Object.entries(guidance)) {
        expect(existsSync(entry.page), `${name}:${role} page`).to.equal(true);
      }
    }
  });

  it("ships every referenced guidance page in the source preset tree", () => {
    // Assert against `src/presets`, not the runtime-resolved path. A page that
    // exists only in the built `lib/` copy would satisfy the resolved-path check
    // above while being absent from the tree the build copies from — the drift
    // that left 21 referenced pages missing from `src/`.
    const presetFiles = readdirSync(SRC_PRESETS_DIR).filter((f) =>
      f.endsWith(".yml"),
    );
    expect(presetFiles.length).to.be.greaterThan(0);

    let checked = 0;
    for (const file of presetFiles) {
      const preset = yamlLoad(
        readFileSync(join(SRC_PRESETS_DIR, file), "utf8"),
      ) as {
        traceability?: {
          roleGuidance?: Record<string, { page?: string }>;
        };
      };
      for (const [role, entry] of Object.entries(
        preset.traceability?.roleGuidance ?? {},
      )) {
        if (!entry?.page) continue;
        const sourcePath = resolve(SRC_PRESETS_DIR, entry.page);
        expect(
          existsSync(sourcePath),
          `${file}:${role} -> ${entry.page} must exist in src/presets`,
        ).to.equal(true);
        checked++;
      }
    }
    expect(checked).to.be.greaterThan(0);
  });

  it("project roleGuidance overrides the preset per role", () => {
    const dir = mkdtempSync(join(tmpdir(), "role-guidance-"));
    const cfg = join(dir, "traceability.yml");
    writeFileSync(
      cfg,
      [
        "extends: requirements-engineering",
        "roles: [requirement]",
        "roleGuidance:",
        "  requirement:",
        "    page: my-req.adoc",
        "    idPrefix: FR",
      ].join("\n"),
    );
    writeFileSync(join(dir, "my-req.adoc"), "= Custom\n");

    const loader = new ConfigLoader();
    const config = loader.load(cfg);

    expect(config.roleGuidance!.requirement.idPrefix).to.equal("FR");
    expect(config.roleGuidance!.requirement.page).to.match(/my-req\.adoc$/);
    // Preset guidance for other roles is still present after the merge.
    expect(config.roleGuidance!.design.idPrefix).to.equal("ARC");

    rmSync(dir, { recursive: true, force: true });
  });

  it("merges guidance across the extends chain", () => {
    const loader = new ConfigLoader();
    const config = loader.loadPreset("requirements-engineering").traceability;

    expect(config.roleGuidance!.requirement).to.exist;
    expect(config.roleGuidance!.design).to.exist;
    expect(config.roleGuidance!.test).to.exist;
  });

  it("reports no guidance for a role without an entry", () => {
    const loader = new ConfigLoader();
    const config = loader.loadPreset("requirements-engineering").traceability;
    expect(config.roleGuidance!.epic).to.be.undefined;
  });

  it("resolves a guidance page for every declared role in every built-in preset", () => {
    const loader = new ConfigLoader();

    for (const name of BUILT_IN_PRESETS) {
      const traceability = loader.loadPreset(name).traceability;
      for (const role of traceability.roles) {
        const guidance = traceability.roleGuidance?.[role];
        expect(guidance, `${name}:${role} must have guidance`).to.exist;
        expect(guidance!.page, `${name}:${role} guidance page`).to.be.a(
          "string",
        );
        expect(
          existsSync(guidance!.page),
          `${name}:${role} page ${guidance!.page} must exist`,
        ).to.equal(true);
      }
    }
  });

  it("renders every shipped guidance page through Asciidoctor without error", () => {
    const Asciidoctor = (
      asciidoctor as unknown as () => {
        convert(
          content: string,
          options?: Record<string, unknown>,
        ): { convert(): string };
      }
    )();
    const pages = readdirSync(resolve(SRC_PRESETS_DIR, "guidance")).filter(
      (f) => f.endsWith(".adoc"),
    );
    expect(pages.length).to.be.greaterThan(0);

    for (const page of pages) {
      const source = readFileSync(
        resolve(SRC_PRESETS_DIR, "guidance", page),
        "utf8",
      );
      let html = "";
      expect(() => {
        html = String(Asciidoctor.convert(source, { safe: "safe" }));
      }, `${page} must render`).to.not.throw();
      expect(html.length, `${page} produced no HTML`).to.be.greaterThan(0);

      // The first line is the document title; Asciidoctor consumes it (it does
      // not emit a title element without a header/footer). A page whose header
      // failed to parse would leave it as literal paragraph text instead.
      const firstLine = source.split("\n", 1)[0];
      expect(firstLine, `${page} should start with a title`).to.match(/^= /);
      expect(
        html,
        `${page} left its '${firstLine}' title unparsed`,
      ).to.not.contain(firstLine);

      // An unbalanced delimiter would leak the remaining source as literal
      // AsciiDoc. Require at least one real rendered element.
      expect(html, `${page} rendered no elements`).to.match(
        /<div class="(paragraph|ulist|olist|listingblock|table|sect\d)"/,
      );
    }
  });
});
