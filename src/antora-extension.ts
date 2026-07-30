/**
 * Antora Extension for Requirements Traceability
 *
 * This module provides the Antora extension that integrates requirements traceability
 * into the Antora documentation pipeline using the unified item architecture.
 *
 * Usage:
 * In your Antora playbook, add this extension to the extensions array:
 * {
 *   extensions: [
 *     require('antora-requirements-traceability/lib/antora-extension')
 *   ]
 * }
 */

import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readdirSync,
  statSync,
  copyFileSync,
} from "node:fs";
import { isAbsolute, join } from "node:path";
import { deflateSync } from "node:zlib";
import { ConfigLoader } from "./config/TraceabilityConfig.js";
import { RequirementsTraceabilityExtension } from "./index.js";
import { LinkResolver } from "./LinkResolver.js";
import { MatrixGenerator } from "./MatrixGenerator.js";
import { INVERSE_MAP } from "./types.js";

/**
 * Antora Extension Configuration
 */
export interface AntoraTraceabilityConfig {
  enabled?: boolean;
  outputDir?: string;
  generateMatrices?: boolean;
  matrixFormats?: ("csv" | "html" | "json")[];
  includeInNavigation?: boolean;
  preset?: string;
  configPath?: string;
}

const DEFAULT_CONFIG: Required<AntoraTraceabilityConfig> = {
  enabled: true,
  outputDir: "traceability",
  generateMatrices: true,
  matrixFormats: ["html", "csv"],
  includeInNavigation: true,
  preset: "requirements-engineering",
  configPath: "",
};

export interface AntoraExtensionContext {
  getLogger: (name?: string) => {
    info: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string) => void;
    debug: (message: string) => void;
  };
  on: (event: string, handler: (...args: any[]) => void) => void;
  once?: (event: string, handler: (...args: any[]) => void) => void;
  config?: any;
  module?: any;
  playbook?: any;
}

export class AntoraTraceabilityExtension {
  private traceability: RequirementsTraceabilityExtension | null = null;
  private config: Required<AntoraTraceabilityConfig>;
  private readonly logger: ReturnType<AntoraExtensionContext["getLogger"]>;
  private itemsWithOutgoingMacro = new Set<string>();
  private itemsWithIncomingMacro = new Set<string>();

  constructor(
    private readonly context: AntoraExtensionContext,
    antoraConfig?: { config?: Partial<AntoraTraceabilityConfig> },
  ) {
    this.logger = context.getLogger("requirements-traceability");
    this.config = {
      ...DEFAULT_CONFIG,
      ...this.loadConfig(),
      ...antoraConfig?.config,
    };

    // Fallback: if no configPath is set, try the example site config
    if (!this.config.configPath) {
      const exampleConfig = join(process.cwd(), "examples", "traceability.yml");
      if (existsSync(exampleConfig)) {
        this.config.configPath = exampleConfig;
      }
    }

    if (!this.config.enabled) {
      this.logger.info("Requirements traceability extension is disabled");
      return;
    }

    this.logger.info("Requirements traceability extension initialized");

    // Register event handlers synchronously in constructor
    // They will check if traceability is loaded before processing
    this.registerContentClassifier();
    this.registerPageProcessor();
    this.registerNavigationEnhancer();

    // Load the extension asynchronously
    this.initializeAsync();
  }

  private async initializeAsync(): Promise<void> {
    // Load the traceability extension (may involve async preset loading)
    this.traceability = await this.createTraceabilityExtension();
    this.logger.debug("Requirements traceability extension fully initialized");
  }

  private async createTraceabilityExtension(): Promise<RequirementsTraceabilityExtension> {
    if (this.config.configPath) {
      const configLoader = new ConfigLoader();
      try {
        // Resolve config path relative to playbook dir, falling back to CWD
        const playbookDir = this.context.playbook?.dir || process.cwd();
        const resolvedPath = isAbsolute(this.config.configPath)
          ? this.config.configPath
          : join(playbookDir, this.config.configPath);
        configLoader.load(resolvedPath);
        this.logger.info(
          `Loaded configuration from: ${resolvedPath}`,
        );
        return new RequirementsTraceabilityExtension(configLoader);
      } catch (error: any) {
        this.logger.warn(
          `Could not load configuration: ${error.message}. Using default.`,
        );
      }
    }

    if (this.config.preset) {
      try {
        return await RequirementsTraceabilityExtension.createWithPreset(
          this.config.preset as any,
        );
      } catch (error: any) {
        this.logger.warn(
          `Could not load preset: ${error.message}. Using default.`,
        );
      }
    }

    return new RequirementsTraceabilityExtension();
  }

  private loadConfig(): Partial<AntoraTraceabilityConfig> {
    try {
      const playbook = this.context.playbook;
      // Extensions are under antora.extensions in the playbook schema
      const extensions = playbook.antora?.extensions || playbook.extensions;
      if (!extensions) return {};
      const extEntry = extensions.find(
        (e: any) =>
          e.require === "antora-tracer/antora-extension" ||
          e.require === "./lib/src/antora-extension.js" ||
          e.require?.includes("antora-tracer") ||
          e.name === "antora-requirements-traceability",
      );
      if (!extEntry) return {};
      // Support both formats: config nested under 'config' key, or directly on the entry
      return extEntry.config ?? extEntry ?? {};
    } catch {
      return {};
    }
  }

  /**
   * Normalize source file path to be relative to pages/ directory.
   * Strips path prefix up to /pages/ and removes .adoc extension.
   */
  private normalizeSourceFile(sourceFile: string): string {
    let result = sourceFile.replace(/\\/g, "/");
    result = result.replace(/\\.adoc$/, "");
    result = result.replace(/^.*[\\/]pages[\\/]/, "");
    return result;
  }

  /**
   * Parse AsciiDoc document attributes from content header.
   */
  private parseDocAttributes(content: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const lines = content.split("\n");
    for (const line of lines) {
      const m = line.match(/^:(\w[\w-]*):\s*(.*)/);
      if (m) {
        attrs[m[1]] = m[2].trim();
      }
      if (line.trim() === "" && Object.keys(attrs).length > 0) break;
    }
    return attrs;
  }

