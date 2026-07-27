/**
 * Unified error types for the traceability extension
 * Provides a hierarchy of errors for better error handling and debugging
 */

/**
 * Base error class for all traceability-related errors
 */
export class TraceabilityError extends Error {
  public readonly code: string;
  public readonly context?: string;

  constructor(message: string, code: string, context?: string) {
    super(message);
    this.name = "TraceabilityError";
    this.code = code;
    this.context = context;

    // Maintain proper stack trace (only available in V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TraceabilityError);
    }
  }
}

/**
 * Errors related to parsing AsciiDoc content
 */
export class ParserError extends TraceabilityError {
  public readonly file: string;
  public readonly line?: number;
  public readonly position?: number;

  constructor(
    message: string,
    file: string,
    line?: number,
    position?: number,
    context?: string,
  ) {
    super(message, "PARSER_ERROR", context);
    this.file = file;
    this.line = line;
    this.position = position;
  }
}

/**
 * Errors related to graph operations
 */
export class GraphError extends TraceabilityError {
  constructor(message: string, context?: string) {
    super(message, "GRAPH_ERROR", context);
  }
}

/**
 * Errors related to configuration
 */
export class ConfigurationError extends TraceabilityError {
  public readonly configPath?: string;

  constructor(message: string, configPath?: string, context?: string) {
    super(message, "CONFIG_ERROR", context);
    this.configPath = configPath;
  }
}

/**
 * Errors related to validation
 */
export class ValidationError extends TraceabilityError {
  public readonly type: "error" | "warning";

  constructor(
    message: string,
    type: "error" | "warning" = "error",
    context?: string,
  ) {
    super(message, "VALIDATION_ERROR", context);
    this.type = type;
  }
}

/**
 * Errors related to Neo4j export
 */
export class ExportError extends TraceabilityError {
  constructor(message: string, context?: string) {
    super(message, "EXPORT_ERROR", context);
  }
}

/**
 * Type guard for TraceabilityError
 */
export function isTraceabilityError(
  error: unknown,
): error is TraceabilityError {
  return error instanceof Error && "code" in error;
}

/**
 * Type guard for ParserError
 */
export function isParserError(error: unknown): error is ParserError {
  return isTraceabilityError(error) && error.code === "PARSER_ERROR";
}

/**
 * Type guard for ConfigurationError
 */
export function isConfigurationError(
  error: unknown,
): error is ConfigurationError {
  return isTraceabilityError(error) && error.code === "CONFIG_ERROR";
}

/**
 * Type guard for ValidationError
 */
export function isValidationError(error: unknown): error is ValidationError {
  return isTraceabilityError(error) && error.code === "VALIDATION_ERROR";
}
