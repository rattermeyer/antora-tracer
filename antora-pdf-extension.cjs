const pdfExt = require("@antora/pdf-extension");

// Debug: check component descriptor after componentsRegistered
module.exports.register = (context) => {
  const vars = context.getVariables?.() || {};

  context.on("componentsRegistered", ({ contentCatalog }) => {
    const components = contentCatalog.getComponents();
    for (const c of components) {
      for (const cv of c.versions) {
        const files = cv.files;
        const navFiles = files.filter((f) => f.path.includes("nav-"));
        process.stderr.write(
          "[NAV-DEBUG] Component " +
            cv.name +
            " " +
            cv.version +
            " nav files: " +
            navFiles.map((f) => f.path).join(", ") +
            "\n",
        );
        // Check assembler config
        const src = [...(cv.origins || [])].find(
          (o) => o.descriptor?.ext?.assembler,
        );
        process.stderr.write(
          "[NAV-DEBUG] Assembler config: " +
            JSON.stringify(src?.descriptor?.ext?.assembler) +
            "\n",
        );
      }
    }
  });

  return pdfExt.register.call(context, context, { config: {} });
};
