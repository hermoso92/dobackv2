/**
 * ⚡ FITNESS FUNCTIONS: PERFORMANCE & TAMAÑO
 * 
 * Protege métricas de performance en DobackSoft
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('⚡ Performance & Size Guardrails', () => {
  
  /**
   * MEDIUM: Componentes <300 líneas
   */
  describe('Component Size Limits', () => {
    
    const MAX_COMPONENT_LINES = 300;
    
    test('React components must be under 300 lines', async () => {
      const violations: Array<{file: string, lines: number}> = [];
      const componentFiles = await glob('frontend/src/components/**/*.{ts,tsx}');
      
      for (const file of componentFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        // Contar solo líneas no vacías y no comentarios
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
            lines: codeLines.length
          });
        }
      }
      
      if (violations.length > 0) {
        const report = violations.map(v => 
          `\n  ⚠️ ${v.file} (${v.lines} lines)`
        ).join('\n');
        
        fail(`🟡 MEDIUM: ${violations.length} components exceed ${MAX_COMPONENT_LINES} lines:\n${report}\n\nRecommendation: Split into smaller components`);
      }
    });
    
    test('Pages must be under 400 lines', async () => {
      const violations: Array<{file: string, lines: number}> = [];
      const MAX_PAGE_LINES = 400;
      
      const pageFiles = await glob('frontend/src/pages/**/*.{ts,tsx}');
      
      for (const file of pageFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        const codeLines = content.split('\n').filter(line => {
          const trimmed = line.trim();
          return trimmed.length > 0 && 
                 !trimmed.startsWith('//') && 
                 !trimmed.startsWith('/*');
        });
        
        if (codeLines.length > MAX_PAGE_LINES) {
          violations.push({
            file: path.relative(process.cwd(), file),
            lines: codeLines.length
          });
        }
      }
      
      if (violations.length > 0) {
        const report = violations.map(v => 
          `\n  ⚠️ ${v.file} (${v.lines} lines)`
        ).join('\n');
        
        console.warn(`🟢 LOW: ${violations.length} pages exceed ${MAX_PAGE_LINES} lines:\n${report}`);
      }
    });
  });
  
  /**
   * MEDIUM: Bundle size <300 KB (check via package.json dependencies)
   */
  describe('Bundle Size Optimization', () => {
    
    test('No unnecessarily large dependencies', async () => {
      const packageJsonPath = 'frontend/package.json';
      
      if (!fs.existsSync(packageJsonPath)) {
        return;
      }
      
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      // Librerías conocidas que son muy pesadas
      const heavyLibraries = [
        { name: 'moment', alternative: 'date-fns or dayjs' },
        { name: 'lodash', alternative: 'lodash-es (tree-shakeable)' },
        { name: '@material-ui/core', alternative: '@mui/material (v5+)' },
      ];
      
      const violations: string[] = [];
      
      heavyLibraries.forEach(lib => {
        if (dependencies[lib.name]) {
          violations.push(`${lib.name} → Use ${lib.alternative}`);
        }
      });
      
      if (violations.length > 0) {
        console.warn(`🟢 LOW: Heavy dependencies detected:\n  ${violations.join('\n  ')}\n\nConsider lighter alternatives for better bundle size.`);
      }
    });
  });
  
  /**
   * LOW: Lazy loading para componentes pesados
   */
  describe('Code Splitting & Lazy Loading', () => {
    
    test('Pages should use React.lazy for routes', async () => {
      const routeFiles = await glob('frontend/src/{routes,App}.{ts,tsx}');
      const recommendations: string[] = [];
      
      for (const file of routeFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Detectar imports de páginas sin lazy loading
        const hasDirectImports = content.match(/import\s+\w+\s+from\s+['"].*\/pages\//g);
        const hasLazyImports = content.includes('React.lazy');
        
        if (hasDirectImports && !hasLazyImports) {
          recommendations.push(file);
        }
      }
      
      if (recommendations.length > 0) {
        console.info(`ℹ️ INFO: Consider lazy loading in:\n  ${recommendations.join('\n  ')}\n\nExample: const Dashboard = React.lazy(() => import('./pages/Dashboard'));`);
      }
    });
  });
  
  /**
   * LOW: No queries N+1
   */
  describe('Database Query Optimization', () => {
    
    test('Detect potential N+1 queries in loops', async () => {
      const violations: Array<{file: string, line: number}> = [];
      const files = await glob('backend/src/{controllers,services}/**/*.ts');
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        let inLoop = false;
        
        lines.forEach((line, index) => {
          // Detectar inicio de loop
          if (line.match(/\.(forEach|map)\(/)) {
            inLoop = true;
          }
          
          // Detectar query dentro del loop
          if (inLoop && line.match(/await\s+prisma\./)) {
            violations.push({ file, line: index + 1 });
          }
          
          // Fin del loop (heurística simple)
          if (line.includes('});')) {
            inLoop = false;
          }
        });
      }
      
      if (violations.length > 0) {
        const report = violations.slice(0, 5).map(v => 
          `\n  ⚠️ ${v.file}:${v.line}`
        ).join('\n');
        
        console.warn(`🟢 LOW: Potential N+1 queries detected:\n${report}\n\nConsider using include/select or batch queries.`);
      }
    });
  });
  
  /**
   * LOW: Imágenes optimizadas
   */
  describe('Asset Optimization', () => {
    
    test('Images in public/ should be optimized', async () => {
      const imageFiles = await glob('frontend/public/**/*.{jpg,jpeg,png}');
      const largeImages: Array<{file: string, size: number}> = [];
      
      const MAX_IMAGE_SIZE = 500 * 1024; // 500 KB
      
      for (const file of imageFiles) {
        const stats = fs.statSync(file);
        
        if (stats.size > MAX_IMAGE_SIZE) {
          largeImages.push({
            file: path.relative(process.cwd(), file),
            size: Math.round(stats.size / 1024)
          });
        }
      }
      
      if (largeImages.length > 0) {
        const report = largeImages.map(img => 
          `\n  📦 ${img.file} (${img.size} KB)`
        ).join('\n');
        
        console.warn(`🟢 LOW: Large images detected:\n${report}\n\nConsider optimizing with tools like imagemin or converting to WebP.`);
      }
    });
  });
  
  /**
   * INFO: Métricas de complejidad ciclomática
   */
  describe('Code Complexity Metrics', () => {
    
    test('Functions should have reasonable complexity', async () => {
      const complexFunctions: Array<{file: string, function: string, complexity: number}> = [];
      const MAX_COMPLEXITY = 15;
      
      const files = await glob('{backend,frontend}/src/**/*.{ts,tsx}');
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Heurística simple: contar if/else/for/while/switch/&&/||
        const functionMatches = content.match(/(?:function|const)\s+(\w+)\s*[=\(][^{]*\{([^}]*)\}/gs);
        
        if (functionMatches) {
          functionMatches.forEach(match => {
            const funcName = match.match(/(?:function|const)\s+(\w+)/)?.[1] || 'anonymous';
            
            // Contar estructuras de control
            const complexity = (match.match(/\bif\b/g)?.length || 0) +
                             (match.match(/\belse\b/g)?.length || 0) +
                             (match.match(/\bfor\b/g)?.length || 0) +
                             (match.match(/\bwhile\b/g)?.length || 0) +
                             (match.match(/\bswitch\b/g)?.length || 0) +
                             (match.match(/&&/g)?.length || 0) +
                             (match.match(/\|\|/g)?.length || 0);
            
            if (complexity > MAX_COMPLEXITY) {
              complexFunctions.push({
                file: path.relative(process.cwd(), file),
                function: funcName,
                complexity
              });
            }
          });
        }
      }
      
      if (complexFunctions.length > 0) {
        const report = complexFunctions.slice(0, 5).map(f => 
          `\n  🔀 ${f.file}::${f.function} (complexity: ${f.complexity})`
        ).join('\n');
        
        console.info(`ℹ️ INFO: High complexity functions:\n${report}\n\nConsider refactoring into smaller functions.`);
      }
    });
  });
});

