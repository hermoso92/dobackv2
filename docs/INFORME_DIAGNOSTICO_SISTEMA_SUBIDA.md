# 🔍 INFORME DIAGNÓSTICO - SISTEMA DE SUBIDA

**Fecha:** 2025-10-12  
**Objetivo:** Analizar desde 0 el sistema de subida, identificar problemas y crear plan de corrección

---

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. RUTAS DUPLICADAS Y CONFUSAS

**PROBLEMA:**
- Existen **dos directorios** `CMadrid` diferentes:
  - `backend/data/CMadrid/` - 4 vehículos (doback024, 026, 027, 028)
  - `backend/data/datosDoback/CMadrid/` - 5 vehículos (doback023, 024, 026, 027, 028)

**IMPACTO:**
- El código en `backend/src/routes/upload.ts:957` usa `datosDoback/CMadrid`
- El usuario menciona archivos en `backend/data/CMadrid`
- Esto causa confusión sobre qué archivos se procesan realmente

**SOLUCIÓN:**
```typescript
// Opción 1: Consolidar en una sola ruta
const cmadridPath = path.join(__dirname, '../../data/CMadrid');

// Opción 2: Hacer configurable
const cmadridPath = process.env.CMADRID_PATH || path.join(__dirname, '../../data/CMadrid');
```

**DECISIÓN REQUERIDA:** ¿Cuál es la ruta correcta a usar?

---

### 2. FOREIGN KEY ERRORS (0 SESIONES CREADAS)

**PROBLEMA:**
```
Foreign key constraint violated on the (not available)
0 sesiones creadas
```

**ANÁLISIS:**
- ✅ Usuario SYSTEM existe (ID: `00000000-0000-0000-0000-000000000001`)
- ✅ Organization SYSTEM existe (ID: `00000000-0000-0000-0000-000000000002`)
- ✅ ForeignKeyValidator valida correctamente
- ❌ Los vehículos NO existen en BD (se crearán automáticamente)

**POSIBLES CAUSAS:**
1. ❌ `getOrCreateVehicle()` está fallando silenciosamente
2. ❌ Otro foreign key no validado (parkId, zoneId?)
3. ❌ Error en la secuencia de guardado

**SOLUCIÓN:**
1. Verificar que `getOrCreateVehicle` funciona correctamente
2. Asegurar que `parkId` y `zoneId` sean NULL o válidos
3. Mejorar logging para identificar exactamente qué foreign key falla

---

### 3. LOGS REPETITIVOS E INÚTILES

**PROBLEMA:**
Los logs actuales son:
- 90% repetidos (mismo mensaje miles de veces)
- Sin información útil sobre qué está fallando
- No muestran progreso claro

**EJEMPLO DEL PROBLEMA:**
```
info: Dashboard stats with filters: {\"clave\":[],\"roadType\":[],\"severity\":[],\"timestamp\":\"03:06:15\",\"vehicles\":[]}
info: Dashboard stats with filters: {\"clave\":[],\"roadType\":[],\"severity\":[],\"timestamp\":\"03:06:15\",\"vehicles\":[]}
info: Dashboard stats with filters: {\"clave\":[],\"roadType\":[],\"severity\":[],\"timestamp\":\"03:06:15\",\"vehicles\":[]}
// ... 1000 veces más ...
```

**SOLUCIÓN:**
```typescript
// ❌ INCORRECTO: Log en cada request
logger.info('Dashboard stats with filters:', filters);

// ✅ CORRECTO: Log solo eventos importantes
logger.debug('Dashboard stats requested'); // Solo en modo debug
logger.info('Processing 93 files...'); // Evento importante
logger.error('Error saving session:', error); // Error crítico
```

**REGLAS DE LOGGING:**
- `logger.debug()`: Detalles técnicos (solo en desarrollo)
- `logger.info()`: Eventos importantes del flujo (inicio/fin procesamiento, sesiones creadas)
- `logger.warn()`: Situaciones anormales pero manejables (GPS faltante, vehículo no existe)
- `logger.error()`: Errores críticos que impiden continuar

---

### 4. CONFIGURACIÓN DE SUBIDA NO IMPLEMENTADA

**PROBLEMA:**
El código tiene un TODO:
```typescript
// TODO: Aplicar configuración a UnifiedFileProcessorV2
```

**IMPACTO:**
- La configuración del frontend NO se aplica
- No se respetan los filtros de vehículos, fechas, archivos obligatorios
- GPS obligatorio no se fuerza

**SOLUCIÓN:**
Ya implementado parcialmente en `UnifiedFileProcessorV2.ts` líneas 79-131, pero necesita testing.

---

## ✅ ASPECTOS CORRECTOS

### 1. Foreign Keys Base
- ✅ Usuario SYSTEM existe correctamente
- ✅ Organización SYSTEM existe correctamente
- ✅ `ForeignKeyValidator` implementado correctamente

### 2. Archivos y Estructura
- ✅ Archivos existen y son accesibles
- ✅ Convención de nombres es correcta (`TIPO_DOBACK0XX_YYYYMMDD.txt`)
- ✅ Agrupación por fecha funciona

### 3. Reglas de Correlación
- ✅ Documento `SessionCorrelationRules.ts` bien definido
- ✅ Umbral de 300s es correcto
- ✅ Criterios de validación claros

