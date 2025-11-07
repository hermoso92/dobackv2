/**
 * 🔍 SCANNER: Console.log Detector
 * 
 * Detecta usos de console.log/error/warn en lugar del logger centralizado
 */

const fs = require('fs');
const path = require('path');
const { glob } = require('glob');

interface Violation {
  file: string;
  line: number;
  column: number;
  code: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

async function scanConsoleLogs(): Promise<Violation[]> {
  const violations: Violation[] = [];
  
  console.log('🔍 Scanning for console.* calls...\n');
  
  // Escanear backend
  const backendFiles = await glob('backend/src/**/*.ts', {
    ignore: ['**/*.test.ts', '**/__tests__/**', '**/logger.ts', '**/scripts/**']
  });
  
  for (const file of backendFiles) {
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
          column: line.indexOf('console'),
          code: line.trim(),
          severity: 'critical'
        });
      }
    });
  }
  
  // Escanear frontend
  const frontendFiles = await glob('frontend/src/**/*.{ts,tsx}', {
    ignore: [
      '**/*.test.*', 
      '**/logger.ts', 
      '**/setupProxy.js',
      '**/i18n*.ts',
      '**/diagnosticar-*.js'
    ]
  });
  
  for (const file of frontendFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      const match = line.match(/console\.(log|error|warn)/);
      
      if (match && 
          !line.trim().startsWith('//') && 
          !line.includes('// GUARDRAILS:SAFE')) {
        
        violations.push({
          file: path.relative(process.cwd(), file),
          line: index + 1,
          column: line.indexOf('console'),
          code: line.trim(),
          severity: 'critical'
        });
      }
    });
  }
  
  return violations;
}

async function main() {
  const violations = await scanConsoleLogs();
  
  if (violations.length === 0) {
    console.log('✅ No console.* violations found!\n');
    process.exit(0);
  }
  
  console.log(`❌ Found ${violations.length} console.* violations:\n`);
  
  // Agrupar por archivo
  const byFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, Violation[]>);
  
  Object.entries(byFile).forEach(([file, fileViolations]) => {
    console.log(`\n📄 ${file} (${fileViolations.length} violations):`);
    
    fileViolations.forEach(v => {
      console.log(`  Line ${v.line}: ${v.code}`);
    });
  });
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '../reports/console-logs-violations.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalViolations: violations.length,
    violations: byFile
  }, null, 2));
  
  console.log(`\n📊 Full report saved to: ${reportPath}`);
  console.log(`\n💡 Fix: Replace console.* with logger from utils/logger.ts`);
  console.log(`   Example: import { logger } from '@/utils/logger';`);
  console.log(`            logger.info('message', { context });`);
  
  process.exit(1);
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { scanConsoleLogs };

