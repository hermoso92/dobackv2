/**
 * 🔍 SCANNER: Hardcoded URLs Detector
 * 
 * Detecta URLs hardcodeadas en lugar de usar config/api.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  url: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

async function scanHardcodedUrls(): Promise<Violation[]> {
  const violations: Violation[] = [];
  
  console.log('🔍 Scanning for hardcoded URLs...\n');
  
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
    
    lines.forEach((line, index) => {
      // Detectar URLs hardcodeadas
      const urlPatterns = [
        /['"`](https?:\/\/localhost:\d+[^'"`]*)['"]/g,
        /['"`](https?:\/\/[a-z0-9.-]+:\d+[^'"`]*)['"]/g,
        /['"`](https?:\/\/(?!process\.env)[^'"`]+)['"]/g
      ];
      
      urlPatterns.forEach(pattern => {
        const matches = [...line.matchAll(pattern)];
        
        matches.forEach(match => {
          if (!line.trim().startsWith('//') && 
              !line.includes('// GUARDRAILS:SAFE') &&
              !match[1].includes('example.com') &&
              !match[1].includes('tomtom.com') &&
              !match[1].includes('googleapis.com')) {
            
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              url: match[1],
              severity: 'high'
            });
          }
        });
      });
    });
  }
  
  return violations;
}

async function main() {
  const violations = await scanHardcodedUrls();
  
  if (violations.length === 0) {
    console.log('✅ No hardcoded URLs found!\n');
    process.exit(0);
  }
  
  console.log(`❌ Found ${violations.length} hardcoded URLs:\n`);
  
  violations.forEach(v => {
    console.log(`📄 ${v.file}:${v.line}`);
    console.log(`   URL: ${v.url}`);
    console.log();
  });
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '../reports/hardcoded-urls-violations.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalViolations: violations.length,
    violations
  }, null, 2));
  
  console.log(`📊 Full report saved to: ${reportPath}`);
  console.log(`\n💡 Fix: Use API_CONFIG from config/api.ts`);
  console.log(`   Example: import { API_CONFIG } from '@/config/api';`);
  console.log(`            const url = \`\${API_CONFIG.BASE_URL}/api/...\`;`);
  
  process.exit(1);
}

if (require.main === module) {
  main().catch(console.error);
}

export { scanHardcodedUrls };

