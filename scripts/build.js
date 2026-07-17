// Build script: compiles TypeScript source to JavaScript in lib/
import { execSync } from 'child_process';

console.log('🔧 Building TypeScript project...');
try {
  execSync('tsc', { stdio: 'inherit' });
  console.log('✅ Build completed: src/ → lib/');
} catch (error) {
  console.error('❌ Build failed');
  process.exit(1);
}
