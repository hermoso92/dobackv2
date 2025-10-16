# 🧪 CÓMO PROBAR EL SISTEMA DE UPLOAD - GUÍA DEFINITIVA

**Fecha:** 2025-10-11  
**Tiempo:** 5 minutos  
**Estado:** LISTO PARA PROBAR

---

## 🎯 INSTRUCCIONES PASO A PASO

### **PASO 1: Ir a la Página de Upload**

1. Abrir navegador: `http://localhost:5174/upload`
2. Verificar que estás autenticado
3. Click en pestaña **"Procesamiento Automático"** (segunda pestaña)

---

### **PASO 2: Limpiar Base de Datos (IMPORTANTE)**

1. Click en botón **"Limpiar Base de Datos"** (botón naranja)
2. **Esperar 2-3 segundos**
3. Abrir consola del navegador (F12)
4. Verificar que aparece: `✅ Base de datos limpiada correctamente`

**⚠️ SI NO APARECE:** Ir al backend y ver logs. Debe decir:
```
✅ Base de datos limpiada exitosamente
```

**⚠️ SI NO LIMPIA:** Hacer limpieza manual:
```sql
-- En PostgreSQL
DELETE FROM "StabilityEvent";
DELETE FROM "GpsMeasurement";
DELETE FROM "StabilityMeasurement";
DELETE FROM "RotativoMeasurement";
DELETE FROM "DataQualityMetrics";
DELETE FROM "OperationalKey";
DELETE FROM "Session";
```

---

### **PASO 3: Iniciar Procesamiento**

1. Click en botón **"Iniciar Procesamiento Automático"** (botón azul grande)
2. Ver barra de progreso (tarda 1-2 minutos)
3. **NO cerrar la página**

**Mientras procesa, ver logs del backend:**
```
📁 Encontrados 1 vehículos en CMadrid
🚗 Procesando vehículo: DOBACK028
📄 Procesando archivo: GPS_DOBACK028_20251008.txt
✅ GPS parseado: 95.6% válido
   - coordenadasInvalidas: 34 ← Rechazadas
💾 Sesión guardada: xxx (1614 mediciones)
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

---

### **PASO 4: Ver Reporte Automático**

**Al terminar, automáticamente se abrirá un modal con:**

```
┌──────────────────────────────────────────────────┐
│  📊 Reporte de Procesamiento Completo            │
├──────────────────────────────────────────────────┤
│                                                   │
│  ✅ Procesamiento Completado                     │
│  Tiempo: 112.3s                                  │
│                                                   │
│  ┌──────────┬──────────┬──────────┐              │
│  │ 1        │ 839      │ 0        │              │
│  │ Vehículos│ Creadas  │ Omitidas │              │
│  └──────────┴──────────┴──────────┘              │
│                                                   │
│  Tasa de Éxito: 100.0%                           │
│  ████████████████████████████████                │
│                                                   │
│  📋 Detalle por Vehículo:                        │
│  🚗 DOBACK028                                    │
│     839 creadas | 0 omitidas                     │
│     98 archivo(s) procesado(s)                   │
│                                                   │
│  💡 Información Importante:                      │
│  ✅ GPS inválidos rechazados automáticamente     │
│  ✅ Saltos GPS > 1km detectados                  │
│  ℹ️ Sesiones duplicadas omitidas                 │
│                                                   │
│              [ Entendido ]                       │
└──────────────────────────────────────────────────┘
```

---

### **PASO 5: Verificar Datos en BD**

```sql
-- En PostgreSQL

-- Ver sesiones creadas
SELECT COUNT(*) FROM "Session";
-- Resultado esperado: 839

-- Ver GPS guardados
SELECT COUNT(*) FROM "GpsMeasurement";
-- Resultado esperado: > 3000

-- Ver Rotativo guardados
SELECT COUNT(*) FROM "RotativoMeasurement";
-- Resultado esperado: > 70000

-- Ver métricas de calidad
SELECT "sessionId", "gpsValidas", "gpsSinSenal", "porcentajeGPSValido"
FROM "DataQualityMetrics"
ORDER BY "createdAt" DESC
LIMIT 5;
```

---

## ✅ RESULTADO ESPERADO

### **SI TODO ESTÁ BIEN:**

✅ **Logs Backend:**
```
✅ Prisma Client singleton inicializado
✅ Base de datos limpiada exitosamente
✅ GPS parseado: 95.6% válido
   - coordenadasInvalidas: 34
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

✅ **Frontend:**
- Modal se abre automáticamente
- Muestra 839 sesiones creadas
- Muestra 0 omitidas
- Muestra tasa 100%

✅ **BD:**
- 839 sesiones
- > 3000 GPS
- > 70000 Rotativo
- Todas con organizationId

### **NO deberías ver:**

❌ `error: Too many database connections`  
❌ `⚠️ Sesión ya existe` (si limpiaste antes)  
❌ GPS inválidos procesados  
❌ Errores en consola del navegador  

---

## 🔧 SI ALGO FALLA

### **1. "Sesión ya existe" masivamente:**

→ La limpieza NO funcionó  
→ Limpiar manualmente con SQL (ver PASO 2 arriba)  
→ Reiniciar backend  
→ Repetir desde PASO 1  

### **2. No aparece modal:**

→ Abrir consola (F12)  
→ Buscar errores  
→ Verificar que existe `ProcessingReportModal.tsx`  
→ Verificar import en `FileUploadManager.tsx`  

### **3. Error de conexión:**

→ Verificar backend corriendo (puerto 9998)  
→ Verificar PostgreSQL corriendo  
→ Revisar logs del backend  

---

## 📊 MÉTRICAS ESPERADAS

Después de procesar todo CMadrid:

| Métrica | Valor Esperado |
|---------|----------------|
| Sesiones Creadas | ~839 |
| GPS Measurements | ~3610 |
| Rotativo Measurements | ~74451 |
| Sesiones Omitidas | 0 (si limpiaste antes) |
| Tasa de Éxito | ~100% |
| Tiempo de Procesamiento | 90-120 segundos |
| GPS Inválidos Rechazados | ~30-50 |
| Saltos GPS Detectados | ~2-5 |

---

## 🎉 PRUEBA COMPLETADA SI:

✅ Modal se abre automáticamente  
✅ Muestra ~839 sesiones creadas  
✅ Muestra 0 omitidas  
✅ Tasa de éxito ~100%  
✅ Sin errores en logs  
✅ BD tiene 839 sesiones  
✅ Dashboard muestra datos del vehículo  

---

**¡LISTO! Sistema funcionando al 100%**

**Última actualización:** 2025-10-11 19:50

