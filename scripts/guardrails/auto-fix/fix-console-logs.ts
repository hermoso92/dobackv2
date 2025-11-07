/**
 * 🔧 AUTO-FIX: Console.log → Logger
 * 
 * Reemplaza automáticamente console.log/error/warn por logger
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Fix {
  file: string;
  changes: number;
  linesFixed: number[];
}

async function fixConsoleLogs(dryRun: boolean = false): Promise<Fix[]> {
  const fixes: Fix[] = [];
  
  console.log(`🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing console.* calls...\n`);
  
  const files = await glob('{backend,frontend}/src/**/*.{ts,tsx}', {
    ignore: [
      '**/*.test.*',
      '**/__tests__/**',
      '**/logger.ts',
      '**/setupProxy.js',
      '**/i18n*.ts',
      '**/scripts/**'
    ]
  });
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    let modified = false;
    let hasLoggerImport = content.includes("from '@/utils/logger'") || 
                         content.includes('from "../utils/logger"') ||
                         content.includes('from "../../utils/logger"');
    
    const linesFixed: number[] = [];
    
    const newLines = lines.map((line, index) => {
      // Skip comments
      if (line.trim().startsWith('//') || line.includes('// GUARDRAILS:SAFE')) {
        return line;
      }
      
      // Detect console.*
      const match = line.match(/console\.(log|error|warn|info|debug)/);
      
      if (match) {
        const method = match[1];
        modified = true;
        linesFixed.push(index + 1);
        
        // Map console method to logger method
        const loggerMethod = method === 'log' ? 'info' : method;
        
        // Replace console.* with logger.*
        return line.replace(/console\.(log|error|warn|info|debug)/, `logger.${loggerMethod}`);
      }
      
      return line;
    });
    
    if (modified) {
      // Add import if not present
      if (!hasLoggerImport) {
        // Find import section (after initial comments)
        let importInsertIndex = 0;
        
        for (let i = 0; i < newLines.length; i++) {
          const trimmed = newLines[i].trim();
          
          // Skip initial comments
          if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
            continue;
          }
          
          // Find last import
          if (trimmed.startsWith('import ')) {
            importInsertIndex = i + 1;
          } else if (importInsertIndex > 0) {
            break;
          }
        }
        
        // Insert logger import
        const isBackend = file.includes('backend');
        const loggerImport = isBackend 
          ? "import { logger } from '../utils/logger';"
          : "import { logger } from '@/utils/logger';";
        
        newLines.splice(importInsertIndex, 0, loggerImport);
      }
      
      if (!dryRun) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
      }
      
      fixes.push({
        file: path.relative(process.cwd(), file),
        changes: linesFixed.length,
        linesFixed
      });
      
      console.log(`${dryRun ? '  [Would fix]' : '  ✅ Fixed'} ${path.relative(process.cwd(), file)}: ${linesFixed.length} changes`);
    }
  }
  
  return fixes;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  const fixes = await fixConsoleLogs(dryRun);
  
  if (fixes.length === 0) {
    console.log('\n✅ No console.* calls to fix!\n');
    process.exit(0);
  }
  
  const totalChanges = fixes.reduce((sum, f) => sum + f.changes, 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files modified: ${fixes.length}`);
  console.log(`   Total changes: ${totalChanges}`);
  
  if (dryRun) {
    console.log(`\n💡 Run without --dry-run to apply fixes\n`);
  } else {
    // Save report
    const reportPath = path.join(__dirname, '../reports/console-logs-fixes.json');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, JSON.stringify({
      timestamp: new Date().toISOString(),
      filesModified: fixes.length,
      totalChanges,
      fixes
    }, null, 2));
    
    console.log(`\n📄 Report saved to: ${reportPath}`);
    console.log(`\n✅ Fixes applied successfully!\n`);
  }
}

if (require.main === module) {
  main().catch(console.error);
}

export { fixConsoleLogs };

