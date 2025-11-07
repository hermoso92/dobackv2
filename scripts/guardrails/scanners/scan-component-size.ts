/**
 * 🔍 SCANNER: Component Size Detector
 * 
 * Detecta componentes React que exceden el límite de 300 líneas
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  lines: number;
  codeLines: number;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

const MAX_COMPONENT_LINES = 300;
const MAX_PAGE_LINES = 400;

async function scanComponentSize(): Promise<Violation[]> {
  const violations: Violation[] = [];
  
  console.log('🔍 Scanning component sizes...\n');
  
  // Escanear componentes
  const componentFiles = await glob('frontend/src/components/**/*.{ts,tsx}');
  
  for (const file of componentFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    // Contar líneas de código (no vacías, no comentarios)
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*') &&
             !trimmed.startsWith('*');
    });
    
    if (codeLines.length > MAX_COMPONENT_LINES) {
      violations.push({
        file: path.relative(process.cwd(), file),
        lines: lines.length,
        codeLines: codeLines.length,
        severity: 'medium'
      });
    }
  }
  
  // Escanear páginas
  const pageFiles = await glob('frontend/src/pages/**/*.{ts,tsx}');
  
  for (const file of pageFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    const codeLines = lines.filter(line => {
      const trimmed = line.trim();
      return trimmed.length > 0 && 
             !trimmed.startsWith('//') && 
             !trimmed.startsWith('/*');
    });
    
    if (codeLines.length > MAX_PAGE_LINES) {
      violations.push({
        file: path.relative(process.cwd(), file),
        lines: lines.length,
        codeLines: codeLines.length,
        severity: 'low'
      });
    }
  }
  
  return violations;
}

async function main() {
  const violations = await scanComponentSize();
  
  if (violations.length === 0) {
    console.log('✅ All components are within size limits!\n');
    process.exit(0);
  }
  
  console.log(`⚠️ Found ${violations.length} oversized components:\n`);
  
  // Ordenar por tamaño (mayor a menor)
  violations.sort((a, b) => b.codeLines - a.codeLines);
  
  violations.forEach(v => {
    const limit = v.file.includes('pages/') ? MAX_PAGE_LINES : MAX_COMPONENT_LINES;
    const excess = v.codeLines - limit;
    
    console.log(`📄 ${v.file}`);
    console.log(`   ${v.codeLines} lines (${excess} over limit of ${limit})`);
    console.log();
  });
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '../reports/component-size-violations.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    limits: {
      components: MAX_COMPONENT_LINES,
      pages: MAX_PAGE_LINES
    },
    totalViolations: violations.length,
    violations
  }, null, 2));
  
  console.log(`📊 Full report saved to: ${reportPath}`);
  console.log(`\n💡 Fix: Split large components into smaller ones`);
  console.log(`   - Extract logical sections into sub-components`);
  console.log(`   - Use composition over large monolithic components`);
  
  // No fallar, solo warning
  process.exit(0);
}

if (require.main === module) {
  main().catch(console.error);
}

export { scanComponentSize };

