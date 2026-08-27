/**
 * DocumentParser - Parses AsciiDoc content for [item] block macros with role attribute
 */

import type { ConfigLoader } from "./config/TraceabilityConfig.js";
import type { Item, ItemRelationship } from "./types.js";

/**
 * Warning type for parser warnings
 */
export interface ParserWarning {
  type:
    | "missing_role"
    | "unknown_role"
    | "invalid_attribute"
    | "unmatched_fence";
  message: string;
  file: string;
  line?: number;
  position?: number;
}

/**
 * Parse error type
 */
export interface ParserError {
  type: "syntax_error" | "duplicate_id" | "invalid_relation";
  message: string;
  file: string;
  line?: number;
  position?: number;
}

/**
 * Options for parsing
 */
export interface ParserOptions {
  sourceFile?: string;
  configLoader?: ConfigLoader;
  /** Antora component name. Absent for CLI usage. */
  component?: string;
  /** Antora module name. Absent for CLI usage. */
  module?: string;
}

/**
 * Result of parsing
 */
export interface ParserResult {
  items: Item[];
  relationships: ItemRelationship[];
  warnings: ParserWarning[];
  errors: ParserError[];
}

/**
 * DocumentParser - Parser for unified item architecture
 *
 * This parser:
 * - Recognizes [item] block macros with role attribute
 * - Supports all existing attributes (id, title, status) plus role
 * - Validates item IDs are unique
 * - Parses inline relationship macros
 */
export class DocumentParser {
  private currentFile: string = "";
  private configLoader?: ConfigLoader;
  private warnings: ParserWarning[] = [];
  private errors: ParserError[] = [];
  private component?: string;
  private module?: string;
  private pubUrl?: string;

  constructor(options: ParserOptions = {}) {
    this.currentFile = options.sourceFile || "";
    this.configLoader = options.configLoader;
  }

  /**
   * Parse an AsciiDoc string and return all traceability elements found within it.
   * Returns items with roles and relationships.
   */
  parse(
    content: string,
    sourceFile?: string,
    component?: string,
    module?: string,
    pubUrl?: string,
  ): ParserResult {
    // Validate input
    if (typeof content !== "string") {
      throw new TypeError("Content must be a string");
    }

    this.currentFile = sourceFile?.trim() || "unknown";
    this.component = component;
    this.module = module;
    this.pubUrl = pubUrl;

    this.warnings = [];
    this.errors = [];

    // Pre-scan: identify verbatim block ranges to skip during parsing
    const verbatimRanges = this.findVerbatimRanges(content);

    const result: ParserResult = {
      items: [],
      relationships: [],
      warnings: [],
      errors: [],
    };

    const seen = new Set<string>();

    // First pass: Parse all [item] block macros
    this.parseItemMacros(
      content,
      sourceFile || this.currentFile,
      seen,
      result,
      verbatimRanges,
    );

    // Second pass: Parse inline relationship macros from item content
    this.parseInlineMacrosFromItems(
      content,
      sourceFile || this.currentFile,
      result,
    );

    // Add accumulated warnings and errors to result
    result.warnings = this.warnings;
    result.errors = this.errors;

    return result;
  }

