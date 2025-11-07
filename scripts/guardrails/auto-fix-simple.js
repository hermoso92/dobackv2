#!/usr/bin/env node
/**
 * 🔧 SIMPLE AUTO-FIX: Corrige violaciones automáticamente
 * Script JS puro sin dependencias complejas
 */

const fs = require('fs');
const path = require('path');

function findFiles(dir, extensions, ignore = []) {
  let results = [];
  
  if (!fs.existsSync(dir)) return results;
  
  const list = fs.readdirSync(dir);
  
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (ignore.some(i => filePath.includes(i))) return;
    
    if (stat && stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions, ignore));
    } else {
      const ext = path.extname(file);
      if (extensions.includes(ext)) {
        results.push(filePath);
      }
    }
  });
  
  return results;
}

function fixConsoleLogs(dryRun = false) {
  console.log(`🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing console.* calls...\n`);
  
  const fixes = [];
  const ignore = [
    'node_modules', 'dist', 'build', '.test.', '__tests__', 
    'logger.ts', 'setupProxy', 'backend\\src\\scripts', 'backend/src/scripts',
    'i18n', 'diagnosticar', 'test-login', 'createTestEvent', 'test\\setup', 'test/setup'
  ];
  
  const backendFiles = findFiles('backend/src', ['.ts', '.js'], ignore);
  const frontendFiles = findFiles('frontend/src', ['.ts', '.tsx', '.js', '.jsx'], ignore);
  
  [...backendFiles, ...frontendFiles].forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    let modified = false;
    let hasLoggerImport = content.includes("from '@/utils/logger'") || 
                         content.includes("from '../utils/logger'") ||
                         content.includes("from '../../utils/logger'") ||
                         content.includes("require('./utils/logger')") ||
                         content.includes("require('../utils/logger')");
    
    const linesFixed = [];
    
    const newLines = lines.map((line, index) => {
      if (line.trim().startsWith('//') || line.includes('// GUARDRAILS:SAFE')) {
        return line;
      }
      
      const match = line.match(/console\.(log|error|warn|info|debug)/);
      
      if (match) {
        const method = match[1];
        modified = true;
        linesFixed.push(index + 1);
        
        const loggerMethod = method === 'log' ? 'info' : method;
        return line.replace(/console\.(log|error|warn|info|debug)/, `logger.${loggerMethod}`);
      }
      
      return line;
    });
    
    if (modified) {
      // Add import if not present
      if (!hasLoggerImport) {
        let importInsertIndex = 0;
        
        for (let i = 0; i < newLines.length; i++) {
          const trimmed = newLines[i].trim();
          
          if (trimmed.startsWith('/*') || trimmed.startsWith('*') || trimmed.startsWith('//')) {
            continue;
          }
          
          if (trimmed.startsWith('import ') || trimmed.startsWith('const ') && trimmed.includes('require(')) {
            importInsertIndex = i + 1;
          } else if (importInsertIndex > 0) {
            break;
          }
        }
        
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
  });
  
  return fixes;
}

function fixHardcodedUrls(dryRun = false) {
  console.log(`\n🔧 ${dryRun ? '[DRY RUN]' : ''} Fixing hardcoded URLs...\n`);
  
  const fixes = [];
  const ignore = [
    'node_modules', 'dist', 'build', 'config/api.ts', 'config\\api.ts',
    'config/constants.ts', 'config\\constants.ts', 'config/env.ts', 'config\\env.ts',
    '.test.', 'setupProxy'
  ];
  
  const frontendFiles = findFiles('frontend/src', ['.ts', '.tsx', '.js', '.jsx'], ignore);
  
  frontendFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    let modified = false;
    let hasApiConfigImport = content.includes("from '@/config/api'") ||
                            content.includes("from './config/api'") ||
                            content.includes("from '../config/api'");
    
    const urlsFixed = [];
    
    const newLines = lines.map(line => {
      if (line.trim().startsWith('//') || line.includes('// GUARDRAILS:SAFE')) {
        return line;
      }
      
      const localhostMatch = line.match(/(['"`])(https?:\/\/localhost:9998[^'"`]*)(['"`])/);
      
      if (localhostMatch) {
        modified = true;
        const fullUrl = localhostMatch[2];
        const endpoint = fullUrl.replace('http://localhost:9998', '');
        
        urlsFixed.push(fullUrl);
        
        return line.replace(
          localhostMatch[0],
          `\`\${API_CONFIG.BASE_URL}${endpoint}\``
        );
      }
      
      return line;
    });
    
    if (modified) {
      if (!hasApiConfigImport) {
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
  });
  
  return fixes;
}

function main() {
  const dryRun = process.argv.includes('--dry-run');
  
  console.log('🛡️  DOBACKSOFT AUTO-FIX ENGINE\n');
  console.log(dryRun ? '⚠️  DRY RUN MODE - No changes will be applied\n' : '');
  console.log('================================================\n');
  
  const consoleLogFixes = fixConsoleLogs(dryRun);
  const urlFixes = fixHardcodedUrls(dryRun);
  
  const totalFiles = consoleLogFixes.length + urlFixes.length;
  const totalChanges = consoleLogFixes.reduce((sum, f) => sum + f.changes, 0) +
                      urlFixes.reduce((sum, f) => sum + f.changes, 0);
  
  console.log('\n================================================');
  console.log('📊 SUMMARY\n');
  
  console.log(`✅ Console Logs: ${consoleLogFixes.length} files, ${consoleLogFixes.reduce((sum, f) => sum + f.changes, 0)} changes`);
  console.log(`✅ Hardcoded URLs: ${urlFixes.length} files, ${urlFixes.reduce((sum, f) => sum + f.changes, 0)} changes`);
  
  console.log(`\nTotal: ${totalFiles} files modified, ${totalChanges} changes ${dryRun ? 'would be ' : ''}applied`);
  
  if (dryRun) {
    console.log('\n⚠️  This was a DRY RUN - no changes were applied');
    console.log('💡 Run without --dry-run to apply fixes\n');
  } else {
    console.log('\n✅ All fixes applied successfully!\n');
    console.log('💡 Next steps:');
    console.log('   1. Review changes with: git diff');
    console.log('   2. Run scan again: npm run guardrails:scan');
    console.log('   3. Commit changes\n');
  }
  
  process.exit(0);
}

if (require.main === module) {
  main();
}

module.exports = { fixConsoleLogs, fixHardcodedUrls };

