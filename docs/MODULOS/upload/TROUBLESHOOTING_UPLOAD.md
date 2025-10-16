# 🔧 TROUBLESHOOTING - SISTEMA DE UPLOAD

**Versión:** 1.0  
**Fecha:** 2025-10-11  
**Propósito:** Diagnóstico y solución de problemas comunes en el sistema de upload

---

## 📋 ÍNDICE RÁPIDO

- [Errores HTTP](#errores-http)
- [Problemas de Validación](#problemas-de-validación)
- [Problemas de Procesamiento](#problemas-de-procesamiento)
- [Problemas de Base de Datos](#problemas-de-base-de-datos)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas de Frontend](#problemas-de-frontend)
- [Herramientas de Diagnóstico](#herramientas-de-diagnóstico)

---

## 🚨 ERRORES HTTP

### **Error 400: Bad Request**

#### **Síntoma:**
```json
{
  "success": false,
  "error": "No se proporcionó archivo"
}
```

#### **Causas Posibles:**

1. **No se envían archivos desde frontend**
   ```typescript
   // ❌ INCORRECTO
   const formData = new FormData();
   // No se añaden archivos
   
   // ✅ CORRECTO
   const formData = new FormData();
   selectedFiles.forEach(file => {
       formData.append('files', file); // 'files' en plural
   });
   ```

2. **Campo incorrecto en FormData**
   ```typescript
   // ❌ INCORRECTO
   formData.append('file', file); // Singular
   
   // ✅ CORRECTO
   formData.append('files', file); // Plural - coincide con multer
   ```

3. **Content-Type incorrecto**
   ```typescript
   // ❌ INCORRECTO
   headers: { 'Content-Type': 'application/json' }
   
   // ✅ CORRECTO
   headers: { 'Content-Type': 'multipart/form-data' }
   ```

#### **Solución:**

1. Verificar en DevTools → Network → Request que:
   - `Content-Type: multipart/form-data` está presente
   - En Form Data aparecen los archivos
   - El campo se llama `files`

2. Verificar código frontend:
   ```typescript
   const formData = new FormData();
   selectedFiles.forEach(file => {
       formData.append('files', file);
   });
   
   await apiService.post('/api/upload/unified', formData, {
       headers: { 'Content-Type': 'multipart/form-data' }
   });
   ```

---

### **Error 400: Formato de archivo inválido**

#### **Síntoma:**
```json
{
  "success": false,
  "error": "Formato de archivo inválido. Debe ser: TIPO_DOBACK###_YYYYMMDD.txt"
}
```

#### **Causas:**

1. Nombre no cumple patrón
2. Extensión incorrecta
3. Número de vehículo mal formateado
4. Fecha inválida

#### **Ejemplos Incorrectos:**

```
❌ ESTABILIDAD_VEHICLE001_20250101.txt  (debe ser DOBACK###)
❌ GPS_DOBACK1_20250101.txt             (debe tener 3 dígitos: 001)
❌ ROTATIVO_DOBACK001_2025.txt          (fecha incompleta)
❌ CAN_DOBACK001_20250101.csv           (debe ser .txt)
❌ INVALIDO_DOBACK001_20250101.txt      (tipo inválido)
```

#### **Ejemplos Correctos:**

```
✅ ESTABILIDAD_DOBACK001_20250101.txt
✅ GPS_DOBACK002_20250115.txt
✅ ROTATIVO_DOBACK123_20251231.txt
✅ CAN_DOBACK999_20250630.txt
```

#### **Solución:**

1. Verificar que archivo sigue el patrón exacto
2. Renombrar archivo si es necesario
3. Usar validación frontend para prevenir:
   ```typescript
   import { validateFileName } from '../utils/uploadValidator';
   
   const validation = validateFileName(file.name);
   if (!validation.valid) {
       console.error(validation.errors);
   }
   ```

---

### **Error 401: Unauthorized**

#### **Síntoma:**
```json
{
  "success": false,
  "error": "No autenticado"
}
```

#### **Causas:**

1. Token JWT no presente
2. Token expirado
3. Token inválido
4. Usuario no existe en BD

#### **Solución:**

1. Verificar que token está en cookie o header:
   ```javascript
   // En DevTools → Application → Cookies
   // Debe existir: token=jwt_string
   ```

2. Verificar que middleware de auth está aplicado:
   ```typescript
   // backend/src/routes/upload-unified.ts
   router.use(requireAuth, extractOrganizationId);
   ```

3. Verificar que token es válido:
   ```sql
   -- En PostgreSQL
   SELECT id, email, "organizationId" 
   FROM "User" 
   WHERE id = 'user_id_del_token';
   ```

4. Si token expiró, hacer login de nuevo

---

### **Error 500: Internal Server Error**

#### **Síntoma:**
```json
{
  "success": false,
  "error": "Error procesando archivos"
}
```

#### **Causas Comunes:**

1. **Error en parser**
   - Archivo con formato inesperado
   - Encoding incorrecto
   - Caracteres especiales

2. **Error en BD**
   - Conexión perdida
   - Constraint violation
   - Disk full

3. **Error en procesamiento**
   - Memory overflow
   - Timeout
   - Archivo corrupto

#### **Diagnóstico:**

1. **Revisar logs del backend:**
   ```bash
   # Buscar errores recientes
   tail -f logs/backend.log | grep ERROR
   ```

2. **Verificar stack trace completo**
   ```javascript
   logger.error('Error en upload', { 
       error: error.message,
       stack: error.stack 
   });
   ```

3. **Verificar conexión a BD:**
   ```bash
   # En terminal del backend
   npx prisma db execute --stdin <<< "SELECT 1"
   ```

#### **Soluciones:**

- **Si es error de parser:** Verificar formato del archivo manualmente
- **Si es error de BD:** Verificar logs de PostgreSQL
- **Si es error de memoria:** Reducir batch size o tamaño de archivo

---

## 🔍 PROBLEMAS DE VALIDACIÓN

### **Archivo pasa frontend pero falla en backend**

#### **Síntoma:**
Frontend permite subir, pero backend rechaza

#### **Causa:**
Validación frontend y backend no sincronizadas

#### **Solución:**

1. Verificar que regex es idéntica:
   ```typescript
   // frontend/src/utils/uploadValidator.ts
   export const FILE_NAME_PATTERN = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d{3})_(\d{8})\.txt$/i;
   
   // backend/src/validators/uploadValidator.ts
   export const FILE_NAME_PATTERN = /^(ESTABILIDAD|GPS|ROTATIVO|CAN)_DOBACK(\d{3})_(\d{8})\.txt$/i;
   ```

2. Verificar que límites son idénticos:
   ```typescript
   // Frontend
   MAX_FILE_SIZE: 100 * 1024 * 1024
   
   // Backend
   MAX_FILE_SIZE: 100 * 1024 * 1024
   ```

3. Actualizar ambos si cambia alguno

---

### **Validación muy estricta**

#### **Síntoma:**
Archivos válidos son rechazados

#### **Causa:**
Validaciones demasiado restrictivas

#### **Ejemplos:**

```typescript
// ❌ Demasiado estricto
if (dataLines.length < 100) {
    result.errors.push('Archivo debe tener al menos 100 líneas');
}

// ✅ Más permisivo
if (dataLines.length < 10) {
    result.warnings.push('Archivo con pocas mediciones');
}
```

#### **Solución:**

- Cambiar errores no críticos a warnings
- Permitir casos límite válidos
- Documentar por qué una validación es estricta

---

## ⚙️ PROBLEMAS DE PROCESAMIENTO

### **No se detectan sesiones múltiples**

#### **Síntoma:**
Archivo con 3 sesiones solo crea 1 sesión en BD

#### **Causa:**
Detector de sesiones no identifica separaciones

#### **Diagnóstico:**

1. Verificar logs:
   ```
   Sesiones detectadas: ESTABILIDAD=1, GPS=1, ROTATIVO=1
   ```

2. Verificar criterios de separación:
   ```typescript
   // MultiSessionDetector.ts
   const GAP_THRESHOLD = 5 * 60 * 1000; // 5 minutos
   ```

3. Verificar timestamps en archivo:
   ```
   2025-01-01 10:00:00  <- Sesión 1 inicio
   2025-01-01 10:15:00  <- Sesión 1 fin
   2025-01-01 10:16:00  <- Gap de 1 min (< 5 min) → Misma sesión
   2025-01-01 10:30:00  <- Gap de 14 min (> 5 min) → Nueva sesión
   ```

#### **Solución:**

1. Si gap es correcto pero no detecta:
   ```typescript
   // Verificar que timestamps se parsean correctamente
   const timestamp = parseTimestamp(line);
   console.log('Timestamp parseado:', timestamp);
   ```

2. Si necesitas ajustar threshold:
   ```typescript
   // Cambiar en MultiSessionDetector.ts
   const GAP_THRESHOLD = 3 * 60 * 1000; // 3 minutos
   ```

---

### **GPS marcado como "sin señal" pero tiene coordenadas**

#### **Síntoma:**
Archivo GPS tiene coordenadas válidas pero métricas muestran 100% sin señal

#### **Causa:**
Parser GPS no reconoce formato de coordenadas

#### **Diagnóstico:**

1. Verificar formato en archivo:
   ```
   2025-01-01 10:00:00;40.4168;-3.7038;650;1.2;3D;8;50
   2025-01-01 10:00:01;sin datos GPS
   ```

2. Verificar parser:
   ```typescript
   // RobustGPSParser.ts
   if (line.includes('sin datos GPS') || line.includes('sin señal')) {
       // Marca como sin señal
   }
   ```

#### **Solución:**

1. Verificar que valores numéricos se parsean:
   ```typescript
   const lat = parseFloat(campos[1]);
   const lon = parseFloat(campos[2]);
   
   if (!isNaN(lat) && !isNaN(lon)) {
       // GPS válido
   }
   ```

2. Verificar rangos de coordenadas:
   ```typescript
   // España: lat 36-44, lon -10 a 5
   if (lat >= 36 && lat <= 44 && lon >= -10 && lon <= 5) {
       // Coordenadas válidas para España
   }
   ```

---

### **Procesamiento muy lento**

#### **Síntoma:**
Upload de 10 archivos tarda > 2 minutos

#### **Causas:**

1. Archivos muy grandes
2. Muchas sesiones
3. Batch size muy pequeño
4. Base de datos lenta

#### **Diagnóstico:**

1. Medir tiempos:
   ```typescript
   const startTime = Date.now();
   await procesarArchivos(...);
   const duration = Date.now() - startTime;
   logger.info(`Procesamiento tardó ${duration}ms`);
   ```

2. Identificar cuello de botella:
   ```typescript
   logger.info('Inicio parseo GPS');
   const gpsData = parseGPS(...);
   logger.info(`Parseo GPS tardó ${Date.now() - t1}ms`);
   
   logger.info('Inicio guardado BD');
   await guardarGPS(...);
   logger.info(`Guardado GPS tardó ${Date.now() - t2}ms`);
   ```

#### **Soluciones:**

1. **Aumentar batch size:**
   ```typescript
   const batchSize = 2000; // En lugar de 1000
   ```

2. **Procesar en paralelo:**
   ```typescript
   await Promise.all([
       guardarMedicionesGPS(sessionId, gpsData),
       guardarMedicionesEstabilidad(sessionId, estabData),
       guardarMedicionesRotativo(sessionId, rotativoData)
   ]);
   ```

3. **Optimizar queries:**
   ```typescript
   // Usar createMany con skipDuplicates
   await prisma.gpsMeasurement.createMany({
       data: batch,
       skipDuplicates: true
   });
   ```

---

## 💾 PROBLEMAS DE BASE DE DATOS

### **Sesiones se crean pero sin mediciones**

#### **Síntoma:**
```sql
SELECT COUNT(*) FROM "Session";          -- 5 sesiones
SELECT COUNT(*) FROM "GpsMeasurement";   -- 0 mediciones
```

#### **Causas:**

1. Error en guardado de mediciones
2. SessionId incorrecto
3. Transacción rollback
4. Constraint violation

#### **Diagnóstico:**

1. Verificar logs de guardado:
   ```
   GPS guardado: 1234 mediciones
   ```

2. Verificar en BD:
   ```sql
   SELECT id FROM "Session" ORDER BY "createdAt" DESC LIMIT 1;
   -- Copiar el ID
   
   SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = 'session_id_aqui';
   ```

3. Verificar errores de constraint:
   ```bash
   tail -f logs/backend.log | grep -i constraint
   ```

#### **Solución:**

1. Si sessionId es incorrecto:
   ```typescript
   // Verificar que sessionId se pasa correctamente
   const sessionId = await crearSesionEnBD(...);
   logger.info('Session creada', { sessionId });
   
   await guardarMedicionesGPS(sessionId, gpsData);
   ```

2. Si hay constraint violation:
   ```typescript
   // Usar skipDuplicates
   await prisma.gpsMeasurement.createMany({
       data: batch,
       skipDuplicates: true
   });
   ```

---

### **Datos duplicados en BD**

#### **Síntoma:**
Subir mismo archivo 2 veces crea datos duplicados

#### **Causa:**
No hay validación de duplicados

#### **Solución:**

1. **Opción 1: Validar antes de insertar**
   ```typescript
   const existente = await prisma.session.findFirst({
       where: {
           vehicleId,
           startTime,
           endTime
       }
   });
   
   if (existente) {
       logger.warn('Sesión ya existe', { sessionId: existente.id });
       return existente.id;
   }
   ```

2. **Opción 2: Usar unique constraints**
   ```prisma
   model Session {
       @@unique([vehicleId, startTime, endTime])
   }
   ```

3. **Opción 3: Limpiar antes de upload (para testing)**
   ```typescript
   // En FileUploadManager.tsx
   await apiService.post('/api/clean-all-sessions', {});
   ```

---

## 🚀 PROBLEMAS DE PERFORMANCE

### **Timeout en uploads grandes**

#### **Síntoma:**
```
Error: timeout of 120000ms exceeded
```

#### **Solución:**

1. **Aumentar timeout en frontend:**
   ```typescript
   await apiService.post('/api/upload/unified', formData, {
       timeout: 300000 // 5 minutos
   });
   ```

2. **Aumentar timeout en backend:**
   ```typescript
   // En server.ts o app.ts
   server.setTimeout(300000); // 5 minutos
   ```

3. **Optimizar procesamiento** (ver sección anterior)

---

### **Memory overflow**

#### **Síntoma:**
```
JavaScript heap out of memory
```

#### **Causas:**

1. Archivos muy grandes en memoria
2. Batch size muy grande
3. No se libera memoria

#### **Solución:**

1. **Reducir batch size:**
   ```typescript
   const batchSize = 500; // En lugar de 1000
   ```

2. **Procesar en streaming:**
   ```typescript
   // En lugar de leer todo el archivo
   const content = fs.readFileSync(path, 'utf8');
   
   // Leer línea por línea
   const rl = readline.createInterface({
       input: fs.createReadStream(path)
   });
   ```

3. **Liberar memoria explícitamente:**
   ```typescript
   let batch = [];
   for (const medicion of mediciones) {
       batch.push(medicion);
       
       if (batch.length >= 1000) {
           await guardar(batch);
           batch = []; // Liberar memoria
       }
   }
   ```

---

## 🎨 PROBLEMAS DE FRONTEND

### **UI no actualiza después de upload**

#### **Síntoma:**
Upload exitoso pero UI no muestra resultado

#### **Causa:**
Estado no se actualiza

#### **Solución:**

```typescript
// En FileUploadManager.tsx
const handleMultipleUpload = async () => {
    try {
        const response = await apiService.post(...);
        
        if (response.success) {
            // ✅ Actualizar estado
            setUploadResult(response.data);
            setSelectedFiles([]); // Limpiar archivos seleccionados
            
            // ✅ Refrescar datos
            await fetchRecentSessions();
        }
    } catch (error) {
        // ✅ Mostrar error
        setUploadError(error.message);
    } finally {
        // ✅ Quitar loading
        setUploading(false);
    }
};
```

---

### **Errores no se muestran claramente**

#### **Síntoma:**
Error ocurre pero usuario no ve mensaje claro

#### **Solución:**

```typescript
// Mostrar errores en Alert
{uploadError && (
    <Alert severity="error" sx={{ mb: 3 }}>
        <Typography variant="h6">Error en Upload</Typography>
        <Typography>{uploadError}</Typography>
    </Alert>
)}

// Mostrar warnings
{warnings.length > 0 && (
    <Alert severity="warning" sx={{ mb: 3 }}>
        <Typography variant="h6">Advertencias</Typography>
        <ul>
            {warnings.map((w, i) => (
                <li key={i}>{w}</li>
            ))}
        </ul>
    </Alert>
)}
```

---

## 🛠️ HERRAMIENTAS DE DIAGNÓSTICO

### **Script de Verificación de Sistema**

```bash
# Guardar como verify-upload-system.sh

echo "🔍 Verificando Sistema de Upload..."

# 1. Verificar backend corriendo
echo "\n1. Backend:"
curl -s http://localhost:9998/api/health || echo "❌ Backend no responde"

# 2. Verificar BD
echo "\n2. Base de Datos:"
psql -U postgres -d dobacksoft -c "SELECT COUNT(*) FROM \"Session\";" || echo "❌ BD no accesible"

# 3. Verificar archivos clave
echo "\n3. Archivos del Sistema:"
[ -f "backend/src/routes/upload-unified.ts" ] && echo "✅ upload-unified.ts" || echo "❌ Falta upload-unified.ts"
[ -f "backend/src/services/UnifiedFileProcessor.ts" ] && echo "✅ UnifiedFileProcessor.ts" || echo "❌ Falta UnifiedFileProcessor.ts"
[ -f "backend/src/validators/uploadValidator.ts" ] && echo "✅ uploadValidator.ts" || echo "❌ Falta uploadValidator.ts"
[ -f "frontend/src/utils/uploadValidator.ts" ] && echo "✅ uploadValidator.ts (frontend)" || echo "❌ Falta uploadValidator.ts (frontend)"

# 4. Verificar logs
echo "\n4. Logs Recientes:"
tail -5 logs/backend.log 2>/dev/null || echo "⚠️ No hay logs"

echo "\n✅ Verificación completada"
```

### **Query SQL de Diagnóstico**

```sql
-- Guardar como diagnostico-upload.sql

-- Estado general del sistema
SELECT 
    'Sesiones' as tabla,
    COUNT(*) as total,
    COUNT(DISTINCT "vehicleId") as vehiculos,
    COUNT(DISTINCT "organizationId") as organizaciones,
    MIN("createdAt") as primera,
    MAX("createdAt") as ultima
FROM "Session"

UNION ALL

SELECT 
    'GPS',
    COUNT(*),
    COUNT(DISTINCT "sessionId"),
    NULL,
    MIN("timestamp"),
    MAX("timestamp")
FROM "GpsMeasurement"

UNION ALL

SELECT 
    'Estabilidad',
    COUNT(*),
    COUNT(DISTINCT "sessionId"),
    NULL,
    MIN("timestamp"),
    MAX("timestamp")
FROM "StabilityMeasurement"

UNION ALL

SELECT 
    'Rotativo',
    COUNT(*),
    COUNT(DISTINCT "sessionId"),
    NULL,
    MIN("timestamp"),
    MAX("timestamp")
FROM "RotativoMeasurement";

-- Sesiones sin mediciones (problema potencial)
SELECT 
    s.id,
    s."vehicleId",
    s."startTime",
    (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) as gps,
    (SELECT COUNT(*) FROM "StabilityMeasurement" WHERE "sessionId" = s.id) as estabilidad,
    (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) as rotativo
FROM "Session" s
WHERE 
    NOT EXISTS (SELECT 1 FROM "GpsMeasurement" WHERE "sessionId" = s.id)
    AND NOT EXISTS (SELECT 1 FROM "StabilityMeasurement" WHERE "sessionId" = s.id)
    AND NOT EXISTS (SELECT 1 FROM "RotativoMeasurement" WHERE "sessionId" = s.id);

-- Métricas de calidad
SELECT 
    "sessionId",
    "gpsTotal",
    "gpsValidas",
    "gpsSinSenal",
    ROUND("porcentajeGPSValido", 2) as "gpsValidoPct",
    "estabilidadTotal",
    "rotativoTotal"
FROM "DataQualityMetrics"
ORDER BY "createdAt" DESC
LIMIT 10;
```

---

## 📞 CONTACTO Y ESCALACIÓN

Si después de seguir este troubleshooting el problema persiste:

1. **Documentar el problema:**
   - Síntoma exacto
   - Pasos para reproducir
   - Logs relevantes
   - Archivos de prueba (si aplica)

2. **Crear issue** con toda la información

3. **No hacer workarounds** sin documentar

---

**Última actualización:** 2025-10-11

