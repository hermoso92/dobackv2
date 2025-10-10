# Guía de Integración - Upload → Estados Operativos

## 📋 Resumen

El `StateProcessorService` **NO está conectado automáticamente** con el sistema de upload actual (TypeScript/Node.js). Se requiere integración manual para generar intervalos de estados después de procesar archivos.

## 🔌 Servicios Creados para Integración

### 1. **UploadIntegrationService** (`upload_integration_service.py`)
Servicio que:
- Obtiene datos de geocercas, GPS y rotativo después del upload
- Llama a `StateProcessorService` para generar intervalos
- Maneja errores y logging

### 2. **Upload Hook API** (`api/v1/upload_hook.py`)
Endpoints para activar el procesamiento:

```
POST /api/v1/upload/process-states
  Body: { "vehicle_id": "DOBACK023", "date": "2025-01-15" }
  → Procesa estados de un día específico

POST /api/v1/upload/batch-process-states
  Body: { "vehicles": [{"vehicle_id": "...", "date": "..."}] }
  → Procesa múltiples días en batch
```

## 🔄 Opciones de Integración

### Opción 1: Llamada Manual desde Frontend (Temporal)

Después de que el upload termine exitosamente, hacer una llamada adicional:

```typescript
// En el componente de upload, después de subir archivos exitosamente
async function onUploadSuccess(vehicleId: string, date: string) {
    try {
        // Subir archivos (ya existe)
        await uploadFiles(files);
        
        // NUEVO: Procesar estados
        await fetch('/api/v1/upload/process-states', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                date: date
            })
        });
        
        console.log('✅ Estados procesados correctamente');
    } catch (error) {
        console.error('❌ Error procesando estados:', error);
    }
}
```

### Opción 2: Job Asíncrono (Recomendado para Producción)

Crear un job que se ejecute periódicamente:

```python
# backend/jobs/process_states_job.py

from datetime import datetime, timedelta
from backend.config.database import get_db
from backend.services.upload_integration_service import UploadIntegrationService

def process_pending_states():
    """
    Job que procesa estados de archivos subidos recientemente.
    Ejecutar cada hora o después de cada batch de uploads.
    """
    db = next(get_db())
    integration_service = UploadIntegrationService(db)
    
    # Obtener vehículos/fechas procesados en las últimas 24h
    # que no tienen estados generados
    pending = get_pending_processing()
    
    for vehicle_id, org_id, date in pending:
        integration_service.process_uploaded_day(vehicle_id, org_id, date)
```

### Opción 3: Webhook/Callback desde TypeScript Backend

Modificar el upload controller de TypeScript para llamar al endpoint Python:

```typescript
// En backend/src/controllers/dataController.ts

public async uploadFile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
        // ... código existente de upload ...
        
        // Procesar archivo
        await dataProcessor.processFile(filePath, req.user.id);
        
        // NUEVO: Trigger procesamiento de estados
        await this.triggerStateProcessing(vehicleId, date);
        
        res.status(200).json({
            message: 'File uploaded and processed successfully',
            path: filePath
        });
    } catch (error: any) {
        // ...
    }
}

private async triggerStateProcessing(vehicleId: string, date: string) {
    try {
        await fetch('http://localhost:9998/api/v1/upload/process-states', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                vehicle_id: vehicleId,
                date: date
            })
        });
    } catch (error) {
        logger.warn('Error triggering state processing:', error);
        // No fallar el upload si esto falla
    }
}
```

## 📊 Flujo Completo

```
Usuario sube archivos
  ↓
Backend TypeScript/Node.js procesa archivos
  ↓
Guarda datos en BD (GPS, rotativo, geocercas)
  ↓
[INTEGRACIÓN NECESARIA AQUÍ]
  ↓
POST /api/v1/upload/process-states
  ↓
UploadIntegrationService obtiene datos
  ↓
StateProcessorService genera intervalos
  ↓
Guarda en tabla vehicle_state_intervals
  ↓
KPIs disponibles en dashboard
```

## ✅ Recomendación

Para implementar **ahora mismo** con mínimo esfuerzo:

1. **Usar Opción 1** (llamada desde frontend) como solución temporal
2. Monitorear logs para verificar que funciona
3. Implementar **Opción 2** (job asíncrono) para producción

## 🧪 Probar la Integración

1. **Subir archivos de ejemplo**
```bash
# Usar el componente de upload del frontend
# O hacer un POST manual a /api/upload
```

2. **Llamar al endpoint de procesamiento**
```bash
curl -X POST http://localhost:9998/api/v1/upload/process-states \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"vehicle_id": "DOBACK023", "date": "2025-01-15"}'
```

3. **Verificar KPIs en dashboard**
```bash
# Los datos deberían aparecer en el dashboard
# Y los endpoints de KPIs deberían devolver datos reales
```

## 📝 Estado Actual

- ✅ StateProcessorService implementado
- ✅ KPI Service implementado
- ✅ API endpoints de KPIs funcionando
- ✅ Frontend conectado a KPIs
- ✅ Upload Integration Service creado
- ✅ Upload Hook endpoints creados
- ❌ **Integración automática NO implementada** (requiere elegir opción)

## 🔜 Siguiente Paso

**Decidir qué opción de integración usar** y implementarla según las necesidades del proyecto.

