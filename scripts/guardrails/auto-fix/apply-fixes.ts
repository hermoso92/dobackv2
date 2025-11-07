/**
 * 🔧 AUTO-FIX ORCHESTRATOR
 * 
 * Ejecuta todos los auto-fixes en orden seguro
 */

import { fixConsoleLogs } from './fix-console-logs';
import { fixHardcodedUrls } from './fix-hardcoded-urls';

interface FixResult {
  name: string;
  filesModified: number;
  changesApplied: number;
  success: boolean;
}

async function applyAllFixes(dryRun: boolean = false): Promise<FixResult[]> {
  const results: FixResult[] = [];
  
  console.log('🛡️  DOBACKSOFT AUTO-FIX ENGINE\n');
  console.log(dryRun ? '⚠️  DRY RUN MODE - No changes will be applied\n' : '');
  console.log('================================================\n');
  
  // 1. Fix console.logs
  console.log('1️⃣  Fixing console.* calls...\n');
  try {
    const consoleFixes = await fixConsoleLogs(dryRun);
    const totalChanges = consoleFixes.reduce((sum, f) => sum + f.changes, 0);
    
    results.push({
      name: 'Console Logs',
      filesModified: consoleFixes.length,
      changesApplied: totalChanges,
      success: true
    });
    
    console.log(`   ✅ ${consoleFixes.length} files, ${totalChanges} changes\n`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
    results.push({
      name: 'Console Logs',
      filesModified: 0,
      changesApplied: 0,
      success: false
    });
  }
  
  // 2. Fix hardcoded URLs
  console.log('2️⃣  Fixing hardcoded URLs...\n');
  try {
    const urlFixes = await fixHardcodedUrls(dryRun);
    const totalChanges = urlFixes.reduce((sum, f) => sum + f.changes, 0);
    
    results.push({
      name: 'Hardcoded URLs',
      filesModified: urlFixes.length,
      changesApplied: totalChanges,
      success: true
    });
    
    console.log(`   ✅ ${urlFixes.length} files, ${totalChanges} changes\n`);
  } catch (error: any) {
    console.error(`   ❌ Error: ${error.message}\n`);
    results.push({
      name: 'Hardcoded URLs',
      filesModified: 0,
      changesApplied: 0,
      success: false
    });
  }
  
  return results;
}

function printSummary(results: FixResult[], dryRun: boolean) {
  console.log('\n================================================');
  console.log('📊 SUMMARY\n');
  
  const totalFiles = results.reduce((sum, r) => sum + r.filesModified, 0);
  const totalChanges = results.reduce((sum, r) => sum + r.changesApplied, 0);
  const successful = results.filter(r => r.success).length;
  
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`${status} ${r.name}: ${r.filesModified} files, ${r.changesApplied} changes`);
  });
  
  console.log(`\nTotal: ${totalFiles} files modified, ${totalChanges} changes applied`);
  console.log(`Success: ${successful}/${results.length} fixers\n`);
  
  if (dryRun) {
    console.log('⚠️  This was a DRY RUN - no changes were applied');
    console.log('💡 Run without --dry-run to apply fixes\n');
  } else {
    console.log('✅ All fixes applied successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Review changes with git diff');
    console.log('   2. Run tests to verify');
    console.log('   3. Commit changes\n');
  }
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  const startTime = Date.now();
  const results = await applyAllFixes(dryRun);
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  
  printSummary(results, dryRun);
  
  console.log(`⏱️  Completed in ${duration}s\n`);
  
  const allSuccess = results.every(r => r.success);
  process.exit(allSuccess ? 0 : 1);
}

if (require.main === module) {
  main().catch(console.error);
}

export { applyAllFixes };

