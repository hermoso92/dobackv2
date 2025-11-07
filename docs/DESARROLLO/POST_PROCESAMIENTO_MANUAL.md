# 🔧 POST-PROCESAMIENTO MANUAL DE SESIONES

## 📋 **¿Qué es esto?**

Durante el procesamiento automático, algunas funcionalidades se deshabilitan temporalmente para mejorar la velocidad:

- ⚠️ **Violaciones de velocidad** → Llamadas lentas a TomTom API
- ⚠️ **Cálculo de KPIs diarios** → Procesamiento pesado por sesión
- ⚠️ **Eventos de geocercas** → Procesamiento pesado por sesión

Este script permite **ejecutar estas funcionalidades manualmente** sobre sesiones ya creadas, con optimizaciones aplicadas.

---

## ⚡ **Optimizaciones Aplicadas**

### **1. Violaciones de Velocidad**
- ✅ **Muestreo inteligente**: 1 punto cada 10 (en lugar de todos)
- ✅ **Caché agresivo**: Límites de velocidad guardados 7 días
- ✅ **Fallback a OSM**: Si TomTom falla, usa OpenStreetMap
- ✅ **Procesamiento en paralelo**: 5 sesiones simultáneamente

### **2. KPIs y Geocercas**
- ✅ **Procesamiento en lotes**: 5 sesiones en paralelo
- ✅ **Logging robusto**: Archivo de log detallado
- ✅ **Tolerante a errores**: Si una sesión falla, continúa con las demás

---

## 🚀 **Uso Rápido**

### **Opción 1: Script PowerShell (Recomendado)**

```powershell
# Desde la raíz del proyecto
.\scripts\postprocess.ps1 -ReportId "64b32f59-92cf-4039-b7f7-da16d7d7384d"
```

### **Opción 2: Script TypeScript directo**

```bash
npx ts-node backend/src/scripts/postProcessSessions.ts 64b32f59-92cf-4039-b7f7-da16d7d7384d
```

---

## 📊 **Ejemplo de Ejecución**

```
========================================
  🚀 POST-PROCESAMIENTO DE SESIONES
========================================

Reporte ID: 64b32f59-92cf-4039-b7f7-da16d7d7384d
Violaciones de velocidad: SÍ
KPIs diarios: SÍ
Geocercas: SÍ
Tamaño de batch: 5
Muestreo GPS: 1 cada 10 puntos

============================================================
📦 Buscando sesiones del reporte...
✅ Encontradas 154 sesiones

============================================================
  BATCH 1/31 (5 sesiones)
============================================================

🔄 Procesando sesión a7b3c4d5...
   Vehículo: DOBACK028
   Fecha: 2025-09-30
   🚗 Analizando violaciones de velocidad (muestreo: 1/10)...
   ✅ Violaciones: 3
   ✅ Distancia: 12345.67m
   ✅ Confianza: 95.2%
   📊 Calculando KPIs...
   ✅ KPIs calculados
   🗺️ Procesando geocercas...
   ✅ Geocercas procesadas (147 puntos GPS)
   ⏱️ Duración: 4.32s

📈 Progreso: 5/154 (3.2%)
   ✅ Exitosas: 5
   ❌ Errores: 0
   ⚠️ Advertencias: 0

[... procesando ...]

============================================================
  RESUMEN FINAL
============================================================
Total de sesiones: 154
Procesadas exitosamente: 154
Errores: 0
Advertencias: 2
Duración: 12.45 minutos (747s)
Velocidad: 0.21 sesiones/segundo

✅ POST-PROCESAMIENTO COMPLETADO EXITOSAMENTE
📝 Log completo: backend/logs/processing/postprocess_64b32f59_2025-11-03T12-30-00.txt
```

---

## ⚙️ **Configuración Personalizada**

Si quieres ajustar los parámetros, edita el archivo `backend/src/scripts/postProcessSessions.ts`:

```typescript
const options: PostProcessOptions = {
  reportId,
  enableSpeedViolations: true,    // ✅ Habilitar violaciones de velocidad
  enableKPIs: true,                // ✅ Habilitar KPIs
  enableGeofences: true,           // ✅ Habilitar geocercas
  batchSize: 5,                    // Procesar 5 sesiones en paralelo
  samplingRate: 10,                // Muestreo GPS: 1 punto cada 10
};
```

### **Parámetros Ajustables**

