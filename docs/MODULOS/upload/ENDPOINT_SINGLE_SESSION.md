# 📦 Endpoint de Subida de Sesión Individual

## 📋 Descripción General

Este endpoint permite subir exactamente 3 archivos (ESTABILIDAD, GPS, ROTATIVO) para crear **una única sesión individual** con validación estricta y post-procesamiento automático.

## 🎯 Características

### ✅ Validaciones Estrictas
- Acepta **exactamente 3 archivos** (ni más, ni menos)
- Los 3 archivos deben ser del **mismo vehículo**
- Los 3 archivos deben ser de la **misma fecha**
- Los tipos deben ser: `ESTABILIDAD`, `GPS` y `ROTATIVO`
- Formato de archivo obligatorio: `TIPO_DOBACK###_YYYYMMDD.txt`

### 🔄 Post-Procesamiento Automático
Después de crear la sesión, se ejecuta automáticamente:
1. **Eventos de estabilidad** - Detección de eventos críticos
2. **Segmentos de claves operacionales** - Análisis de estados (clave 2, clave 5, etc.)
3. **Violaciones de velocidad** - Detección de excesos de velocidad

### 📊 Respuesta Detallada
- ID de sesión creada
- Detalles de la sesión (duración, puntos GPS, puntos de estabilidad)
- Estadísticas del post-procesamiento (eventos y segmentos generados)
- Invalidación automática de cache de KPIs

## 🚀 Uso del Endpoint

### Backend

**URL:** `POST /api/upload/single-session`

**Headers:**
```
Content-Type: multipart/form-data
Cookie: authToken=<JWT_TOKEN>
```

**Body:**
```
FormData con 3 archivos en el campo 'files':
- ESTABILIDAD_DOBACK001_20240101.txt
- GPS_DOBACK001_20240101.txt
- ROTATIVO_DOBACK001_20240101.txt
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Sesión individual creada exitosamente",
  "vehiculo": "DOBACK001",
  "fecha": "20240101",
  "sesionCreada": true,
  "sessionId": "uuid-de-la-sesion",
  "data": {
    "sesionesCreadas": 1,
    "sessionIds": ["uuid-de-la-sesion"],
    "archivosValidos": 3,
    "estadisticas": {
      "stabilityPoints": 1234,
      "gpsPoints": 567,
      "rotativoPoints": 890
    },
    "postProcessing": {
      "eventsGenerated": 15,
      "segmentsGenerated": 8,
      "errors": [],
      "duration": "1.2s"
    },
    "sessionDetail": {
      "sessionId": "uuid-de-la-sesion",
      "sessionNumber": 1,
      "vehicleIdentifier": "DOBACK001",
      "startTime": "2024-01-01T10:00:00.000Z",
      "endTime": "2024-01-01T11:30:00.000Z",
      "durationSeconds": 5400,
      "durationFormatted": "1h 30m",
      "status": "CREADA",
      "stabilityDataCount": 5,
      "gpsDataCount": 5,
      "eventsGenerated": 15,
      "segmentsGenerated": 8,
      "events": [...]
    }
  }
}
```

**Errores comunes:**

```json
// 400 - No se subieron 3 archivos
{
  "success": false,
  "error": "Se requieren exactamente 3 archivos (ESTABILIDAD, GPS, ROTATIVO). Recibidos: 2"
}

// 400 - Vehículos diferentes
{
  "success": false,
  "error": "Los 3 archivos deben ser del mismo vehículo. Encontrados: 001, 002"
}

// 400 - Fechas diferentes
{
  "success": false,
  "error": "Los 3 archivos deben ser de la misma fecha. Encontradas: 20240101, 20240102"
}

// 400 - Tipos incorrectos
{
  "success": false,
  "error": "Se requieren archivos ESTABILIDAD, GPS y ROTATIVO. Recibidos: ESTABILIDAD, GPS, CAN"
}

// 500 - Error interno
{
  "success": false,
  "error": "Error procesando archivos",
  "message": "Detalle del error..."
}
```

## 🖥️ Uso del Frontend

### Ruta
`/upload-single`

### Componente
`SingleSessionUpload.tsx`

### Características del UI
- Selector de archivos con validación en tiempo real
- Visualización de archivos seleccionados con información parsed
- Validación automática antes de subir
- Indicador de progreso durante la subida
- Resultado detallado con información de la sesión creada
- Manejo de errores con mensajes claros

