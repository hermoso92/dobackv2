# 📋 PROTOCOLOS Y REGLAS - SISTEMA DE UPLOAD MASIVO

**Versión:** 1.0  
**Fecha:** 2025-10-11  
**Estado:** ACTIVO

---

## 🎯 OBJETIVO

Establecer protocolos estrictos y reglas inmutables para el sistema de subida masiva de archivos `/upload`, asegurando funcionamiento consistente y predecible en todo momento.

---

## 📐 ARQUITECTURA DEL SISTEMA

### **Componentes Principales**

```
┌─────────────────────────────────────────────────────────────┐
│                    SISTEMA DE UPLOAD                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Frontend (React + TypeScript)                              │
│  ├── pages/UploadPage.tsx (Router)                          │
│  └── components/FileUploadManager.tsx (UI + Lógica)         │
│                                                              │
│  Backend (Node.js + Express + Prisma)                       │
│  ├── routes/upload-unified.ts (Endpoint principal)          │
│  ├── services/UnifiedFileProcessor.ts (Procesamiento)       │
│  └── services/parsers/ (Parsers robustos)                   │
│      ├── MultiSessionDetector.ts                            │
│      ├── RobustGPSParser.ts                                 │
│      ├── RobustRotativoParser.ts                            │
│      └── RobustStabilityParser.ts                           │
│                                                              │
│  Base de Datos (PostgreSQL + Prisma)                        │
│  ├── Session (sesiones de vehículos)                        │
│  ├── Vehicle (vehículos de la organización)                 │
│  ├── GpsMeasurement (datos GPS)                             │
│  ├── StabilityMeasurement (datos estabilidad)               │
│  ├── RotativoMeasurement (estados rotativo)                 │
│  └── DataQualityMetrics (métricas de calidad)               │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔒 REGLAS INMUTABLES (NUNCA VIOLAR)

### **1. Autenticación y Organización**

```typescript
// ✅ SIEMPRE incluir middleware de autenticación
router.use(requireAuth, extractOrganizationId);

// ✅ SIEMPRE validar organizationId y userId
if (!organizationId || !userId) {
    return res.status(400).json({ error: 'Se requiere autenticación válida' });
}

// ❌ NUNCA procesar archivos sin organizationId
// ❌ NUNCA permitir acceso cross-organization
```

### **2. Formato de Archivos**

```typescript
// ✅ FORMATO OBLIGATORIO
const PATRON_NOMBRE = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK\d{3}_\d{8}\.txt$/i;

// Ejemplos válidos:
// - ESTABILIDAD_DOBACK001_20250101.txt
// - GPS_DOBACK002_20250105.txt
// - ROTATIVO_DOBACK001_20250101.txt
// - CAN_DOBACK003_20250107.txt

