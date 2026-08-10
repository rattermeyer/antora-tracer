#!/usr/bin/env node
// Full site preview — replicates CI pipeline.
// Local:  node scripts/preview.js          (uses local content source)
// CI:     node scripts/preview.js --ci     (uses remote content source)
// Output: public/index.html + public/docs/

import { execSync } from 'node:child_process';
import { existsSync, cpSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const PUBLIC = join(ROOT, 'public');
const isCI = process.argv.includes('--ci');
const playbook = isCI ? 'antora-playbook-ci.yml' : 'antora-playbook.yml';

function run(cmd, label) {
  console.log(`\n▶ ${label}`);
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// CI runs npm ci + npm run build beforehand; local expects deps already installed
if (!isCI && !existsSync(join(ROOT, 'node_modules', '@asciidoctor', 'core'))) {
  console.error('ERROR: node_modules not found. Run: npm install && npm run build');
  process.exit(1);
}

// Clean + recreate public/
execSync(`rm -rf "${PUBLIC}" && mkdir -p "${PUBLIC}"`, { stdio: 'inherit' });
console.log('✓ cleaned public/');

// 1. Build Antora docs
run(`npx antora ${playbook}`, 'Build Antora docs');

// 2. Build PDF
function copyPDFs() {
  const version = execSync("grep '^version:' examples/tracer/antora.yml | awk '{print $2}'", { cwd: ROOT, encoding: 'utf8' }).trim();
  const exportsDir = `build/pdf-output/tracer/${version}/_exports`;
  execSync(`mkdir -p "${PUBLIC}/pdf"`, { stdio: 'inherit' });
  for (const pdf of ['architecture', 'use-cases', 'requirements', 'test-plan']) {
    const src = join(ROOT, exportsDir, `${pdf}.pdf`);
    if (existsSync(src)) {
      cpSync(src, join(PUBLIC, 'pdf', `${pdf}.pdf`));
      console.log(`  copied pdf/${pdf}.pdf`);
    }
  }
}

if (isCI) {
  run('KROKI_IMAGE_FORMAT=png npx antora antora-playbook-pdf.yml', 'Build PDF');
  copyPDFs();
} else {
  try {
    run('KROKI_IMAGE_FORMAT=png npx antora antora-playbook-pdf.yml', 'Build PDF');
    copyPDFs();
  } catch (e) {
    console.log('⚠ PDF build skipped (Ruby/asciidoctor-pdf not available? Use devbox shell for PDF).');
  }
}

// 3. Generate blog index + copy landing page
run('node scripts/generate-blog-index.js', 'Generate blog index');
execSync(`cp -r "${join(ROOT, 'landing')}"/* "${PUBLIC}/"`, { stdio: 'inherit' });
console.log('  copied landing page');

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Site ready in public/');
console.log('  Landing:  public/index.html');
console.log('  Docs:     public/docs/');
if (existsSync(join(PUBLIC, 'pdf'))) console.log('  PDF:      public/pdf/');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Open with:  npx serve public  (or any static server)\n');
