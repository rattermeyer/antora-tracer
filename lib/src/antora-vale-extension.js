/**
 * Antora Vale extension — runs the Vale prose linter against the source
 * AsciiDoc content of the complete content catalog and gates the build on a
 * configurable minimum severity.
 *
 * Register in a playbook:
 *   antora:
 *     extensions:
 *       - require: antora-tracer/antora-vale
 *         valeConfig: .vale.ini
 *         minLevel: warning
 *
 * Requires the `vale` and `asciidoctor` executables on PATH.
 */
import { execFileSync } from "node:child_process";
import { isAbsolute, join } from "node:path";
const LEVEL_RANK = {
    suggestion: 0,
    warning: 1,
    error: 2,
};
function normalizeLevel(value) {
    return value === "error" || value === "suggestion" || value === "warning"
        ? value
        : "warning";
}
export class AntoraValeExtension {
    context;
    logger;
    config;
    constructor(context, config = {}) {
        this.context = context;
        this.logger = context.getLogger("antora-vale-extension");
        // Antora normalizes YAML extension config keys to lowercase, so accept
        // both camelCase and lowercase spellings. Read from the raw config (not
        // merged with defaults) so `??` falls through on absent keys.
        const raw = config;
        this.config = {
            valeConfig: String(raw.valeConfig ?? raw.valeconfig ?? raw.vale_config ?? ""),
            minLevel: normalizeLevel(raw.minLevel ?? raw.minlevel ?? "warning"),
            exclude: Array.isArray(raw.exclude)
                ? raw.exclude.map((pattern) => String(pattern))
                : [],
        };
        context.on("contentClassified", (event) => this.onContentClassified(event));
    }
    onContentClassified(event) {
        const contentCatalog = event.contentCatalog;
        if (!contentCatalog)
            return;
        const adocFiles = [
            ...(contentCatalog.findBy({ family: "page" }) || []),
            ...(contentCatalog.findBy({ family: "partial" }) || []),
        ]
            .filter((file) => file.src?.path?.endsWith(".adoc"))
            .filter((file) => !this.config.exclude.some((pattern) => file.src?.path?.includes(pattern)));
        if (adocFiles.length === 0)
            return;
        this.assertExecutables();
        const errors = [];
        const warnings = [];
        for (const file of adocFiles) {
            const sourcePath = file.src.path;
            const contents = (file.contents ?? file.src?.contents);
            if (!contents)
                continue;
            for (const finding of this.lintContent(contents, sourcePath)) {
                const check = finding.Check ? `${finding.Check}: ` : "";
                const message = `${sourcePath}:${finding.Line}: [${finding.Severity}] ${check}${finding.Message}`;
                if (LEVEL_RANK[finding.Severity] >= LEVEL_RANK[this.config.minLevel]) {
                    errors.push(message);
                }
                else {
                    warnings.push(message);
                }
            }
        }
        for (const warning of warnings)
            this.logger.warn(warning);
        if (errors.length > 0) {
            throw new Error(`Vale found ${errors.length} issue(s) at or above level '${this.config.minLevel}':\n${errors.join("\n")}`);
        }
        this.logger.info("Vale prose check completed with no issues");
    }
    lintContent(contents, sourcePath) {
        const args = [
            "--output=JSON",
            "--no-wrap",
            "--no-exit",
            "--minAlertLevel=suggestion",
        ];
        const valeConfig = this.resolveValeConfig();
        if (valeConfig)
            args.push("--config", valeConfig);
        args.push("--path", sourcePath);
        let stdout;
        try {
            stdout = execFileSync("vale", args, {
                input: contents.toString("utf8"),
                encoding: "utf8",
            });
        }
        catch (error) {
            const stderr = error?.stderr?.toString() || "";
            throw new Error(`vale failed while linting ${sourcePath}: ${stderr || error.message}`);
        }
        const parsed = JSON.parse(stdout);
        if (Array.isArray(parsed))
            return parsed;
        if (parsed && typeof parsed === "object") {
            for (const value of Object.values(parsed)) {
                if (Array.isArray(value))
                    return value;
            }
        }
        return [];
    }
    resolveValeConfig() {
        if (!this.config.valeConfig)
            return "";
        const playbookDir = this.context.playbook?.dir || process.cwd();
        return isAbsolute(this.config.valeConfig)
            ? this.config.valeConfig
            : join(playbookDir, this.config.valeConfig);
    }
    assertExecutables() {
        for (const bin of ["vale", "asciidoctor"]) {
            try {
                execFileSync(bin, ["--version"], { stdio: "ignore" });
            }
            catch {
                throw new Error(`The '${bin}' executable is required by the antora-vale-extension but was not found on PATH. Install it (e.g. 'brew install vale asciidoctor' or via devbox/nix) or disable the extension.`);
            }
        }
    }
}
export function register(context, extConfig) {
    const config = (extConfig?.config ?? extConfig ?? {});
    new AntoraValeExtension(context, config);
}
export default { register };
