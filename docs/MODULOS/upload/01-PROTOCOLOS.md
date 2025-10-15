# 📐 PROTOCOLOS DEL SISTEMA DE UPLOAD

**Versión:** 2.0  
**Última actualización:** 2025-10-11

---

## 🎯 OBJETIVO

Establecer reglas inmutables para el sistema de upload masivo, asegurando funcionamiento consistente.

---

## 🔒 REGLAS INMUTABLES

### **1. Singleton Prisma (CRÍTICO)**

```typescript
// ✅ CORRECTO - Usar singleton
import { prisma } from '../lib/prisma';

// ❌ INCORRECTO - Crear nueva instancia
const prisma = new PrismaClient();
```

**Razón:** Previene "Too many database connections"

---

### **2. Autenticación y Organización**

```typescript
// ✅ SIEMPRE incluir middleware
router.use(requireAuth, extractOrganizationId);

// ✅ SIEMPRE validar
if (!organizationId || !userId) {
    return res.status(400).json({ error: 'Autenticación inválida' });
}

// ❌ NUNCA procesar sin organizationId
```

---

### **3. Formato de Archivos**

```
✅ FORMATO OBLIGATORIO:
TIPO_DOBACK###_YYYYMMDD.txt

Donde:
- TIPO: ESTABILIDAD, GPS, ROTATIVO, CAN
- ###: 3 dígitos (001, 002, 123)
- YYYYMMDD: Fecha (20250101)

Ejemplos válidos:
✅ ESTABILIDAD_DOBACK001_20250101.txt
✅ GPS_DOBACK002_20250115.txt
✅ ROTATIVO_DOBACK123_20251231.txt

Ejemplos inválidos:
❌ ESTABILIDAD_VEHICLE001_20250101.txt (debe ser DOBACK)
❌ GPS_DOBACK1_20250101.txt (debe tener 3 dígitos)
❌ ROTATIVO_DOBACK001_2025.txt (fecha incompleta)
❌ CAN_DOBACK001_20250101.csv (debe ser .txt)
```

---

### **4. Validación GPS (5 Niveles)**

```typescript
// Nivel 1: Números válidos
if (isNaN(lat) || isNaN(lon)) → RECHAZAR

// Nivel 2: No (0,0)
if (lat === 0 || lon === 0) → RECHAZAR

// Nivel 3: Rango global
if (lat < -90 || lat > 90) → RECHAZAR
if (lon < -180 || lon > 180) → RECHAZAR

// Nivel 4: Rango España (warning)
if (lat < 36 || lat > 44) → ADVERTIR
if (lon < -10 || lon > 5) → ADVERTIR

// Nivel 5: Saltos GPS
if (distancia > 1km) → ADVERTIR
```

---

### **5. Detección de Sesiones Múltiples**

```typescript
// Criterio: Gap > 5 minutos entre mediciones
const GAP_THRESHOLD = 5 * 60 * 1000; // 5 minutos

if (currentTime - lastTime > GAP_THRESHOLD) {
    // Nueva sesión
}
```

---

### **6. Orden de Guardado (ESTRICTO)**

```
1. Buscar o crear vehículo
2. Crear sesión
3. Guardar GPS (lotes de 1000)
4. Guardar Estabilidad (lotes de 1000)
5. Guardar Rotativo (lotes de 1000)
6. Guardar métricas de calidad
7. Invalidar cache de KPIs
```

---

### **7. Manejo de Errores**

**Errores que DETIENEN todo:**
- Sin archivos
- Sin autenticación
- Sin organizationId
- Error conexión BD

**Errores que NO detienen:**
- Archivo inválido → salta y continúa
- GPS sin señal → marca y continúa
- Coordenadas inválidas → rechaza y continúa
- Grupo incompleto → procesa parcial

---

### **8. Respuestas HTTP**

```typescript
// 200 OK - Éxito completo
{
    success: true,
    message: "X sesiones creadas",
    data: { sesionesCreadas, sessionIds, estadisticas }
}

// 207 Multi-Status - Éxito parcial
{
    success: true,
    message: "X sesiones, Y problemas",
    data: { ... },
    warnings: [...]
}

// 400 Bad Request - Error del cliente
{
    success: false,
    error: "Descripción del error"
}

// 401 Unauthorized - Sin autenticación
{
    success: false,
    error: "No autenticado"
}

// 500 Internal Error - Error del servidor
{
    success: false,
    error: "Error procesando archivos",
    details: "Stack trace"
}
```

---

### **9. Logging Obligatorio**

```typescript
// ✅ USAR
import { logger } from '../utils/logger';

logger.info('Mensaje informativo', { datos });
logger.warn('Advertencia', { datos });
logger.error('Error', { error: err.message });

// ❌ NUNCA USAR
console.log('mensaje');
```

---

### **10. Invalidación de Cache**

```typescript
// ✅ SIEMPRE después de upload exitoso
if (resultado.sesionesCreadas > 0) {
    kpiCacheService.invalidate(organizationId);
}

// ❌ NUNCA dejar cache desactualizada
```

---

## 📊 FLUJO COMPLETO

```
1. Usuario selecciona archivos
2. Frontend valida (nombre, tamaño, formato)
3. Frontend agrupa por vehículo+fecha
4. Frontend envía a backend
5. Backend valida (auth, contenido, GPS)
6. Backend agrupa archivos
7. Backend detecta sesiones múltiples
8. Backend parsea cada sesión
9. Backend valida datos (GPS, Estabilidad, Rotativo)
10. Backend guarda en BD (orden estricto)
11. Backend genera métricas de calidad
12. Backend invalida cache
13. Backend responde con resultado
14. Frontend muestra resultado visual
```

---

## ⚠️ NUNCA HACER

1. Crear nueva instancia de PrismaClient
2. Procesar sin organizationId
3. Cambiar formato de archivos sin documentar
4. Modificar múltiples archivos simultáneamente
5. Usar console.log en lugar de logger
6. Ignorar errores de validación
7. Procesar GPS inválidos
8. Dejar cache desactualizado

---

**Ver documentos complementarios para detalles completos**

