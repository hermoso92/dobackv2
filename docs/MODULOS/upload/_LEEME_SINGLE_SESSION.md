# 📦 Sistema de Subida de Sesión Individual - Implementado

## ✅ ¿Qué se ha implementado?

Se ha creado un **endpoint completo** para subir exactamente 3 archivos (ESTABILIDAD, GPS, ROTATIVO) y crear **una sesión individual** con validación estricta y post-procesamiento automático.

## 🎯 Características Principales

### Backend
✅ **Endpoint REST:** `POST /api/upload/single-session`
- Acepta exactamente 3 archivos
- Validación estricta (mismo vehículo, misma fecha, tipos correctos)
- Post-procesamiento automático (eventos, segmentos, velocidades)
- Respuesta detallada con información completa de la sesión

### Frontend
✅ **Componente React:** `SingleSessionUpload.tsx`
- Interfaz visual intuitiva
- Validación en tiempo real
- Selector de archivos con preview
- Resultado detallado con estadísticas
- Manejo de errores claro

✅ **Ruta:** `/upload-single`
- Integrada en el sistema de rutas protegidas
- Accesible desde el menú de la aplicación

## 📂 Archivos Creados/Modificados

### Backend
```
backend/src/routes/upload-unified.ts
  └─ Agregado: router.post('/single-session', ...)
     ├─ Validación de 3 archivos
     ├─ Validación de vehículo y fecha
     ├─ Procesamiento con UnifiedFileProcessor
     └─ Post-procesamiento automático
```

### Frontend
```
frontend/src/components/upload/SingleSessionUpload.tsx (NUEVO)
  └─ Componente completo con:
     ├─ Validación de archivos
     ├─ Preview de archivos seleccionados
     ├─ Subida con FormData
     └─ Resultado detallado

frontend/src/routes.tsx
  └─ Agregada ruta: /upload-single
```

### Documentación
```
docs/MODULOS/upload/ENDPOINT_SINGLE_SESSION.md (NUEVO)
  └─ Documentación completa del endpoint

docs/MODULOS/upload/_LEEME_SINGLE_SESSION.md (ESTE ARCHIVO)
  └─ Guía rápida de uso
```

### Testing
```
scripts/testing/test-single-session-upload.ps1 (NUEVO)
  └─ Script de prueba para PowerShell
```

## 🚀 Cómo Usar

### Opción 1: Desde el Frontend (Recomendado)

1. Inicia el sistema con `iniciar.ps1`
2. Abre el navegador en `http://localhost:5174`
3. Inicia sesión
4. Navega a `/upload-single`
5. Selecciona exactamente 3 archivos (ESTABILIDAD, GPS, ROTATIVO)
6. Haz clic en "Subir Sesión"
7. Espera el resultado con detalles de la sesión creada

### Opción 2: Desde Postman

1. Crea un POST a `http://localhost:9998/api/upload/single-session`
2. Headers: `Cookie: authToken=<tu-token>`
3. Body > form-data:
   - Key: `files` (File) → ESTABILIDAD_DOBACK001_20240101.txt
   - Key: `files` (File) → GPS_DOBACK001_20240101.txt
   - Key: `files` (File) → ROTATIVO_DOBACK001_20240101.txt
4. Send

### Opción 3: Desde cURL

```bash
curl -X POST http://localhost:9998/api/upload/single-session \
  -H "Cookie: authToken=tu-token" \
  -F "files=@ESTABILIDAD_DOBACK001_20240101.txt" \
  -F "files=@GPS_DOBACK001_20240101.txt" \
  -F "files=@ROTATIVO_DOBACK001_20240101.txt"
```

### Opción 4: Script de Prueba

```powershell
cd scripts/testing
.\test-single-session-upload.ps1
```

## 📊 Ejemplo de Respuesta

```json
{
  "success": true,
  "message": "Sesión individual creada exitosamente",
  "vehiculo": "DOBACK001",
  "fecha": "20240101",
  "sesionCreada": true,
  "sessionId": "uuid-sesion",
  "data": {
    "sesionesCreadas": 1,
    "sessionIds": ["uuid-sesion"],
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
      "sessionId": "uuid-sesion",
      "sessionNumber": 1,
      "vehicleIdentifier": "DOBACK001",
      "startTime": "2024-01-01T10:00:00Z",
      "endTime": "2024-01-01T11:30:00Z",
      "durationFormatted": "1h 30m",
      "stabilityDataCount": 1234,
      "gpsDataCount": 567,
      "eventsGenerated": 15,
      "segmentsGenerated": 8
    }
  }
}
```

## ⚠️ Validaciones

El endpoint valida automáticamente:
- ✅ Exactamente 3 archivos (no más, no menos)
- ✅ Los 3 archivos del mismo vehículo
- ✅ Los 3 archivos de la misma fecha
- ✅ Tipos correctos: ESTABILIDAD, GPS, ROTATIVO
- ✅ Formato de nombre: `TIPO_DOBACK###_YYYYMMDD.txt`

Si alguna validación falla, recibirás un error claro explicando el problema.

## 🎯 Casos de Uso

1. **Subida manual controlada** - Cuando necesitas subir una sesión específica
2. **Testing y validación** - Para probar el procesamiento con datos conocidos
3. **Demos** - Mostrar el flujo completo con datos controlados
4. **Re-procesamiento** - Volver a procesar una sesión (después de borrarla)

## 🔍 Diferencias con `/upload/unified`

| Característica | `/single-session` | `/unified` |
|---------------|-------------------|------------|
| **Archivos** | Exactamente 3 | Hasta 20 |
| **Validación** | Estricta | Flexible |
| **Sesiones** | Siempre 1 | Puede crear múltiples |
| **Uso** | Casos específicos | Subida masiva |

## 🐛 Troubleshooting

### Error: "Se requieren exactamente 3 archivos"
- Asegúrate de subir exactamente 3 archivos

### Error: "Los 3 archivos deben ser del mismo vehículo"
- Verifica que los archivos tengan el mismo número de vehículo (ej: DOBACK001)

### Error: "Los 3 archivos deben ser de la misma fecha"
- Verifica que los archivos tengan la misma fecha (ej: 20240101)

### Error: "Se requieren archivos ESTABILIDAD, GPS y ROTATIVO"
- Asegúrate de subir un archivo de cada tipo
- No puedes subir 2 GPS y 1 ESTABILIDAD, por ejemplo

### Error: "Formato de archivo inválido"
- El formato debe ser: `TIPO_DOBACK###_YYYYMMDD.txt`
- Ejemplos válidos:
  - `ESTABILIDAD_DOBACK001_20240101.txt`
  - `GPS_DOBACK123_20231225.txt`
  - `ROTATIVO_DOBACK999_20240615.txt`

## 📚 Más Información

- [Documentación completa del endpoint](./ENDPOINT_SINGLE_SESSION.md)
- [Sistema de upload unificado](./SISTEMA_UPLOAD_UNIFICADO.md)
- [UnifiedFileProcessor](../../BACKEND/SERVICIOS/UNIFIED_FILE_PROCESSOR.md)

## ✅ Estado

**✅ IMPLEMENTADO Y FUNCIONAL**

Todos los componentes han sido creados, integrados y están listos para usar.

---

**Fecha de implementación:** 16 de octubre de 2025
**Versión:** 1.0.0

