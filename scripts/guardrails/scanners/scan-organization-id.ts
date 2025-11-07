/**
 * 🔍 SCANNER: OrganizationId Filter Detector
 * 
 * Detecta queries Prisma sin filtro organizationId
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

interface Violation {
  file: string;
  line: number;
  query: string;
  method: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
}

async function scanOrganizationId(): Promise<Violation[]> {
  const violations: Violation[] = [];
  
  console.log('🔍 Scanning for queries without organizationId filter...\n');
  
  const PRISMA_QUERIES = [
    'findMany',
    'findFirst',
    'count',
    'aggregate',
    'groupBy',
    'update',
    'updateMany',
    'delete',
    'deleteMany'
  ];
  
  const files = await glob('backend/src/{controllers,services,repositories}/**/*.ts', {
    ignore: ['**/*.test.ts', '**/__tests__/**']
  });
  
  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      PRISMA_QUERIES.forEach(method => {
        if (line.includes(`.${method}(`) && 
            !line.trim().startsWith('//')) {
          
          // Verificar contexto (próximas 10 líneas)
          const contextStart = index;
          const contextEnd = Math.min(index + 10, lines.length);
          const context = lines.slice(contextStart, contextEnd).join('\n');
          
          // Excepciones: queries que no necesitan organizationId
          const isException = 
            line.includes('user.findUnique') ||
            line.includes('organization.findUnique') ||
            line.includes('session.findFirst') ||
            context.includes('// GUARDRAILS:SAFE');
          
          if (!isException && 
              !context.includes('organizationId') &&
              !context.includes('where: {')) {
            
            violations.push({
              file: path.relative(process.cwd(), file),
              line: index + 1,
              query: line.trim(),
              method,
              severity: 'critical'
            });
          }
        }
      });
    });
  }
  
  return violations;
}

async function main() {
  const violations = await scanOrganizationId();
  
  if (violations.length === 0) {
    console.log('✅ All queries have proper organizationId filtering!\n');
    process.exit(0);
  }
  
  console.log(`❌ Found ${violations.length} queries without organizationId:\n`);
  
  const byFile = violations.reduce((acc, v) => {
    if (!acc[v.file]) acc[v.file] = [];
    acc[v.file].push(v);
    return acc;
  }, {} as Record<string, Violation[]>);
  
  Object.entries(byFile).forEach(([file, fileViolations]) => {
    console.log(`\n📄 ${file}:`);
    fileViolations.forEach(v => {
      console.log(`  Line ${v.line} [${v.method}]: ${v.query}`);
    });
  });
  
  // Guardar reporte
  const reportPath = path.join(__dirname, '../reports/organizationid-violations.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    timestamp: new Date().toISOString(),
    totalViolations: violations.length,
    violations: byFile
  }, null, 2));
  
  console.log(`\n📊 Full report saved to: ${reportPath}`);
  console.log(`\n💡 Fix: Add organizationId to where clause`);
  console.log(`   Example: await prisma.vehicle.findMany({`);
  console.log(`              where: { organizationId: user.organizationId }`);
  console.log(`            });`);
  
  process.exit(1);
}

if (require.main === module) {
  main().catch(console.error);
}

export { scanOrganizationId };

