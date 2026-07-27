/**
 * DocumentParser - Parses AsciiDoc content for [item] block macros with role attribute
 * Replaces the old DocumentParser that used [req], [imp], [test], [doc] macros
 */
/**
 * DocumentParser - Parser for unified item architecture
 *
 * This parser:
 * - Recognizes [item] block macros with role attribute
 * - Generates errors for old macro syntax ([req], [imp], [test], [doc])
 * - Supports all existing attributes (id, title, status) plus role
 * - Validates item IDs are unique
 * - Parses inline relationship macros
 */
export class DocumentParser {
    currentFile = '';
    configLoader;
    strictMode = true;
    warnings = [];
    errors = [];
    constructor(options = {}) {
        this.currentFile = options.sourceFile || '';
        this.configLoader = options.configLoader;
        this.strictMode = options.strictMode !== false;
    }
    /**
     * Parse an AsciiDoc string and return all traceability elements found within it.
     * Returns items with roles and relationships.
     */
    parse(content, sourceFile) {
        if (sourceFile) {
            this.currentFile = sourceFile;
        }
        this.warnings = [];
        this.errors = [];
        const result = {
            items: [],
            relationships: [],
            warnings: [],
            errors: [],
        };
        const seen = new Set();
        // First pass: Check for old macro syntax and generate errors
        this.checkForOldMacros(content, result);
        // Second pass: Parse all [item] block macros
        this.parseItemMacros(content, sourceFile || this.currentFile, seen, result);
        // Third pass: Parse inline relationship macros from item content
        this.parseInlineMacrosFromItems(content, sourceFile || this.currentFile, result);
        // Add accumulated warnings and errors to result
        result.warnings = this.warnings;
        result.errors = this.errors;
        return result;
    }
    /**
     * Check for old macro syntax and generate errors
     */
    checkForOldMacros(content, _result) {
        const oldMacros = ['req', 'imp', 'test', 'doc', 'design'];
        for (const macro of oldMacros) {
            const regex = new RegExp(`\[${macro}(,\s*|\s)\.?\]`, 'g');
            let match;
            while ((match = regex.exec(content)) !== null) {
                const line = this.lineAt(content, match.index);
                const error = {
                    type: 'syntax_error',
                    message: `Old macro syntax '[${macro}]' is deprecated. Use [item, role=${this.getSuggestedRole(macro)}] instead.`,
                    file: this.currentFile,
                    line,
                    position: match.index,
                };
                if (this.strictMode) {
                    this.errors.push(error);
                }
                else {
                    // In non-strict mode, add as warning
                    this.warnings.push({
                        type: 'old_macro',
                        message: error.message,
                        file: this.currentFile,
                        line,
                        position: match.index,
                    });
                }
            }
        }
    }
    /**
     * Get suggested role for old macro type
     */
    getSuggestedRole(macro) {
        const mapping = {
            'req': 'requirement',
            'imp': 'implementation',
            'test': 'test',
            'doc': 'document',
            'design': 'design',
        };
        return mapping[macro] || 'unknown';
    }
    /**
     * Parse [item] block macros
     */
    parseItemMacros(content, sourceFile, seen, result) {
        // Parse items with explicit IDs: [item, id=XXX, role=YYY]
        // Only match [item at line start to avoid matching inline backtick references
        const itemRegex = /^\[item,([^\]]*)\]/gm;
        let match;
        while ((match = itemRegex.exec(content)) !== null) {
            const attributesStr = match[1];
            const startPosition = match.index;
            const line = this.lineAt(content, startPosition);
            // Extract block content (between ==== delimiters)
            const block = this.extractBlock(content, startPosition);
            if (!block) {
                this.warnings.push({
                    type: 'invalid_attribute',
                    message: `Item block macro at line ${line} has no content block (missing ====)`,
                    file: sourceFile,
                    line,
                    position: startPosition,
                });
                continue;
            }
            // Parse attributes
            const attributes = this.parseAttributes(attributesStr);
            // Extract ID
            let id = attributes.id;
            if (!id) {
                // Generate auto ID
                id = this.generateId('ITEM');
                this.warnings.push({
                    type: 'invalid_attribute',
                    message: `Item at line ${line} has no id attribute. Generated: ${id}`,
                    file: sourceFile,
                    line,
                    position: startPosition,
                });
            }
            // Check for duplicate ID
            if (seen.has(id)) {
                this.errors.push({
                    type: 'duplicate_id',
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
                role = 'unknown';
                this.warnings.push({
                    type: 'missing_role',
                    message: `Item '${id}' at line ${line} has no role attribute. Defaulting to 'unknown'.`,
                    file: sourceFile,
                    line,
                    position: startPosition,
                });
            }
            // Check if role is known in configuration (if config loader available)
            if (this.configLoader && role !== 'unknown') {
                if (!this.configLoader.isKnownRole(role)) {
                    this.warnings.push({
                        type: 'unknown_role',
                        message: `Item '${id}' at line ${line} has unknown role '${role}'. Known roles: ${this.configLoader.getConfig().roles.join(', ')}`,
                        file: sourceFile,
                        line,
                        position: startPosition,
                    });
                }
            }
            // Extract title
            const title = attributes.title || `Item ${id}`;
            // Extract status
            const status = attributes.status;
            // Extract all other attributes
            const itemAttributes = { ...attributes };
            delete itemAttributes.id;
            delete itemAttributes.role;
            delete itemAttributes.title;
            delete itemAttributes.status;
            // Create the item
            const item = {
                id,
                title,
                content: this.extractBody(block),
                role,
                status,
                attributes: itemAttributes,
                sourceFile,
                sourceLine: line,
            };
            result.items.push(item);
        }
    }
    /**
     * Parse attributes from attribute string
     * Format: id=XXX, role=YYY, title="ZZZ", status=open
     */
    parseAttributes(attributesStr) {
        const attributes = {};
        // Split by commas, but respect quoted strings
        const parts = this.splitAttributes(attributesStr);
        for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed)
                continue;
            // Handle both key=value and key="value with spaces"
            const match = trimmed.match(/^([a-zA-Z][a-zA-Z0-9_-]*)\s*=\s*(.+)$/);
            if (!match)
                continue;
            const key = match[1].toLowerCase();
            let value = match[2];
            // Remove surrounding quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) ||
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            attributes[key] = value;
        }
        return attributes;
    }
    /**
     * Split attribute string by commas, respecting quoted strings
     */
    splitAttributes(attributesStr) {
        const parts = [];
        let current = '';
        let inQuotes = false;
        let quoteChar = '';
        for (let i = 0; i < attributesStr.length; i++) {
            const char = attributesStr[i];
            if ((char === '"' || char === "'") && (i === 0 || attributesStr[i - 1] !== '\\')) {
                if (!inQuotes) {
                    inQuotes = true;
                    quoteChar = char;
                }
                else if (char === quoteChar) {
                    inQuotes = false;
                    quoteChar = '';
                }
                current += char;
            }
            else if (char === ',' && !inQuotes) {
                parts.push(current);
                current = '';
            }
            else {
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
    parseInlineMacrosFromItems(_content, sourceFile, result) {
        // Build a map of item IDs to their role for efficient lookup
        const itemRoleMap = new Map();
        for (const item of result.items) {
            itemRoleMap.set(item.id, item.role);
        }
        // For each item, parse its content for inline macros
        for (const item of result.items) {
            const itemContent = item.content ?? '';
            // Parse inline relationship macros: relationType:targetId[]
            // Example: satisfies:REQ-001[], addresses:DES-001[], implemented_by:IMP-001[]
            const inlineMacroRegex = /([a-zA-Z][a-zA-Z0-9_-]*:[A-Z0-9_-]+)\[/g;
            let match;
            while ((match = inlineMacroRegex.exec(itemContent)) !== null) {
                const macro = match[1];
                const line = this.lineAt(itemContent, match.index) + (item.sourceLine || 0);
                // Split macro into relation type and target ID
                const colonIndex = macro.indexOf(':');
                if (colonIndex === -1)
                    continue;
                const relationType = macro.substring(0, colonIndex);
                const targetId = macro.substring(colonIndex + 1);
                if (!relationType || !targetId)
                    continue;
                // Create relationship: source is the current item, target is the referenced ID
                const relationship = {
                    id: `${item.id}-${relationType}-${targetId}`,
                    fromId: item.id,
                    targetId,
                    type: relationType,
                    sourceFile,
                    line,
                };
                // Validate relation if config loader is available
                if (this.configLoader) {
                    const sourceRole = itemRoleMap.get(item.id) || 'unknown';
                    // Find target item to get its role
                    const targetItem = result.items.find(i => i.id === targetId);
                    const targetRole = targetItem ? targetItem.role : 'unknown';
                    // Check if relation is allowed
                    if (!this.configLoader.isRelationAllowed(sourceRole, targetRole, relationType)) {
                        // Check if either role is unknown
                        if (sourceRole === 'unknown' || targetRole === 'unknown') {
                            this.warnings.push({
                                type: 'unknown_role',
                                message: `Relation '${relationType}' from '${item.id}' (role: ${sourceRole}) to '${targetId}' (role: ${targetRole}) involves unknown role(s). Skipping validation.`,
                                file: sourceFile,
                                line,
                            });
                        }
                        else {
                            const allowed = this.configLoader.getAllowedRelations(sourceRole, targetRole);
                            this.errors.push({
                                type: 'invalid_relation',
                                message: `Relation '${relationType}' not allowed from '${sourceRole}' to '${targetRole}'. Allowed: [${allowed.join(', ')}]`,
                                file: sourceFile,
                                line,
                                position: match.index,
                            });
                            continue; // Skip adding this invalid relation
                        }
                    }
                }
                result.relationships.push(relationship);
                console.log(`Inline relationship found: ${item.id} ${relationType} ${targetId}`);
            }
        }
    }
    extractBlock(content, startIndex) {
        // Find opening delimiter: ==== or -- (must be alone on a line)
        let m = content.slice(startIndex).match(/\n(====|--)\n/);
        if (!m || m.index === undefined)
            return null;
        const blockStart = startIndex + m.index + 1;
        const delimiter = m[1];
        const blockEnd = content.indexOf(`\n${delimiter}\n`, blockStart + delimiter.length + 1);
        if (blockEnd === -1)
            return null;
        return content.substring(startIndex, blockEnd + delimiter.length + 2);
    }
    extractBody(block) {
        // Find the delimiter: either ==== or --
        const hasEquals = block.includes('====');
        const delimiter = hasEquals ? '====' : '--';
        const start = block.indexOf(delimiter) + delimiter.length;
        const end = block.lastIndexOf(delimiter);
        return block.substring(start, end).trim();
    }
    lineAt(content, position) {
        return (content.substring(0, position).match(/\n/g) ?? []).length + 1;
    }
    generateId(prefix) {
        return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    }
}
