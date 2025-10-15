# 🚀 INICIO RÁPIDO - SISTEMA DE UPLOAD

**Tiempo:** 5 minutos  
**Fecha:** 2025-10-11

---

## 🎯 PARA USUARIOS

### **Paso 1: Limpiar Base de Datos (PRIMERO)**

1. Ir a `http://localhost:5174/upload`
2. Clic en pestaña **"Procesamiento Automático"**
3. Clic en **"Limpiar Base de Datos"** (botón naranja)
4. Esperar confirmación en pantalla

**Resultado esperado:**
```
✅ Base de datos limpiada correctamente
Eliminados: X sesiones, Y GPS, Z rotativo
```

### **Paso 2: Procesar Archivos**

1. Clic en **"Iniciar Procesamiento Automático"** (botón azul grande)
2. Esperar 1-2 minutos (verás barra de progreso)
3. Ver modal de reporte automático

**Resultado esperado:**
```
📊 Reporte de Procesamiento Completo

✅ Procesamiento Completado
1 Vehículos | 839 Sesiones Creadas | 0 Omitidas

Tasa de Éxito: 100% ████████████████████
```

### **Paso 3: Verificar Datos**

1. Ir a Panel de Control (`/`)
2. Seleccionar vehículo DOBACK028
3. Ver KPIs actualizados
4. Ver mapa con datos GPS

---

## 🔧 PARA DESARROLLADORES

### **Verificar Sistema:**

```powershell
# Ejecutar script de verificación
.\verificar-sistema-upload.ps1 -Verbose
```

### **Reiniciar Backend:**

```powershell
cd backend

# Detener (Ctrl+C)
# Iniciar
npm run dev
```

**Verificar logs:**
```
✅ Prisma Client singleton inicializado
Server running on port 9998
```

### **Ejecutar Tests:**

```powershell
cd backend
npm test -- uploadValidator.test.ts
```

**Resultado esperado:** 80+ tests pasando al 100%

---

## 📊 LOGS ESPERADOS

### **Al Limpiar BD:**

```
⚠️ Iniciando limpieza de base de datos - OPERACIÓN DESTRUCTIVA
📊 Elementos a eliminar: 839 sesiones, 0 eventos, 3610 GPS...
🗑️ Eliminando datos relacionados...
  ✓ StabilityEvent eliminados
  ✓ GpsMeasurement eliminados
  ✓ Session eliminadas
✅ Base de datos limpiada exitosamente
```

### **Al Procesar Archivos:**

```
📁 Encontrados 1 vehículos en CMadrid
🚗 Procesando vehículo: DOBACK028
✅ GPS parseado: 95.6% válido
   - coordenadasInvalidas: 34 ← Rechazadas ✅
   - saltosGPS: 2 ← Detectados ✅
💾 Sesión guardada: xxx (1614 mediciones)
✅ ROTATIVO_DOBACK028_20251003.txt: 18 sesiones procesadas
✅ Procesamiento completado: 98 archivos, 839 sesiones
```

### **NO Deberías Ver:**

```
❌ error: Too many database connections ← ELIMINADO
❌ info: ⚠️ Sesión ya existe, omitiendo (después de limpiar) ← NO DEBE APARECER
❌ GPS inválidos procesados ← BLOQUEADOS
```

---

## ⚠️ SI ALGO FALLA

### **1. "Sesión ya existe" después de limpiar:**

**Solución inmediata:**
```sql
-- En PostgreSQL manualmente
DELETE FROM "StabilityEvent";
DELETE FROM "GpsMeasurement";
DELETE FROM "StabilityMeasurement";
DELETE FROM "RotativoMeasurement";
DELETE FROM "DataQualityMetrics";
DELETE FROM "OperationalKey";
DELETE FROM "Session";
```

Luego reiniciar backend y repetir.

### **2. No aparece modal de reporte:**

**Verificar en navegador (F12 → Console):**
- No debe haber errores rojos
- Debe ver: "✅ Procesamiento automático completado"

**Si falta el componente:**
```
Error: Cannot find module './ProcessingReportModal'
```

Crear el archivo `frontend/src/components/ProcessingReportModal.tsx`

### **3. Backend no responde:**

```powershell
# Verificar que está corriendo
curl http://localhost:9998/api/health

# Si no responde, reiniciar
cd backend
npm run dev
```

---

## ✅ TODO ESTÁ BIEN SI VES:

✅ Logs: "Base de datos limpiada exitosamente"  
✅ Logs: "Procesamiento completado: 98 archivos, 839 sesiones"  
✅ Modal se abre automáticamente  
✅ Modal muestra "839 sesiones creadas, 0 omitidas"  
✅ No hay errores de "too many clients"  
✅ GPS inválidos fueron rechazados  

---

**Última actualización:** 2025-10-11

