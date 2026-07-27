## 1. Create LinkResolver Component

- [x] 1.1 Create new file `src/LinkResolver.ts` with LinkResolver class
- [x] 1.2 Implement `generateItemLink(item: Item): string` method
- [x] 1.3 Add `LinkResolverOptions` interface with `relativePathPrefix` field
- [x] 1.4 Export LinkResolver class from file

## 2. Update Antora Extension for Path Normalization

- [x] 2.1 Add `normalizeSourceFile(sourceFile: string): string` method to AntoraTraceabilityExtension
- [x] 2.2 Update `processAsciiDocFile` to call `normalizeSourceFile` before passing to traceability extension
- [x] 2.3 Import LinkResolver in antora-extension.ts

## 3. Integrate LinkResolver in MatrixGenerator

- [x] 3.1 Update `MatrixGeneratorOptions` interface to include optional `linkResolver?: LinkResolver`
- [x] 3.2 Add private `linkResolver?: LinkResolver` field to MatrixGenerator class
- [x] 3.3 Update constructor to accept and store linkResolver option
- [x] 3.4 Update `prepareRowForTemplate` to generate `rowHref` using linkResolver for row items
- [x] 3.5 Update `prepareRowForTemplate` to generate `itemHref` and `sourceFile` for cell items

## 4. Update HTML Matrix Template

- [x] 4.1 Modify row ID cell to render as link when `rowHref` exists
- [x] 4.2 Modify cell item rendering to use `itemHref` for links
- [x] 4.3 Add `title` attribute with source file tooltip to item links
- [x] 4.4 Add source file reference in small text after item title

## 5. Wire Up LinkResolver in Antora Build

- [x] 5.1 In `generateTraceabilityFiles`, create LinkResolver with `relativePathPrefix: '../../'`
- [x] 5.2 Pass linkResolver to MatrixGenerator constructor

## 6. Wire Up LinkResolver in CLI

- [x] 6.1 In `examples/run-example.js`, import LinkResolver
- [x] 6.2 Create LinkResolver with `relativePathPrefix: '../../pages/'`
- [x] 6.3 Pass linkResolver to MatrixGenerator constructor

## 7. Testing

- [x] 7.1 Run existing test suite to ensure no regressions
- [x] 7.2 Manually verify Antora build generates clickable links in matrices
- [x] 7.3 Manually verify CLI example generates clickable links in matrices
- [x] 7.4 Verify links navigate to correct items with fragment identifiers
- [x] 7.5 Verify tooltips show source file names
- [x] 7.6 Verify items in subdirectories link correctly
- [x] 7.7 Verify backward compatibility (matrices without LinkResolver render as before)

## 8. Documentation

- [x] 8.1 Update README or documentation to mention clickable matrix links
- [x] 8.2 Add configuration example for custom `relativePathPrefix` if applicable
