/**
 * LinkResolver - Generates navigation links from matrix items to their source definitions
 *
 * This component handles path resolution for different contexts (Antora build vs. CLI)
 * and generates clickable deep links to item blocks in rendered HTML.
 */

import type { Item } from "./types.js";

/**
 * Options for LinkResolver
 */
export interface LinkResolverOptions {
  /**
   * Relative path prefix from matrix output directory to pages directory.
   * - Antora: '../../' (from _attachments/traceability/ to component root)
   * - CLI: '../../pages/' (from attachments/traceability/ to pages/)
   */
  relativePathPrefix: string;
  /**
   * Whether Antora's indexify URL style is used (default: true).
   * When true, pages at the module root (no directory separator in path)
   * produce pagename/index.html instead of pagename.html.
   */
  indexify?: boolean;
}

/**
 * LinkResolver generates URLs for navigating from matrix items to their source definitions.
 *
 * The resolver uses a configurable prefix to handle different output directory structures
 * between Antora builds (where matrices go to _attachments/) and CLI usage.
 */
export class LinkResolver {
  private readonly options: LinkResolverOptions;

  constructor(options: LinkResolverOptions) {
    this.options = options;
  }

  /**
   * Generate a full HTML link (href) for an item.
   *
   * @param item - The item to generate a link for
   * @returns Full URL path including fragment identifier, e.g., "../../architecture.html#ARC-001"
   */
  generateItemLink(item: Item): string {
    const htmlPath = this.itemToHtmlPath(item);
    // If the path is a full URL, return it directly with the fragment
    if (htmlPath.includes("://")) {
      return `${htmlPath}#${item.id}`;
    }
    return `${this.options.relativePathPrefix + htmlPath}#${item.id}`;
  }

  /**
   * Generate just the anchor/fragment for an item.
   *
   * @param item - The item to generate an anchor for
   * @returns Fragment identifier, e.g., "#ARC-001"
   */
  generateItemAnchor(item: Item): string {
    return `#${item.id}`;
  }

  /**
   * Convert an item's sourceFile to an HTML path.
   *
   * Handles all possible sourceFile formats:
   *  - Full URL (partial item): passed through unchanged
   *  - "architecture"           -> "architecture.html" (or "architecture/index.html" with indexify)
   *  - "architecture.adoc"      -> "architecture.html" (or "architecture/index.html" with indexify)
   *  - "pages/architecture"     -> "architecture.html"
   *  - "traceability/index"     -> "traceability/index.html"
   *
   * @param item - The item to generate a path for
   * @returns Clean HTML path or full URL, e.g., "architecture.html" or "https://github.com/.../partial.adoc"
   */
  private itemToHtmlPath(item: Item): string {
    let sourceFile = item.sourceFile || item.id;

    // If it's already a full URL (partial items use view URL as sourceFile),
    // return it as-is — no HTML conversion needed
    if (sourceFile.includes("://")) {
      return sourceFile;
    }

    // Normalize path separators
    sourceFile = sourceFile.replace(/\\/g, "/");

    // Strip everything up to and including '/pages/' or 'pages/'
    sourceFile = sourceFile.replace(/^.*[/]pages[/]/, "");
    sourceFile = sourceFile.replace(/^pages[/]/, "");

    // Remove .adoc extension if present
    if (sourceFile.endsWith(".adoc")) {
      sourceFile = sourceFile.slice(0, -5);
    }

    // Remove .html extension if present (will be re-added)
    if (sourceFile.endsWith(".html")) {
      sourceFile = sourceFile.slice(0, -5);
    }

    // Prepend module prefix when available.
    // Skip ROOT — Antora serves ROOT module pages directly under the
    // component version directory without a module subdirectory.
    if (item.module && item.module !== "ROOT") {
      sourceFile = `${item.module}/${sourceFile}`;
    }

    // With indexify, pages at the module root (no '/' in the path after
    // module prefix handling) use a trailing slash instead of /index.html.
    // e.g. "requirements" -> "requirements/"
    // This avoids server redirects from /index.html to / that can drop fragments.
    if (this.options.indexify && !sourceFile.includes("/")) {
      return `${sourceFile}/`;
    }

    // Add .html extension
    return `${sourceFile}.html`;
  }
}
