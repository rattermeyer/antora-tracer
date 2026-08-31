const pdfExt = require("@antora/pdf-extension");

// DO NOT bump @antora/pdf-extension or @antora/assembler past 1.0.0-beta.20
// until Antora 3.2 is adopted: rc.8+ reads contentCatalog.publishableFamilies,
// which only exists in Antora 3.2+. See ADR-013.

module.exports.register = (context, extConfig) => {
  // Merge config_files from the playbook extension entry into context.config
  // so the assembler's configure.js can find configFiles.
  const files = extConfig?.config?.configFiles;
  if (files) {
    context.config = Object.assign(context.config || {}, {
      configFiles: files,
    });
  }
  return pdfExt.register.call(context, context);
};
