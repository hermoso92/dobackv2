# 🚀 EJECUTAR POST-PROCESAMIENTO INMEDIATAMENTE

## ✅ **Tu procesamiento automático completó exitosamente:**
- ✅ 154 sesiones creadas
- ✅ 103 archivos procesados
- ✅ 0 errores
- ⏱️ 18 minutos de duración

---

## 📋 **Lo que falta (deshabilitado temporalmente):**

Durante el procesamiento automático, estas funcionalidades se deshabilitaron para mejorar la velocidad:

1. ⚠️ **Violaciones de velocidad** → Análisis de excesos de velocidad
2. ⚠️ **KPIs diarios** → Métricas por día (disponibilidad, tiempos, etc.)
3. ⚠️ **Eventos de geocercas** → Entradas/salidas de zonas definidas

---

## 🎯 **Ejecutar Ahora (3 opciones)**

### **Opción 1: Script PowerShell (MÁS FÁCIL)** ⭐

```powershell
# Copia y pega esto en PowerShell desde la raíz del proyecto:
.\scripts\postprocess.ps1 -ReportId "64b32f59-92cf-4039-b7f7-da16d7d7384d"
```

### **Opción 2: Comando directo**

```powershell
# Copia y pega esto:
npx ts-node backend/src/scripts/postProcessSessions.ts 64b32f59-92cf-4039-b7f7-da16d7d7384d
```

### **Opción 3: Manual paso a paso**

1. Abre PowerShell en la raíz del proyecto
2. Ejecuta:
   ```powershell
   npx ts-node backend/src/scripts/postProcessSessions.ts 64b32f59-92cf-4039-b7f7-da16d7d7384d
   ```
3. Espera ~12-15 minutos (154 sesiones × ~5s por sesión)
4. Verifica el log generado

---

## ⏱️ **Duración Estimada**

```
📊 Estimación para 154 sesiones:
   - Velocidad: ~0.2 sesiones/segundo
   - Tiempo total: ~12-15 minutos
   - Con optimizaciones aplicadas: ✅
```

---

## 📝 **¿Qué va a hacer?**

El script ejecutará **automáticamente**:

1. **Buscar las 154 sesiones** del reporte `64b32f59-92cf-4039-b7f7-da16d7d7384d`
2. **Procesar en lotes** de 5 sesiones en paralelo
3. **Por cada sesión**:
   - 🚗 Analizar violaciones de velocidad (muestreo: 1 punto cada 10)
   - 📊 Calcular KPIs diarios
   - 🗺️ Detectar eventos de geocercas
4. **Generar log detallado** en `backend/logs/processing/`
5. **Mostrar resumen final** con estadísticas

---

## 🛡️ **Optimizaciones Aplicadas**

✅ **Muestreo GPS**: 1 punto cada 10 (en lugar de todos) → 10x más rápido
✅ **Caché de límites**: Guardados 7 días → Evita llamadas repetidas
✅ **Fallback a OSM**: Si TomTom falla → Usa OpenStreetMap
✅ **Procesamiento paralelo**: 5 sesiones a la vez → 5x más rápido
✅ **Tolerante a errores**: Si falla una sesión, continúa con las demás

---

## 📊 **Verificar Resultados Después**

### **1. Ver el log generado**

```
backend/logs/processing/postprocess_64b32f59_2025-11-03T[timestamp].txt
```

### **2. Consultar violaciones de velocidad (SQL)**

```sql
SELECT COUNT(*) as total_violaciones
FROM speed_violations sv
JOIN session s ON s.id = sv.session_id
WHERE s.upload_batch_id = '64b32f59-92cf-4039-b7f7-da16d7d7384d';
```

### **3. Consultar KPIs calculados (SQL)**

```sql
SELECT * FROM daily_kpi 
WHERE date >= '2025-09-30' AND date <= '2025-11-02'
ORDER BY date DESC;
```

### **4. Ver en el Dashboard**

1. Ir a: http://localhost:5174
2. Login con credenciales admin
3. Navegar a **Reportes** o **Estabilidad**
4. Seleccionar vehículo **DOBACK028**
5. Ver período: **30/09/2025 - 02/11/2025**

---

## ⚠️ **Notas Importantes**

1. ✅ **Backend debe estar corriendo** en puerto 9998
2. ✅ **Base de datos debe estar disponible**
3. ✅ **No interrumpir el proceso** (puede dejar a medias)
4. ⚠️ **NO ejecutar múltiples veces** (duplicará datos)
5. 📝 **Revisar el log** si hay errores o advertencias

---

## 🔄 **Si algo falla**

### **Error: "No se encontraron sesiones"**
- Verifica que el Report ID sea correcto
- Consulta: `SELECT DISTINCT upload_batch_id FROM session ORDER BY created_at DESC LIMIT 5;`

### **Warnings: "Error en violaciones de velocidad"**
- Es normal para sesiones con pocos datos GPS
- El script continúa automáticamente

### **Muy lento (>20 minutos)**
- Reduce el batch size en el script (de 5 a 3)
- Aumenta el sampling rate (de 10 a 20)

---

## 📚 **Documentación Completa**

Ver: `docs/DESARROLLO/POST_PROCESAMIENTO_MANUAL.md`

---

## 🎉 **¡Listo para Ejecutar!**

Copia y pega en PowerShell:

```powershell
.\scripts\postprocess.ps1 -ReportId "64b32f59-92cf-4039-b7f7-da16d7d7384d"
```

**¡Eso es todo!** 🚀

