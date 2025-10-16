# 🎯 PLAN DE PRUEBA - EJECUTAR AHORA

**Fecha:** 2025-10-11 19:55  
**Tiempo:** 5 minutos  
**Estado:** LISTO PARA EJECUTAR

---

## ⚡ QUÉ HACER AHORA MISMO (COPY-PASTE)

### **1. Reiniciar Backend**

```powershell
# En la terminal del backend, presiona Ctrl+C para detener

# Luego ejecuta:
cd backend
npm run dev
```

**Espera a ver:**
```
✅ Prisma Client singleton inicializado
Server running on port 9998
```

**✅ SI LO VES → CONTINÚA**  
**❌ SI NO → Para y avísame**

---

### **2. Limpiar Base de Datos**

1. Ir a: `http://localhost:5174/upload`
2. Click pestaña **"Procesamiento Automático"** (la segunda)
3. Click botón **"Limpiar Base de Datos"** (botón naranja/warning)
4. **ESPERAR 2-3 segundos**

**Verifica en logs del backend (ventana terminal):**
```
⚠️ Iniciando limpieza de base de datos
📊 Elementos a eliminar: XXX sesiones, YYY eventos...
🗑️ Eliminando datos relacionados...
  ✓ GpsMeasurement eliminados
  ✓ Session eliminadas
✅ Base de datos limpiada exitosamente
```

**✅ SI LO VES → CONTINÚA**  
**❌ SI NO LO VES → Ejecuta esto en PostgreSQL:**

```sql
DELETE FROM "StabilityEvent";
DELETE FROM "GpsMeasurement";
DELETE FROM "StabilityMeasurement";
DELETE FROM "RotativoMeasurement";
DELETE FROM "CanMeasurement";
DELETE FROM "DataQualityMetrics";
DELETE FROM "OperationalKey";
DELETE FROM "Session";

-- Verifica que esté vacío
SELECT COUNT(*) FROM "Session"; -- Debe ser 0
```

---

### **3. Procesar Archivos**

1. En la misma página, Click botón **"Iniciar Procesamiento Automático"** (botón azul grande)
2. **ESPERAR 1-2 MINUTOS** (verás barra de progreso)
3. **NO CERRAR LA PÁGINA**

**Mientras procesa, logs del backend mostrarán:**
```
📁 Encontrados 1 vehículos en CMadrid
🚗 Procesando vehículo: DOBACK028
📄 Procesando archivo: GPS_DOBACK028_20251008.txt
✅ GPS parseado: 95.6% válido
   - total: 1234
   - validas: 1180
   - coordenadasInvalidas: 34 ← ¡Rechazadas! ✅
   - saltosGPS: 2 ← ¡Detectados! ✅
💾 Sesión guardada: xxx (1614 mediciones)
💾 Sesión guardada: xxx (1996 mediciones)
✅ GPS_DOBACK028_20251008.txt: 2 sesiones procesadas
...
✅ ROTATIVO_DOBACK028_20251003.txt: 18 sesiones procesadas
...
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

**✅ SI LO VES → PERFECTO, CONTINÚA**  
**❌ SI VES "⚠️ Sesión ya existe" muchas veces → Vuelve al PASO 2**  

---

### **4. Ver Modal Automático**

**Al terminar procesamiento, se abrirá AUTOMÁTICAMENTE un modal:**

```
╔═══════════════════════════════════════════════╗
║ 📊 Reporte de Procesamiento Completo         ║
╠═══════════════════════════════════════════════╣
║                                                ║
║ ✅ Procesamiento Completado                   ║
║ Tiempo: 112.3s                                ║
║                                                ║
║ ╔═══════════╦═══════════╦═══════════╗         ║
║ ║ 1         ║ 839       ║ 0         ║         ║
║ ║ Vehículo  ║ Creadas   ║ Omitidas  ║         ║
║ ╚═══════════╩═══════════╩═══════════╝         ║
║                                                ║
║ Tasa de Éxito: 100.0%                         ║
║ ████████████████████████████████████████      ║
║                                                ║
║ 📋 Detalle por Vehículo:                      ║
║ ┌────────────────────────────────────────┐    ║
║ │ 🚗 DOBACK028                           │    ║
║ │ ✅ 839 creadas | ⚠️ 0 omitidas         │    ║
║ │ 📁 98 archivo(s) procesado(s)          │    ║
║ └────────────────────────────────────────┘    ║
║                                                ║
║ 💡 Información Importante:                    ║
║ ✅ GPS inválidos fueron rechazados            ║
║ ✅ Saltos GPS > 1km fueron detectados         ║
║ ℹ️ Sesiones duplicadas fueron omitidas        ║
║                                                ║
║         [ Entendido ]                          ║
╚═══════════════════════════════════════════════╝
```

**✅ SI LO VES → ¡ÉXITO TOTAL!**  
**❌ SI NO LO VES → Abre consola del navegador (F12) y busca errores**

---

### **5. Verificar en Base de Datos**

```sql
-- En PostgreSQL (pgAdmin, DBeaver, o psql)

