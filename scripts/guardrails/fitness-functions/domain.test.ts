/**
 * 🔄 FITNESS FUNCTIONS: FLUJO & DOMINIO
 * 
 * Protege reglas de negocio y flujos críticos de DobackSoft
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';

describe('🔄 Domain & Business Rules Guardrails', () => {
  
  /**
   * HIGH: Solo roles ADMIN y MANAGER permitidos
   */
  describe('Role System Validation', () => {
    
    const OFFICIAL_ROLES = ['ADMIN', 'MANAGER'];
    
    test('Only ADMIN and MANAGER roles allowed', async () => {
      const violations: Array<{file: string, role: string}> = [];
      const files = await glob('backend/src/**/*.ts');
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Detectar definiciones de roles no oficiales
        const roleMatches = content.match(/role\s*[:=]\s*['"](\w+)['"]/gi);
        
        if (roleMatches) {
          roleMatches.forEach(match => {
            const role = match.match(/['"](\w+)['"]/)?.[1];
            
            if (role && 
                !OFFICIAL_ROLES.includes(role.toUpperCase()) &&
                !['USER', 'GUEST'].includes(role.toUpperCase())) { // Roles legacy permitidos temporalmente
              violations.push({
                file: path.relative(process.cwd(), file),
                role
              });
            }
          });
        }
      }
      
      if (violations.length > 0) {
        const report = violations.map(v => 
          `\n  ❌ ${v.file}: "${v.role}"`
        ).join('\n');
        
        fail(`🟠 HIGH: Unofficial roles detected:\n${report}\n\nOfficial roles: ${OFFICIAL_ROLES.join(', ')}`);
      }
    });
    
    test('Prisma schema only defines ADMIN and MANAGER roles', async () => {
      const schemaPath = 'backend/prisma/schema.prisma';
      
      if (!fs.existsSync(schemaPath)) {
        return;
      }
      
      const content = fs.readFileSync(schemaPath, 'utf-8');
      
      // Buscar enum Role
      const roleEnumMatch = content.match(/enum\s+Role\s*\{([^}]+)\}/);
      
      if (roleEnumMatch) {
        const roles = roleEnumMatch[1]
          .split('\n')
          .map(line => line.trim())
          .filter(line => line && !line.startsWith('//'))
          .map(line => line.split(/\s+/)[0]);
        
        const unofficialRoles = roles.filter(role => 
          !OFFICIAL_ROLES.includes(role) && role !== 'USER' // USER permitido temporalmente
        );
        
        if (unofficialRoles.length > 0) {
          fail(`🟠 HIGH: Unofficial roles in Prisma schema: ${unofficialRoles.join(', ')}\n\nRemove and migrate to ADMIN/MANAGER only.`);
        }
      }
    });
  });
  
  /**
   * MEDIUM: PDF 1-clic disponible desde módulos clave
   */
  describe('PDF Export Flow', () => {
    
    const MODULES_WITH_PDF = [
      'dashboard',
      'estabilidad',
      'ia',
      'reportes'
    ];
    
    test('Key modules must have PDF export button', async () => {
      const missing: string[] = [];
      
      for (const module of MODULES_WITH_PDF) {
        const moduleFiles = await glob(`frontend/src/{pages,components}/**/*${module}*.{ts,tsx}`, {
          nocase: true
        });
        
        let hasPdfExport = false;
        
        for (const file of moduleFiles) {
          const content = fs.readFileSync(file, 'utf-8');
          
          if (content.match(/pdf|export.*pdf|generate.*pdf/i)) {
            hasPdfExport = true;
            break;
          }
        }
        
        if (!hasPdfExport) {
          missing.push(module);
        }
      }
      
      if (missing.length > 0) {
        console.warn(`🟡 MEDIUM: Modules missing PDF export:\n  ${missing.join('\n  ')}\n\nAdd PDF 1-click export button.`);
      }
    });
  });
  
  /**
   * MEDIUM: Comparadores solo entre sesiones del mismo tipo
   */
  describe('Session Comparison Rules', () => {
    
    test('Comparators must validate session type consistency', async () => {
      const comparatorFiles = await glob('backend/src/{controllers,services}/**/*compar*.ts', {
        nocase: true
      });
      
      const violations: string[] = [];
      
      for (const file of comparatorFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Verificar que haya validación de tipo de sesión
        const hasTypeValidation = content.includes('sessionType') || 
                                  content.includes('type ===') ||
                                  content.includes('validateSessionType');
        
        if (!hasTypeValidation && !content.includes('// GUARDRAILS:SAFE')) {
          violations.push(path.relative(process.cwd(), file));
        }
      }
      
      if (violations.length > 0) {
        console.warn(`🟡 MEDIUM: Comparators missing session type validation:\n  ${violations.join('\n  ')}\n\nEnsure comparisons only happen between same session types.`);
      }
    });
  });
  
  /**
   * LOW: Flujo Subida → Procesamiento → Visualización → Exportación
   */
  describe('Core Processing Flow', () => {
    
    test('Upload service must trigger processing', async () => {
      const uploadFiles = await glob('backend/src/{controllers,services}/**/*upload*.ts', {
        nocase: true
      });
      
      const missing: string[] = [];
      
      for (const file of uploadFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Verificar que llame a procesamiento después de upload
        const callsProcessing = content.includes('process') || 
                               content.includes('parse') ||
                               content.includes('analyze');
        
        if (!callsProcessing && !file.includes('Controller')) {
          missing.push(path.relative(process.cwd(), file));
        }
      }
      
      if (missing.length > 0) {
        console.info(`ℹ️ INFO: Upload services that may not trigger processing:\n  ${missing.join('\n  ')}`);
      }
    });
  });
  
  /**
   * MEDIUM: Validación de datos de estabilidad
   */
  describe('Stability Data Validation', () => {
    
    test('Stability data must validate date ranges', async () => {
      const MIN_DATE = new Date('2025-09-01'); // Fecha mínima según auditoría
      
      const files = await glob('backend/src/{controllers,services}/**/*{stability,estabilidad}*.ts', {
        nocase: true
      });
      
      const violations: string[] = [];
      
      for (const file of files) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Verificar que haya validación de fecha
        const hasDateValidation = content.includes('2025-09-01') || 
                                  content.includes('MIN_DATE') ||
                                  content.includes('// GUARDRAILS:SAFE');
        
        if (!hasDateValidation && content.includes('findMany')) {
          violations.push(path.relative(process.cwd(), file));
        }
      }
      
      if (violations.length > 0) {
        console.warn(`🟡 MEDIUM: Stability queries missing date validation (>= 2025-09-01):\n  ${violations.join('\n  ')}`);
      }
    });
    
    test('GPS data must validate coordinates for Spain', async () => {
      const gpsFiles = await glob('backend/src/**/*gps*.ts', {
        nocase: true
      });
      
      const missing: string[] = [];
      
      for (const file of gpsFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Verificar que valide coordenadas de España (36-44°N, -10 a 5°E)
        const hasCoordValidation = content.match(/lat.*36.*44|lng.*-10.*5/) ||
                                   content.includes('isValidSpainCoordinates') ||
                                   content.includes('// GUARDRAILS:SAFE');
        
        if (!hasCoordValidation && content.includes('latitude')) {
          missing.push(path.relative(process.cwd(), file));
        }
      }
      
      if (missing.length > 0) {
        console.info(`ℹ️ INFO: GPS parsers missing Spain coordinate validation:\n  ${missing.join('\n  ')}\n\nValidate: lat 36-44°N, lng -10 to 5°E`);
      }
    });
    
    test('Speed data must filter unrealistic values', async () => {
      const speedFiles = await glob('backend/src/**/*{speed,velocidad}*.ts', {
        nocase: true
      });
      
      const missing: string[] = [];
      
      for (const file of speedFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Verificar que filtre velocidades >200 km/h
        const hasSpeedFilter = content.includes('200') || 
                              content.includes('MAX_SPEED') ||
                              content.includes('// GUARDRAILS:SAFE');
        
        if (!hasSpeedFilter && content.includes('speed')) {
          missing.push(path.relative(process.cwd(), file));
        }
      }
      
      if (missing.length > 0) {
        console.info(`ℹ️ INFO: Speed parsers missing max speed filter (>200 km/h):\n  ${missing.join('\n  ')}`);
      }
    });
  });
  
  /**
   * LOW: Geocercas válidas
   */
  describe('Geofence Validation', () => {
    
    test('Only valid fire stations should exist', async () => {
      const VALID_PARKS = ['Rozas', 'Alcobendas'];
      
      const geofenceFiles = await glob('backend/src/**/*{geofence,geocerca,park}*.ts', {
        nocase: true
      });
      
      for (const file of geofenceFiles) {
        const content = fs.readFileSync(file, 'utf-8');
        
        // Detectar nombres de parques inválidos (heurística)
        const invalidParks = ['Pinto', 'Getafe', 'Valdemoro', 'Majadahonda'];
        
        invalidParks.forEach(park => {
          if (content.includes(park)) {
            console.warn(`⚠️ Found reference to invalid park "${park}" in ${file}`);
          }
        });
      }
    });
  });
  
  /**
   * INFO: Estructura de módulos
   */
  describe('Module Structure Validation', () => {
    
    test('Each module should have expected structure', async () => {
      const MODULES = [
        'dashboard',
        'estabilidad',
        'telemetria',
        'ia',
        'operaciones',
        'reportes'
      ];
      
      const EXPECTED_PARTS = ['Controller', 'Service', 'Route'];
      
      const incomplete: Array<{module: string, missing: string[]}> = [];
      
      for (const module of MODULES) {
        const missing: string[] = [];
        
        for (const part of EXPECTED_PARTS) {
          const pattern = `backend/src/**/*${module}*${part}*.ts`;
          const files = await glob(pattern, { nocase: true });
          
          if (files.length === 0) {
            missing.push(part);
          }
        }
        
        if (missing.length > 0) {
          incomplete.push({ module, missing });
        }
      }
      
      if (incomplete.length > 0) {
        const report = incomplete.map(m => 
          `\n  📦 ${m.module}: missing ${m.missing.join(', ')}`
        ).join('\n');
        
        console.info(`ℹ️ INFO: Modules with incomplete structure:\n${report}`);
      }
    });
  });
});