  /**
   * Parse [item] block macros
   */
  private parseItemMacros(
    content: string,
    sourceFile: string,
    seen: Set<string>,
    result: ParserResult,
    verbatimRanges: Array<{ start: number; end: number }>,
  ): void {
    // Parse items with Asciidoctor native ID syntax: [#ID, item, role=XXX, title="..."]
    // Only match at line start to avoid matching inline backtick references.
    // Use a quote-aware scanner to find the closing ']' so that ']' inside
    // quoted attribute values (e.g. title="traceability:outgoing[]") doesn't
    // prematurely terminate the macro.
    const itemStartRegex = /^[ \t]*\[#([^,\]]+),\s*item,?/gm;
    let match: RegExpExecArray | null;

    while ((match = itemStartRegex.exec(content)) !== null) {
      let id = match[1].trim();
      const startPosition = match.index;
      const attrStart = startPosition + match[0].length;

      // Scan forward to find the closing ']' outside quoted strings
      let macroEnd = -1;
      let inQuotes = false;
      let quoteChar = "";
      for (let i = attrStart; i < content.length; i++) {
        const ch = content[i];
        if (
          (ch === '"' || ch === "'") &&
          (i === 0 || content[i - 1] !== "\\")
        ) {
          if (!inQuotes) {
            inQuotes = true;
            quoteChar = ch;
          } else if (ch === quoteChar) {
            inQuotes = false;
            quoteChar = "";
          }
        } else if (ch === "]" && !inQuotes) {
          macroEnd = i;
          break;
        }
      }

      if (macroEnd === -1) {
        this.warnings.push({
          type: "invalid_attribute",
          message: `Item macro at line ${this.lineAt(content, startPosition)} has no closing ']'`,
          file: sourceFile,
          line: this.lineAt(content, startPosition),
          position: startPosition,
        });
        continue;
      }

      const attributesStr = content.slice(attrStart, macroEnd).trim();
      const line = this.lineAt(content, startPosition);

      // Skip items inside verbatim blocks (example code, not real data)
      if (
        verbatimRanges.some(
          (r) => startPosition >= r.start && startPosition < r.end,
        )
      ) {
        continue;
      }

      // Extract block content (between ==== or -- delimiters)
      const block = this.extractBlock(content, startPosition);
      if (!block) {
        this.warnings.push({
          type: "invalid_attribute",
          message: `Item block macro at line ${line} has no content block (missing delimiter)`,
          file: sourceFile,
          line,
          position: startPosition,
        });
        continue;
      }

      // Parse attributes
      const attributes = this.parseAttributes(attributesStr);

      // ID comes from the [#ID] prefix
      attributes.id = id;
      if (!id) {
        // Generate auto ID
        id = this.generateId("ITEM");
        this.warnings.push({
          type: "invalid_attribute",
          message: `Item at line ${line} has no id attribute. Generated: ${id}`,
          file: sourceFile,
          line,
          position: startPosition,
        });
      }

      // Check for duplicate ID
      if (seen.has(id)) {
        this.errors.push({
          type: "duplicate_id",
          message: `Duplicate item ID: ${id}. An item with this ID already exists.`,
          file: sourceFile,
          line,
          position: startPosition,
        });
        continue;
      }
      seen.add(id);

      // Extract role
      let role = attributes.role;
      if (!role) {
        role = "unknown";
        this.warnings.push({
          type: "missing_role",
          message: `Item '${id}' at line ${line} has no role attribute. Defaulting to 'unknown'.`,
          file: sourceFile,
          line,
          position: startPosition,
        });
      }

      // Check if role is known in configuration (if config loader available)
      if (this.configLoader && role !== "unknown") {
        if (!this.configLoader.isKnownRole(role)) {
          this.warnings.push({
            type: "unknown_role",
            message: `Item '${id}' at line ${line} has unknown role '${role}'. Known roles: ${this.configLoader.getConfig().roles.join(", ")}`,
            file: sourceFile,
            line,
            position: startPosition,
          });
        }
      }

      // Extract title — prepend ID for visible identification in output
      let title = attributes.title;
      title = title ? `${id} \u2014 ${title}` : id;

      // Extract status
      const status = attributes.status;

      // Extract all other attributes
      const itemAttributes: Record<string, string> = { ...attributes };
      delete itemAttributes.id;
      delete itemAttributes.role;
      delete itemAttributes.title;
      delete itemAttributes.status;

      // Create the item
      const item: Item = {
        id,
        title,
        content: this.extractBody(block),
        role,
        status,
        attributes: itemAttributes,
        sourceFile,
        sourceLine: line,
        component: this.component,
        module: this.module,
        pubUrl: this.pubUrl,
      };

      result.items.push(item);
    }
  }

  /**
   * Parse attributes from attribute string
   * Format: id=XXX, role=YYY, title="ZZZ", status=open
   */
  private parseAttributes(attributesStr: string): Record<string, string> {
    const attributes: Record<string, string> = {};

    // Split by commas, but respect quoted strings
    const parts = this.splitAttributes(attributesStr);

    for (const part of parts) {
      const trimmed = part.trim();
      if (!trimmed) continue;

      // Handle both key=value and key="value with spaces"
      const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.+)$/);
      if (!match) continue;

      const key = match[1].toLowerCase();
      let value = match[2];

      // Remove surrounding quotes if present
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      attributes[key] = value;
    }

