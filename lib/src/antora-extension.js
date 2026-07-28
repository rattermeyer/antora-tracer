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
import { join } from "node:path";
import { ConfigLoader } from "./config/TraceabilityConfig.js";
import { RequirementsTraceabilityExtension } from "./index.js";
import { LinkResolver } from "./LinkResolver.js";
import { MatrixGenerator } from "./MatrixGenerator.js";
import { INVERSE_MAP } from "./types.js";
const DEFAULT_CONFIG = {
    enabled: true,
    outputDir: "traceability",
    generateMatrices: true,
    matrixFormats: ["html", "csv"],
    includeInNavigation: true,
    preset: "requirements-engineering",
    configPath: "",
};
export class AntoraTraceabilityExtension {
    context;
    traceability = null;
    config;
    logger;
    itemsWithOutgoingMacro = new Set();
    itemsWithIncomingMacro = new Set();
    constructor(context) {
        this.context = context;
        this.logger = context.getLogger("requirements-traceability");
        this.config = { ...DEFAULT_CONFIG, ...this.loadConfig() };
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
    async initializeAsync() {
        // Load the traceability extension (may involve async preset loading)
        this.traceability = await this.createTraceabilityExtension();
        this.logger.debug("Requirements traceability extension fully initialized");
    }
    async createTraceabilityExtension() {
        if (this.config.configPath) {
            const configLoader = new ConfigLoader();
            try {
                configLoader.load(this.config.configPath);
                this.logger.info(`Loaded configuration from: ${this.config.configPath}`);
                return new RequirementsTraceabilityExtension(configLoader);
            }
            catch (error) {
                this.logger.warn(`Could not load configuration: ${error.message}. Using default.`);
            }
        }
        if (this.config.preset) {
            try {
                return await RequirementsTraceabilityExtension.createWithPreset(this.config.preset);
            }
            catch (error) {
                this.logger.warn(`Could not load preset: ${error.message}. Using default.`);
            }
        }
        return new RequirementsTraceabilityExtension();
    }
    loadConfig() {
        try {
            const playbook = this.context.playbook;
            const extConfig = playbook.extensions?.find((e) => e.name === "antora-requirements-traceability");
            return extConfig?.config ?? {};
        }
        catch {
            return {};
        }
    }
    /**
     * Normalize source file path to be relative to pages/ directory.
     * Strips path prefix up to /pages/ and removes .adoc extension.
     */
    normalizeSourceFile(sourceFile) {
        let result = sourceFile.replace(/\\/g, "/");
        result = result.replace(/\\.adoc$/, "");
        result = result.replace(/^.*[\\/]pages[\\/]/, "");
        return result;
    }
    /**
     * Parse AsciiDoc document attributes from content header.
     */
    parseDocAttributes(content) {
        const attrs = {};
        const lines = content.split("\n");
        for (const line of lines) {
            const m = line.match(/^:(\w[\w-]*):\s*(.*)/);
            if (m) {
                attrs[m[1]] = m[2].trim();
            }
            if (line.trim() === "" && Object.keys(attrs).length > 0)
                break;
        }
        return attrs;
    }
    isLinksEnabled(attrs) {
        const val = (attrs["traceability-links"] || "").toLowerCase();
        return val === "true" || val === "yes" || val === "1";
    }
    getLinksStyle(attrs) {
        const val = (attrs["traceability-style"] || "").toLowerCase();
        if (val === "table")
            return "table";
        if (val === "inline")
            return "inline";
        return "list";
    }
    getLinksOrder(attrs) {
        const val = (attrs["traceability-order"] || "").toLowerCase();
        if (val === "target-title")
            return "target-title";
        if (val === "relation-type")
            return "relation-type";
        return "target-id";
    }
    getCollapsible(attrs) {
        const val = (attrs["traceability-collapsible"] || "").toLowerCase();
        return val === "true" || val === "yes" || val === "1";
    }
    /**
     * Expand traceability:outgoing[] macros.
     */
    expandOutgoingMacros(file) {
        if (!this.traceability)
            return;
        try {
            const contentsBuffer = file.contents || file.src?.contents;
            if (!contentsBuffer)
                return;
            const content = contentsBuffer.toString("utf8");
            const docAttrs = this.parseDocAttributes(content);
            const linksEnabled = this.isLinksEnabled(docAttrs);
            if (!content.includes("traceability:outgoing[]"))
                return;
            const style = this.getLinksStyle(docAttrs);
            const order = this.getLinksOrder(docAttrs);
            const collapsible = this.getCollapsible(docAttrs);
            const sourceFile = file.src?.path || file.path || "unknown";
            const currentFile = this.normalizeSourceFile(sourceFile);
            const replacements = [];
            // Find item blocks and scan for macros only within block bodies.
            // This avoids matching the macro name in prose/documentation text.
            const itemBlockRegex = /\[#([^,\]]+),\s*item[^\]]*\][ \t]*\r?\n--\r?\n([\s\S]*?)\r?\n--/g;
            let blockMatch;
            while ((blockMatch = itemBlockRegex.exec(content)) !== null) {
                const itemId = blockMatch[1];
                const bodyContent = blockMatch[2];
                // Find the absolute offset of body content within the file
                const openerMatch = blockMatch[0].match(/\r?\n--\r?\n/);
                if (!openerMatch || openerMatch.index === undefined)
                    continue;
                const bodyStart = blockMatch.index + openerMatch.index + openerMatch[0].length;
                // Scan for macros within this body
                const macroRegex = /traceability:outgoing\[\]/g;
                let macroMatch;
                while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
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
                    const grouped = new Map();
                    for (const rel of rels) {
                        const target = this.traceability.graph.getItem(rel.targetId);
                        if (!target)
                            continue;
                        if (!grouped.has(rel.type))
                            grouped.set(rel.type, []);
                        grouped
                            .get(rel.type)
                            ?.push({ id: target.id, title: target.title || target.id, sourceFile: target.sourceFile });
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
                    const generated = this.generateLinksAsciiDoc(groupEntries, style, currentFile, collapsible);
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
                if (file.contents)
                    file.contents = buf;
                if (file.src?.contents)
                    file.src.contents = buf;
            }
        }
        catch (error) {
            this.logger.warn(`Error expanding links in ${file.src?.path}: ${error.message}`);
        }
    }
    /**
     * Expand traceability:incoming[] macros.
     */
    expandIncomingMacros(file) {
        if (!this.traceability)
            return;
        try {
            const contentsBuffer = file.contents || file.src?.contents;
            if (!contentsBuffer)
                return;
            const content = contentsBuffer.toString("utf8");
            const docAttrs = this.parseDocAttributes(content);
            const linksEnabled = this.isLinksEnabled(docAttrs);
            if (!content.includes("traceability:incoming[]"))
                return;
            const style = this.getLinksStyle(docAttrs);
            const order = this.getLinksOrder(docAttrs);
            const collapsible = this.getCollapsible(docAttrs);
            const sourceFile = file.src?.path || file.path || "unknown";
            const currentFile = this.normalizeSourceFile(sourceFile);
            const replacements = [];
            // Find item blocks and scan for macros only within block bodies.
            // This avoids matching the macro name in prose/documentation text.
            const itemBlockRegex = /\[#([^,\]]+),\s*item[^\]]*\][ \t]*\r?\n--\r?\n([\s\S]*?)\r?\n--/g;
            let blockMatch;
            while ((blockMatch = itemBlockRegex.exec(content)) !== null) {
                const itemId = blockMatch[1];
                const bodyContent = blockMatch[2];
                // Find the absolute offset of body content within the file
                const openerMatch = blockMatch[0].match(/\r?\n--\r?\n/);
                if (!openerMatch || openerMatch.index === undefined)
                    continue;
                const bodyStart = blockMatch.index + openerMatch.index + openerMatch[0].length;
                // Scan for macros within this body
                const macroRegex = /traceability:incoming\[\]/g;
                let macroMatch;
                while ((macroMatch = macroRegex.exec(bodyContent)) !== null) {
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
                    const grouped = new Map();
                    for (const rel of rels) {
                        const source = this.traceability.graph.getItem(rel.fromId);
                        if (!source)
                            continue;
                        // Transform relation type to inverse label for incoming display
                        const inverseType = INVERSE_MAP[rel.type] || rel.type;
                        if (!grouped.has(inverseType))
                            grouped.set(inverseType, []);
                        grouped
                            .get(inverseType)
                            ?.push({ id: source.id, title: source.title || source.id, sourceFile: source.sourceFile });
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
                    const generated = this.generateLinksAsciiDoc(groupEntries, style, currentFile, collapsible);
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
                if (file.contents)
                    file.contents = buf;
                if (file.src?.contents)
                    file.src.contents = buf;
            }
        }
        catch (error) {
            this.logger.warn(`Error expanding incoming links in ${file.src?.path}: ${error.message}`);
        }
    }
    generateLinksAsciiDoc(grouped, style, currentFile, collapsible) {
        if (grouped.length === 0)
            return "";
        if (style === "table")
            return this.generateTableStyle(grouped, currentFile);
        if (style === "inline")
            return this.generateInlineStyle(grouped, currentFile);
        return this.generateListStyle(grouped, currentFile, collapsible);
    }
    buildXref(item, currentFile, displayText) {
        if (item.sourceFile && item.sourceFile !== currentFile) {
            return `xref:${item.sourceFile}#${item.id}[${displayText}]`;
        }
        return `xref:#${item.id}[${displayText}]`;
    }
    generateListStyle(grouped, currentFile, collapsible) {
        const lines = [];
        for (const [relType, items] of grouped) {
            const title = this.capitalize(relType);
            if (collapsible) {
                lines.push(`\n[%collapsible]`);
                lines.push(`.${title}`);
                lines.push(`====`);
            }
            else {
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
    generateTableStyle(grouped, currentFile) {
        const lines = ['\n[cols="15,15,70"]', "|==="];
        lines.push("| Relation | ID | Title");
        for (const [relType, items] of grouped) {
            for (const item of items) {
                const xref = this.buildXref(item, currentFile, item.id);
                lines.push("| " +
                    relType +
                    "| " +
                    xref +
                    " | " +
                    item.title.replace(/\|/g, "\\\\|").replace(/&/g, "&amp;"));
            }
        }
        lines.push("|===");
        return `${lines.join("\n")}\n`;
    }
    generateInlineStyle(grouped, currentFile) {
        const lines = [];
        for (const [relType, items] of grouped) {
            lines.push("\n" +
                this.capitalize(relType) +
                ": " +
                items
                    .map((i) => this.buildXref(i, currentFile, i.id))
                    .join(", "));
        }
        return `${lines.join("\n")}\n`;
    }
    capitalize(s) {
        return s.charAt(0).toUpperCase() + s.slice(1);
    }
    registerContentClassifier() {
        this.context.on("contentClassified", (event) => {
            const contentCatalog = event.contentCatalog;
            if (!contentCatalog) {
                this.logger.warn("contentCatalog not found in contentClassified event");
                return;
            }
            this.logger.info("Processing content for traceability");
            const files = contentCatalog.findBy({ family: "page" }) || [];
            const adocFiles = files.filter((file) => file.src?.path?.endsWith(".adoc"));
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
            // Pass 3: Substitute relationship macros with xrefs now that the graph is complete
            for (const file of adocFiles) {
                this.substituteLinksInFile(file);
            }
        });
    }
    processAsciiDocFile(file) {
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
        }
        catch (error) {
            this.logger.warn(`Error processing ${file.src?.path}: ${error.message}`);
        }
    }
    /**
     * Substitute relationship macros with Asciidoctor xrefs in the file's
     * in-memory content buffer. Must be called AFTER all files have been processed
     * so the graph contains all target items.
     */
    substituteLinksInFile(file) {
        if (!this.traceability)
            return;
        try {
            const contentsBuffer = file.contents || file.src?.contents;
            if (!contentsBuffer)
                return;
            const content = contentsBuffer.toString("utf8");
            // Strip inline macros (always invisible)
            let modifiedContent = this.substituteRelationshipLinks(content);
            // Pass 2b: Prepend item IDs to title attributes for visible display
            modifiedContent = this.injectTitleIds(modifiedContent);
            if (modifiedContent !== content) {
                const buf = Buffer.from(modifiedContent, "utf8");
                if (file.contents)
                    file.contents = buf;
                if (file.src?.contents)
                    file.src.contents = buf;
            }
        }
        catch (error) {
            this.logger.warn(`Error substituting links in ${file.src?.path}: ${error.message}`);
        }
    }
    /**
     * Prepend item IDs to title attributes so they appear in rendered block titles.
     */
    injectTitleIds(content) {
        if (!this.traceability)
            return content;
        return content.replace(/^(\[#([^,\]]+),\s*item[^\]]*title=")([^"]+)(")/gm, (_match, prefix, id, title, suffix) => {
            if (title.startsWith(`${id} \u2014 `))
                return _match;
            return `${prefix}${id} \u2014 ${title}${suffix}`;
        });
    }
    /**
     * Substitute inline relationship macros with Asciidoctor xrefs in the
     * in-memory content buffer. Inline macros (e.g., addresses:REQ-001[]) are
     * always invisible — pure data markers stored in the traceability graph.
     * traceability:outgoing[] and traceability:incoming[] are excluded from
     * this pass (they are handled in expandOutgoingMacros/expandIncomingMacros).
     */
    substituteRelationshipLinks(content) {
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
    findVerbatimRanges(content) {
        const ranges = [];
        const fenceRegex = /(?:^|\n)(----|\.\.\.\.)[ \t]*\r?\n/g;
        let match;
        while ((match = fenceRegex.exec(content)) !== null) {
            const fence = match[1];
            const openEnd = match.index + match[0].length;
            const closePattern = fence === "----"
                ? "\\r?\\n----[ \\t]*(?:\\r?\\n|$)"
                : "\\r?\\n\\.\\.\\.\\.[ \\t]*(?:\\r?\\n|$)";
            const closeRegex = new RegExp(closePattern, "g");
            closeRegex.lastIndex = openEnd;
            const closeMatch = closeRegex.exec(content);
            if (closeMatch) {
                const rangeEnd = closeMatch.index + closeMatch[0].length;
                ranges.push({ start: match.index, end: rangeEnd });
                fenceRegex.lastIndex = rangeEnd;
            }
            else {
                ranges.push({ start: match.index, end: content.length });
                break;
            }
        }
        return ranges;
    }
    registerPageProcessor() {
        this.context.on("sitePublished", (event) => {
            if (!this.config.generateMatrices)
                return;
            this.generateTraceabilityFiles(event);
        });
    }
    generateTraceabilityFiles(event) {
        if (!this.traceability) {
            this.logger.warn("Traceability extension not initialized, skipping file generation");
            return;
        }
        try {
            const outputDir = event.playbook?.output?.dir || event.playbook?.dir || "_site";
            const traceabilityDir = join(outputDir, this.config.outputDir);
            this.logger.info(`Writing traceability files to ${traceabilityDir}`);
            mkdirSync(traceabilityDir, { recursive: true });
            const allItems = this.traceability.graph.getAllItems();
            if (allItems.length === 0) {
                this.logger.warn("No traceable items found. Skipping matrix generation.");
                return;
            }
            const matrices = this.traceability?.configLoader?.getConfig()?.matrices || [];
            const matrixNames = matrices.length > 0
                ? matrices.map((m) => m.name)
                : this.generateDefaultMatrixNames(this.traceability.graph.getAllRoles());
            const linkResolver = new LinkResolver({ relativePathPrefix: "../../" });
            const generator = new MatrixGenerator(this.traceability.graph, this.traceability.configLoader, { linkResolver });
            for (const matrixName of matrixNames) {
                for (const format of this.config.matrixFormats) {
                    try {
                        const matrix = generator.generateMatrix(matrixName);
                        let matrixContent;
                        if (format === "html") {
                            matrixContent = generator.exportToHTML(matrix);
                        }
                        else if (format === "json") {
                            matrixContent = JSON.stringify(matrix, null, 2);
                        }
                        else {
                            matrixContent = generator.exportToCSV(matrix);
                        }
                        const safeName = matrixName
                            .replace(/[^a-zA-Z0-9-]/g, "-")
                            .toLowerCase();
                        const fileName = `matrix-${safeName}.${format}`;
                        const filePath = join(traceabilityDir, fileName);
                        writeFileSync(filePath, matrixContent, "utf8");
                        this.logger.info(`Generated ${fileName}`);
                    }
                    catch (error) {
                        this.logger.warn(`Failed to generate matrix ${matrixName} (${format}): ${error.message}`);
                    }
                }
            }
            this.generateCoverageReport(traceabilityDir);
            const indexContent = this.generateIndexContent(matrixNames);
            writeFileSync(join(traceabilityDir, "index.html"), indexContent, "utf8");
            this.logger.info("Generated index.html");
            this.logger.info(`Traceability files written to ${this.config.outputDir}/`);
        }
        catch (error) {
            this.logger.error(`Error generating traceability pages: ${error.message}`);
        }
    }
    generateDefaultMatrixNames(roles) {
        if (!this.traceability)
            return ["default"];
        const matrices = [];
        const roleList = Array.from(new Set(roles));
        if (roleList.includes("requirement")) {
            if (roleList.includes("implementation"))
                matrices.push("requirements-implementations");
            if (roleList.includes("test"))
                matrices.push("requirements-tests");
            if (roleList.includes("design"))
                matrices.push("requirements-design");
        }
        if (matrices.length === 0 && roleList.length > 0) {
            matrices.push("all-items");
        }
        return matrices.length > 0 ? matrices : ["default"];
    }
    generateCoverageReport(traceabilityDir) {
        if (!this.traceability) {
            this.logger.warn("Traceability extension not initialized, skipping coverage report");
            return;
        }
        try {
            const stats = this.traceability.graph.getRoleStatistics();
            const generator = new MatrixGenerator(this.traceability.graph, this.traceability.configLoader);
            const coverage = generator.getCoverageReport();
            const coverageContent = this.formatCoverageReport(stats, coverage);
            writeFileSync(join(traceabilityDir, "coverage.html"), coverageContent, "utf8");
            this.logger.info("Generated coverage.html");
        }
        catch (error) {
            this.logger.warn(`Failed to generate coverage report: ${error.message}`);
        }
    }
    formatCoverageReport(stats, _coverage) {
        const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
        const coverageCards = Object.entries(stats)
            .map(([role, count]) => {
            const percentage = total > 0 ? ((count / total) * 100).toFixed(1) : "0";
            const percentNum = parseFloat(percentage);
            const color = percentNum >= 80
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
    generateIndexContent(matrixNames) {
        const formats = this.config.matrixFormats;
        const links = matrixNames
            .flatMap((name) => {
            const safeName = name.replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
            const displayName = name.replace(/-/g, " ");
            return formats.map((f) => `<li><a href="matrix-${safeName}.${f}">${displayName} (${f.toUpperCase()})</a></li>`);
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
    registerNavigationEnhancer() {
        if (!this.config.includeInNavigation)
            return;
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
function register(context) {
    new AntoraTraceabilityExtension(context);
}
function createAntoraExtension(context) {
    return new AntoraTraceabilityExtension(context);
}
export { createAntoraExtension, register };
export default { register };
