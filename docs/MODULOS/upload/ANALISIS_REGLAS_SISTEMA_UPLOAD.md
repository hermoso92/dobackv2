# 📋 ANÁLISIS COMPLETO: REGLAS DEL SISTEMA MASIVO DE SUBIDA

**Fecha:** 14 de enero de 2025  
**Analista:** Sistema de Auditoría StabilSafe  
**Objetivo:** Identificar todas las reglas utilizadas por el sistema de upload masivo  

---

## 🎯 RESUMEN EJECUTIVO

El sistema de subida masiva utiliza **4 controladores diferentes** con reglas específicas cada uno. Se han identificado **10 reglas inmutables** y **3 sistemas de procesamiento** principales.

---

## 🏗️ ARQUITECTURA DEL SISTEMA

### **Controladores Identificados**

| Controlador | Ubicación | Estado | Reglas Principales |
|-------------|-----------|--------|-------------------|
| **MassUploadController** | `backend/src/controllers/MassUploadController.ts` | ⚠️ Parcial | Agrupación por vehículo/fecha |
| **UnifiedFileProcessor** | `backend/src/services/UnifiedFileProcessor.ts` | ✅ Principal | Detección sesiones múltiples |
| **upload-unified** | `backend/src/routes/upload-unified.ts` | ✅ Activo | Validación formato archivos |
| **upload.ts** | `backend/src/routes/upload.ts` | ⚠️ Básico | Subida individual |

---

## 🔒 REGLAS INMUTABLES DEL SISTEMA

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

**Ubicación:** `backend/src/routes/upload-unified.ts:37`

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

**Ubicación:** `backend/src/routes/upload-unified.ts:26`

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

**Ubicación:** `backend/src/routes/upload-unified.ts:18-34`

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

**Ubicación:** `backend/src/services/parsers/MultiSessionDetector.ts:186-228`

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

**Ubicación:** `backend/src/services/parsers/MultiSessionDetector.ts:19-115`

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

**Ubicación:** `backend/src/services/UnifiedFileProcessor.ts:354-378`

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

**Ubicación:** `backend/src/services/UnifiedFileProcessor.ts:290-338`

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

**Ubicación:** `backend/src/services/UnifiedFileProcessor.ts:498-521`

### **9. Post-Procesamiento Automático**

```typescript
// ✅ MANDAMIENTO M9: POST-PROCESAMIENTO OBLIGATORIO

// Después de crear cada sesión, ejecutar automáticamente:
1. Detectar y guardar eventos de estabilidad
2. Calcular y guardar segmentos de claves operacionales
3. Analizar velocidades (opcional)

// ✅ SIEMPRE ejecutar post-procesamiento
// ✅ SIEMPRE invalidar cache de KPIs
```

**Ubicación:** `backend/src/services/UnifiedFileProcessor.ts:108-166`

### **10. Invalidación de Caché**

```typescript
// ✅ SIEMPRE invalidar cache de KPIs después de upload exitoso
if (resultado.sesionesCreadas > 0) {
    kpiCacheService.invalidate(organizationId);
    logger.info('Cache de KPIs invalidado', { organizationId });
}

// ❌ NUNCA dejar caché desactualizada
```

**Ubicación:** `backend/src/routes/upload-unified.ts:90-93`

---

## 📊 REGLAS ESPECÍFICAS POR TIPO DE ARCHIVO

### **GPS (RobustGPSParser.ts)**

#### **Validaciones Obligatorias:**
```typescript
// ✅ VALIDACIÓN 1: Números válidos
if (isNaN(lat) || isNaN(lon)) {
    // Rechazar punto
}

// ✅ VALIDACIÓN 2: No (0,0)
if (lat === 0 || lon === 0) {
    // Rechazar punto
}

// ✅ VALIDACIÓN 3: Rango válido global
if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    // Rechazar punto
}

// ✅ VALIDACIÓN 4: Detectar saltos GPS (> 1km)
if (distancia > 1000) {
    // Reportar como problema
}

// ✅ VALIDACIÓN 5: Usar HORA RASPBERRY (no GPS UTC)
const timestamp = parseTimestampRaspberry(horaRaspberry, fecha, fechaSesionDetectada, ultimoTimestamp);
```

#### **Manejo de "Sin Datos GPS":**
```typescript
// ✅ Detectar líneas "sin datos GPS"
if (linea.includes('sin datos GPS')) {
    contadores.sinSenal++;
    // Continuar sin procesar
}
```

#### **Interpolación GPS:**
```typescript
// ✅ Interpolar si hay gap entre 1 y 10 segundos
if (diffSegundos > 1 && diffSegundos <= 10) {
    // Crear puntos interpolados
}
```

### **ESTABILIDAD (RobustStabilityParser.ts)**

#### **Interpolación de Timestamps:**
```typescript
// ✅ INTERPOLAR TIMESTAMP basándose en frecuencia ~10 Hz (100ms por muestra)
const timestamp = new Date(ultimoMarcadorTemporal.getTime() + lineasDesdeMarcador * 100);
```

#### **Validación de Campos:**
```typescript
// ✅ CORRECCIÓN: Archivos tienen 20 campos (último está vacío)
if (partes.length !== 19 && partes.length !== 20) {
    // Rechazar medición
}

// ✅ Validar que los valores son números válidos
if (valores.some(v => isNaN(v))) {
    // Rechazar medición
}
```

