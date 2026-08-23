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

import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { isAbsolute, join } from "node:path";
import { deflateSync } from "node:zlib";
import { ConfigLoader, toConfigDot } from "./config/TraceabilityConfig.js";
import { RequirementsTraceabilityExtension } from "./index.js";
import { TraceabilityGraph } from "./TraceabilityGraph.js";
import { LinkResolver } from "./LinkResolver.js";
import { MatrixGenerator } from "./MatrixGenerator.js";
import type { Item } from "./types.js";

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
  krokiImageFormat?: "svg" | "png";
  krokiServerUrl?: string;
  allowDuplicateIds?: boolean;
  renderSuperseded?: boolean;
  generateOverview?: boolean;
  overviewTarget?: string;
}

const DEFAULT_CONFIG: Required<AntoraTraceabilityConfig> = {
  enabled: true,
  outputDir: "traceability",
  generateMatrices: true,
  matrixFormats: ["html", "csv"],
  includeInNavigation: true,
  preset: "requirements-engineering",
  configPath: "",
  krokiImageFormat: "svg",
  krokiServerUrl: "",
  allowDuplicateIds: false,
  renderSuperseded: true,
  generateOverview: true,
  overviewTarget: "traceability/overview.html",
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

/** A related item as surfaced in outgoing/incoming/links macro output. */
type RelItem = {
  id: string;
  title: string;
  sourceFile?: string;
  component?: string;
  module?: string;
};
/** Which relationship macros expand a given direction. */
type RelationMacro = "outgoing" | "incoming" | "links";
type RelationDirection = "outgoing" | "incoming";

export class AntoraTraceabilityExtension {
  private traceability: RequirementsTraceabilityExtension | null = null;
  private fullGraph: TraceabilityGraph | null = null;
  private config: Required<AntoraTraceabilityConfig>;
  private readonly logger: ReturnType<AntoraExtensionContext["getLogger"]>;

  constructor(
    private readonly context: AntoraExtensionContext,
    antoraConfig?: { config?: Partial<AntoraTraceabilityConfig> },
  ) {
    this.logger = context.getLogger("requirements-traceability");
    // Antora normalizes YAML extension config keys to lowercase, so merge
    // all sources first, then re-apply camelCase keys so DEFAULT_CONFIG
    // fields like configPath/outputDir are correctly overridden.
    const rawConfig = {
      ...DEFAULT_CONFIG,
      ...this.loadConfig(),
      ...antoraConfig?.config,
    };
    const rc = rawConfig as Record<string, any>;
    this.config = {
      ...rawConfig,
      configPath: rc.configpath || rc.configPath || "",
      outputDir: rc.outputdir || rc.outputDir || "traceability",
      generateMatrices: rc.generateMatrices ?? rc.generatematrices ?? true,
      matrixFormats: rc.matrixFormats || rc.matrixformats || ["html", "csv"],
      includeInNavigation:
        rc.includeInNavigation ?? rc.includeinnavigation ?? true,
      preset: rc.preset || "requirements-engineering",
      krokiImageFormat: rc.krokiImageFormat || rc.krokiimageformat || "svg",
      krokiServerUrl: rc.krokiServerUrl || rc.krokiserverurl || "",
      allowDuplicateIds: rc.allowDuplicateIds ?? rc.allowduplicateids ?? false,
      renderSuperseded: rc.renderSuperseded ?? rc.rendersuperseded ?? true,
      generateOverview: rc.generateOverview ?? rc.generateoverview ?? true,
      overviewTarget: rc.overviewTarget || rc.overviewtarget || "traceability/overview.html",
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

    // Load the extension synchronously so event handlers can rely on
    // this.traceability being ready before any Antora event fires.
    // Config and preset loading are synchronous file reads — no need for async.
    this.traceability = this.createTraceabilityExtension();
    this.fullGraph = new TraceabilityGraph(this.traceability.configLoader);
    this.logger.debug("Requirements traceability extension fully initialized");

    // Register event handlers after initialization to avoid a race where
    // an early event fires before traceability is ready.
    this.registerContentClassifier();
    this.registerPageProcessor();
    this.registerNavigationEnhancer();
  }

  private createTraceabilityExtension(): RequirementsTraceabilityExtension {
    if (this.config.configPath) {
      const configLoader = new ConfigLoader();
      try {
        // Resolve config path relative to playbook dir, falling back to CWD
        const playbookDir = this.context.playbook?.dir || process.cwd();
        const resolvedPath = isAbsolute(this.config.configPath)
          ? this.config.configPath
          : join(playbookDir, this.config.configPath);
        configLoader.load(resolvedPath);
        this.logger.info(`Loaded configuration from: ${resolvedPath}`);
        return new RequirementsTraceabilityExtension(configLoader, this.logger);
      } catch (error: any) {
        this.logger.warn(
          `Could not load configuration: ${error.message}. Using default.`,
        );
      }
    }

    if (this.config.preset) {
      try {
        return RequirementsTraceabilityExtension.createWithPreset(
          this.config.preset as any,
        );
      } catch (error: any) {
        this.logger.warn(
          `Could not load preset: ${error.message}. Using default.`,
        );
      }
    }

    return new RequirementsTraceabilityExtension(undefined, this.logger);
  }

  private loadConfig(): Partial<AntoraTraceabilityConfig> {
    try {
      const playbook = this.context.playbook;
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
    // If it's already a URL (e.g., view URL for partials), return unchanged
    if (/^https?:\/\//.test(sourceFile)) {
      return sourceFile;
    }
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

  private getEmptyStyle(
    attrs: Record<string, string>,
  ): "none" | "italic" | "admonition" {
    const val = (attrs["traceability-empty"] || "").toLowerCase();
    if (val === "italic") return "italic";
    if (val === "admonition") return "admonition";
    return "none";
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

      results.push({
        itemId,
        headerStart: m.index,
        headerEnd: macroEnd + 1,
        bodyStart,
        bodyEnd,
      });
    }

    return results;
  }

  /**
   * Expand traceability:outgoing[], traceability:incoming[], or
   * traceability:links[] macros within item block bodies. The three macro
   * kinds share the same scan/expand/replace pipeline and differ only in
   * which relationship directions they render.
   */
  private expandRelationMacros(file: any, macroName: RelationMacro): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;
      const content = contentsBuffer.toString("utf8");
      if (!content.includes(`traceability:${macroName}[]`)) return;

      const docAttrs = this.parseDocAttributes(content);
      const linksEnabled =
        (file as any).__isPartial || this.isLinksEnabled(docAttrs);
      const style = this.getLinksStyle(docAttrs);
      const order = this.getLinksOrder(docAttrs);
      const collapsible = this.getCollapsible(docAttrs);
      const emptyStyle = this.getEmptyStyle(docAttrs);
      const sourceFile = file.src?.path || file.path || "unknown";
      const currentFile = this.normalizeSourceFile(sourceFile);
      const currentComponent = file.src?.component || undefined;
      const currentModule = file.src?.module || undefined;
      const replacements: Array<{ start: number; end: number; text: string }> =
        [];

      // Find item blocks and scan for macros only within block bodies.
      // This avoids matching the macro name in prose/documentation text.
      const blocks = this.findItemBlocks(content);

      for (const { itemId, bodyStart } of blocks) {
        const bodyEnd = content.indexOf("\n--\n", bodyStart);
        const bodyContent = content.slice(
          bodyStart,
          bodyEnd >= 0 ? bodyEnd : undefined,
        );

        const macroRegex = new RegExp(`traceability:${macroName}\\[\\]`, "g");
        const bodyRanges = this.getInlineCodeRanges(bodyContent);
        let macroMatch: RegExpExecArray | null;
        while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
          if (this.isInsideRange(macroMatch.index, bodyRanges)) continue;
          const macroStart = bodyStart + macroMatch.index;
          const macroEnd = macroStart + macroMatch[0].length;

          const text = linksEnabled
            ? this.buildRelationMacroOutput(
                itemId,
                macroName,
                style,
                order,
                currentFile,
                collapsible,
                currentComponent,
                currentModule,
                emptyStyle,
              )
            : "";
          replacements.push({ start: macroStart, end: macroEnd, text });
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
        `Error expanding ${macroName} links in ${file.src?.path}: ${error.message}`,
      );
    }
  }

  /**
   * Build the AsciiDoc output for a single relation macro occurrence.
   *
   * For `outgoing` only outgoing groups render; for `incoming` only incoming
   * groups render; for `links` outgoing groups are followed by incoming groups.
   */
  private buildRelationMacroOutput(
    itemId: string,
    macroName: RelationMacro,
    style: "list" | "table" | "inline",
    order: "target-id" | "target-title" | "relation-type",
    currentFile: string,
    collapsible: boolean,
    currentComponent?: string,
    currentModule?: string,
    emptyStyle: "none" | "italic" | "admonition" = "none",
  ): string {
    const directions: RelationDirection[] =
      macroName === "links" ? ["outgoing", "incoming"] : [macroName];

    const parts: string[] = [];
    for (const direction of directions) {
      const groups = this.buildRelationGroups(itemId, direction, order);
      if (groups.length > 0) {
        parts.push(
          this.generateLinksAsciiDoc(
            groups,
            style,
            currentFile,
            collapsible,
            currentComponent,
            currentModule,
          ),
        );
      } else if (emptyStyle !== "none") {
        const msg = `No ${direction} relationships.`;
        if (emptyStyle === "admonition") {
          parts.push(`\n[NOTE]\n====\n${msg}\n====\n`);
        } else {
          parts.push(`\n_${msg}_\n`);
        }
      }
    }
    return parts.join("");
  }

  /**
   * Collect and sort the relationships for a single direction as
   * (relationType, RelItems) group entries.
   */
  private buildRelationGroups(
    itemId: string,
    direction: RelationDirection,
    order: "target-id" | "target-title" | "relation-type",
  ): Array<[string, RelItem[]]> {
    const graph = this.traceability!.graph;
    const isOutgoing = direction === "outgoing";
    const rels = isOutgoing
      ? graph.getRelationships(itemId)
      : graph.getReverseRelationships(itemId);

    const grouped = new Map<string, RelItem[]>();
    for (const rel of rels) {
      const targetId = isOutgoing ? rel.targetId : rel.fromId;
      const related = graph.getItem(targetId);
      if (!related) continue;

      // Incoming display uses the reverse type of the relation.
      const groupKey = isOutgoing
        ? rel.type
        : (this.traceability!.configLoader?.getInverseType(rel.type) ??
          rel.type);

      if (!grouped.has(groupKey)) grouped.set(groupKey, []);
      const successors = graph.isSuperseded(related.id)
        ? graph
            .getSuccessors(related.id)
            .map((s) => s.id)
            .join(", ")
        : "";
      const title =
        (related.title || related.id) +
        (successors ? ` (superseded by ${successors})` : "");
      grouped.get(groupKey)?.push({
        id: related.id,
        title,
        sourceFile: related.sourceFile,
        component: related.component,
        module: related.module,
      });
    }

    if (grouped.size === 0) return [];

    const groupEntries = Array.from(grouped.entries());
    if (order === "relation-type")
      groupEntries.sort((a, b) => a[0].localeCompare(b[0]));
    for (const [, items] of groupEntries) {
      if (order === "target-id") items.sort((a, b) => a.id.localeCompare(b.id));
      else if (order === "target-title")
        items.sort((a, b) => a.title.localeCompare(b.title));
    }
    return groupEntries;
  }

  private generateLinksAsciiDoc(
    grouped: Array<
      [
        string,
        Array<{
          id: string;
          title: string;
          sourceFile?: string;
          component?: string;
          module?: string;
        }>,
      ]
    >,
    style: "list" | "table" | "inline",
    currentFile: string,
    collapsible: boolean,
    currentComponent?: string,
    currentModule?: string,
  ): string {
    if (grouped.length === 0) return "";
    if (style === "table")
      return this.generateTableStyle(
        grouped,
        currentFile,
        currentComponent,
        currentModule,
      );
    if (style === "inline")
      return this.generateInlineStyle(
        grouped,
        currentFile,
        currentComponent,
        currentModule,
      );
    return this.generateListStyle(
      grouped,
      currentFile,
      collapsible,
      currentComponent,
      currentModule,
    );
  }

  private buildXref(
    item: {
      id: string;
      title: string;
      sourceFile?: string;
      component?: string;
      module?: string;
    },
    currentFile: string,
    displayText: string,
    currentComponent?: string,
    currentModule?: string,
  ): string {
    if (item.sourceFile && item.sourceFile !== currentFile) {
      // Partial items have view URLs as sourceFile — use link: instead of xref:
      if (item.sourceFile.includes("://")) {
        return `link:${item.sourceFile}#${item.id}[${displayText}]`;
      }
      // Items defined in partials can't be xref'd to the partial file —
      // partials don't produce pages. Fall back to same-page anchor.
      if (item.sourceFile.includes("/partials/")) {
        return `xref:#${item.id}[${displayText}]`;
      }
      // Build the xref path with appropriate Antora prefix:
      // cross-component → component:module:page, cross-module → module:page, same → page
      let path = item.sourceFile;
      if (
        item.component &&
        currentComponent &&
        item.component !== currentComponent
      ) {
        path = `${item.component}:${item.module || ""}:${item.sourceFile}`;
      } else if (
        item.module &&
        currentModule &&
        item.module !== currentModule
      ) {
        path = `${item.module}:${item.sourceFile}`;
      }
      return `xref:${path}#${item.id}[${displayText}]`;
    }
    return `xref:#${item.id}[${displayText}]`;
  }

  private generateListStyle(
    grouped: Array<
      [
        string,
        Array<{
          id: string;
          title: string;
          sourceFile?: string;
          component?: string;
          module?: string;
        }>,
      ]
    >,
    currentFile: string,
    collapsible: boolean,
    currentComponent?: string,
    currentModule?: string,
  ): string {
    const lines: string[] = [];
    for (const [relType, items] of grouped) {
      const title = this.displayLabel(relType);
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
        lines.push(
          `* ${this.buildXref(item, currentFile, safeTitle, currentComponent, currentModule)}`,
        );
      }
      if (collapsible) {
        lines.push(`====`);
      }
    }
    return `${lines.join("\n")}\n`;
  }

  private generateTableStyle(
    grouped: Array<
      [
        string,
        Array<{
          id: string;
          title: string;
          sourceFile?: string;
          component?: string;
          module?: string;
        }>,
      ]
    >,
    currentFile: string,
    currentComponent?: string,
    currentModule?: string,
  ): string {
    const lines: string[] = ['\n[cols="15,15,70"]', "|==="];
    lines.push("| Relation | ID | Title");
    for (const [relType, items] of grouped) {
      for (const item of items) {
        const xref = this.buildXref(
          item,
          currentFile,
          item.id,
          currentComponent,
          currentModule,
        );
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
      [
        string,
        Array<{
          id: string;
          title: string;
          sourceFile?: string;
          component?: string;
          module?: string;
        }>,
      ]
    >,
    currentFile: string,
    currentComponent?: string,
    currentModule?: string,
  ): string {
    const lines: string[] = [];
    for (const [relType, items] of grouped) {
      lines.push(
        "\n" +
          this.displayLabel(relType) +
          ": " +
          items
            .map((i) =>
              this.buildXref(
                i,
                currentFile,
                i.id,
                currentComponent,
                currentModule,
              ),
            )
            .join(", "),
      );
    }
    return `${lines.join("\n")}\n`;
  }

  /**
   * Humanize a relation type: underscores to spaces, sentence case.
   */
  private humanize(type: string): string {
    const s = type.replace(/_/g, " ");
    return s.charAt(0).toUpperCase() + s.slice(1);
  }

  /**
   * Display name for a relation type: `labels` override, else humanized type.
   */
  private displayLabel(type: string): string {
    const labels = this.traceability?.configLoader?.getConfig()?.labels;
    return labels?.[type] ?? this.humanize(type);
  }

  private isGraphEnabled(attrs: Record<string, string>): boolean {
    const val = (attrs["traceability-graph"] || "").toLowerCase();
    return val === "true" || val === "yes" || val === "1";
  }

  /**
   * Encode source text as a Kroki URL for the given diagram type.
   * Uses deflate + base64url encoding.
   */
  private krokiUrl(type: string, source: string): string {
    const serverUrl = (
      process.env.KROKI_SERVER_URL ||
      this.config.krokiServerUrl ||
      "https://kroki.io"
    ).replace(/\/$/, "");
    const format =
      process.env.KROKI_IMAGE_FORMAT || this.config.krokiImageFormat || "svg";
    const compressed = deflateSync(Buffer.from(source, "utf-8"));
    const encoded = Buffer.from(compressed).toString("base64url");
    return `${serverUrl}/${type}/${format}/${encoded}`;
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

      const graphEnabled =
        (file as any).__isPartial || this.isGraphEnabled(docAttrs);
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

      const graphEnabled =
        (file as any).__isPartial || this.isGraphEnabled(docAttrs);
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

  /**
   * Expand traceability:config-graph[] macros into Kroki GraphViz images.
   * Renders the effective traceability configuration (roles + declared relations).
   */
  private expandConfigGraphMacros(file: any): void {
    if (!this.traceability) return;
    try {
      const contentsBuffer = file.contents || file.src?.contents;
      if (!contentsBuffer) return;
      const content = contentsBuffer.toString("utf8");
      if (!content.includes("traceability:config-graph[")) return;

      const docAttrs = this.parseDocAttributes(content);
      const graphEnabled =
        (file as any).__isPartial || this.isGraphEnabled(docAttrs);

      // Resolve the effective config once; unavailable config strips the macro.
      let config: ReturnType<typeof this.traceability.getConfig>;
      try {
        config = this.traceability.getConfig();
      } catch {
        config = undefined;
      }

      const replacements: Array<{ start: number; end: number; text: string }> =
        [];
      const macroRegex = /traceability:config-graph\[\]/g;
      const inlineRanges = this.getInlineCodeRanges(content);
      let match: RegExpExecArray | null;

      while ((match = macroRegex.exec(content)) !== null) {
        if (this.isInsideRange(match.index, inlineRanges)) continue;
        const macroStart = match.index;
        const macroEnd = macroStart + match[0].length;

        if (!graphEnabled || !config) {
          replacements.push({ start: macroStart, end: macroEnd, text: "" });
          continue;
        }

        const dotSource = toConfigDot(config);
        const url = this.krokiUrl("graphviz", dotSource);
        replacements.push({
          start: macroStart,
          end: macroEnd,
          text: `\nimage::${url}[Traceability configuration graph]\n`,
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
        `Error expanding config graph in ${file.src?.path}: ${error.message}`,
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
      const pageFiles = contentCatalog.findBy({ family: "page" }) || [];
      const adocFiles = pageFiles.filter((file: any) =>
        file.src?.path?.endsWith(".adoc"),
      );

      // Also process partial files — items defined in partials need to be in the graph
      const partialFiles = contentCatalog.findBy({ family: "partial" }) || [];
      const adocPartials = partialFiles.filter((file: any) =>
        file.src?.path?.endsWith(".adoc"),
      );

      const allModules = new Set<string>();
      for (const file of [...adocFiles, ...adocPartials]) {
        allModules.add(file.src?.module || "ROOT");
      }
      if (allModules.size === 0) allModules.add("ROOT");

      // Group files by component version so each version's graph is isolated.
      // Antora xrefs are version-scoped — an xref from v0.10.x cannot resolve
      // to a page in v0.11.x. Clearing the graph between versions prevents
      // items from one version leaking into another version's xref generation.
      // The key includes the component because two components may share a
      // version string (e.g. "latest").
      const groupByVersion = (files: any[]) => {
        const groups = new Map<string, any[]>();
        for (const file of files) {
          const key = `${file.src?.component || "unknown"}@${file.src?.version || "unknown"}`;
          if (!groups.has(key)) groups.set(key, []);
          groups.get(key)!.push(file);
        }
        return groups;
      };

      const pageGroups = groupByVersion(adocFiles);
      const partialGroups = groupByVersion(adocPartials);
      const allKeys = new Set([...pageGroups.keys(), ...partialGroups.keys()]);

      const htmlStyle = event.playbook?.urls?.html_style;

      // Reset the accumulated full graph — rebuilt below by merging each
      // version's working graph.
      this.fullGraph?.clear();

      for (const key of allKeys) {
        const [component, version] = key.split("@");
        const pageFilesForVersion = pageGroups.get(key) || [];
        const partialFilesForVersion = partialGroups.get(key) || [];

        // Clear the graph so each version is self-contained
        if (this.traceability) {
          this.traceability.graph.clear();
        }

        // Process files to populate the traceability graph
        for (const file of pageFilesForVersion) {
          this.processAsciiDocFile(file);
        }
        for (const file of partialFilesForVersion) {
          this.processAsciiDocFile(file, file.src?.fileUri);
        }

        // Accumulate this version's items into the full graph used by the
        // sitePublished generation passes.
        if (this.fullGraph && this.traceability) {
          this.fullGraph.merge(this.traceability.graph);
        }

        // Duplicate item IDs are merge-time conflicts, not recoverable state.
        // Fail the build so the collision surfaces instead of silently
        // dropping one definition, unless the site opts out.
        const duplicates =
          this.traceability?.graph.getDuplicateWarnings() ?? [];
        if (duplicates.length > 0) {
          const details = duplicates.map((d) => d.message).join("\n");
          const summary = `Duplicate item IDs detected in component '${component}' version '${version}':\n${details}`;
          if (this.config.allowDuplicateIds) {
            this.logger.warn(summary);
          } else {
            throw new Error(summary);
          }
        }

        // Expand macros on pages
        for (const file of pageFilesForVersion) {
          this.expandRelationMacros(file, "outgoing");
          this.expandRelationMacros(file, "incoming");
          this.expandRelationMacros(file, "links");
          this.expandGraphMacros(file);
          this.expandCoverageMacros(file);
          this.expandConfigGraphMacros(file);
        }

        // Expand macros on partials — mark them so expand methods default
        // links/graph to enabled (partials have no doc attributes of their own)
        for (const file of partialFilesForVersion) {
          (file as any).__isPartial = true;
          this.expandRelationMacros(file, "outgoing");
          this.expandRelationMacros(file, "incoming");
          this.expandRelationMacros(file, "links");
          this.expandGraphMacros(file);
          this.expandCoverageMacros(file);
          this.expandConfigGraphMacros(file);
        }

        // Substitute relationship macros with xrefs — both pages and partials
        for (const file of pageFilesForVersion) {
          this.substituteLinksInFile(file);
        }
        for (const file of partialFilesForVersion) {
          this.substituteLinksInFile(file);
        }

        // Register generated matrices in the content catalog as attachments so
        // xref:attachment$traceability/matrix-*.{format}[...] resolves during
        // document conversion (which happens after this contentClassified event).
        this.registerMatricesInCatalog(
          contentCatalog,
          component,
          version,
          pageFilesForVersion.concat(partialFilesForVersion),
          htmlStyle,
        );
      }

      // Register the supersession overview as an attachment so it is navigable
      // via xref:attachment$... — the full graph is complete only after the loop.
      if (this.config.generateOverview && this.fullGraph) {
        const overviewContent = this.generateOverviewContent();
        const overviewPath =
          this.config.overviewTarget || "traceability/overview.html";
        for (const key of allKeys) {
          const [component, version] = key.split("@");
          for (const module of allModules) {
            this.registerAttachmentInCatalog(
              contentCatalog,
              component,
              version,
              module,
              overviewPath,
              overviewContent,
            );
          }
        }
      }
    });
  }

  /**
   * Register generated matrix files in the content catalog as attachments for a
   * single component version. Files are registered under every module that has
   * AsciiDoc content so xref:attachment$traceability/... resolves from any page
   * or nav file in that module during document conversion.
   *
   * Runs during contentClassified — after classification but before
   * convertDocuments — the window in which xrefs are resolved.
   */
  private registerMatricesInCatalog(
    contentCatalog: any,
    component: string,
    version: string,
    files: any[],
    htmlStyle?: string,
  ): void {
    if (!this.config.generateMatrices || !this.traceability) return;
    if (this.traceability.graph.getAllItems().length === 0) return;

    const modules = new Set<string>();
    for (const file of files) {
      modules.add(file.src?.module || "ROOT");
    }
    if (modules.size === 0) modules.add("ROOT");

    const { files: matrixFiles } = this.generateMatrixFiles(htmlStyle);
    for (const module of modules) {
      for (const { fileName, content } of matrixFiles) {
        this.registerAttachmentInCatalog(
          contentCatalog,
          component,
          version,
          module,
          `traceability/${fileName}`,
          content,
        );
      }
    }
  }

  /**
   * Add (or refresh) a single attachment in the content catalog. If a committed
   * copy already exists (e.g. matrices checked into modules/ROOT/attachments/),
   * its contents are replaced so the freshly generated output is authoritative.
   */
  private registerAttachmentInCatalog(
    contentCatalog: any,
    component: string,
    version: string,
    module: string,
    relative: string,
    content: string,
  ): void {
    const family = "attachment";
    const id = { component, version, module, family, relative };
    const existing = contentCatalog.getById?.(id);
    if (existing) {
      existing.contents = Buffer.from(content, "utf8");
      return;
    }
    try {
      contentCatalog.addFile({
        src: { component, version, module, family, relative },
        contents: Buffer.from(content, "utf8"),
      });
    } catch (error: any) {
      this.logger.warn(
        `Failed to register ${relative} in content catalog: ${error.message}`,
      );
    }
  }

  private processAsciiDocFile(file: any, viewUrl?: string): void {
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
      let sourceFile = viewUrl || file.src?.path || file.path || "unknown";
      sourceFile = this.normalizeSourceFile(sourceFile);
      const component = file.src?.component || undefined;
      const moduleName = file.src?.module || undefined;
      this.traceability.process(content, {
        sourceFile,
        component,
        module: moduleName,
      });
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

      if (!this.config.renderSuperseded) {
        modifiedContent = this.stripSupersededBlocks(modifiedContent);
      }

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
          const base = titleVal.startsWith(`${id} \u2014 `)
            ? titleVal
            : `${id} \u2014 ${titleVal}`;
          const successors = this.traceability!.graph.isSuperseded(id)
            ? this.traceability!.graph.getSuccessors(id)
                .map((s) => s.id)
                .join(", ")
            : "";
          const suffix = successors ? ` (superseded by ${successors})` : "";
          if (suffix && base.endsWith(suffix)) return `title="${base}"`;
          return `title="${base}${suffix}"`;
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
   * this pass (they are handled in expandRelationMacros).
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
        if (!this.config.generateMatrices && !this.config.generateOverview) {
          return;
        }
        this.generateTraceabilityFiles(event);
      } catch (error: any) {
        this.logger.error(`Error in sitePublished handler: ${error.message}`);
      }
    });
  }

  private generateMatrixFiles(htmlStyle?: string): {
    matrixNames: string[];
    files: Array<{ fileName: string; content: string }>;
  } {
    const files: Array<{ fileName: string; content: string }> = [];
    if (!this.traceability || !this.fullGraph)
      return { matrixNames: [], files };

    const matrices =
      this.traceability.configLoader?.getConfig()?.matrices || [];
    const matrixNames =
      matrices.length > 0
        ? matrices.map((m: any) => m.name)
        : this.generateDefaultMatrixNames(this.fullGraph!.getAllRoles());

    const generator = new MatrixGenerator(
      this.fullGraph!,
      this.traceability.configLoader,
      {
        linkResolver: new LinkResolver({
          relativePathPrefix: "../../",
          indexify: htmlStyle !== "default",
        }),
      },
    );

    for (const matrixName of matrixNames) {
      for (const format of this.config.matrixFormats) {
        try {
          const matrix = generator.generateMatrix(matrixName);
          let content: string;
          if (format === "html") {
            content = generator.exportToHTML(matrix);
          } else if (format === "json") {
            content = JSON.stringify(matrix, null, 2);
          } else {
            content = generator.exportToCSV(matrix);
          }
          const safeName = matrixName
            .replace(/[^a-zA-Z0-9-]/g, "-")
            .toLowerCase();
          files.push({ fileName: `matrix-${safeName}.${format}`, content });
        } catch (error: any) {
          this.logger.warn(
            `Failed to generate matrix ${matrixName} (${format}): ${error.message}`,
          );
        }
      }
    }

    return { matrixNames, files };
  }

  private generateTraceabilityFiles(event: any): void {
    if (!this.traceability || !this.fullGraph) {
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
      if (this.fullGraph!.getAllItems().length === 0) {
        this.logger.warn(
          "No traceable items found. Skipping matrix generation.",
        );
        return;
      }

      const { matrixNames, files } = this.generateMatrixFiles(
        event.playbook?.urls?.html_style,
      );
      if (this.config.generateMatrices) {
        for (const { fileName, content } of files) {
          writeFileSync(join(traceabilityDir, fileName), content, "utf8");
          this.logger.info(`Generated ${fileName}`);
        }
        this.generateCoverageReport(traceabilityDir);
      }

      if (this.config.generateOverview) {
        writeFileSync(
          join(traceabilityDir, "overview.html"),
          this.generateOverviewContent(),
          "utf8",
        );
        this.logger.info("Generated overview.html");
      }
      const indexContent = this.generateIndexContent(matrixNames);
      writeFileSync(join(traceabilityDir, "index.html"), indexContent, "utf8");
      this.logger.info("Generated index.html");
      this.logger.info(
        `Traceability files written to ${this.config.outputDir}/`,
      );
    } catch (error: any) {
      this.logger.error(
        `Error generating traceability pages: ${error.message}`,
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
    if (!this.traceability || !this.fullGraph) {
      this.logger.warn(
        "Traceability extension not initialized, skipping coverage report",
      );
      return;
    }
    try {
      const stats = this.fullGraph!.getRoleStatistics();
      const generator = new MatrixGenerator(
        this.fullGraph!,
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

  private stripSupersededBlocks(content: string): string {
    if (!this.traceability) return content;
    const graph = this.traceability.graph;
    return content.replace(
      /^\[#([A-Za-z0-9_-]+),\s*item,[^\]]*\]\n(--|====)\n[\s\S]*?\n\2\n?/gm,
      (match: string, id: string) => (graph.isSuperseded(id) ? "" : match),
    );
  }

  private generateOverviewContent(): string {
    if (!this.fullGraph) return "";
    const graph = this.fullGraph;
    const esc = (s: string) =>
      s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const linkResolver = new LinkResolver({
      relativePathPrefix: "../../",
      indexify: true,
    });
    const itemLink = (item: Item | undefined, label: string): string => {
      if (!item?.sourceFile) return esc(label);
      return `<a href="${esc(linkResolver.generateItemLink(item))}">${esc(label)}</a>`;
    };

    const all = graph.getAllItems();
    const superseded = graph.getSupersededItems();
    const supersededIds = new Set(superseded.map((i) => i.id));
    const activeCount = all.length - supersededIds.size;
    const roles = graph.getAllRoles().sort();

    const roleRows = roles
      .map((role) => {
        const roleAll = all.filter((i) => i.role === role);
        const roleSup = superseded.filter((i) => i.role === role).length;
        return `<tr><td>${esc(role)}</td><td>${roleAll.length}</td><td>${
          roleAll.length - roleSup
        }</td><td>${roleSup}</td></tr>`;
      })
      .join("\n");

    const supersededRows = superseded
      .slice()
      .sort((a, b) => a.id.localeCompare(b.id))
      .map(
        (item) =>
          `<tr><td>${itemLink(item, item.id)}</td><td>${esc(item.title)}</td></tr>`,
      )
      .join("\n");

    const danglingRows = graph
      .getDanglingReferences()
      .map((rel) => {
        const source = graph.getItem(rel.fromId);
        return `<tr><td>${itemLink(source, rel.fromId)}</td><td>${esc(rel.type)}</td><td>${esc(rel.targetId)}</td></tr>`;
      })
      .join("\n");

    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Traceability Overview</title>
<style>
body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
.container { max-width: 1000px; margin: 0 auto; }
h1, h2 { color: #333; }
.card { background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); margin-bottom: 20px; }
table { border-collapse: collapse; width: 100%; }
th, td { text-align: left; padding: 8px; border-bottom: 1px solid #eee; }
</style>
</head>
<body>
<div class="container">
<h1>Traceability Overview</h1>
<div class="card"><h2>Totals</h2><table><tr><th>Managed</th><th>Active</th><th>Superseded</th></tr><tr><td>${all.length}</td><td>${activeCount}</td><td>${supersededIds.size}</td></tr></table></div>
<div class="card"><h2>Per-role statistics</h2><table><tr><th>Role</th><th>Total</th><th>Active</th><th>Superseded</th></tr>${roleRows}</table></div>
<div class="card"><h2>Superseded items</h2><table><tr><th>ID</th><th>Title</th></tr>${supersededRows}</table></div>
<div class="card"><h2>Dangling references</h2><table><tr><th>Source</th><th>Relation</th><th>Missing target</th></tr>${danglingRows}</table></div>
</div>
</body>
</html>`;
  }

  private generateIndexContent(matrixNames: string[]): string {
    const formats = this.config.matrixFormats;
    const overviewLink = this.config.generateOverview
      ? `<li><a href="overview.html">Traceability Overview</a></li>`
      : "";
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
    <div class="card"><h2>Traceability Artifacts</h2><p>Browse traceability matrices and reports:</p><ul>${overviewLink}${links}</ul></div>
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
