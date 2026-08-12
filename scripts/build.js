// Post-compile step: copies non-TS assets (templates, presets) to lib/src/.
// Called after tsc by both "npm run build" and "npm test".
import fs from "node:fs";
import path from "node:path";

const libSrc = path.join("lib", "src");

// Copy templates
const srcTemplates = path.join("src", "templates");
if (fs.existsSync(srcTemplates)) {
  copyDirRecursive(srcTemplates, path.join(libSrc, "templates"));
}

// Copy presets
const srcPresets = path.join("src", "presets");
if (fs.existsSync(srcPresets)) {
  copyDirRecursive(srcPresets, path.join(libSrc, "presets"));
}

console.log("✅ Assets copied to lib/src/");

function copyDirRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