#### **Detección de Marcadores Temporales:**
```typescript
// ✅ Detectar marcador temporal (línea solo con HH:MM:SS)
const marcadorMatch = linea.match(/^(\d{2}):(\d{2}):(\d{2})$/);
if (marcadorMatch) {
    // Actualizar último marcador temporal
}
```

### **ROTATIVO (RobustRotativoParser.ts)**

#### **Validación de Estados:**
```typescript
// ✅ Validar estado
const state = partes[1].trim();
if (state !== '0' && state !== '1') {
    // Rechazar medición
}
```

#### **Claves Operacionales:**
```typescript
// ✅ Extraer clave operacional si existe (columna 3)
// Validar que sea una clave válida (0,1,2,3,5)
if ([0, 1, 2, 3, 5].includes(keyNum)) {
    key = keyNum;
}
```

#### **Parseo de Timestamps:**
```typescript
// ✅ Parsear timestamp: DD/MM/YYYY-HH:MM:SS
const match = timestampStr.match(/(\d{2})\/(\d{2})\/(\d{4})-(\d{2}):(\d{2}):(\d{2})/);
```

---

## 🔧 CONFIGURACIÓN Y LÍMITES

### **Límites del Sistema**

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
```

### **Criterios de Calidad**

```typescript
// ✅ Alertar si la calidad es muy baja
if (porcentajeValido < 80 && contadores.total > 100) {
    logger.warn(`⚠️ Calidad de datos ESTABILIDAD baja: ${porcentajeValido.toFixed(2)}%`);
}
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

## 📋 FLUJO DE PROCESAMIENTO

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

### **Paso 6: Post-Procesamiento**
```typescript
✅ Detectar y guardar eventos de estabilidad
✅ Calcular y guardar segmentos de claves operacionales
✅ Analizar velocidades (opcional)
✅ Invalidar cache de KPIs
```

### **Paso 7: Respuesta Final**
```typescript
✅ Recopilar estadísticas totales
✅ Devolver resultado con todas las métricas
✅ Logear éxito/errores
```

---

## 🎯 REGLAS CRÍTICAS POR CONTROLADOR

### **MassUploadController (Legacy)**

**Reglas específicas:**
- ✅ Agrupa archivos por vehículo y fecha
- ✅ Crea vehículos automáticamente si no existen
- ✅ Procesa archivos en lotes
- ❌ NO detecta sesiones múltiples
- ❌ NO valida calidad de datos
- ❌ NO correlaciona GPS-ESTABILIDAD-ROTATIVO

### **UnifiedFileProcessor (Principal)**

**Reglas específicas:**
- ✅ Detección de sesiones múltiples
- ✅ Validación robusta de GPS ("sin datos GPS")
- ✅ Interpolación de timestamps en ESTABILIDAD
- ✅ Correlación GPS-ESTABILIDAD-ROTATIVO
- ✅ Estadísticas de calidad por sesión
- ✅ Post-procesamiento automático

### **upload-unified (Endpoint Principal)**

**Reglas específicas:**
- ✅ Validación de formato de archivos
- ✅ Límites de tamaño (100 MB)
- ✅ Autenticación obligatoria
- ✅ Invalidación de caché
- ✅ Respuestas HTTP estructuradas

---

## ⚠️ ADVERTENCIAS CRÍTICAS

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

## 📚 ARCHIVOS CLAVE DEL SISTEMA

### **Backend Principal:**
```
- backend/src/routes/upload-unified.ts (Endpoint principal)
- backend/src/services/UnifiedFileProcessor.ts (Procesamiento)
- backend/src/services/parsers/MultiSessionDetector.ts (Detección sesiones)
- backend/src/services/parsers/RobustGPSParser.ts (Parser GPS)
- backend/src/services/parsers/RobustStabilityParser.ts (Parser Estabilidad)
- backend/src/services/parsers/RobustRotativoParser.ts (Parser Rotativo)
- backend/src/controllers/MassUploadController.ts (Controlador legacy)
```

### **Frontend:**
```
- frontend/src/pages/UploadPage.tsx (Página principal)
- frontend/src/components/FileUploadManager.tsx (Gestor de archivos)
- frontend/src/components/MassUpload.tsx (Subida masiva)
```

### **Documentación:**
```
- PROTOCOLOS_SISTEMA_UPLOAD.md (Reglas inmutables)
- docs/CALIDAD/auditorias/AUDITORIA_SISTEMA_SUBIDA.md (Auditoría)
- backend/src/services/upload/UnifiedFileProcessorV2.ts (Versión mejorada)
```

---

## 🎉 CONCLUSIÓN

El sistema de subida masiva utiliza **10 reglas inmutables** distribuidas en **4 controladores diferentes**. El **UnifiedFileProcessor** es el sistema principal que implementa todas las reglas críticas, mientras que los otros controladores tienen funcionalidades parciales.

**Reglas más críticas:**
1. **Autenticación obligatoria** con organizationId
2. **Formato de archivos estricto** (TIPO_DOBACK###_YYYYMMDD.txt)
3. **Detección de sesiones múltiples** automática
4. **Validación robusta de GPS** con manejo de "sin datos GPS"
5. **Post-procesamiento automático** (eventos, claves, velocidad)
6. **Invalidación de caché** después de upload exitoso

**El sistema está diseñado para ser robusto, escalable y mantener la integridad de los datos en todo momento.**

---

**Generado:** 14 de enero de 2025  
**Por:** Sistema de Auditoría StabilSafe  
**Versión:** 1.0.0  
**Estado:** ✅ ANÁLISIS COMPLETO
