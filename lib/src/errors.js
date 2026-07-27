/**
 * Unified error types for the traceability extension
 * Provides a hierarchy of errors for better error handling and debugging
 */
/**
 * Base error class for all traceability-related errors
 */
export class TraceabilityError extends Error {
    code;
    context;
    constructor(message, code, context) {
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
    file;
    line;
    position;
    constructor(message, file, line, position, context) {
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
    constructor(message, context) {
        super(message, "GRAPH_ERROR", context);
    }
}
/**
 * Errors related to configuration
 */
export class ConfigurationError extends TraceabilityError {
    configPath;
    constructor(message, configPath, context) {
        super(message, "CONFIG_ERROR", context);
        this.configPath = configPath;
    }
}
/**
 * Errors related to validation
 */
export class ValidationError extends TraceabilityError {
    type;
    constructor(message, type = "error", context) {
        super(message, "VALIDATION_ERROR", context);
        this.type = type;
    }
}
/**
 * Errors related to Neo4j export
 */
export class ExportError extends TraceabilityError {
    constructor(message, context) {
        super(message, "EXPORT_ERROR", context);
    }
}
/**
 * Type guard for TraceabilityError
 */
export function isTraceabilityError(error) {
    return error instanceof Error && "code" in error;
}
/**
 * Type guard for ParserError
 */
export function isParserError(error) {
    return isTraceabilityError(error) && error.code === "PARSER_ERROR";
}
/**
 * Type guard for ConfigurationError
 */
export function isConfigurationError(error) {
    return isTraceabilityError(error) && error.code === "CONFIG_ERROR";
}
/**
 * Type guard for ValidationError
 */
export function isValidationError(error) {
    return isTraceabilityError(error) && error.code === "VALIDATION_ERROR";
}
