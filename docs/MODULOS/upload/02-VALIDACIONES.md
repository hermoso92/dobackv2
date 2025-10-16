# ✅ SISTEMA DE VALIDACIONES - UPLOAD

**Versión:** 2.0  
**Fecha:** 2025-10-11

---

## 🎯 VALIDACIÓN DOBLE (Frontend + Backend)

El sistema usa validación en dos niveles para máxima robustez:

1. **Frontend** - Validación temprana (UX)
2. **Backend** - Validación definitiva (seguridad)

---

## 📝 VALIDACIONES FRONTEND

**Archivo:** `frontend/src/utils/uploadValidator.ts`

### **Funciones Principales:**

```typescript
// 1. Validar nombre de archivo
validateFileName(fileName: string): ValidationResult
// Verifica: extensión, patrón, tipo, número vehículo, fecha

// 2. Validar tamaño
validateFileSize(size: number): ValidationResult
// Verifica: min 100 bytes, max 100 MB

// 3. Validar archivo completo
validateFile(file: File): ValidationResult
// Ejecuta validateFileName + validateFileSize

// 4. Validar múltiples archivos
validateFiles(files: File[]): ValidationResult
// Verifica: límite 20 archivos, duplicados

// 5. Validar agrupación
validateFileGroups(files: File[]): ValidationResult
// Detecta grupos incompletos

// ⭐ FUNCIÓN PRINCIPAL
validateAndPrepareFiles(files: File[]): CompleteValidationResult
// Ejecuta TODAS las validaciones y retorna resumen completo
```

### **Uso en Componentes:**

```typescript
import { validateAndPrepareFiles } from '../utils/uploadValidator';

const validation = validateAndPrepareFiles(selectedFiles);

if (!validation.valid) {
    setUploadError(validation.errors.join('\n'));
    return;
}

// Proceder con validation.validFiles
```

---

## 🔐 VALIDACIONES BACKEND

**Archivo:** `backend/src/validators/uploadValidator.ts`

### **Funciones Principales:**

```typescript
// 1. Parsear nombre
parseFileName(fileName: string): ParsedFileName | null
// Extrae: tipo, vehicleId, vehicleNumber, date

// 2. Validar nombre
validateFileName(fileName: string): ValidationResult
// Verifica: formato, tipo, número, fecha válida

// 3. Validar contenido
validateFileContent(fileName: string, content: Buffer): ValidationResult
// Verifica: cabecera, encoding UTF-8, mínimo líneas

// 4. Validar autenticación
validateAuthentication(userId?, organizationId?): ValidationResult
// Verifica: userId y organizationId presentes

// ⭐ FUNCIÓN PRINCIPAL
validateUploadRequest(params): CompleteValidationResult
// Ejecuta TODAS las validaciones backend
```

### **Uso en Rutas:**

```typescript
import { validateUploadRequest, formatValidationErrors } from '../validators/uploadValidator';

router.post('/upload', async (req, res) => {
    const validation = validateUploadRequest({
        files: req.files,
        userId: req.user?.id,
        organizationId: req.organizationId
    });

    if (!validation.valid) {
        return res.status(400).json({
            success: false,
            error: formatValidationErrors(validation.errors)
        });
    }

    // Proceder con procesamiento
});
```

---

## 📍 VALIDACIONES GPS (5 Niveles)

**Archivo:** `backend/src/services/parsers/RobustGPSParser.ts`

### **Nivel 1: Números Válidos**

```typescript
const lat = parseFloat(latStr);
const lon = parseFloat(lonStr);

if (isNaN(lat) || isNaN(lon)) {
    // RECHAZAR - No es un número
    logger.warn(`Coordenadas NaN: lat="${latStr}", lon="${lonStr}"`);
    continue;
}
```

### **Nivel 2: No (0,0)**

```typescript
if (lat === 0 || lon === 0) {
    // RECHAZAR - Coordenadas en cero (error común)
    logger.warn(`Coordenadas en cero: ${lat}, ${lon}`);
    continue;
}
```

### **Nivel 3: Rango Global**

```typescript
if (lat < -90 || lat > 90) {
    // RECHAZAR - Latitud inválida
    logger.warn(`Latitud fuera de rango (-90 a 90): ${lat}`);
    continue;
}

if (lon < -180 || lon > 180) {
    // RECHAZAR - Longitud inválida
    logger.warn(`Longitud fuera de rango (-180 a 180): ${lon}`);
    continue;
}
```

**Ejemplos rechazados:**
- `-355654.5833333` (longitud inválida)
- `0.575398` (latitud inválida - falta dígito)
- `4.0587252` (latitud inválida - fuera de rango España)

