#!/usr/bin/env node
/**
 * 🛡️ GUARDRAILS MAIN SCRIPT
 * 
 * Punto de entrada principal del sistema de guardrails
 */

const { runAllScans } = require('./scanners/scan-all');
const { applyAllFixes } = require('./auto-fix/apply-fixes');

async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'scan';
  
  console.log('🛡️  DOBACKSOFT GUARDRAILS SYSTEM\n');
  console.log('================================================\n');
  
  switch (command) {
    case 'scan':
      console.log('📊 Running full scan...\n');
      await runAllScans();
      break;
      
    case 'fix':
      const dryRun = args.includes('--dry-run');
      console.log(`🔧 Running auto-fix${dryRun ? ' (dry run)' : ''}...\n`);
      await applyAllFixes(dryRun);
      break;
      
    case 'scan-and-fix':
      console.log('🔍 Step 1: Scanning for violations...\n');
      await runAllScans();
      
      console.log('\n🔧 Step 2: Applying auto-fixes...\n');
      await applyAllFixes(false);
      
      console.log('\n🔍 Step 3: Re-scanning to verify...\n');
      await runAllScans();
      break;
      
    case 'help':
    default:
      printHelp();
      break;
  }
}

function printHelp() {
  console.log(`
USAGE:
  npm run guardrails [command] [options]

COMMANDS:
  scan              Run all guardrails scanners (default)
  fix               Apply auto-fixes
  scan-and-fix      Scan → Fix → Re-scan
  help              Show this help

OPTIONS:
  --dry-run         Preview changes without applying (for 'fix' command)

EXAMPLES:
  # Run full scan
  npm run guardrails scan

  # Apply fixes (dry run first to preview)
  npm run guardrails fix --dry-run
  npm run guardrails fix

  # Full cycle: scan, fix, and verify
  npm run guardrails scan-and-fix

INDIVIDUAL SCANNERS:
  npm run guardrails:console-logs
  npm run guardrails:hardcoded-urls
  npm run guardrails:organization-id
  npm run guardrails:component-size

INDIVIDUAL FIXES:
  npm run guardrails:fix-console-logs
  npm run guardrails:fix-hardcoded-urls

For more info, see: scripts/guardrails/README.md
`);
}

if (require.main === module) {
  main().catch((error) => {
    console.error('\n❌ Fatal error:', error.message);
    process.exit(1);
  });
}

