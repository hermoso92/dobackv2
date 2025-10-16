# 🔧 TROUBLESHOOTING - UPLOAD

**Versión:** 2.0  
**Fecha:** 2025-10-11

---

## 🚨 PROBLEMA: "Sesión ya existe, omitiendo"

### **Síntoma:**
```
info: ⚠️ Sesión ya existe, omitiendo: xxx
info: ⚠️ Sesión ya existe, omitiendo: yyy
info: ⚠️ Sesión ya existe, omitiendo: zzz
...
info: ✅ Procesamiento completado: 98 archivos, 839 sesiones
```

Pero en el frontend muestra: "0 sesiones creadas, 839 omitidas"

### **Causa:**
El botón "Limpiar Base de Datos" NO limpió correctamente la base de datos.

### **Solución:**

#### **Opción 1: Limpiar desde Backend**

```sql
-- En PostgreSQL (pgAdmin, psql, o DBeaver)

-- Eliminar datos en orden
DELETE FROM "StabilityEvent";
DELETE FROM "GpsMeasurement";
DELETE FROM "StabilityMeasurement";
DELETE FROM "RotativoMeasurement";
DELETE FROM "CanMeasurement";
DELETE FROM "DataQualityMetrics";
DELETE FROM "OperationalKey";
DELETE FROM "Session";

-- Verificar
SELECT COUNT(*) FROM "Session"; -- Debe ser 0
```

#### **Opción 2: Reiniciar Backend y Probar**

```powershell
# Detener backend (Ctrl+C)
cd backend
npm run dev
```

Luego:
1. Ir a `/upload`
2. Click "Limpiar Base de Datos"
3. Esperar confirmación en logs: "✅ Base de datos limpiada"
4. Click "Iniciar Procesamiento"

### **Verificación:**

**Después de limpiar, logs deben mostrar:**
```
✅ Base de datos limpiada exitosamente
  ✓ StabilityEvent eliminados
  ✓ GpsMeasurement eliminados
  ✓ Session eliminadas
```

**Si no aparece:** Backend NO está usando el singleton Prisma correctamente.

---

## 🚨 PROBLEMA: "Too many database connections"

### **Síntoma:**
```
error: Too many database connections opened: 
FATAL: lo siento, ya tenemos demasiados clientes
```

### **Causa:**
Algún archivo está creando `new PrismaClient()` en lugar de usar el singleton.

### **Solución:**

Buscar y reemplazar en todos los archivos:

```typescript
// ❌ BUSCAR ESTO
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ✅ REEMPLAZAR POR ESTO
import { prisma } from '../lib/prisma';
```

**Verificar archivo específico:**
```powershell
# Buscar instancias de PrismaClient
grep -r "new PrismaClient" backend/src/
```

**Arreglar:**
```powershell
# Ejemplo: backend/src/routes/index.ts línea 752
# ANTES:
const { PrismaClient } = await import('@prisma/client');
const prisma = new PrismaClient();

# DESPUÉS:
const { prisma } = await import('../lib/prisma');
```

---

## 🚨 PROBLEMA: No se ve modal de reporte

### **Síntoma:**
Procesamiento termina pero no aparece el modal con el resumen.

### **Causa:**
1. Modal no se importó correctamente
2. Estado `showReportModal` no se actualiza
3. Componente ProcessingReportModal no existe

### **Solución:**

**Verificar import:**
```typescript
// En FileUploadManager.tsx línea 43
import ProcessingReportModal from './ProcessingReportModal';
```

**Verificar estado:**
```typescript
// Línea 126
const [showReportModal, setShowReportModal] = useState(false);
```

**Verificar actualización:**
```typescript
// En handleAutoProcess, línea 295
setShowReportModal(true); // ✅ Debe estar presente
```

**Verificar renderizado:**
```typescript
// Al final del componente, antes de </Box>
<ProcessingReportModal
    open={showReportModal}
    onClose={() => setShowReportModal(false)}
    results={autoProcessResults}
/>
```

---

## 🚨 PROBLEMA: GPS inválidos se procesan

### **Síntoma:**
```
info: ✅ GPS real procesado: 40.5754288, -355654.5833333
info: ✅ GPS real procesado: 0.575398, -3.927545
```

(Coordenadas claramente inválidas)

### **Causa:**
Validación GPS no está activa.

### **Solución:**

**Verificar `RobustGPSParser.ts`:**
```typescript
// Debe tener las 5 validaciones:

// 1. NaN
if (isNaN(lat) || isNaN(lon)) {
    contadores.coordenadasInvalidas++;
    continue; // ✅ DEBE TENER continue
}

// 2. (0,0)
if (lat === 0 || lon === 0) {
    contadores.coordenadasInvalidas++;
    continue; // ✅ DEBE TENER continue
}

// 3. Rango global
if (lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    contadores.coordenadasInvalidas++;
    continue; // ✅ DEBE TENER continue
}
```

**Logs esperados después de validación:**
```
⚠️ Longitud fuera de rango global (-180 a 180): -355654.58
⚠️ Latitud fuera de rango global (-90 a 90): 0.575398
✅ GPS parseado: 95.6% válido
   - coordenadasInvalidas: 34
```

---

## 🚨 PROBLEMA: Procesamiento muy lento

### **Síntoma:**
Procesar 98 archivos tarda > 5 minutos.

### **Causa:**
1. Conexiones BD lentas
2. Batch size muy pequeño
3. Muchos archivos duplicados

### **Solución:**

**Aumentar batch size:**
```typescript
// En UnifiedFileProcessor.ts
const batchSize = 2000; // En lugar de 1000
```

**Verificar conexiones:**
```sql
SELECT count(*), state 
FROM pg_stat_activity 
WHERE datname = 'dobacksoft' 
GROUP BY state;
```

**Optimizar:**
- Procesar en paralelo cuando sea posible
- Usar índices en BD
- Reducir logging verbose

---

## 📋 QUERY SQL DE DIAGNÓSTICO

```sql
-- Estado actual del sistema
SELECT 
    'Sesiones' as tabla,
    COUNT(*) as total
FROM "Session"
UNION ALL
SELECT 'GPS', COUNT(*) FROM "GpsMeasurement"
UNION ALL
SELECT 'Estabilidad', COUNT(*) FROM "StabilityMeasurement"
UNION ALL
SELECT 'Rotativo', COUNT(*) FROM "RotativoMeasurement";

-- Sesiones sin mediciones (problema)
SELECT s.id, s."vehicleId", s."startTime",
    (SELECT COUNT(*) FROM "GpsMeasurement" WHERE "sessionId" = s.id) as gps,
    (SELECT COUNT(*) FROM "RotativoMeasurement" WHERE "sessionId" = s.id) as rotativo
FROM "Session" s
WHERE NOT EXISTS (
    SELECT 1 FROM "GpsMeasurement" WHERE "sessionId" = s.id
) AND NOT EXISTS (
    SELECT 1 FROM "RotativoMeasurement" WHERE "sessionId" = s.id
);
```

---

## ✅ CHECKLIST RÁPIDO

Si algo falla:

- [ ] Backend está corriendo (puerto 9998)
- [ ] Frontend está corriendo (puerto 5174)
- [ ] PostgreSQL está corriendo
- [ ] Singleton Prisma está siendo usado
- [ ] Logs muestran "Prisma Client singleton inicializado"
- [ ] No hay errores de "too many clients"
- [ ] Archivos existen en `backend/data/CMadrid`
- [ ] Usuario está autenticado

---

**Si el problema persiste, consultar logs del backend y ejecutar queries SQL de diagnóstico**

