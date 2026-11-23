/**
 * Resolve an item's relative `sourceFile` to an absolute filesystem path.
 *
 * Extracted from the CLI so the resolution preference order — the item's
 * recorded content-source root first, the caller's own input directory second
 * — and the escape guard are unit-testable without importing the CLI entry
 * point (which parses `process.argv` on import).
 */
import { resolve, sep } from "node:path";
/**
 * Resolve an item's source file to an absolute path.
 *
 * Preference order: the item's recorded content-source root, then the caller's
 * input directory. A resolved path that escapes the chosen root is rejected
 * rather than returned, so the CLI never reads or writes outside it.
 */
export function resolveSourceFilePath(input, sourceFile, sourceRoot) {
    if (!sourceFile) {
        throw new Error("Item has no source file recorded");
    }
    const root = sourceRoot && sourceRoot.length > 0
        ? resolve(process.cwd(), sourceRoot)
        : resolve(process.cwd(), input);
    const full = resolve(root, sourceFile);
    if (full !== root && !full.startsWith(root + sep)) {
        throw new Error(`Source file escapes input directory: ${sourceFile}`);
    }
    return full;
}
