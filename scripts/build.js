// TypeScript build script
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔧 Building TypeScript project...');

try {
  // Run TypeScript compiler
  execSync('tsc', { stdio: 'inherit' });
  
  // Copy non-TypeScript files if needed
  const srcDir = path.join(__dirname, '..', 'src');
  const libDir = path.join(__dirname, '..', 'lib');
  
  // Copy any non-.ts files
  if (fs.existsSync(srcDir)) {
    const entries = fs.readdirSync(srcDir, { withFileTypes: true });
    
    for (const entry of entries) {
      if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.js')) {
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(libDir, entry.name);
        
        if (entry.isDirectory()) {
          if (!fs.existsSync(destPath)) {
            fs.mkdirSync(destPath, { recursive: true });
          }
        } else {
          fs.copyFileSync(srcPath, destPath);
        }
      }
    }
  }
  
  console.log('✅ Build completed: TypeScript → JavaScript in lib/');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}