// ✅ EXTENSIÓN OBLIGATORIA: .txt
// ✅ CODIFICACIÓN OBLIGATORIA: UTF-8
// ❌ NUNCA aceptar otros formatos
```

### **3. Validación de Archivos**

```typescript
// ✅ VALIDACIONES OBLIGATORIAS (en orden)
1. Extensión del archivo (.txt)
2. Patrón del nombre (TIPO_DOBACK###_YYYYMMDD.txt)
3. Tamaño del archivo (< 100 MB)
4. Contenido UTF-8 válido
5. Cabecera correcta según tipo
6. Al menos 1 medición válida

// ❌ NUNCA procesar archivos que fallan cualquier validación
```

### **4. Agrupación de Archivos**

```typescript
// ✅ AGRUPACIÓN AUTOMÁTICA POR:
// - Vehículo (DOBACK###)
// - Fecha (YYYYMMDD)

// Ejemplo de grupo válido:
{
    vehiculo: 'DOBACK001',
    fecha: '20250101',
    archivos: {
        estabilidad: 'ESTABILIDAD_DOBACK001_20250101.txt',
        gps: 'GPS_DOBACK001_20250101.txt',
        rotativo: 'ROTATIVO_DOBACK001_20250101.txt'
    }
}

// ✅ Permitir grupos incompletos (ej: solo GPS + Estabilidad)
// ✅ Múltiples sesiones por grupo son válidas
```

### **5. Detección de Sesiones Múltiples**

```typescript
// ✅ CRITERIOS DE SEPARACIÓN DE SESIONES:

// Para ESTABILIDAD y GPS:
// - Salto de tiempo > 5 minutos entre mediciones consecutivas
// - Cambio en número de sesión explícito en archivo

// Para ROTATIVO:
// - Cambio de estado ON → OFF (finaliza sesión)
// - Salto de tiempo > 5 minutos

// ✅ SIEMPRE detectar sesiones múltiples antes de procesar
// ✅ Cada sesión se guarda independientemente en BD
```

### **6. Procesamiento de Vehículos**

```typescript
// ✅ SI el vehículo existe:
//    - Usar vehicleId existente
//    - Validar que pertenece a la organizationId

// ✅ SI el vehículo NO existe:
//    - Crear automáticamente con:
//      {
//          identifier: 'DOBACK###',
//          name: 'DOBACK###',
//          model: 'UNKNOWN',
//          licensePlate: 'PENDING',
//          organizationId: organizationId,
//          type: 'OTHER',
//          status: 'ACTIVE'
//      }

// ❌ NUNCA fallar por vehículo inexistente
// ❌ NUNCA crear vehículos en otra organización
```

### **7. Guardado en Base de Datos**

```typescript
// ✅ ORDEN OBLIGATORIO:

1. Crear/buscar vehículo
2. Crear sesión (con startTime y endTime)
3. Guardar mediciones GPS (en lotes de 1000)
4. Guardar mediciones Estabilidad (en lotes de 1000)
5. Guardar mediciones Rotativo (en lotes de 1000)
6. Guardar métricas de calidad

// ✅ SIEMPRE usar transacciones para operaciones atómicas
// ✅ SIEMPRE guardar en lotes para optimizar
// ❌ NUNCA fallar silenciosamente
```

### **8. Métricas de Calidad**

```typescript
// ✅ SIEMPRE registrar para cada sesión:

{
    gpsTotal: number,           // Total de puntos GPS en archivo
    gpsValidas: number,         // Puntos con coordenadas válidas
    gpsSinSenal: number,        // Puntos con "sin datos GPS"
    gpsInterpoladas: number,    // Puntos interpolados
    porcentajeGPSValido: number,// % de GPS válido
    estabilidadTotal: number,   // Total mediciones estabilidad
    estabilidadValidas: number, // Mediciones válidas
    rotativoTotal: number,      // Total estados rotativo
    rotativoValidas: number,    // Estados válidos
    problemas: string[]         // Problemas detectados
}

// ✅ Estas métricas se usan para auditoría y debugging
```

### **9. Respuestas HTTP**

```typescript
// ✅ ESTRUCTURA OBLIGATORIA DE RESPUESTA:

// Éxito completo (200):
{
    success: true,
    message: string,
    data: {
        sesionesCreadas: number,
        sessionIds: string[],
        archivosValidos: number,
        archivosConProblemas: number,
        estadisticas: {...},
        problemas: []
    }
}

// Éxito parcial (207 Multi-Status):
{
    success: true,
    message: string,
    data: { ... },
    warnings: string[]
}

// Error (400/500):
{
    success: false,
    error: string,
    message: string
}

// ❌ NUNCA devolver códigos HTTP inconsistentes
// ❌ NUNCA devolver HTML en lugar de JSON
```

### **10. Invalidación de Caché**

```typescript
// ✅ SIEMPRE invalidar cache de KPIs después de upload exitoso
if (resultado.sesionesCreadas > 0) {
    kpiCacheService.invalidate(organizationId);
    logger.info('Cache de KPIs invalidado', { organizationId });
}

// ❌ NUNCA dejar caché desactualizada
```

---

## 📊 FLUJO DE PROCESAMIENTO

### **Paso 1: Validación de Entrada**

```typescript
✅ Verificar autenticación (JWT válido)
✅ Verificar organizationId
✅ Verificar que hay archivos
✅ Validar nombre de cada archivo
✅ Validar tamaño de cada archivo
❌ Si falla → Detener y devolver error 400
```

### **Paso 2: Agrupación**

```typescript
✅ Extraer vehículo y fecha de cada archivo
✅ Agrupar por (vehículo, fecha)
✅ Leer contenido de cada archivo
✅ Convertir a Buffer UTF-8
```

### **Paso 3: Detección de Sesiones**

```typescript
Para cada grupo (vehículo + fecha):
    ✅ Detectar sesiones múltiples en ESTABILIDAD
    ✅ Detectar sesiones múltiples en GPS
    ✅ Detectar sesiones múltiples en ROTATIVO
    ✅ Tomar el máximo número de sesiones
```

### **Paso 4: Parseo de Datos**

```typescript
Para cada sesión detectada:
    ✅ Parsear GPS → puntos con coordenadas válidas
    ✅ Parsear Estabilidad → mediciones con timestamps interpolados
    ✅ Parsear Rotativo → estados con timestamps
    ✅ Interpolar GPS si hay gaps temporales
    ✅ Calcular startTime y endTime de la sesión
```

### **Paso 5: Guardado en BD**

```typescript
Para cada sesión:
    ✅ Buscar o crear vehículo
    ✅ Crear sesión en tabla Session
    ✅ Guardar GPS en tabla GpsMeasurement (lotes de 1000)
    ✅ Guardar Estabilidad en tabla StabilityMeasurement (lotes de 1000)
    ✅ Guardar Rotativo en tabla RotativoMeasurement (lotes de 1000)
    ✅ Guardar métricas en tabla DataQualityMetrics
```

### **Paso 6: Respuesta Final**

```typescript
✅ Recopilar estadísticas totales
✅ Invalidar cache de KPIs
✅ Devolver resultado con todas las métricas
✅ Logear éxito/errores
```

---

## 🚨 MANEJO DE ERRORES

### **Errores que Detienen Todo Procesamiento**

```typescript
❌ No hay archivos
❌ Autenticación inválida
❌ OrganizationId faltante
❌ Error crítico en BD (conexión perdida)
```

### **Errores que NO Detienen Procesamiento**

```typescript
⚠️ Un archivo tiene formato incorrecto → Se salta, se continúa
⚠️ Un grupo falla al procesar → Se salta, se continúa
⚠️ Una sesión tiene datos incompletos → Se guarda parcial, se continúa
⚠️ GPS sin señal → Se marca como "sin datos GPS", se continúa
```

### **Logging Obligatorio**

```typescript
// ✅ SIEMPRE logear (usando logger de utils/logger):

logger.info('Inicio de procesamiento', {
    archivos: number,
    organizationId: string
});

logger.warn('Problema no crítico', {
    tipo: string,
    descripcion: string
});

logger.error('Error crítico', {
    error: string,
    stack: string
});

// ❌ NUNCA usar console.log
```

---

## 🔧 CONFIGURACIÓN

### **Límites y Timeouts**

```typescript
const CONFIG = {
    // Multer
    MAX_FILE_SIZE: 100 * 1024 * 1024,  // 100 MB
    MAX_FILES_PER_UPLOAD: 20,          // 20 archivos máximo

    // Timeouts
    UPLOAD_TIMEOUT: 120000,            // 2 minutos
    PROCESSING_TIMEOUT: 300000,        // 5 minutos

    // Batch sizes
    GPS_BATCH_SIZE: 1000,              // Mediciones GPS por lote
    STABILITY_BATCH_SIZE: 1000,        // Mediciones estabilidad por lote
    ROTATIVO_BATCH_SIZE: 1000,         // Estados rotativo por lote

    // Sesiones
    SESSION_GAP_MINUTES: 5,            // Gap para detectar nueva sesión

    // GPS
    MIN_VALID_GPS_PERCENT: 10,         // % mínimo de GPS válido
};

// ❌ NUNCA cambiar estos valores sin documentar
```

---

## 📝 CHECKLIST DE VERIFICACIÓN

### **Antes de Modificar el Código**

- [ ] ¿He leído este documento completo?
- [ ] ¿Entiendo el flujo completo del sistema?
- [ ] ¿Mi cambio respeta todas las reglas inmutables?
- [ ] ¿He identificado qué módulos debo modificar?

### **Durante la Modificación**

- [ ] ¿Estoy modificando solo UN archivo por turno?
- [ ] ¿He leído el contexto cercano (imports, funciones relacionadas)?
- [ ] ¿He añadido logging apropiado?
- [ ] ¿He manejado errores correctamente?
- [ ] ¿He actualizado TypeScript types si es necesario?

### **Después de Modificar**

- [ ] ¿He probado manualmente la subida de archivos?
- [ ] ¿He verificado que las sesiones se crean correctamente?
- [ ] ¿He verificado que los datos se guardan en BD?
- [ ] ¿He verificado que el cache se invalida?
- [ ] ¿He documentado el cambio en CHANGELOG.md?

---

## 🧪 TESTING MANUAL

### **Casos de Prueba Obligatorios**

#### **Test 1: Upload Simple (1 archivo)**

```bash
Archivos: ESTABILIDAD_DOBACK001_20250101.txt
Resultado esperado:
✅ 200 OK
✅ 1+ sesiones creadas
✅ Vehículo creado si no existe
✅ Métricas de calidad guardadas
```

#### **Test 2: Upload Completo (3 archivos, mismo vehículo/fecha)**

```bash
Archivos:
- ESTABILIDAD_DOBACK001_20250101.txt
- GPS_DOBACK001_20250101.txt
- ROTATIVO_DOBACK001_20250101.txt

Resultado esperado:
✅ 200 OK
✅ Sesiones con GPS + Estabilidad + Rotativo correlacionados
✅ Número de sesiones = max(sesiones en cada archivo)
```

#### **Test 3: Upload Múltiple (varios vehículos)**

```bash
Archivos:
- ESTABILIDAD_DOBACK001_20250101.txt
- GPS_DOBACK001_20250101.txt
- ESTABILIDAD_DOBACK002_20250101.txt
- GPS_DOBACK002_20250101.txt

Resultado esperado:
✅ 200 OK
✅ 2 grupos procesados (DOBACK001 y DOBACK002)
✅ Sesiones separadas por vehículo
```

#### **Test 4: Upload con GPS sin señal**

```bash
Archivos: GPS con muchas líneas "sin datos GPS"

Resultado esperado:
✅ 200 o 207
✅ Sesión creada con GPS marcado como "sin señal"
✅ Métricas reflejan problemas GPS
✅ Sistema no falla
```

#### **Test 5: Upload con archivo incorrecto**

```bash
Archivos:
- archivo_invalido.txt
- ESTABILIDAD_DOBACK001_20250101.txt

Resultado esperado:
✅ 400 o 207
✅ Archivo válido procesado
✅ Archivo inválido reportado en errores
```

---

## 🔍 DEBUGGING

### **Problemas Comunes y Soluciones**

#### **Problema: "No se proporcionó archivo"**

```typescript
Causa: Frontend no envía archivos correctamente
Solución:
✅ Verificar FormData en frontend
✅ Verificar header 'Content-Type': 'multipart/form-data'
✅ Verificar que el campo se llama 'files' (plural)
```

#### **Problema: "Formato de archivo inválido"**

```typescript
Causa: Nombre de archivo no cumple patrón
Solución:
✅ Verificar regex en multer fileFilter
✅ Verificar que el archivo sigue TIPO_DOBACK###_YYYYMMDD.txt
```

#### **Problema: "No se crean sesiones"**

```typescript
Causa: Parsers no detectan datos válidos
Solución:
✅ Verificar logs de parsers
✅ Verificar contenido del archivo (UTF-8)
✅ Verificar cabecera del archivo
✅ Verificar que hay al menos 1 medición válida
```

#### **Problema: "OrganizationId undefined"**

```typescript
Causa: Middleware de auth no se aplica
Solución:
✅ Verificar que router.use(requireAuth, extractOrganizationId) está presente
✅ Verificar que el token JWT es válido
✅ Verificar que el usuario tiene organizationId en BD
```

---

## 📚 REFERENCIAS

### **Archivos Clave**

```
Frontend:
- frontend/src/pages/UploadPage.tsx
- frontend/src/components/FileUploadManager.tsx
- frontend/src/services/api.ts

Backend:
- backend/src/routes/upload-unified.ts
- backend/src/services/UnifiedFileProcessor.ts
- backend/src/services/parsers/MultiSessionDetector.ts
- backend/src/services/parsers/RobustGPSParser.ts
- backend/src/services/parsers/RobustStabilityParser.ts
- backend/src/services/parsers/RobustRotativoParser.ts
- backend/src/middleware/auth.ts

Base de Datos:
- backend/prisma/schema.prisma
```

### **Documentación Relacionada**

- `_LEEME_PRIMERO_SISTEMA_COMPLETO.md` - Visión general del sistema
- `GUIA_ARCHIVOS_BD_DOBACKSOFT.md` - Formato de archivos
- `FLUJO_COMPLETO_SISTEMA.md` - Flujo de datos
- `PROCESAMIENTO_AUTOMATICO_GUIA.md` - Procesamiento automático

---

## ⚠️ ADVERTENCIAS FINALES

### **❌ NUNCA HACER:**

1. Cambiar el patrón de nombres de archivo sin actualizar TODA la documentación
2. Modificar la estructura de respuesta HTTP sin actualizar frontend
3. Cambiar la lógica de agrupación sin actualizar parsers
4. Eliminar validaciones "por simplicidad"
5. Hardcodear organizationId o userId
6. Usar console.log en lugar de logger
7. Ignorar errores de BD
8. Procesar archivos sin autenticación
9. Cambiar los límites de tamaño sin justificación
10. Modificar múltiples módulos simultáneamente

### **✅ SIEMPRE HACER:**

1. Leer este documento antes de modificar código
2. Validar todos los inputs
3. Logear apropiadamente
4. Manejar errores explícitamente
5. Invalidar caché después de cambios
6. Usar TypeScript estricto (no `any` sin justificar)
7. Probar manualmente después de cambios
8. Documentar cambios en CHANGELOG.md
9. Seguir el flujo de procesamiento establecido
10. Consultar en caso de duda

---

**ESTE DOCUMENTO ES LA FUENTE ÚNICA DE VERDAD PARA EL SISTEMA DE UPLOAD**

**Cualquier cambio al sistema debe documentarse aquí primero**

**Última actualización:** 2025-10-11