| Parámetro | Descripción | Valor por defecto | Recomendación |
|-----------|-------------|-------------------|---------------|
| `enableSpeedViolations` | Calcular violaciones de velocidad | `true` | ✅ Dejar en `true` |
| `enableKPIs` | Calcular KPIs diarios | `true` | ✅ Dejar en `true` |
| `enableGeofences` | Detectar eventos de geocercas | `true` | ✅ Dejar en `true` |
| `batchSize` | Sesiones en paralelo | `5` | 3-10 según RAM |
| `samplingRate` | Muestreo GPS (1 cada N) | `10` | 5-20 según precisión |

---

## 📝 **Obtener el Report ID**

### **Desde los logs del procesamiento automático**

```
[12:16:15] Log guardado en: C:\...\processing_64b32f59-92cf-4039-b7f7-da16d7d7384d_2025-11-03T11-58-06.txt
                                        ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
                                                  Este es el Report ID
```

### **Desde la base de datos**

```sql
-- Obtener el último reporte procesado
SELECT DISTINCT upload_batch_id 
FROM session 
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC 
LIMIT 1;
```

---

## 🔍 **Verificar Resultados**

### **1. Ver violaciones de velocidad**

```sql
SELECT s.id, v.plateNumber, sv.* 
FROM speed_violations sv
JOIN session s ON s.id = sv.session_id
JOIN Vehicle v ON v.id = s.vehicleId
WHERE s.upload_batch_id = '64b32f59-92cf-4039-b7f7-da16d7d7384d'
ORDER BY sv.timestamp DESC;
```

### **2. Ver KPIs calculados**

```sql
SELECT * 
FROM daily_kpi 
WHERE date >= '2025-09-30' AND date <= '2025-11-02'
ORDER BY date DESC;
```

### **3. Ver eventos de geocercas**

```sql
SELECT ge.*, g.name as geofence_name
FROM geofence_event ge
JOIN Geofence g ON g.id = ge.geofenceId
WHERE ge.timestamp >= '2025-09-30'
ORDER BY ge.timestamp DESC;
```

---

## ⚠️ **Solución de Problemas**

### **Error: "No se encontraron sesiones para el reporte"**

**Causa**: El Report ID no existe o es incorrecto.

**Solución**:
1. Verifica el Report ID en los logs del procesamiento automático
2. O consulta la base de datos para obtener el correcto

### **Error: "TomTom API key inválida"**

**Causa**: La API key de TomTom no está configurada o es inválida.

**Solución**:
- El sistema automáticamente usará **OSM como fallback** ✅
- No es necesario hacer nada, el procesamiento continuará

### **Warnings: "Error en violaciones de velocidad"**

**Causa**: Sesiones sin puntos GPS o con datos insuficientes.

**Solución**:
- Es normal si algunas sesiones tienen pocos datos GPS
- El script continúa con las demás sesiones

### **Procesamiento muy lento**

**Causa**: Demasiadas sesiones en paralelo o muestreo bajo.

**Solución**:
1. Reduce `batchSize` de 5 a 3
2. Aumenta `samplingRate` de 10 a 20
3. Deshabilita funcionalidades no críticas

---

## 📈 **Rendimiento Esperado**

### **Con 154 sesiones (como en el ejemplo)**

- **Sin optimizaciones**: ~9 horas ❌
- **Con optimizaciones**: ~12-15 minutos ✅
- **Mejora**: ~36x más rápido

### **Factores que afectan el rendimiento**

1. **Cantidad de puntos GPS por sesión**: Más puntos = más lento
2. **Calidad de la conexión a internet**: Para TomTom API y OSM
3. **Carga del servidor PostgreSQL**: Si hay otras consultas activas
4. **RAM disponible**: Para procesamiento en paralelo

---

## 🎯 **Recomendaciones**

1. ✅ **Ejecutar en horario de baja actividad** (noche/fin de semana)
2. ✅ **Monitorear los logs** mientras se ejecuta
3. ✅ **Hacer backup de la BD** antes de ejecutar (opcional)
4. ✅ **Verificar resultados** después de completar
5. ❌ **NO ejecutar múltiples veces sobre el mismo reporte** (duplicará datos)

---

## 📚 **Ver También**

- [Procesamiento Automático](../00-INICIO/PROCESAMIENTO_AUTOMATICO.md)
- [Optimización de APIs](./OPTIMIZACION_APIS.md)
- [Arquitectura de Geoprocesamiento](../BACKEND/geoprocesamiento.md)

