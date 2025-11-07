/**
 * 🏗️ FITNESS FUNCTIONS: ARQUITECTURA & MODULARIDAD
 * 
 * Protege la estructura y modularidad de DobackSoft
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('🏗️ Architecture & Modularity Guardrails', () => {
  
  /**
   * CRITICAL: No console.log en producción - usar logger
   */
  describe('Centralized Logging', () => {
    
    test('No console.log/error/warn in backend src', async () => {
      const violations: Array<{file: string, line: number, code: string}> = [];
      const files = await glob('backend/src/**/*.ts');
      
      for (const file of files) {
        // Excluir archivos de configuración de logger y tests
        if (file.includes('logger.ts') || 
            file.includes('.test.ts') || 
            file.includes('__tests__')) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Detectar console.log, console.error, console.warn
          const consoleMatch = line.match(/console\.(log|error|warn|debug|info)/);
          
          if (consoleMatch && 
              !line.includes('//') && // No comentado
              !line.includes('// GUARDRAILS:SAFE')) {
            violations.push({
              file: file,
              line: index + 1,
              code: line.trim()
            });
          }
        });
      }
      
      if (violations.length > 0) {
        const report = violations.slice(0, 10).map(v => 
          `\n  ❌ ${v.file}:${v.line}\n     ${v.code}`
        ).join('\n');
        
        const more = violations.length > 10 ? `\n  ... and ${violations.length - 10} more` : '';
        
        fail(`🔴 CRITICAL: Found ${violations.length} console.* calls in backend:\n${report}${more}\n\nFix: Use logger from utils/logger.ts instead`);
      }
    });
    
    test('No console.log in frontend src (except setup files)', async () => {
      const violations: Array<{file: string, line: number}> = [];
      const files = await glob('frontend/src/**/*.{ts,tsx}');
      
      for (const file of files) {
        // Excluir archivos de setup y tests
        if (file.includes('logger.ts') || 
            file.includes('.test.') || 
            file.includes('setupProxy') ||
            file.includes('i18n')) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          if (line.match(/console\.(log|error|warn)/) && 
              !line.includes('//') &&
              !line.includes('// GUARDRAILS:SAFE')) {
            violations.push({ file, line: index + 1 });
          }
        });
      }
      
      if (violations.length > 0) {
        const report = violations.slice(0, 10).map(v => 
          `\n  ❌ ${v.file}:${v.line}`
        ).join('\n');
        
        fail(`🔴 CRITICAL: Found ${violations.length} console.* in frontend:\n${report}\n\nFix: Use logger from utils/logger.ts`);
      }
    });
  });
  
  /**
   * HIGH: No URLs hardcodeadas - usar config/api.ts
   */
  describe('Centralized API Configuration', () => {
    
    test('No hardcoded localhost URLs in frontend', async () => {
      const violations: Array<{file: string, line: number, url: string}> = [];
      const files = await glob('frontend/src/**/*.{ts,tsx}');
      
      for (const file of files) {
        // Excluir config/api.ts y archivos de test
        if (file.includes('config/api.ts') || 
            file.includes('.test.') ||
            file.includes('setupProxy')) {
          continue;
        }
        
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          // Detectar URLs hardcodeadas
          const urlMatch = line.match(/(http:\/\/localhost:\d+|https?:\/\/[^'"]+)/);
          
          if (urlMatch && 
              !line.includes('//') &&
              !line.includes('// GUARDRAILS:SAFE')) {
            violations.push({
              file,
              line: index + 1,
              url: urlMatch[0]
            });
          }
        });
      }
      
      if (violations.length > 0) {
        const report = violations.slice(0, 5).map(v => 
          `\n  ❌ ${v.file}:${v.line}\n     URL: ${v.url}`
        ).join('\n');
        
        fail(`🟠 HIGH: Found ${violations.length} hardcoded URLs:\n${report}\n\nFix: Use API_CONFIG from config/api.ts`);
      }
    });
    
    test('API config must use environment variables', async () => {
      const apiConfigFile = 'frontend/src/config/api.ts';
      
      if (!fs.existsSync(apiConfigFile)) {
        fail(`🔴 CRITICAL: Missing ${apiConfigFile}`);
      }
      
      const content = fs.readFileSync(apiConfigFile, 'utf-8');
      
      // Debe usar process.env para la URL base
      if (!content.includes('process.env.REACT_APP_API_BASE_URL')) {
        fail(`🟠 HIGH: ${apiConfigFile} must use process.env.REACT_APP_API_BASE_URL`);
      }
    });
  });
  
  /**
   * HIGH: Puertos fijos (9998 backend, 5174 frontend)
   */
  describe('Fixed Ports', () => {
    
    test('Backend must use port 9998', async () => {
      const serverFiles = await glob('backend/src/{server,config/server,index}.ts');
      const violations: string[] = [];
      
      for (const file of serverFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Buscar definición de puerto diferente a 9998
        const portMatch = content.match(/PORT\s*[:=]\s*(\d+)/);
        
        if (portMatch && portMatch[1] !== '9998' && !content.includes('process.env.PORT')) {
          violations.push(`${file}: Found hardcoded port ${portMatch[1]} instead of 9998`);
        }
      }
      
      if (violations.length > 0) {
        fail(`🟠 HIGH: Backend port violations:\n  ${violations.join('\n  ')}`);
      }
    });
    
    test('Frontend must use port 5174 in Vite config', async () => {
      const viteConfig = 'frontend/vite.config.ts';
      
      if (fs.existsSync(viteConfig)) {
        const content = fs.readFileSync(viteConfig, 'utf-8');
        
        // Verificar que el puerto sea 5174
        if (content.includes('port:') && !content.includes('port: 5174')) {
          fail(`🟠 HIGH: Frontend must use port 5174 in ${viteConfig}`);
        }
      }
    });
  });
  
  /**
   * MEDIUM: Módulos fijos del menú
   */
  describe('Fixed Menu Modules', () => {
    
    const OFFICIAL_MODULES = [
      'dashboard',      // Panel de Control
      'estabilidad',    // Estabilidad
      'telemetria',     // Telemetría
      'ia',             // Inteligencia Artificial
      'geofences',      // Geofences
      'operaciones',    // Operaciones (Eventos + Alertas + Mantenimiento)
      'reportes',       // Reportes
      'administracion', // Administración (solo ADMIN)
      'conocimiento',   // Base de Conocimiento (solo ADMIN)
      'perfil',         // Mi Cuenta
    ];
    
    test('Only official modules allowed in menu', async () => {
      const menuFiles = await glob('frontend/src/{components,layouts}/**/*{menu,sidebar,nav}*.{ts,tsx}', {
        nocase: true
      });
      
      const violations: string[] = [];
      
      for (const file of menuFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Detectar rutas no oficiales (aproximación simple)
        const routeMatches = content.match(/to=['"]\/([a-z-]+)['"]/gi) || [];
        
        routeMatches.forEach(match => {
          const route = match.match(/\/([a-z-]+)/)?.[1];
          
          if (route && 
              !OFFICIAL_MODULES.includes(route) && 
              !['login', 'logout', 'auth'].includes(route)) {
            violations.push(`${file}: Unofficial module route "${route}"`);
          }
        });
      }
      
      if (violations.length > 0) {
        fail(`🟡 MEDIUM: Unofficial modules detected:\n  ${violations.join('\n  ')}\n\nOfficial modules: ${OFFICIAL_MODULES.join(', ')}`);
      }
    });
  });
  
  /**
   * MEDIUM: Estructura de carpetas (docs/, scripts/, temp/)
   */
  describe('Folder Organization', () => {
    
    test('No .md files in root except README.md', async () => {
      const mdFiles = await glob('*.md');
      const violations = mdFiles.filter(f => f !== 'README.md');
      
      if (violations.length > 0) {
        fail(`🟡 MEDIUM: Markdown files in root (move to docs/):\n  ${violations.join('\n  ')}`);
      }
    });
    
    test('Scripts must be in scripts/ directory', async () => {
      const rootFiles = fs.readdirSync('.');
      const scriptViolations = rootFiles.filter(f => 
        (f.endsWith('.ps1') || f.endsWith('.sh') || f.endsWith('.bat')) &&
        !['iniciar.ps1', 'iniciar.sh'].includes(f) // Excepciones permitidas
      );
      
      if (scriptViolations.length > 0) {
        fail(`🟡 MEDIUM: Scripts in root (move to scripts/):\n  ${scriptViolations.join('\n  ')}`);
      }
    });
  });
  
  /**
   * LOW: Import optimization (tree-shaking)
   */
  describe('Import Optimization', () => {
    
    test('No wildcard imports from large libraries', async () => {
      const violations: Array<{file: string, line: number}> = [];
      const files = await glob('frontend/src/**/*.{ts,tsx}');
      
      const largeLibraries = ['lodash', '@mui/material', '@mui/icons-material'];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        const lines = content.split('\n');
        
        lines.forEach((line, index) => {
          largeLibraries.forEach(lib => {
            // Detectar: import * as X from 'lodash'
            if (line.includes(`import * as`) && line.includes(`from '${lib}'`)) {
              violations.push({ file, line: index + 1 });
            }
          });
        });
      }
      
      if (violations.length > 0) {
        const report = violations.slice(0, 5).map(v => 
          `\n  ⚠️ ${v.file}:${v.line}`
        ).join('\n');
        
        console.warn(`🟢 LOW: Found ${violations.length} wildcard imports from large libraries:\n${report}\n\nRecommendation: Use named imports for better tree-shaking`);
      }
    });
  });
});