### **Nivel 4: Rango España (Warning)**

```typescript
if (lat < 36 || lat > 44) {
    // ADVERTIR (no rechazar) - Puede ser válido pero fuera de España
    logger.warn(`Latitud fuera de España (36-44): ${lat}`);
    // No continue - se permite pero se reporta
}

if (lon < -10 || lon > 5) {
    // ADVERTIR - Puede ser válido pero fuera de España
    logger.warn(`Longitud fuera de España (-10 a 5): ${lon}`);
    // No continue
}
```

### **Nivel 5: Saltos GPS**

```typescript
if (ultimoPuntoValido) {
    const distancia = haversineDistance(
        ultimoPuntoValido.latitude,
        ultimoPuntoValido.longitude,
        lat,
        lon
    );

    if (distancia > 1000) { // 1 km
        // ADVERTIR - Salto sospechoso
        logger.warn(`Salto GPS de ${distancia.toFixed(0)}m detectado`);
        // No continue - se permite pero se reporta
    }
}
```

---

## 📊 ESTRUCTURA DE RESULTADOS

### **Frontend → Backend (Request)**

```typescript
FormData {
    files: File[] // Hasta 20 archivos
}

Headers {
    'Content-Type': 'multipart/form-data',
    'Authorization': 'Bearer <jwt_token>'
}
```

### **Backend → Frontend (Response)**

```typescript
{
    success: boolean,
    message: string,
    data: {
        sesionesCreadas: number,
        sessionIds: string[],
        archivosValidos: number,
        archivosConProblemas: number,
        estadisticas: {
            gpsValido: number,
            gpsInterpolado: number,
            gpsSinSenal: number,
            coordenadasInvalidas: number, // NUEVO
            saltosGPS: number,             // NUEVO
            estabilidadValida: number,
            rotativoValido: number
        },
        problemas: Array<{
            tipo: string,
            descripcion: string,
            gravedad: string
        }>
    }
}
```

---

## 🔧 CONFIGURACIÓN

```typescript
const CONFIG = {
    // Archivos
    MAX_FILE_SIZE: 100 * 1024 * 1024,  // 100 MB
    MAX_FILES_PER_UPLOAD: 20,
    MIN_FILE_SIZE: 100,                // 100 bytes

    // Timeouts
    UPLOAD_TIMEOUT: 120000,            // 2 minutos
    PROCESSING_TIMEOUT: 300000,        // 5 minutos

    // Batches
    GPS_BATCH_SIZE: 1000,
    STABILITY_BATCH_SIZE: 1000,
    ROTATIVO_BATCH_SIZE: 1000,

    // Sesiones
    SESSION_GAP_MINUTES: 5,

    // GPS
    MAX_GPS_JUMP_METERS: 1000,         // 1 km
    MIN_VALID_GPS_PERCENT: 10,
    
    // Coordenadas España
    SPAIN_LAT_MIN: 36,
    SPAIN_LAT_MAX: 44,
    SPAIN_LON_MIN: -10,
    SPAIN_LON_MAX: 5
};
```

---

## ⚠️ CASOS ESPECIALES

### **GPS Sin Señal**

```typescript
// Línea: "sin datos GPS"
→ Marcar como sinSenal
→ No rechazar sesión
→ Guardar en métricas
→ Reportar en estadísticas
```

### **Grupos Incompletos**

```typescript
// Solo GPS (sin Estabilidad ni Rotativo)
→ PERMITIDO
→ Procesar GPS normalmente
→ Advertir que está incompleto
```

### **Sesiones Ya Existentes**

```typescript
// Si sesión con mismo vehículo+tiempo ya existe
→ OMITIR silenciosamente
→ Logear: "⚠️ Sesión ya existe, omitiendo: <id>"
→ No contar en sesionesCreadas
```

### **Archivos Muy Pequeños**

```typescript
// < 1 KB
→ PERMITIR si pasa validación
→ ADVERTIR al usuario
→ Posible problema de datos
```

---

## 📋 CHECKLIST DE VALIDACIÓN

Antes de procesar cada archivo:

- [ ] ✅ Nombre cumple patrón
- [ ] ✅ Tamaño entre límites
- [ ] ✅ Extensión .txt
- [ ] ✅ Contenido UTF-8
- [ ] ✅ Cabecera correcta
- [ ] ✅ Al menos 1 medición válida
- [ ] ✅ GPS con coordenadas válidas
- [ ] ✅ Sin saltos GPS > 1km
- [ ] ✅ Usuario autenticado
- [ ] ✅ OrganizationId presente

---

**Ver 03-FLUJO-PROCESAMIENTO.md para el flujo completo**