### Flujo de Usuario

1. **Seleccionar archivos**
   - Hacer clic en "Seleccionar archivos"
   - Elegir 3 archivos .txt con formato correcto
   - Los archivos se validan automáticamente

2. **Validación visual**
   - ✅ Verde: Archivos válidos, listos para subir
   - ⚠️ Amarillo: Falta algún archivo o hay errores de validación

3. **Subir sesión**
   - Hacer clic en "Subir Sesión"
   - Esperar procesamiento (con indicador de progreso)
   - Ver resultado con detalles de la sesión creada

4. **Resultado**
   - Session ID generado
   - Duración de la sesión
   - Puntos GPS y estabilidad
   - Eventos y segmentos generados

## 📝 Ejemplos de Uso

### Ejemplo con cURL

```bash
curl -X POST http://localhost:9998/api/upload/single-session \
  -H "Cookie: authToken=tu-jwt-token" \
  -F "files=@ESTABILIDAD_DOBACK001_20240101.txt" \
  -F "files=@GPS_DOBACK001_20240101.txt" \
  -F "files=@ROTATIVO_DOBACK001_20240101.txt"
```

### Ejemplo con JavaScript/Fetch

```javascript
const formData = new FormData();
formData.append('files', file1); // ESTABILIDAD
formData.append('files', file2); // GPS
formData.append('files', file3); // ROTATIVO

const response = await fetch('http://localhost:9998/api/upload/single-session', {
  method: 'POST',
  credentials: 'include',
  body: formData
});

const result = await response.json();
console.log('Sesión creada:', result);
```

### Ejemplo con Postman

1. Crear nueva request POST
2. URL: `http://localhost:9998/api/upload/single-session`
3. Headers: Cookie con authToken
4. Body > form-data:
   - Key: `files` (type: File) - ESTABILIDAD_DOBACK001_20240101.txt
   - Key: `files` (type: File) - GPS_DOBACK001_20240101.txt
   - Key: `files` (type: File) - ROTATIVO_DOBACK001_20240101.txt
5. Send

## 🔍 Diferencias con `/upload/unified`

| Característica | `/single-session` | `/unified` |
|---------------|-------------------|------------|
| Archivos | Exactamente 3 | Hasta 20 |
| Validación | Estricta (mismo vehículo y fecha) | Flexible (agrupa por vehículo/fecha) |
| Sesiones | Siempre 1 | Puede crear múltiples |
| Uso | Pruebas, casos específicos | Subida masiva |
| Respuesta | Detalles de la sesión única | Resumen de múltiples sesiones |

## ✅ Ventajas

1. **Validación estricta** - Garantiza que los 3 archivos correspondan a una sesión coherente
2. **Respuesta detallada** - Incluye información completa de la sesión creada
3. **Post-procesamiento automático** - Eventos y segmentos listos inmediatamente
4. **Ideal para pruebas** - Perfecta para validar datos de sesiones específicas
5. **Cache invalidado** - KPIs actualizados automáticamente

## 🎯 Casos de Uso

### 1. Subida Manual de Sesión Específica
Cuando quieres subir datos de una sesión particular con validación estricta.

### 2. Testing y Validación
Para probar el procesamiento de datos de una sesión conocida.

### 3. Re-procesamiento
Para volver a procesar datos de una sesión existente (previo borrado).

### 4. Demos y Presentaciones
Mostrar el flujo completo de subida y procesamiento con datos controlados.

## 🔧 Implementación Técnica

### Backend
- **Archivo:** `backend/src/routes/upload-unified.ts`
- **Endpoint:** `router.post('/single-session', ...)`
- **Procesador:** `UnifiedFileProcessor`
- **Post-procesador:** `UploadPostProcessor`

### Frontend
- **Archivo:** `frontend/src/components/upload/SingleSessionUpload.tsx`
- **Ruta:** `/upload-single`
- **Componente:** `<SingleSessionUpload />`

## 📚 Ver También

- [Sistema de Subida Unificado](./SISTEMA_UPLOAD_UNIFICADO.md)
- [UnifiedFileProcessor](../../BACKEND/SERVICIOS/UNIFIED_FILE_PROCESSOR.md)
- [Post-Procesamiento](../../BACKEND/SERVICIOS/POST_PROCESSOR.md)

