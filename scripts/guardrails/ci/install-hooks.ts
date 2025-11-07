#!/usr/bin/env ts-node
/**
 * 🔧 INSTALL GUARDRAILS HOOKS
 * 
 * Instala el pre-commit hook en .git/hooks/
 */

import * as fs from 'fs';
import * as path from 'path';

function installPreCommitHook() {
  console.log('🔧 Installing guardrails pre-commit hook...\n');
  
  const hookPath = path.join(process.cwd(), '.git', 'hooks', 'pre-commit');
  const scriptPath = path.join(__dirname, 'pre-commit.ts');
  
  // Check if .git exists
  if (!fs.existsSync(path.join(process.cwd(), '.git'))) {
    console.error('❌ Error: .git directory not found. Are you in a git repository?');
    process.exit(1);
  }
  
  // Create hooks directory if it doesn't exist
  const hooksDir = path.dirname(hookPath);
  if (!fs.existsSync(hooksDir)) {
    fs.mkdirSync(hooksDir, { recursive: true });
  }
  
  // Create pre-commit hook
  const hookContent = `#!/bin/sh
# DobackSoft Guardrails Pre-commit Hook
# Auto-generated - Do not edit manually

npx ts-node "${scriptPath}"
`;
  
  fs.writeFileSync(hookPath, hookContent, { mode: 0o755 });
  
  console.log('✅ Pre-commit hook installed successfully!');
  console.log(`   Location: ${hookPath}`);
  console.log('\n💡 The hook will run automatically on every commit');
  console.log('   To bypass (not recommended): git commit --no-verify\n');
}

function main() {
  try {
    installPreCommitHook();
  } catch (error: any) {
    console.error('❌ Error installing hook:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

