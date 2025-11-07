/**
 * 🔧 AUTO-FIX: Hardcoded URLs → API Config
 * 
 * Reemplaza URLs hardcodeadas por referencias a config/api.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Fix {
  file: string;
  changes: number;
  urls: string[];
}

async function fixHardcodedUrls(dryRun: boolean = false): Promise<Fix[]> {
  const fixes: Fix[] = [];
  
  console.log(`🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing hardcoded URLs...\n`);
  
  const files = await glob('frontend/src/**/*.{ts,tsx}', {
    ignore: [
      '**/config/api.ts',
      '**/*.test.*',
      '**/setupProxy.js'
    ]
  });
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    let modified = false;
    let hasApiConfigImport = content.includes("from '@/config/api'");
    
    const urlsFixed: string[] = [];
    
    const newLines = lines.map((line) => {
      // Skip comments and safe URLs
      if (line.trim().startsWith('//') || 
          line.includes('// GUARDRAILS:SAFE') ||
          line.includes('tomtom.com') ||
          line.includes('googleapis.com')) {
        return line;
      }
      
      // Detect localhost URLs
      const localhostMatch = line.match(/(['"`])(https?:\/\/localhost:9998[^'"`]*)\1/);
      
      if (localhostMatch) {
        modified = true;
        const fullUrl = localhostMatch[2];
        const endpoint = fullUrl.replace('http://localhost:9998', '');
        
        urlsFixed.push(fullUrl);
        
        // Replace with API_CONFIG
        return line.replace(
          localhostMatch[0],
          `\`\${API_CONFIG.BASE_URL}${endpoint}\``
        );
      }
      
      return line;
    });
    
    if (modified) {
      // Add import if not present
      if (!hasApiConfigImport) {
        // Find import section
        let importInsertIndex = 0;
        
        for (let i = 0; i < newLines.length; i++) {
          const trimmed = newLines[i].trim();
          
          if (trimmed.startsWith('import ')) {
            importInsertIndex = i + 1;
          } else if (importInsertIndex > 0) {
            break;
          }
        }
        
        newLines.splice(importInsertIndex, 0, "import { API_CONFIG } from '@/config/api';");
      }
      
      if (!dryRun) {
        fs.writeFileSync(file, newLines.join('\n'), 'utf-8');
      }
      
      fixes.push({
        file: path.relative(process.cwd(), file),
        changes: urlsFixed.length,
        urls: urlsFixed
      });
      
      console.log(`${dryRun ? '  [Would fix]' : '  ✅ Fixed'} ${path.relative(process.cwd(), file)}: ${urlsFixed.length} URLs`);
    }
  }
  
  return fixes;
}

async function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  const fixes = await fixHardcodedUrls(dryRun);
  
  if (fixes.length === 0) {
    console.log('\n✅ No hardcoded URLs to fix!\n');
    process.exit(0);
  }
  
  const totalChanges = fixes.reduce((sum, f) => sum + f.changes, 0);
  
  console.log(`\n📊 Summary:`);
  console.log(`   Files modified: ${fixes.length}`);
  console.log(`   Total URLs fixed: ${totalChanges}`);
  
  if (dryRun) {
    console.log(`\n💡 Run without --dry-run to apply fixes\n`);
  } else {
    const reportPath = path.join(__dirname, '../reports/hardcoded-urls-fixes.json');
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

export { fixHardcodedUrls };