  private isLinksEnabled(attrs: Record<string, string>): boolean {
    const val = (attrs["traceability-links"] || "").toLowerCase();
    return val === "true" || val === "yes" || val === "1";
  }

  private getLinksStyle(
    attrs: Record<string, string>,
  ): "list" | "table" | "inline" {
    const val = (attrs["traceability-style"] || "").toLowerCase();
    if (val === "table") return "table";
    if (val === "inline") return "inline";
    return "list";
  }

  private getLinksOrder(
    attrs: Record<string, string>,
  ): "target-id" | "target-title" | "relation-type" {
    const val = (attrs["traceability-order"] || "").toLowerCase();
    if (val === "target-title") return "target-title";
    if (val === "relation-type") return "relation-type";
    return "target-id";
  }

  private getCollapsible(attrs: Record<string, string>): boolean {
    const val = (attrs["traceability-collapsible"] || "").toLowerCase();
    return val === "true" || val === "yes" || val === "1";
  }

  /**
   * Find all item block boundaries in content using quote-aware scanning
   * so that ']' inside quoted title values doesn't break detection.
   * Returns array of { itemId, headerEnd, bodyStart, bodyEnd } where
   * bodyStart..bodyEnd is the body content between -- delimiters.
   */
  private findItemBlocks(content: string): Array<{
    itemId: string;
    headerStart: number;
    headerEnd: number;
    bodyStart: number;
    bodyEnd: number;
  }> {
    const results: Array<{
      itemId: string;
      headerStart: number;
      headerEnd: number;
      bodyStart: number;
      bodyEnd: number;
    }> = [];

    const macroStartRe = /\[#([^,\]]+),\s*item,?/g;
    let m: RegExpExecArray | null;

    while ((m = macroStartRe.exec(content)) !== null) {
      const itemId = m[1].trim();
      const attrStart = m.index + m[0].length;

      // Scan forward for the closing ']' outside quoted strings
      let macroEnd = -1;
      let inQ = false;
      let qChar = "";
      for (let i = attrStart; i < content.length; i++) {
        const ch = content[i];
        if (
          (ch === '"' || ch === "'") &&
          (i === 0 || content[i - 1] !== "\\")
        ) {
          if (!inQ) {
            inQ = true;
            qChar = ch;
          } else if (ch === qChar) {
            inQ = false;
            qChar = "";
          }
        } else if (ch === "]" && !inQ) {
          macroEnd = i;
          break;
        }
      }
      if (macroEnd === -1) continue;

      // Find the opening '--' delimiter after the macro line
      const afterHeader = content.slice(macroEnd + 1);
      const openDelim = afterHeader.match(/[ \t]*\r?\n--\r?\n/);
      if (!openDelim || openDelim.index === undefined) continue;

      const bodyStart = macroEnd + 1 + openDelim.index + openDelim[0].length;
      const bodyEnd = content.indexOf("\n--\n", bodyStart);
      if (bodyEnd === -1) continue;

      results.push({ itemId, headerStart: m.index, headerEnd: macroEnd + 1, bodyStart, bodyEnd });
    }

    return results;
  }

  /**
   * Expand traceability:outgoing[] macros.
   */
  private expandOutgoingMacros(file: any): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;
      const content = contentsBuffer.toString("utf8");
      const docAttrs = this.parseDocAttributes(content);
      const linksEnabled = this.isLinksEnabled(docAttrs);
      if (!content.includes("traceability:outgoing[]")) return;

      const style = this.getLinksStyle(docAttrs);
      const order = this.getLinksOrder(docAttrs);
      const collapsible = this.getCollapsible(docAttrs);
      const sourceFile = file.src?.path || file.path || "unknown";
      const currentFile = this.normalizeSourceFile(sourceFile);
      const replacements: Array<{ start: number; end: number; text: string }> =
        [];

      // Find item blocks and scan for macros only within block bodies.
      // This avoids matching the macro name in prose/documentation text.
      const blocks = this.findItemBlocks(content);

      for (const { itemId, bodyStart } of blocks) {
        const bodyContent = content.slice(
          bodyStart,
          content.indexOf("\n--\n", bodyStart),
        );

        // Scan for macros within this body
        const macroRegex = /traceability:outgoing\[\]/g;
        let macroMatch: RegExpExecArray | null;
        const bodyRanges = this.getInlineCodeRanges(bodyContent);
        while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
          if (this.isInsideRange(macroMatch.index, bodyRanges)) continue;
          const macroStart = bodyStart + macroMatch.index;
          const macroEnd = macroStart + macroMatch[0].length;

          if (!linksEnabled) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }
          this.itemsWithOutgoingMacro.add(itemId);

          const rels = this.traceability.graph.getRelationships(itemId);
          if (rels.length === 0) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          const grouped = new Map<
            string,
            Array<{ id: string; title: string; sourceFile?: string }>
          >();
          for (const rel of rels) {
            const target = this.traceability.graph.getItem(rel.targetId);
            if (!target) continue;
            if (!grouped.has(rel.type)) grouped.set(rel.type, []);
            grouped.get(rel.type)?.push({
              id: target.id,
              title: target.title || target.id,
              sourceFile: target.sourceFile,
            });
          }
          if (grouped.size === 0) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          let groupEntries = Array.from(grouped.entries());
          if (order === "relation-type")
            groupEntries.sort((a, b) => a[0].localeCompare(b[0]));
          for (const [, items] of groupEntries) {
            if (order === "target-id")
              items.sort((a, b) => a.id.localeCompare(b.id));
            else if (order === "target-title")
              items.sort((a, b) => a.title.localeCompare(b.title));
          }

          const generated = this.generateLinksAsciiDoc(
            groupEntries,
            style,
            currentFile,
            collapsible,
          );
          replacements.push({
            start: macroStart,
            end: macroEnd,
            text: generated,
          });
        }
      }

      if (replacements.length > 0) {
        let modifiedContent = content;
        for (let i = replacements.length - 1; i >= 0; i--) {
          const r = replacements[i];
          modifiedContent =
            modifiedContent.slice(0, r.start) +
            r.text +
            modifiedContent.slice(r.end);
        }
        const buf = Buffer.from(modifiedContent, "utf8");
        if (file.contents) file.contents = buf;
        if (file.src?.contents) file.src.contents = buf;
      }
    } catch (error: any) {
      this.logger.warn(
        `Error expanding links in ${file.src?.path}: ${error.message}`,
      );
    }
  }

  /**
   * Expand traceability:incoming[] macros.
   */
  private expandIncomingMacros(file: any): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;
      const content = contentsBuffer.toString("utf8");
      const docAttrs = this.parseDocAttributes(content);
      const linksEnabled = this.isLinksEnabled(docAttrs);
      if (!content.includes("traceability:incoming[]")) return;

      const style = this.getLinksStyle(docAttrs);
      const order = this.getLinksOrder(docAttrs);
      const collapsible = this.getCollapsible(docAttrs);
      const sourceFile = file.src?.path || file.path || "unknown";
      const currentFile = this.normalizeSourceFile(sourceFile);
      const replacements: Array<{ start: number; end: number; text: string }> =
        [];

      // Find item blocks and scan for macros only within block bodies.
      // This avoids matching the macro name in prose/documentation text.
      const blocks = this.findItemBlocks(content);

      for (const { itemId, bodyStart } of blocks) {
        const bodyContent = content.slice(
          bodyStart,
          content.indexOf("\n--\n", bodyStart),
        );

        // Scan for macros within this body
        const macroRegex = /traceability:incoming\[\]/g;
        let macroMatch: RegExpExecArray | null;
        const bodyRanges = this.getInlineCodeRanges(bodyContent);
        while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
          if (this.isInsideRange(macroMatch.index, bodyRanges)) continue;
          const macroStart = bodyStart + macroMatch.index;
          const macroEnd = macroStart + macroMatch[0].length;

          if (!linksEnabled) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }
          this.itemsWithIncomingMacro.add(itemId);

          const rels = this.traceability.graph.getReverseRelationships(itemId);
          if (rels.length === 0) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          const grouped = new Map<
            string,
            Array<{ id: string; title: string; sourceFile?: string }>
          >();
          for (const rel of rels) {
            const source = this.traceability.graph.getItem(rel.fromId);
            if (!source) continue;
            // Transform relation type to inverse label for incoming display
            const inverseType =
              INVERSE_MAP[rel.type as keyof typeof INVERSE_MAP] || rel.type;
            if (!grouped.has(inverseType)) grouped.set(inverseType, []);
            grouped.get(inverseType)?.push({
              id: source.id,
              title: source.title || source.id,
              sourceFile: source.sourceFile,
            });
          }
          if (grouped.size === 0) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          let groupEntries = Array.from(grouped.entries());
          if (order === "relation-type")
            groupEntries.sort((a, b) => a[0].localeCompare(b[0]));
          for (const [, items] of groupEntries) {
            if (order === "target-id")
              items.sort((a, b) => a.id.localeCompare(b.id));
            else if (order === "target-title")
              items.sort((a, b) => a.title.localeCompare(b.title));
          }

          const generated = this.generateLinksAsciiDoc(
            groupEntries,
            style,
            currentFile,
            collapsible,
          );
          replacements.push({
            start: macroStart,
            end: macroEnd,
            text: generated,
          });
        }
      }

      if (replacements.length > 0) {
        let modifiedContent = content;
        for (let i = replacements.length - 1; i >= 0; i--) {
          const r = replacements[i];
          modifiedContent =
            modifiedContent.slice(0, r.start) +
            r.text +
            modifiedContent.slice(r.end);
        }
        const buf = Buffer.from(modifiedContent, "utf8");
        if (file.contents) file.contents = buf;
        if (file.src?.contents) file.src.contents = buf;
      }
    } catch (error: any) {
      this.logger.warn(
        `Error expanding incoming links in ${file.src?.path}: ${error.message}`,
      );
    }
  }

  private generateLinksAsciiDoc(
    grouped: Array<
      [string, Array<{ id: string; title: string; sourceFile?: string }>]
    >,
    style: "list" | "table" | "inline",
    currentFile: string,
    collapsible: boolean,
  ): string {
    if (grouped.length === 0) return "";
    if (style === "table") return this.generateTableStyle(grouped, currentFile);
    if (style === "inline")
      return this.generateInlineStyle(grouped, currentFile);
    return this.generateListStyle(grouped, currentFile, collapsible);
  }

  private buildXref(
    item: { id: string; title: string; sourceFile?: string },
    currentFile: string,
    displayText: string,
  ): string {
    if (item.sourceFile && item.sourceFile !== currentFile) {
      return `xref:${item.sourceFile}#${item.id}[${displayText}]`;
    }
    return `xref:#${item.id}[${displayText}]`;
  }

  private generateListStyle(
    grouped: Array<
      [string, Array<{ id: string; title: string; sourceFile?: string }>]
    >,
    currentFile: string,
    collapsible: boolean,
  ): string {
    const lines: string[] = [];
    for (const [relType, items] of grouped) {
      const title = this.capitalize(relType);
      if (collapsible) {
        lines.push(`\n[%collapsible]`);
        lines.push(`.${title}`);
        lines.push(`====`);
      } else {
        lines.push(`\n.${title}`);
      }
      for (const item of items) {
        const safeTitle = item.title
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        lines.push(`* ${this.buildXref(item, currentFile, safeTitle)}`);
      }
      if (collapsible) {
        lines.push(`====`);
      }
    }
    return `${lines.join("\n")}\n`;
  }

  private generateTableStyle(
    grouped: Array<
      [string, Array<{ id: string; title: string; sourceFile?: string }>]
    >,
    currentFile: string,
  ): string {
    const lines: string[] = ['\n[cols="15,15,70"]', "|==="];
    lines.push("| Relation | ID | Title");
    for (const [relType, items] of grouped) {
      for (const item of items) {
        const xref = this.buildXref(item, currentFile, item.id);
        lines.push(
          "| " +
            relType +
            "| " +
            xref +
            " | " +
            item.title.replace(/\|/g, "\\\\|").replace(/&/g, "&amp;"),
        );
      }
    }
    lines.push("|===");
    return `${lines.join("\n")}\n`;
  }

  private generateInlineStyle(
    grouped: Array<
      [string, Array<{ id: string; title: string; sourceFile?: string }>]
    >,
    currentFile: string,
  ): string {
    const lines: string[] = [];
    for (const [relType, items] of grouped) {
      lines.push(
        "\n" +
          this.capitalize(relType) +
          ": " +
          items.map((i) => this.buildXref(i, currentFile, i.id)).join(", "),
      );
    }
    return `${lines.join("\n")}\n`;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  private isGraphEnabled(attrs: Record<string, string>): boolean {
    const val = (attrs["traceability-graph"] || "").toLowerCase();
    return val === "true" || val === "yes" || val === "1";
  }

  /**
   * Encode source text as a Kroki URL for the given diagram type.
   * Uses deflate + base64url encoding.
   */
  private krokiUrl(type: string, source: string, format = "svg"): string {
    const compressed = deflateSync(Buffer.from(source, "utf-8"));
    const encoded = Buffer.from(compressed).toString("base64url");
    return `https://kroki.io/${type}/${format}/${encoded}`;
  }

  /**
   * Expand traceability:graph[] macros into Kroki GraphViz images.
   */
  private expandGraphMacros(file: any): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;
      const content = contentsBuffer.toString("utf8");
      const docAttrs = this.parseDocAttributes(content);
      if (!content.includes("traceability:graph[")) return;

      const graphEnabled = this.isGraphEnabled(docAttrs);
      const blocks = this.findItemBlocks(content);
      const replacements: Array<{ start: number; end: number; text: string }> =
        [];

      for (const { itemId, bodyStart } of blocks) {
        const bodyEnd = content.indexOf("\n--\n", bodyStart);
        const bodyContent = content.slice(
          bodyStart,
          bodyEnd >= 0 ? bodyEnd : undefined,
        );

        const macroRegex =
          /traceability:graph\[([A-Z][A-Z0-9-]*)?(?:,\s*(\d+))?\]/g;
        let macroMatch: RegExpExecArray | null;
        const bodyRanges = this.getInlineCodeRanges(bodyContent);
        while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
          if (this.isInsideRange(macroMatch.index, bodyRanges)) continue;
          const macroStart = bodyStart + macroMatch.index;
          const macroEnd = macroStart + macroMatch[0].length;

          if (!graphEnabled) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          const targetId = macroMatch[1] || itemId;
          const depth = macroMatch[2] ? parseInt(macroMatch[2], 10) : 1;
          const dotSource = this.traceability.graph.toDot(targetId, depth);
          if (!dotSource) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          const url = this.krokiUrl("graphviz", dotSource);
          replacements.push({
            start: macroStart,
            end: macroEnd,
            text: `\nimage::${url}[Relationship graph for ${itemId}]\n`,
          });
        }
      }

      // Handle graph macros outside item blocks: traceability:graph[ID]
      const externalRegex =
        /traceability:graph\[([A-Z][A-Z0-9-]*)(?:,\s*(\d+))?\]/g;
      let externalMatch: RegExpExecArray | null;

      // Build ranges to exclude: item headers + item bodies
      const graphExcludeRanges = blocks.map((b) => ({
        start: b.headerStart,
        end: b.bodyEnd,
      }));

      while ((externalMatch = externalRegex.exec(content)) !== null) {
        const matchStart = externalMatch.index;
        if (
          graphExcludeRanges.some(
            (r) => matchStart >= r.start && matchStart <= r.end,
          )
        )
          continue;

        const macroEnd = matchStart + externalMatch[0].length;
        if (!graphEnabled) {
          replacements.push({ start: matchStart, end: macroEnd, text: "" });
          continue;
        }

        const targetId = externalMatch[1];
        const depth = externalMatch[2] ? parseInt(externalMatch[2], 10) : 1;
        const dotSource = this.traceability.graph.toDot(targetId, depth);
        if (!dotSource) {
          replacements.push({ start: matchStart, end: macroEnd, text: "" });
          continue;
        }

        const url = this.krokiUrl("graphviz", dotSource);
        replacements.push({
          start: matchStart,
          end: macroEnd,
          text: `\nimage::${url}[Relationship graph for ${targetId}]\n`,
        });
      }

      if (replacements.length > 0) {
        let modifiedContent = content;
        for (let i = replacements.length - 1; i >= 0; i--) {
          const r = replacements[i];
          modifiedContent =
            modifiedContent.slice(0, r.start) +
            r.text +
            modifiedContent.slice(r.end);
        }
        const buf = Buffer.from(modifiedContent, "utf8");
        if (file.contents) file.contents = buf;
        if (file.src?.contents) file.src.contents = buf;
      }
    } catch (error: any) {
      this.logger.warn(
        `Error expanding graphs in ${file.src?.path}: ${error.message}`,
      );
    }
  }

  /**
   * Expand traceability:graph-coverage[] macros into Kroki Vega-Lite images.
   */
  private expandCoverageMacros(file: any): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;
      const content = contentsBuffer.toString("utf8");
      const docAttrs = this.parseDocAttributes(content);
      if (!content.includes("traceability:graph-coverage[")) return;

      const graphEnabled = this.isGraphEnabled(docAttrs);
      const blocks = this.findItemBlocks(content);
      const replacements: Array<{ start: number; end: number; text: string }> =
        [];

      for (const { itemId, bodyStart } of blocks) {
        const bodyEnd = content.indexOf("\n--\n", bodyStart);
        const bodyContent = content.slice(
          bodyStart,
          bodyEnd >= 0 ? bodyEnd : undefined,
        );

        const macroRegex = /traceability:graph-coverage\[\]/g;
        let macroMatch: RegExpExecArray | null;
        const bodyRanges = this.getInlineCodeRanges(bodyContent);
        while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
          if (this.isInsideRange(macroMatch.index, bodyRanges)) continue;
          const macroStart = bodyStart + macroMatch.index;
          const macroEnd = macroStart + macroMatch[0].length;

          if (!graphEnabled) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          const vegaSource = this.traceability.graph.toVegaLite(itemId);
          if (!vegaSource) {
            replacements.push({ start: macroStart, end: macroEnd, text: "" });
            continue;
          }

          const url = this.krokiUrl("vegalite", vegaSource);
          replacements.push({
            start: macroStart,
            end: macroEnd,
            text: `\nimage::${url}[Coverage chart for ${itemId}]\n`,
          });
        }
      }

      // Handle global coverage (outside item blocks)
      const globalRegex = /traceability:graph-coverage\[\]/g;
      let globalMatch: RegExpExecArray | null;

      // Build ranges to exclude: item headers + item bodies
      const excludeRanges = blocks.map((b) => ({
        start: b.headerStart,
        end: b.bodyEnd,
      }));

      while ((globalMatch = globalRegex.exec(content)) !== null) {
        const matchStart = globalMatch.index;
        // Skip if inside an item header or body
        if (
          excludeRanges.some(
            (r) => matchStart >= r.start && matchStart <= r.end,
          )
        )
          continue;

        const macroEnd = matchStart + globalMatch[0].length;
        if (!graphEnabled) {
          replacements.push({ start: matchStart, end: macroEnd, text: "" });
          continue;
        }

        const vegaSource = this.traceability.graph.toVegaLite();
        if (!vegaSource) {
          replacements.push({ start: matchStart, end: macroEnd, text: "" });
          continue;
        }

        const url = this.krokiUrl("vegalite", vegaSource);
        replacements.push({
          start: matchStart,
          end: macroEnd,
          text: `\nimage::${url}[Global coverage chart]\n`,
        });
      }

      if (replacements.length > 0) {
        let modifiedContent = content;
        for (let i = replacements.length - 1; i >= 0; i--) {
          const r = replacements[i];
          modifiedContent =
            modifiedContent.slice(0, r.start) +
            r.text +
            modifiedContent.slice(r.end);
        }
        const buf = Buffer.from(modifiedContent, "utf8");
        if (file.contents) file.contents = buf;
        if (file.src?.contents) file.src.contents = buf;
      }
    } catch (error: any) {
      this.logger.warn(
        `Error expanding coverage in ${file.src?.path}: ${error.message}`,
      );
    }
  }

  private registerContentClassifier(): void {
    this.context.on("contentClassified", (event: any) => {
      const contentCatalog = event.contentCatalog;
      if (!contentCatalog) {
        this.logger.warn("contentCatalog not found in contentClassified event");
        return;
      }

      this.logger.info("Processing content for traceability");
      const files = contentCatalog.findBy({ family: "page" }) || [];
      const adocFiles = files.filter((file: any) =>
        file.src?.path?.endsWith(".adoc"),
      );

      // Pass 1: Process all files to populate the traceability graph
      for (const file of adocFiles) {
        this.processAsciiDocFile(file);
      }

      // Pass 2: Expand traceability:outgoing[] and traceability:incoming[] macros
      this.itemsWithOutgoingMacro.clear();
      this.itemsWithIncomingMacro.clear();
      for (const file of adocFiles) {
        this.expandOutgoingMacros(file);
        this.expandIncomingMacros(file);
      }

      // Pass 2b: Expand traceability:graph[] and traceability:graph-coverage[] macros
      for (const file of adocFiles) {
        this.expandGraphMacros(file);
        this.expandCoverageMacros(file);
      }

      // Pass 3: Substitute relationship macros with xrefs now that the graph is complete
      for (const file of adocFiles) {
        this.substituteLinksInFile(file);
      }
    });
  }

  private processAsciiDocFile(file: any): void {
    if (!this.traceability) {
      this.logger.debug("Extension not loaded yet, skipping file processing");
      return;
    }
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) {
        return;
      }
      const content = contentsBuffer.toString("utf8");
      let sourceFile = file.src?.path || file.path || "unknown";
      sourceFile = this.normalizeSourceFile(sourceFile);
      this.traceability.process(content, { sourceFile });
    } catch (error: any) {
      this.logger.warn(`Error processing ${file.src?.path}: ${error.message}`);
    }
  }

  /**
   * Substitute relationship macros with Asciidoctor xrefs in the file's
   * in-memory content buffer. Must be called AFTER all files have been processed
   * so the graph contains all target items.
   */
  private substituteLinksInFile(file: any): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;

      const content = contentsBuffer.toString("utf8");

      // Unindent: strip leading whitespace from [#..., item, ...] lines so
      // Asciidoctor doesn't treat them as literal blocks.
      let modifiedContent = this.unindentItemMacros(content);

      // Strip inline macros (always invisible)
      modifiedContent = this.substituteRelationshipLinks(modifiedContent);

      // Pass 2b: Prepend item IDs to title attributes for visible display
      modifiedContent = this.injectTitleIds(modifiedContent);

      if (modifiedContent !== content) {
        const buf = Buffer.from(modifiedContent, "utf8");
        if (file.contents) file.contents = buf;
        if (file.src?.contents) file.src.contents = buf;
      }
    } catch (error: any) {
      this.logger.warn(
        `Error substituting links in ${file.src?.path}: ${error.message}`,
      );
    }
  }

  /**
   * Strip leading whitespace from [#..., item, ...] lines so that Asciidoctor
   * recognizes them as block macros instead of literal blocks.
   * Uses quote-aware scanning to find the real closing ']'.
   */
  private unindentItemMacros(content: string): string {
    const macroStartRe = /^[ \t]+(\[#[^,\]]+,\s*item,?)/gm;
    const replacements: Array<{ start: number; end: number; text: string }> =
      [];
    let m: RegExpExecArray | null;

    while ((m = macroStartRe.exec(content)) !== null) {
      const prefix = m[1]; // "[#ID, item," without leading whitespace
      const attrStart = m.index + m[0].length;

      let macroEnd = -1;
      let inQ = false;
      let qChar = "";
      for (let i = attrStart; i < content.length; i++) {
        const ch = content[i];
        if (
          (ch === '"' || ch === "'") &&
          (i === 0 || content[i - 1] !== "\\")
        ) {
          if (!inQ) {
            inQ = true;
            qChar = ch;
          } else if (ch === qChar) {
            inQ = false;
            qChar = "";
          }
        } else if (ch === "]" && !inQ) {
          macroEnd = i;
          break;
        }
      }
      if (macroEnd === -1) continue;

      // Build the unindented macro line: [#ID, item, …\n
      const attrs = content.slice(attrStart, macroEnd);
      const trailing = content.slice(macroEnd, macroEnd + 1); // "]"
      replacements.push({
        start: m.index,
        end: macroEnd + 1,
        text: `${prefix}${attrs}${trailing}`,
      });
    }

    let result = content;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      result = result.slice(0, r.start) + r.text + result.slice(r.end);
    }
    return result;
  }

  /**
   * Prepend item IDs to title attributes so they appear in rendered block titles.
   * Uses quote-aware scanning to find the closing ']' of the item macro so that
   * ']' inside quoted attribute values (e.g. title="traceability:outgoing[]")
   * doesn't prematurely terminate the match.
   */
  private injectTitleIds(content: string): string {
    if (!this.traceability) return content;

    const macroStartRe = /^[ \t]*\[#([^,\]]+),\s*item,?/gm;
    const replacements: Array<{ start: number; end: number; text: string }> =
      [];
    let m: RegExpExecArray | null;

    while ((m = macroStartRe.exec(content)) !== null) {
      const id = m[1].trim();
      const startPos = m.index;
      const attrStart = startPos + m[0].length;

      // Scan forward for the closing ']' outside quoted strings
      let macroEnd = -1;
      let inQ = false;
      let qChar = "";
      for (let i = attrStart; i < content.length; i++) {
        const ch = content[i];
        if (
          (ch === '"' || ch === "'") &&
          (i === 0 || content[i - 1] !== "\\")
        ) {
          if (!inQ) {
            inQ = true;
            qChar = ch;
          } else if (ch === qChar) {
            inQ = false;
            qChar = "";
          }
        } else if (ch === "]" && !inQ) {
          macroEnd = i;
          break;
        }
      }
      if (macroEnd === -1) continue;

      const fullMacro = content.slice(startPos, macroEnd + 1);

      // Replace the title attribute value within this macro
      const fixedMacro = fullMacro.replace(
        /title="([^"]*)"/,
        (_titleMatch: string, titleVal: string) => {
          if (titleVal.startsWith(`${id} \u2014 `)) return _titleMatch;
          return `title="${id} \u2014 ${titleVal}"`;
        },
      );

      if (fixedMacro !== fullMacro) {
        replacements.push({
          start: startPos,
          end: macroEnd + 1,
          text: fixedMacro,
        });
      }
    }

    // Apply replacements in reverse order to preserve positions
    let result = content;
    for (let i = replacements.length - 1; i >= 0; i--) {
      const r = replacements[i];
      result = result.slice(0, r.start) + r.text + result.slice(r.end);
    }
    return result;
  }

  /**
   * Substitute inline relationship macros with Asciidoctor xrefs in the
   * in-memory content buffer. Inline macros (e.g., addresses:REQ-001[]) are
   * always invisible — pure data markers stored in the traceability graph.
   * traceability:outgoing[] and traceability:incoming[] are excluded from
   * this pass (they are handled in expandOutgoingMacros/expandIncomingMacros).
   */
  private substituteRelationshipLinks(content: string): string {
    // Inline macros are always invisible — pure data markers.
    // Exclude traceability:outgoing[] and traceability:incoming[] (the rendering macros).
    const relRegex = /\b(?!traceability:)(\w+):([\w][-.\w]*)\[\]/g;

    // Find verbatim block ranges so we can preserve example code inside them
    const ranges = this.findVerbatimRanges(content);

    if (ranges.length === 0) {
      return content.replace(relRegex, "");
    }

    // Segment-based processing: strip macros from non-verbatim parts,
    // preserve verbatim blocks as-is (they are example/documentation code)
    let result = "";
    let pos = 0;
    for (const range of ranges) {
      result += content.slice(pos, range.start).replace(relRegex, "");
      result += content.slice(range.start, range.end);
      pos = range.end;
    }
    result += content.slice(pos).replace(relRegex, "");
    return result;
  }

  /**
   * Find verbatim block ranges (---- and .... fences) for content preservation.
   * Mirrors DocumentParser.findVerbatimRanges — these are example code blocks
   * whose content should not be stripped or parsed.
   */
  private findVerbatimRanges(
    content: string,
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    const fenceRegex = /(?:^|\n)(----|\.\.\.\.)[ \t]*\r?\n/g;
    let match: RegExpExecArray | null;

    while ((match = fenceRegex.exec(content)) !== null) {
      const fence = match[1];
      const openEnd = match.index + match[0].length;
      const closePattern =
        fence === "----"
          ? "\\r?\\n----[ \\t]*(?:\\r?\\n|$)"
          : "\\r?\\n\\.\\.\\.\\.[ \\t]*(?:\\r?\\n|$)";
      const closeRegex = new RegExp(closePattern, "g");
      closeRegex.lastIndex = openEnd;
      const closeMatch = closeRegex.exec(content);

      if (closeMatch) {
        const rangeEnd = closeMatch.index + closeMatch[0].length;
        ranges.push({ start: match.index, end: rangeEnd });
        fenceRegex.lastIndex = rangeEnd;
      } else {
        ranges.push({ start: match.index, end: content.length });
        break;
      }
    }

    return ranges;
  }

  /**
   * Find inline code span ranges (backtick-enclosed text) in content.
   * Returns start/end positions of each backtick code span so macro
   * expansion can skip them.
   */
  private getInlineCodeRanges(
    content: string,
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
    // Match single-backtick spans: `content`
    const btRe = /`([^`]+)`/g;
    let m: RegExpExecArray | null;
    while ((m = btRe.exec(content)) !== null) {
      ranges.push({ start: m.index, end: m.index + m[0].length });
    }
    return ranges;
  }

  /**
   * Check if a position falls within any of the given ranges.
   */
  private isInsideRange(
    pos: number,
    ranges: Array<{ start: number; end: number }>,
  ): boolean {
    return ranges.some((r) => pos >= r.start && pos < r.end);
  }

  private registerPageProcessor(): void {
    this.context.on("sitePublished", (event: any) => {
      try {
        if (!this.config.generateMatrices) return;
        this.generateTraceabilityFiles(event);
      } catch (error: any) {
        this.logger.error(
          `Error in sitePublished handler: ${error.message}`,
        );
      }
    });
  }

  private generateTraceabilityFiles(event: any): void {
    if (!this.traceability) {
      this.logger.warn(
        "Traceability extension not initialized, skipping file generation",
      );
      return;
    }
    try {
      const outputDir =
        event.playbook?.output?.dir || event.playbook?.dir || "_site";
      const traceabilityDir = join(outputDir, this.config.outputDir);
      this.logger.info(`Writing traceability files to ${traceabilityDir}`);
      mkdirSync(traceabilityDir, { recursive: true });
      const allItems = this.traceability.graph.getAllItems();
      if (allItems.length === 0) {
        this.logger.warn(
          "No traceable items found. Skipping matrix generation.",
        );
        return;
      }

      const matrices =
        this.traceability?.configLoader?.getConfig()?.matrices || [];
      const matrixNames =
        matrices.length > 0
          ? matrices.map((m: any) => m.name)
          : this.generateDefaultMatrixNames(
              this.traceability.graph.getAllRoles(),
            );

      const linkResolver = new LinkResolver({ relativePathPrefix: "../../" });
      const generator = new MatrixGenerator(
        this.traceability.graph,
        this.traceability.configLoader,
        { linkResolver },
      );

      for (const matrixName of matrixNames) {
        for (const format of this.config.matrixFormats) {
          try {
            const matrix = generator.generateMatrix(matrixName);
            let matrixContent: string;
            if (format === "html") {
              matrixContent = generator.exportToHTML(matrix);
            } else if (format === "json") {
              matrixContent = JSON.stringify(matrix, null, 2);
            } else {
              matrixContent = generator.exportToCSV(matrix);
            }
            const safeName = matrixName
              .replace(/[^a-zA-Z0-9-]/g, "-")
              .toLowerCase();
            const fileName = `matrix-${safeName}.${format}`;
            const filePath = join(traceabilityDir, fileName);
            writeFileSync(filePath, matrixContent, "utf8");
            this.logger.info(`Generated ${fileName}`);
          } catch (error: any) {
            this.logger.warn(
              `Failed to generate matrix ${matrixName} (${format}): ${error.message}`,
            );
          }
        }
      }

      this.generateCoverageReport(traceabilityDir);
      const indexContent = this.generateIndexContent(matrixNames);
      writeFileSync(join(traceabilityDir, "index.html"), indexContent, "utf8");
      this.logger.info("Generated index.html");
      this.logger.info(
        `Traceability files written to ${this.config.outputDir}/`,
      );

      // Also write matrices to each component version's _attachments/traceability/
      // so that attachment$traceability/... links in nav resolve correctly.
      this.syncMatricesToAttachments(event, traceabilityDir, outputDir);
    } catch (error: any) {
      this.logger.error(
        `Error generating traceability pages: ${error.message}`,
      );
    }
  }

  /**
   * Sync generated matrix files from traceabilityDir to each component version's
   * _attachments/traceability/ directory so that attachment$traceability/... links
   * in AsciiDoc resolve to the latest matrix output.
   *
   * Uses contentCatalog to find component version output paths, resolving the
   * correct version URL segment (e.g. "latest" instead of "0.7.0").
   */
  private syncMatricesToAttachments(
    event: any,
    traceabilityDir: string,
    outputDir: string,
  ): void {
    try {
      const contentCatalog = event.contentCatalog;
      if (!contentCatalog) {
        this.logger.warn("No contentCatalog, skipping attachment sync");
        return;
      }

      // Get attachment files from the catalog to discover the correct version segment
      const attachmentFiles = contentCatalog.findBy?.({ family: "attachment" }) || [];
      const versionSegments = new Map<string, string>(); // component -> versionSegment
      for (const file of attachmentFiles) {
        if (file.src?.component && file.src?.version && !versionSegments.has(file.src.component)) {
          // Extract version segment from the output path
          // path is like: tracer/latest/_attachments/traceability/matrix-requirements-tests.html
          const outPath = file.out?.path || file.out?.dirname || "";
          const match = outPath.match(
            /^([^/]+)\/([^/]+)\/_attachments\//,
          );
          if (match) {
            versionSegments.set(match[1], match[2]);
          }
        }
      }

      if (versionSegments.size === 0) {
        // Fallback: get components and try with their versions
        const components = contentCatalog.getComponents();
        if (components) {
          for (const comp of components) {
            for (const cv of comp.versions || []) {
              if (cv.version) versionSegments.set(comp.name, cv.version);
            }
          }
        }
      }

      const traceabilityFiles = readdirSync(traceabilityDir);
      for (const [componentName, versionSegment] of versionSegments) {
        const attachDir = join(
          outputDir,
          componentName,
          versionSegment,
          "_attachments",
          "traceability",
        );
        mkdirSync(attachDir, { recursive: true });
        for (const file of traceabilityFiles) {
          const src = join(traceabilityDir, file);
          if (!statSync(src).isFile()) continue;
          copyFileSync(src, join(attachDir, file));
        }
        this.logger.info(
          `Synced matrices to ${componentName}/${versionSegment}/_attachments/traceability/`,
        );
      }
    } catch (error: any) {
      this.logger.warn(
        `Failed to sync matrices to attachments: ${error.message}`,
      );
    }
  }

  private generateDefaultMatrixNames(roles: string[]): string[] {
    if (!this.traceability) return ["default"];
    const matrices: string[] = [];
    const roleList = Array.from(new Set(roles));
    if (roleList.includes("requirement")) {
      if (roleList.includes("implementation"))
        matrices.push("requirements-implementations");
      if (roleList.includes("test")) matrices.push("requirements-tests");
      if (roleList.includes("design")) matrices.push("requirements-design");
    }
    if (matrices.length === 0 && roleList.length > 0) {
      matrices.push("all-items");
    }
    return matrices.length > 0 ? matrices : ["default"];
  }

  private generateCoverageReport(traceabilityDir: string): void {
    if (!this.traceability) {
      this.logger.warn(
        "Traceability extension not initialized, skipping coverage report",
      );
      return;
    }
    try {
      const stats = this.traceability.graph.getRoleStatistics();
      const generator = new MatrixGenerator(
        this.traceability.graph,
        this.traceability.configLoader,
      );
      const coverage = generator.getCoverageReport();
      const coverageContent = this.formatCoverageReport(stats, coverage);
      writeFileSync(
        join(traceabilityDir, "coverage.html"),
        coverageContent,
        "utf8",
      );
      this.logger.info("Generated coverage.html");
    } catch (error: any) {
      this.logger.warn(`Failed to generate coverage report: ${error.message}`);
    }
  }

  private formatCoverageReport(
    stats: Record<string, number>,
    _coverage: Record<string, any>,
  ): string {
    const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
    const coverageCards = Object.entries(stats)
      .map(([role, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
        const percentNum = parseFloat(percentage);
        const color =
          percentNum >= 80
            ? "#28a745"
            : percentNum >= 50
              ? "#ffc107"
              : "#dc3545";
        return `
        <div class="coverage-card">
          <h3>${role}</h3>
          <div class="metric-value" style="color: ${color}">${count}</div>
          <div class="progress-bar"><div class="progress-fill" style="width: ${percentage}%; background: ${color}"></div></div>
          <div class="metric-label">${percentage}% of ${total} items</div>
        </div>
      `;
      })
      .join("\n");

    const rows = Object.entries(stats)
      .map(([role, count]) => {
        const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : 0;
        return `<tr><td>${role}</td><td>${count}</td><td>${percentage}%</td></tr>`;
      })
      .join("\n");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Traceability Coverage Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 0; margin-bottom: 30px; }
    header h1 { margin: 0; font-size: 2rem; }
    .coverage-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin-bottom: 30px; }
    .coverage-card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .metric-value { font-size: 2.5rem; font-weight: bold; margin: 10px 0; }
    .progress-bar { height: 8px; background: #e9ecef; border-radius: 4px; margin: 15px 0; overflow: hidden; }
    .progress-fill { height: 100%; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #eee; }
    th { background: #f8f9fa; font-weight: 600; }
    footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <header><div class="container"><h1>Traceability Coverage Report</h1></div></header>
  <div class="container">
    <h2>Items by Role</h2>
    <div class="coverage-grid">${coverageCards}</div>
    <h2>Summary</h2>
    <p>Total: <strong>${total}</strong> items</p>
    <table><thead><tr><th>Role</th><th>Count</th><th>Percentage</th></tr></thead><tbody>${rows}</tbody></table>
    <footer><p>Antora Requirements Traceability Extension</p></footer>
  </div>
</body>
</html>
    `;
  }

  private generateIndexContent(matrixNames: string[]): string {
    const formats = this.config.matrixFormats;
    const links = matrixNames
      .flatMap((name) => {
        const safeName = name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
        const displayName = name.replace(/-/g, " ");
        return formats.map(
          (f) =>
            `<li><a href="matrix-${safeName}.${f}">${displayName} (${f.toUpperCase()})</a></li>`,
        );
      })
      .join("\n");

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Requirements Traceability</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 30px 0; margin-bottom: 30px; }
    header h1 { margin: 0; font-size: 2rem; }
    .card { background: white; padding: 25px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
    .card ul { list-style: none; padding: 0; margin: 0; }
    .card li { padding: 10px 0; border-bottom: 1px solid #eee; }
    .card li:last-child { border-bottom: none; }
    .card a { color: #007bff; text-decoration: none; display: block; }
    footer { text-align: center; padding: 20px; color: #666; }
  </style>
</head>
<body>
  <header><div class="container"><h1>Requirements Traceability</h1></div></header>
  <div class="container">
    <div class="card"><h2>Traceability Artifacts</h2><p>Browse traceability matrices and reports:</p><ul>${links}</ul></div>
    <footer><p>Antora Requirements Traceability Extension</p></footer>
  </div>
</body>
</html>
    `;
  }

  private registerNavigationEnhancer(): void {
    if (!this.config.includeInNavigation) return;
    this.context.on("beforeSiteGenerated", () => {
      this.logger.info("Enhanced navigation with traceability links");
    });
  }

  getTraceabilityExtension() {
    if (!this.traceability) {
      throw new Error("Traceability extension not initialized");
    }
    return this.traceability;
  }
}

function register(
  context: AntoraExtensionContext,
  antoraConfig?: { config?: Partial<AntoraTraceabilityConfig> },
): void {
  new AntoraTraceabilityExtension(context, antoraConfig);
}

function createAntoraExtension(
  context: AntoraExtensionContext,
  antoraConfig?: { config?: Partial<AntoraTraceabilityConfig> },
): AntoraTraceabilityExtension {
  return new AntoraTraceabilityExtension(context, antoraConfig);
}

export { createAntoraExtension, register };
export default { register };
