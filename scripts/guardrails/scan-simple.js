#!/usr/bin/env node
/**
 * 🔍 SIMPLE SCANNER: Detecta violaciones críticas
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
    
    // Skip ignored directories
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

function scanConsoleLogs() {
  console.log('🔍 Scanning for console.* calls...\n');
  
  const violations = [];
  const ignore = [
    'node_modules', 
    'dist', 
    'build', 
    '.test.', 
    '__tests__', 
    'logger.ts', 
    'setupProxy',
    'backend\\src\\scripts',
    'backend/src/scripts',
    'frontend\\src\\scripts',
    'frontend/src/scripts',
    'frontend\\src\\test',
    'frontend/src/test',
    'test-login',
    'i18n',
    'diagnosticar'
  ];
  
  // Scan backend
  const backendFiles = findFiles('backend/src', ['.ts', '.js'], ignore);
  const frontendFiles = findFiles('frontend/src', ['.ts', '.tsx', '.js', '.jsx'], ignore);
  
  [...backendFiles, ...frontendFiles].forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/console\.(log|error|warn|debug|info)/);
      
      if (match && 
          !line.trim().startsWith('//') && 
          !line.includes('// GUARDRAILS:SAFE')) {
        
        violations.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          code: line.trim()
        });
      }
    });
  });
  
  return violations;
}

function scanHardcodedUrls() {
  console.log('🔍 Scanning for hardcoded URLs...\n');
  
  const violations = [];
  const ignore = [
    'node_modules', 
    'dist', 
    'build', 
    'config/api.ts',
    'config\\api.ts',
    'config\\constants.ts',
    'config/constants.ts',
    'config\\env.ts',
    'config/env.ts',
    'WebfleetReportGenerator',
    '.test.', 
    'setupProxy'
  ];
  
  const frontendFiles = findFiles('frontend/src', ['.ts', '.tsx', '.js', '.jsx'], ignore);
  
  frontendFiles.forEach(file => {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const urlMatch = line.match(/(['"`])(https?:\/\/localhost:\d+[^'"`]*)(['"`])/);
      
      if (urlMatch && 
          !line.trim().startsWith('//') && 
          !line.includes('// GUARDRAILS:SAFE')) {
        
        violations.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          url: urlMatch[2]
        });
      }
    });
  });
  
  return violations;
}

function main() {
  console.log('🛡️  DOBACKSOFT GUARDRAILS - QUICK SCAN\n');
  console.log('================================================\n');
  
  // 1. Console.log scan
  console.log('1️⃣  Scanning console.* calls...');
  const consoleViolations = scanConsoleLogs();
  console.log(`   ${consoleViolations.length === 0 ? '✅' : '❌'} Found ${consoleViolations.length} violations\n`);
  
  // 2. Hardcoded URLs scan
  console.log('2️⃣  Scanning hardcoded URLs...');
  const urlViolations = scanHardcodedUrls();
  console.log(`   ${urlViolations.length === 0 ? '✅' : '❌'} Found ${urlViolations.length} violations\n`);
  
  // Summary
  console.log('================================================');
  console.log('📊 SUMMARY\n');
  
  const totalViolations = consoleViolations.length + urlViolations.length;
  
  if (consoleViolations.length > 0) {
    console.log(`🔴 CRITICAL: Console.log violations: ${consoleViolations.length}`);
    
    // Group by file
    const byFile = {};
    consoleViolations.forEach(v => {
      if (!byFile[v.file]) byFile[v.file] = [];
      byFile[v.file].push(v);
    });
    
    Object.entries(byFile).slice(0, 10).forEach(([file, violations]) => {
      console.log(`   - ${file}: ${violations.length} violations`);
    });
    
    if (Object.keys(byFile).length > 10) {
      console.log(`   ... and ${Object.keys(byFile).length - 10} more files`);
    }
    console.log();
  }
  
  if (urlViolations.length > 0) {
    console.log(`🟠 HIGH: Hardcoded URLs: ${urlViolations.length}`);
    urlViolations.slice(0, 5).forEach(v => {
      console.log(`   - ${v.file}:${v.line}`);
    });
    if (urlViolations.length > 5) {
      console.log(`   ... and ${urlViolations.length - 5} more`);
    }
    console.log();
  }
  
  console.log(`Total violations: ${totalViolations}`);
  console.log(`Status: ${totalViolations === 0 ? '✅ PASSED' : '❌ FAILED'}\n`);
  
  // Save report
  const reportDir = path.join(__dirname, 'reports');
  if (!fs.existsSync(reportDir)) {
    fs.mkdirSync(reportDir, { recursive: true });
  }
  
  const report = {
    timestamp: new Date().toISOString(),
    totalViolations,
    consoleLogs: consoleViolations.length,
    hardcodedUrls: urlViolations.length,
    details: {
      consoleLogs: consoleViolations,
      hardcodedUrls: urlViolations
    }
  };
  
  fs.writeFileSync(
    path.join(reportDir, 'quick-scan.json'),
    JSON.stringify(report, null, 2)
  );
  
  console.log(`📄 Report saved to: scripts/guardrails/reports/quick-scan.json\n`);
  
  if (totalViolations > 0) {
    console.log('💡 Next steps:');
    console.log('   1. Review violations above');
    console.log('   2. Run auto-fix (when available)');
    console.log('   3. Fix remaining violations manually\n');
    process.exit(1);
  } else {
    console.log('🎉 All guardrails checks passed!\n');
    process.exit(0);
  }
}

if (require.main === module) {
  main();
}

module.exports = { scanConsoleLogs, scanHardcodedUrls };

