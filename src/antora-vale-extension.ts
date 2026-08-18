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

export type ValeLevel = "suggestion" | "warning" | "error";

export interface AntoraValeConfig {
  valeConfig?: string;
  minLevel?: ValeLevel;
}

interface ValeFinding {
  Line: number;
  Severity: ValeLevel;
  Message: string;
  Check?: string;
}

interface AntoraValeLogger {
  info: (msg: string) => void;
  warn: (msg: string) => void;
  error: (msg: string) => void;
}

interface AntoraValeContext {
  getLogger: (name: string) => AntoraValeLogger;
  on: (event: string, handler: (event: any) => void) => void;
  playbook?: { dir?: string };
}

const LEVEL_RANK: Record<ValeLevel, number> = {
  suggestion: 0,
  warning: 1,
  error: 2,
};

const DEFAULT_CONFIG: Required<AntoraValeConfig> = {
  valeConfig: "",
  minLevel: "warning",
};

function normalizeLevel(value: unknown): ValeLevel {
  return value === "error" || value === "suggestion" || value === "warning"
    ? value
    : "warning";
}

export class AntoraValeExtension {
  private readonly logger: AntoraValeLogger;
  private readonly config: Required<AntoraValeConfig>;

  constructor(
    private readonly context: AntoraValeContext,
    config: AntoraValeConfig = {},
  ) {
    this.logger = context.getLogger("antora-vale-extension");
    // Antora normalizes YAML extension config keys to lowercase, so accept
    // both camelCase and lowercase spellings.
    const raw = { ...DEFAULT_CONFIG, ...config } as Record<string, unknown>;
    this.config = {
      valeConfig: String(raw.valeConfig ?? raw.valeconfig ?? raw.vale_config ?? ""),
      minLevel: normalizeLevel(raw.minLevel ?? raw.minlevel),
    };
    context.on("contentClassified", (event) => this.onContentClassified(event));
  }

  private onContentClassified(event: any): void {
    const contentCatalog = event.contentCatalog;
    if (!contentCatalog) return;

    const adocFiles = [
      ...(contentCatalog.findBy({ family: "page" }) || []),
      ...(contentCatalog.findBy({ family: "partial" }) || []),
    ].filter((file: any) => file.src?.path?.endsWith(".adoc"));

    if (adocFiles.length === 0) return;

    this.assertExecutables();

    const errors: string[] = [];
    const warnings: string[] = [];

    for (const file of adocFiles) {
      const sourcePath = file.src.path as string;
      const contents = (file.contents ?? file.src?.contents) as
        | Buffer
        | undefined;
      if (!contents) continue;

      for (const finding of this.lintContent(contents, sourcePath)) {
        const check = finding.Check ? `${finding.Check}: ` : "";
        const message =
          `${sourcePath}:${finding.Line}: [${finding.Severity}] ${check}${finding.Message}`;
        if (LEVEL_RANK[finding.Severity] >= LEVEL_RANK[this.config.minLevel]) {
          errors.push(message);
        } else {
          warnings.push(message);
        }
      }
    }

    for (const warning of warnings) this.logger.warn(warning);
    if (errors.length > 0) {
      throw new Error(
        `Vale found ${errors.length} issue(s) at or above level '${this.config.minLevel}':\n${errors.join("\n")}`,
      );
    }
    this.logger.info("Vale prose check completed with no issues");
  }

  private lintContent(contents: Buffer, sourcePath: string): ValeFinding[] {
    const args = ["--output=JSON", "--no-wrap", "--no-exit"];
    const valeConfig = this.resolveValeConfig();
    if (valeConfig) args.push("--config", valeConfig);
    args.push("--path", sourcePath);

    let stdout: string;
    try {
      stdout = execFileSync("vale", args, {
        input: contents.toString("utf8"),
        encoding: "utf8",
        stdio: ["ignore", "pipe", "pipe"],
      });
    } catch (error) {
      const stderr = (error as any)?.stderr?.toString() || "";
      throw new Error(
        `vale failed while linting ${sourcePath}: ${stderr || (error as any).message}`,
      );
    }

    const parsed = JSON.parse(stdout);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && typeof parsed === "object") {
      for (const value of Object.values(parsed)) {
        if (Array.isArray(value)) return value as ValeFinding[];
      }
    }
    return [];
  }

  private resolveValeConfig(): string {
    if (!this.config.valeConfig) return "";
    const playbookDir = this.context.playbook?.dir || process.cwd();
    return isAbsolute(this.config.valeConfig)
      ? this.config.valeConfig
      : join(playbookDir, this.config.valeConfig);
  }

  private assertExecutables(): void {
    for (const bin of ["vale", "asciidoctor"]) {
      try {
        execFileSync(bin, ["--version"], { stdio: "ignore" });
      } catch {
        throw new Error(
          `The '${bin}' executable is required by the antora-vale-extension but was not found on PATH. Install it (e.g. 'brew install vale asciidoctor' or via devbox/nix) or disable the extension.`,
        );
      }
    }
  }
}

export function register(
  context: AntoraValeContext,
  extConfig?: { config?: AntoraValeConfig },
): void {
  const config = (extConfig?.config ?? extConfig ?? {}) as AntoraValeConfig;
  new AntoraValeExtension(context, config);
}

export default { register };
