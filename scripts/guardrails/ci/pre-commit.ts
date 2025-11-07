#!/usr/bin/env ts-node
/**
 * 🪝 PRE-COMMIT HOOK
 * 
 * Ejecuta guardrails antes de cada commit
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

async function runPreCommit(): Promise<boolean> {
  console.log('🪝 Running pre-commit guardrails...\n');
  
  try {
    // Get staged files
    const stagedFiles = execSync('git diff --cached --name-only', { encoding: 'utf-8' })
      .split('\n')
      .filter(f => f.length > 0);
    
    if (stagedFiles.length === 0) {
      console.log('⚠️  No staged files, skipping guardrails\n');
      return true;
    }
    
    console.log(`📁 Checking ${stagedFiles.length} staged files...\n`);
    
    // Quick checks on staged files only
    let violations = 0;
    
    for (const file of stagedFiles) {
      // Skip non-source files
      if (!file.match(/\.(ts|tsx|js|jsx)$/)) continue;
      
      // Skip test files, node_modules, etc.
      if (file.includes('node_modules') || 
          file.includes('.test.') || 
          file.includes('__tests__')) {
        continue;
      }
      
      const fullPath = path.join(process.cwd(), file);
      
      if (!fs.existsSync(fullPath)) continue;
      
      const content = fs.readFileSync(fullPath, 'utf-8');
      
      // Check 1: No console.log (except in allowed files)
      if (!file.includes('logger.ts') && 
          !file.includes('setupProxy') &&
          !file.includes('i18n')) {
        
        const consoleMatches = content.match(/console\.(log|error|warn)/g);
        
        if (consoleMatches) {
          console.log(`❌ ${file}: Found ${consoleMatches.length} console.* calls`);
          violations++;
        }
      }
      
      // Check 2: No hardcoded localhost URLs (frontend only)
      if (file.includes('frontend/src') && !file.includes('config/api.ts')) {
        const urlMatches = content.match(/['"]https?:\/\/localhost:\d+/g);
        
        if (urlMatches) {
          console.log(`❌ ${file}: Found ${urlMatches.length} hardcoded URLs`);
          violations++;
        }
      }
      
      // Check 3: Prisma queries should have organizationId (backend only)
      if (file.includes('backend/src') && 
          (file.includes('controllers') || file.includes('services'))) {
        
        const lines = content.split('\n');
        
        lines.forEach((line, idx) => {
          if (line.match(/\.(findMany|findFirst|update|delete)\(/) &&
              !line.includes('//')) {
            
            // Check next 5 lines for organizationId
            const context = lines.slice(idx, idx + 5).join('\n');
            
            const isException = 
              line.includes('user.findUnique') ||
              line.includes('organization.findUnique') ||
              context.includes('// GUARDRAILS:SAFE');
            
            if (!isException && !context.includes('organizationId')) {
              console.log(`⚠️  ${file}:${idx + 1}: Possible missing organizationId filter`);
              // Don't count as violation (just warning)
            }
          }
        });
      }
    }
    
    if (violations > 0) {
      console.log(`\n❌ Found ${violations} critical violations in staged files`);
      console.log(`\n💡 Fix violations before committing:`);
      console.log(`   npm run guardrails fix --dry-run  # Preview fixes`);
      console.log(`   npm run guardrails fix            # Apply fixes`);
      console.log(`\n   Or bypass hook (NOT recommended): git commit --no-verify\n`);
      
      return false;
    }
    
    console.log('✅ All pre-commit checks passed!\n');
    return true;
    
  } catch (error: any) {
    console.error('❌ Error running pre-commit hook:', error.message);
    return false;
  }
}

async function main() {
  const passed = await runPreCommit();
  process.exit(passed ? 0 : 1);
}

if (require.main === module) {
  main();
}

