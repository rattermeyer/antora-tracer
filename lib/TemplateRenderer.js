import fs from "node:fs";
import path from "node:path";
import mustache from "mustache";
/**
 * Renders Mustache templates with support for partials.
 * Templates are loaded and compiled once, then cached for reuse.
 */
export class TemplateRenderer {
    templates = new Map();
    partials = new Map();
    templateDir;
    /**
     * Creates a new TemplateRenderer.
     * @param templateDir - Directory containing template files
     */
    constructor(templateDir) {
        this.templateDir = templateDir;
        this.loadTemplates();
    }
    /**
     * Loads all templates from the template directory.
     * Templates in the root directory are main templates.
     * Templates in the partials/ subdirectory are partials.
     */
    loadTemplates() {
        // Load partials first
        const partialsDir = path.join(this.templateDir, "partials");
        if (fs.existsSync(partialsDir)) {
            const partialFiles = fs.readdirSync(partialsDir);
            for (const file of partialFiles) {
                if (file.endsWith(".mustache")) {
                    const name = path.basename(file, ".mustache");
                    const content = fs.readFileSync(path.join(partialsDir, file), "utf8");
                    this.partials.set(name, content);
                }
            }
        }
        // Load main templates
        const templateFiles = fs.readdirSync(this.templateDir);
        for (const file of templateFiles) {
            // Skip directories (like partials/)
            const filePath = path.join(this.templateDir, file);
            if (fs.statSync(filePath).isDirectory()) {
                continue;
            }
            if (file.endsWith(".mustache")) {
                // Remove both .html and .mustache extensions
                let name = path.basename(file, ".mustache");
                if (name.endsWith(".html")) {
                    name = name.slice(0, -5); // Remove .html
                }
                const content = fs.readFileSync(filePath, "utf8");
                this.templates.set(name, content);
            }
        }
    }
    /**
     * Renders a template with the provided data.
     * @param templateName - Name of the template (without .mustache extension)
     * @param data - Data to render the template with
     * @returns Rendered HTML string
     */
    render(templateName, data) {
        const template = this.templates.get(templateName);
        if (!template) {
            throw new Error(`Template not found: ${templateName}`);
        }
        // Convert partials map to object for mustache
        const partialsObj = {};
        for (const [name, content] of this.partials) {
            partialsObj[name] = content;
        }
        return mustache.render(template, data, partialsObj);
    }
    /**
     * Gets the list of available template names.
     */
    getAvailableTemplates() {
        return Array.from(this.templates.keys());
    }
    /**
     * Gets the list of available partial names.
     */
    getAvailablePartials() {
        return Array.from(this.partials.keys());
    }
}
