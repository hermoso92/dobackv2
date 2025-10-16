# 🔍 ANÁLISIS DE PROBLEMAS - SISTEMA DE UPLOAD

**Fecha**: 2025-10-12 04:53  
**Estado**: EN CORRECCIÓN  

---

## 📊 RESULTADO ACTUAL

### Procesamiento Ejecutado
- **Archivos procesados**: 93
- **Sesiones creadas**: 437 (muchas duplicadas)
- **Estado backend**: ✅ Funcionando (sin loops de Prisma)

### Caso de Prueba: DOBACK024 - 30/09/2025

**Esperado** (según `Analisis_Sesiones_CMadrid_real.md`):
- 2 sesiones únicas
- Sesión 1: 09:33:37 - 10:38:25 (EST + GPS + ROT)
- Sesión 2: 12:41:43 - 14:05:48 (EST + ROT, sin GPS)

**Obtenido**:
- 14 sesiones (7 duplicados de sesión 1, 7 duplicados de sesión 2)
- Sesión 1: 07:33:37 - 08:38:25 (2 horas antes)
- Sesión 2: 10:41:43 - 12:05:48 (2 horas antes)

---

## 🚨 PROBLEMAS IDENTIFICADOS

### 1. ❌ DUPLICADOS MASIVOS

**Causa**: `guardarSesion()` en `UnifiedFileProcessorV2.ts` no verificaba si ya existía una sesión antes de crearla.

**Solución aplicada**:
```typescript
// Verificar si ya existe antes de crear
const existing = await prisma.session.findFirst({
    where: {
        vehicleId,
        sessionNumber: session.sessionNumber,
        startTime: {
            gte: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()),
            lt: new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate() + 1)
        }
    }
});

if (existing) {
    logger.info(`   ⚠️ Sesión ${session.sessionNumber} ya existe, omitiendo...`);
    return existing.id;
}
```

**Estado**: ✅ CORREGIDO - compilado en `dist/`

---

### 2. ⚠️ TIMESTAMPS CON OFFSET DE 2 HORAS

**Causa**: Los archivos contienen timestamps en **hora local de Madrid** (UTC+2 en septiembre), pero los parsers usan:

```typescript
new Date(año, mes - 1, dia, horas, minutos, segundos)
```

Este constructor de JavaScript crea la fecha en la **timezone local del servidor**, que puede ser UTC. Cuando se guarda en la BD (que usa UTC), hay un offset de 2 horas.

**Afecta a**:
- `RobustGPSParser.ts` - función `parseTimestampRaspberry`
- `RobustStabilityParser.ts` - creación de timestamps
- `RobustRotativoParser.ts` - creación de timestamps

**Solución pendiente**:
Usar `Date.UTC()` o `moment-timezone` para parsear correctamente:

```typescript
// Opción 1: Usar Date.UTC y ajustar a Madrid
const utcDate = new Date(Date.UTC(año, mes - 1, dia, horas, minutos, segundos));
utcDate.setHours(utcDate.getHours() - 2); // UTC+2 → UTC

// Opción 2: Usar librería (más robusto)
import moment from 'moment-timezone';
const timestamp = moment.tz(`${año}-${mes}-${dia} ${horas}:${minutos}:${segundos}`, 'Europe/Madrid').toDate();
```

**Estado**: ⏳ PENDIENTE - funcional pero con offset

---

## ✅ PRÓXIMOS PASOS

### Paso 1: Limpiar BD y Probar con Detección de Duplicados

Ejecutar:
```powershell
# Limpiar BD actual (con duplicados)
.\limpiar-bd-manual.ps1

# Reiniciar backend (para cargar código nuevo)
# Cerrar ventana del backend y ejecutar:
cd backend
npm run dev

# Probar procesamiento
.\test-upload-system.ps1
```

**Resultado esperado**:
- ✅ 0 duplicados
- ✅ 2 sesiones únicas para DOBACK024 - 30/09/2025
- ⚠️ Timestamps con offset de 2 horas (esperado por ahora)

### Paso 2: Corregir Timezone (Opcional)

Si el offset de 2 horas es crítico:
1. Modificar los 3 parsers para usar timezone Europe/Madrid
2. Recompilar
3. Volver a procesar archivos

---

## 📋 ESTADO DE TODOS

| ID | Task | Estado |
|----|------|--------|
| 1 | Singleton de Prisma | ✅ COMPLETADO |
| 2 | Sistema de reportes detallado | ✅ COMPLETADO |
| 3 | Parseo robusto GPS | ✅ COMPLETADO |
| 4 | UI de reporte de procesamiento | ✅ COMPLETADO |
| 5 | Botón de borrar sesiones | ✅ COMPLETADO |
| 6 | Detección de duplicados | ✅ COMPLETADO |
| 7 | Timezone correcta | ⏳ PENDIENTE |
| 8 | Verificar 2 sesiones DOBACK024 | ⏳ EN PRUEBA |

---

## 🎯 ACCIÓN INMEDIATA

**Cerrar la ventana del backend actual** y ejecutar:

```powershell
cd backend
npm run dev
```

Luego limpiar la BD y probar:

```powershell
cd ..
.\limpiar-bd-manual.ps1
.\test-upload-system.ps1
```

Esto debería crear exactamente **2 sesiones** para DOBACK024 - 30/09/2025 (aunque con offset de 2h).