    return attributes;
  }

  /**
   * Split attribute string by commas, respecting quoted strings
   */
  private splitAttributes(attributesStr: string): string[] {
    const parts: string[] = [];
    let current = "";
    let inQuotes = false;
    let quoteChar = "";

    for (let i = 0; i < attributesStr.length; i++) {
      const char = attributesStr[i];

      if (
        (char === '"' || char === "'") &&
        (i === 0 || attributesStr[i - 1] !== "\\")
      ) {
        if (!inQuotes) {
          inQuotes = true;
          quoteChar = char;
        } else if (char === quoteChar) {
          inQuotes = false;
          quoteChar = "";
        }
        current += char;
      } else if (char === "," && !inQuotes) {
        parts.push(current);
        current = "";
      } else {
        current += char;
      }
    }

    if (current.trim()) {
      parts.push(current);
    }

    return parts;
  }

  /**
   * Parse inline relationship macros from item content
   */
  private parseInlineMacrosFromItems(
    _content: string,
    sourceFile: string,
    result: ParserResult,
  ): void {
    // Build a map of item IDs to their role for efficient lookup
    const itemRoleMap = new Map<string, string>();
    for (const item of result.items) {
      itemRoleMap.set(item.id, item.role);
    }

    // For each item, parse its content for inline macros
    for (const item of result.items) {
      const itemContent = item.content ?? "";

      // Skip macros inside backtick code spans (documentation examples)
      const backtickRanges = this.getBacktickRanges(itemContent);

      // Parse inline relationship macros: relationType:targetId[]
      // Multiple targets per type are comma-separated: addresses:REQ-001,REQ-002[]
      // Exclude traceability: namespace — those are link/rendering macros, not relationships
      // Escape with backslash before the colon: relation\:TARGET[] is ignored
      const inlineMacroRegex =
        /(?<!\\)(?!traceability:)([a-zA-Z][a-zA-Z0-9_-]*:[A-Z0-9_-]+(?:\s*,\s*[A-Z0-9_-]+)*)\[/g;
      let match: RegExpExecArray | null;

      while ((match = inlineMacroRegex.exec(itemContent)) !== null) {
        // Skip macros inside backtick code spans
        if (this.isInsideRange(match.index, backtickRanges)) continue;

        const macro = match[1];
        const line =
          this.lineAt(itemContent, match.index) + (item.sourceLine || 0);

        // Split macro into relation type and target ID
        const colonIndex = macro.indexOf(":");
        if (colonIndex === -1) continue;

        const relationType = macro.substring(0, colonIndex);
        const targetIds = macro
          .substring(colonIndex + 1)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean);

        if (!relationType) continue;

        for (const targetId of targetIds) {
          // Create relationship: source is the current item, target is the referenced ID
          const relationship: ItemRelationship = {
            id: `${item.id}-${relationType}-${targetId}`,
            fromId: item.id,
            targetId,
            type: relationType,
            sourceFile,
            line,
          };

          // Note: Relation validation is deferred to the extension level where the full graph is available.
          // The parser only extracts relationships; it doesn't validate them against config.
          result.relationships.push(relationship);
        }
      }
    }
  }

  /**
   * Find verbatim block ranges (---- and .... fences) to exclude from parsing.
   * Returns an array of {start, end} positions. Content within these ranges
   * is example code, not real traceability data.
   */
  private findVerbatimRanges(
    content: string,
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];

    // Match opening fence: ---- or .... (4 chars) on its own line, optional trailing whitespace
    const fenceRegex = /(?:^|\n)(----|\.\.\.\.)[ \t]*\r?\n/g;
    let match: RegExpExecArray | null;

    while ((match = fenceRegex.exec(content)) !== null) {
      const fence = match[1];
      const openEnd = match.index + match[0].length;

      // Find matching closing fence: same delimiter, on its own line
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
        // Unmatched fence — treat rest of file as verbatim
        const rangeEnd = content.length;
        ranges.push({ start: match.index, end: rangeEnd });
        this.warnings.push({
          type: "unmatched_fence",
          message: `Unmatched verbatim fence '${fence}' at line ${this.lineAt(content, match.index)} — treating remainder of file as verbatim`,
          file: this.currentFile,
          line: this.lineAt(content, match.index),
          position: match.index,
        });
        break;
      }
    }

    return ranges;
  }

  private extractBlock(content: string, startIndex: number): string | null {
    // Find opening delimiter: ==== or -- (must be alone on a line)
    let m = content.slice(startIndex).match(/\n(====|--)\n/);
    if (!m || m.index === undefined) return null;
    const blockStart = startIndex + m.index! + 1;
    const delimiter = m[1];
    const blockEnd = content.indexOf(
      `\n${delimiter}\n`,
      blockStart + delimiter.length + 1,
    );
    if (blockEnd === -1) return null;
    return content.substring(startIndex, blockEnd + delimiter.length + 2);
  }

  private extractBody(block: string): string {
    // Find the delimiter: either ==== or --.
    // Check for ==== as a delimiter (line of its own), not just in body text.
    const hasEqualsDelim = /\n====\r?\n/.test(block);
    const delimiter = hasEqualsDelim ? "====" : "--";
    const start = block.indexOf(`\n${delimiter}\n`);
    if (start === -1) return "";
    const bodyStart = start + delimiter.length + 2;
    const end = block.lastIndexOf(`\n${delimiter}\n`);
    const body = end > start ? block.substring(bodyStart, end).trim() : "";
    return body;
  }

  private lineAt(content: string, position: number): number {
    return (content.substring(0, position).match(/\n/g) ?? []).length + 1;
  }

  private generateId(prefix: string): string {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  /**
   * Find backtick-enclosed code spans in content.
   * Returns ranges that should be skipped when parsing inline macros.
   */
  private getBacktickRanges(
    content: string,
  ): Array<{ start: number; end: number }> {
    const ranges: Array<{ start: number; end: number }> = [];
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
}