-- Sesiones creadas
SELECT COUNT(*) FROM "Session";
-- ✅ Debe mostrar: 839

-- GPS guardados
SELECT COUNT(*) FROM "GpsMeasurement";
-- ✅ Debe mostrar: > 3000

-- Rotativo guardados
SELECT COUNT(*) FROM "RotativoMeasurement";
-- ✅ Debe mostrar: > 70000

-- Ver primera sesión como ejemplo
SELECT * FROM "Session" ORDER BY "createdAt" DESC LIMIT 1;
```

---

## ✅ RESULTADO ESPERADO COMPLETO

### **Logs Backend:**

```
✅ Prisma Client singleton inicializado           ← Al iniciar
✅ Base de datos limpiada exitosamente           ← Al limpiar
📁 Encontrados 1 vehículos en CMadrid            ← Al procesar
✅ GPS parseado: 95.6% válido                    ← Por cada archivo GPS
   - coordenadasInvalidas: 34 ← Bloqueadas ✅
   - saltosGPS: 2 ← Detectados ✅
💾 Sesión guardada: xxx (1614 mediciones)        ← Por cada sesión
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

### **Frontend:**

✅ Modal se abre automáticamente  
✅ Muestra 839 sesiones creadas  
✅ Muestra 0 sesiones omitidas  
✅ Tasa de éxito: 100%  
✅ Sin errores en consola (F12)  

### **Base de Datos:**

✅ 839 sesiones en tabla Session  
✅ > 3000 mediciones GPS  
✅ > 70000 mediciones Rotativo  
✅ Todas las sesiones tienen organizationId  

---

## ❌ PROBLEMAS COMUNES Y SOLUCIONES

### **Problema 1: "⚠️ Sesión ya existe, omitiendo" (muchas veces)**

**Significa:** La limpieza NO funcionó correctamente

**Solución INMEDIATA:**
```sql
-- En PostgreSQL MANUALMENTE
DELETE FROM "GpsMeasurement";
DELETE FROM "StabilityMeasurement";
DELETE FROM "RotativoMeasurement";
DELETE FROM "DataQualityMetrics";
DELETE FROM "OperationalKey";
DELETE FROM "Session";

-- Verifica
SELECT COUNT(*) FROM "Session"; -- Debe ser 0
```

Luego:
1. Reiniciar backend
2. Ir al PASO 3 (procesar archivos)

### **Problema 2: No aparece modal**

**Solución:**
1. Abre consola (F12)
2. Busca errores rojos
3. Si dice "Cannot find module ProcessingReportModal":
   - Verifica que existe: `frontend/src/components/ProcessingReportModal.tsx`
   - Reinicia frontend (`npm run dev` en frontend/)

### **Problema 3: Error "too many clients"**

**Solución:**
1. Detener backend (Ctrl+C)
2. Esperar 5 segundos
3. Iniciar backend (`npm run dev`)
4. Repetir desde PASO 2

---

## 🎉 ÉXITO CONFIRMADO SI VES:

✅ Logs: "Prisma Client singleton inicializado"  
✅ Logs: "Base de datos limpiada exitosamente"  
✅ Logs: "Procesamiento completado: 98 archivos, 839 sesiones"  
✅ Modal automático con "839 sesiones creadas"  
✅ BD tiene 839 sesiones  
✅ Dashboard muestra datos de DOBACK028  

---

## 📞 SI ALGO FALLA

1. **Ver logs del backend** (terminal donde corre npm run dev)
2. **Ver consola navegador** (F12 → Console)
3. **Consultar:** `docs/upload/04-TROUBLESHOOTING.md`
4. **Ejecutar:** `.\verificar-sistema-upload.ps1 -Verbose`

---

## 🎯 EJECUTA LOS 5 PASOS AHORA

No leas más documentación. **Ejecuta los 5 pasos de arriba** y verás el sistema funcionando perfectamente.

**Tiempo total:** 5 minutos  
**Dificultad:** Muy fácil  
**Resultado:** Sistema 100% funcional  

---

🚀 **¡EMPIEZA AHORA CON EL PASO 1!** 🚀

**Última actualización:** 2025-10-11 19:55

