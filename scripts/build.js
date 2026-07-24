// Build script: compiles TypeScript source to JavaScript in lib/
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

console.log('🔧 Building TypeScript project...');
try {
  execSync('tsc', { stdio: 'inherit' });

  // Copy templates directory to both lib/ and lib/src/ for compatibility
  const srcTemplates = path.join('src', 'templates');

  if (fs.existsSync(srcTemplates)) {
    // Copy to lib/templates/
    const libTemplates = path.join('lib', 'templates');
    if (!fs.existsSync('lib')) {
      fs.mkdirSync('lib', { recursive: true });
    }
    copyDirRecursive(srcTemplates, libTemplates);

    // Copy to lib/src/templates/ (for tests that import from lib/src/)
    const libSrcTemplates = path.join('lib', 'src', 'templates');
    if (!fs.existsSync(path.join('lib', 'src'))) {
      fs.mkdirSync(path.join('lib', 'src'), { recursive: true });
    }
    copyDirRecursive(srcTemplates, libSrcTemplates);

    console.log('✅ Templates copied to lib/templates/ and lib/src/templates/');
  }

  // Copy presets directory to both lib/ and lib/src/ for compatibility
  const srcPresets = path.join('src', 'presets');

  if (fs.existsSync(srcPresets)) {
    // Copy to lib/presets/
    const libPresets = path.join('lib', 'presets');
    if (!fs.existsSync('lib')) {
      fs.mkdirSync('lib', { recursive: true });
    }
    copyDirRecursive(srcPresets, libPresets);

    // Copy to lib/src/presets/ (for tests that import from lib/src/)
    const libSrcPresets = path.join('lib', 'src', 'presets');
    if (!fs.existsSync(path.join('lib', 'src'))) {
      fs.mkdirSync(path.join('lib', 'src'), { recursive: true });
    }
    copyDirRecursive(srcPresets, libSrcPresets);

    console.log('✅ Presets copied to lib/presets/ and lib/src/presets/');
  }

  console.log('✅ Build completed: src/ → lib/');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}

/**
 * Recursively copies a directory
 */
function copyDirRecursive(src, dest) {
  // Create destination directory if it doesn't exist
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  // Read all files/directories from source
  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      // Recursively copy subdirectories
      copyDirRecursive(srcPath, destPath);
    } else {
      // Copy files
      fs.copyFileSync(srcPath, destPath);
    }
  }
}