### 4. Parsers Robustos
- ✅ `RobustGPSParser`, `RobustStabilityParser`, `RobustRotativoParser` implementados
- ✅ Manejo de errores en parsers
- ✅ Interpolación de GPS

---

## 📊 DATOS DISPONIBLES

### backend/data/CMadrid/
```
doback024: 9 EST, 10 GPS, 9 ROT (9 grupos completos)
doback026: 3 EST, 2 GPS, 1 ROT (0 grupos completos)
doback027: 10 EST, 10 GPS, 10 ROT (10 grupos completos)
doback028: 9 EST, 10 GPS, 9 ROT (9 grupos completos)

TOTAL: 28 grupos completos procesables
```

### backend/data/datosDoback/CMadrid/ (la que se usa actualmente)
```
doback023: 2 EST, 2 GPS, 2 ROT (2 grupos)
doback024: ~9 archivos por tipo
doback026: ~4 archivos por tipo
doback027: ~13 archivos por tipo
doback028: ~9 archivos por tipo

TOTAL: ~110 archivos, cantidad exacta de grupos por verificar
```

---

## 🎯 PLAN DE CORRECCIÓN

### PASO 1: Aclarar Ruta de Archivos
- [ ] Decidir qué ruta usar: `/CMadrid` vs `/datosDoback/CMadrid`
- [ ] Actualizar código para usar ruta correcta
- [ ] Documentar en `docs/SISTEMA_SUBIDA_ESTRUCTURADO.md`

### PASO 2: Corregir Foreign Keys
- [ ] Añadir logging detallado en `getOrCreateVehicle()`
- [ ] Verificar que `parkId` y `zoneId` sean NULL
- [ ] Testear creación de vehículo manualmente

### PASO 3: Limpiar Logs
- [ ] Reducir logs de dashboard (actualmente inunda consola)
- [ ] Añadir logs útiles en procesamiento:
  - Vehículo X: procesando
  - Fecha Y: Z sesiones detectadas
  - Sesión creada/omitida con razón clara
- [ ] Usar `logger.debug()` para detalles técnicos

### PASO 4: Implementar Configuración
- [ ] Verificar que filtros se aplican correctamente
- [ ] Testear GPS obligatorio
- [ ] Testear duración mínima

### PASO 5: Probar con 1 Archivo
- [ ] Limpiar BD completamente
- [ ] Procesar solo DOBACK024 - 30/09/2025
- [ ] Verificar que se crean sesiones correctamente
- [ ] Comparar con análisis real (`Analisis_Sesiones_CMadrid_real.md`)

### PASO 6: Procesamiento Masivo
- [ ] Una vez funcione 1 archivo, procesar todos
- [ ] Generar reporte detallado
- [ ] Verificar que coincide con análisis real

---

## 🔬 TESTS NECESARIOS

### Test 1: Crear Vehículo
```typescript
const vehicleId = await ForeignKeyValidator.getOrCreateVehicle(
  'doback024',
  SYSTEM_ORG_ID
);
console.log('Vehicle ID:', vehicleId);
```
**Resultado esperado:** UUID del vehículo creado

### Test 2: Guardar Sesión Mínima
```typescript
const session = await prisma.session.create({
  data: {
    vehicleId,
    userId: SYSTEM_USER_ID,
    organizationId: SYSTEM_ORG_ID,
    startTime: new Date(),
    endTime: new Date(),
    sessionNumber: 1,
    sequence: 1,
    source: 'TEST'
  }
});
console.log('Session ID:', session.id);
```
**Resultado esperado:** Sesión creada sin error

### Test 3: Procesar 1 Grupo
```typescript
// Procesar solo ESTABILIDAD_DOBACK024_20250930.txt
// + GPS_DOBACK024_20250930.txt
// + ROTATIVO_DOBACK024_20250930.txt
```
**Resultado esperado según análisis real:**
```
Sesión 1: 09:33:37 - 10:38:25 (1h 4m 48s) ✅
Sesión 2: 12:41:43 - 14:05:48 (1h 24m 5s) ⚠️ sin GPS
```

---

## 📚 REFERENCIAS

- **Reglas estructuradas:** `docs/SISTEMA_SUBIDA_ESTRUCTURADO.md`
- **Análisis real:** `resumendoback/Analisis_Sesiones_CMadrid_real.md`
- **Código principal:** `backend/src/routes/upload.ts`
- **Procesador:** `backend/src/services/upload/UnifiedFileProcessorV2.ts`
- **Validadores:** `backend/src/services/upload/validators/`
- **Parsers:** `backend/src/services/parsers/Robust*Parser.ts`

---

## 🎬 PRÓXIMOS PASOS INMEDIATOS

1. **¿Cuál es la ruta correcta?** `CMadrid` o `datosDoback/CMadrid`
2. **Testear creación de vehículo** (Test 1)
3. **Testear creación de sesión** (Test 2)
4. **Procesar 1 grupo** (Test 3)
5. **Corregir según resultados**
6. **Procesar todos los archivos**

---

**ESTADO ACTUAL:** ⚠️ SISTEMA NO FUNCIONAL
- Foreign keys fallan
- 0 sesiones creadas
- Logs inútiles
- Confusión de rutas

**OBJETIVO:** ✅ SISTEMA ROBUSTO
- Reglas claras
- Procesamiento automático exitoso
- Reportes detallados
- Sin errores

---

**Última actualización:** 2025-10-12  
**Autor:** Cursor AI  
**Siguiente acción:** Decisión sobre ruta de archivos

