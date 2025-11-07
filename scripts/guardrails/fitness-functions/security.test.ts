/**
 * 🔒 FITNESS FUNCTIONS: SEGURIDAD & AISLAMIENTO
 * 
 * Protege invariantes críticos de seguridad en DobackSoft
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('🔒 Security & Isolation Guardrails', () => {
  
  /**
   * CRITICAL: organizationId debe estar en todas las queries de Prisma
   */
  describe('organizationId Filtering', () => {
    
    test('All Prisma queries must include organizationId filter', async () => {
      const violations: Array<{file: string, line: number, query: string}> = [];
      
      // Patrones de queries Prisma que DEBEN tener organizationId
      const prismaQueries = [
        'findMany',
        'findFirst',
        'findUnique',
        'count',
        'aggregate',
        'groupBy',
        'update',
        'updateMany',
        'delete',
        'deleteMany'
      ];
      
      // Archivos a analizar (controladores, servicios, repositorios)
      const files = await glob('backend/src/{controllers,services,repositories}/**/*.ts');
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          prismaQueries.forEach(query => {
            // Detectar query Prisma sin organizationId
            if (line.includes(`.${query}(`) && 
                !line.includes('//') && // No comentado
                !isExcludedQuery(line)) {
              
              // Verificar si hay organizationId en las próximas 5 líneas
              const contextLines = lines.slice(index, index + 5).join('\n');
              
              if (!contextLines.includes('organizationId') && 
                  !contextLines.includes('// GUARDRAILS:SAFE')) {
                violations.push({
                  file: file,
                  line: index + 1,
                  query: line.trim()
                });
              }
            }
          });
        });
      }
      
      if (violations.length > 0) {
        const report = violations.map(v => 
          `\n  ❌ ${v.file}:${v.line}\n     ${v.query}`
        ).join('\n');
        
        fail(`🔴 CRITICAL: Found ${violations.length} queries without organizationId filter:\n${report}\n\nFix: Add organizationId to where clause or add // GUARDRAILS:SAFE comment`);
      }
    });
    
    test('Auth middleware must be applied to protected routes', async () => {
      const violations: string[] = [];
      const routeFiles = await glob('backend/src/routes/**/*.ts');
      
      for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Detectar rutas sin authMiddleware
        if (content.includes('router.get') || 
            content.includes('router.post') ||
            content.includes('router.put') ||
            content.includes('router.delete')) {
          
          // Excepciones: rutas públicas
          const isPublicRoute = file.includes('auth.ts') || 
                                file.includes('health.ts');
          
          if (!isPublicRoute && !content.includes('authMiddleware')) {
            violations.push(file);
          }
        }
      }
      
      if (violations.length > 0) {
        fail(`🔴 CRITICAL: Routes without auth middleware:\n  ${violations.join('\n  ')}`);
      }
    });
  });
  
  /**
   * CRITICAL: No hardcoded secrets/keys
   */
  describe('Secrets & Keys Protection', () => {
    
    test('No hardcoded API keys or secrets', async () => {
      const violations: Array<{file: string, line: number}> = [];
      
      // Patrones sospechosos (excluir archivos de ejemplo)
      const suspiciousPatterns = [
        /apiKey\s*[:=]\s*['"](?!process\.env)[^'"]{20,}/i,
        /secret\s*[:=]\s*['"](?!process\.env)[^'"]{20,}/i,
        /password\s*[:=]\s*['"][^'"]+/i,
        /token\s*[:=]\s*['"](?!process\.env)[^'"]{30,}/i,
      ];
      
      const files = await glob('backend/src/**/*.ts');
      
      for (const file of files) {
        if (file.includes('.example') || file.includes('test')) continue;
        
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          suspiciousPatterns.forEach(pattern => {
            if (pattern.test(line) && !line.includes('// GUARDRAILS:SAFE')) {
              violations.push({ file, line: index + 1 });
            }
          });
        });
      }
      
      if (violations.length > 0) {
        fail(`🔴 CRITICAL: Potential hardcoded secrets detected:\n  ${violations.map(v => `${v.file}:${v.line}`).join('\n  ')}\n\nUse environment variables instead.`);
      }
    });
  });
  
  /**
   * HIGH: JWT debe estar en httpOnly cookies
   */
  describe('JWT Cookie Security', () => {
    
    test('JWT cookies must be httpOnly', async () => {
      const files = await glob('backend/src/{controllers,middleware}/**/*auth*.ts');
      const violations: string[] = [];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Detectar res.cookie sin httpOnly
        if (content.includes('res.cookie') && 
            content.includes('token')) {
          
          const lines = content.split('\n');
          let foundCookie = false;
          let foundHttpOnly = false;
          
          lines.forEach((line, idx) => {
            if (line.includes('res.cookie') && line.includes('token')) {
              foundCookie = true;
              // Buscar httpOnly en las próximas 3 líneas
              const context = lines.slice(idx, idx + 3).join('\n');
              if (context.includes('httpOnly: true')) {
                foundHttpOnly = true;
              }
            }
          });
          
          if (foundCookie && !foundHttpOnly) {
            violations.push(file);
          }
        }
      }
      
      if (violations.length > 0) {
        fail(`🟠 HIGH: JWT cookies without httpOnly flag:\n  ${violations.join('\n  ')}`);
      }
    });
  });
  
  /**
   * MEDIUM: CORS debe estar configurado correctamente
   */
  describe('CORS Configuration', () => {
    
    test('CORS must not allow wildcard origin in production', async () => {
      const corsFile = 'backend/src/middleware/cors.ts';
      
      if (fs.existsSync(corsFile)) {
        const content = fs.readFileSync(corsFile, 'utf-8');
        
        // Detectar origin: '*' sin condición de env
        const hasWildcard = content.includes("origin: '*'");
        const hasEnvCheck = content.includes('process.env.NODE_ENV');
        
        if (hasWildcard && !hasEnvCheck) {
          fail(`🟡 MEDIUM: CORS allows wildcard origin without env check in ${corsFile}`);
        }
      }
    });
  });
  
});

/**
 * Helper: Verificar si una query está excluida de la validación
 */
function isExcludedQuery(line: string): boolean {
  // Queries de sistema/admin que no requieren organizationId
  const excludedPatterns = [
    'user.findUnique',  // Buscar usuario por ID es seguro
    'organization.findUnique', // Buscar org por ID
    'session.findFirst', // Sesiones de autenticación
  ];
  
  return excludedPatterns.some(pattern => line.includes(pattern));
}

